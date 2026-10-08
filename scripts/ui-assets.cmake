# Provision UI assets and generate ui.cpp/ui.h.
#
# The UI is built from this tree with Vite (npm). A dist/ already on disk does
# not override source changes. Nothing is downloaded and no checksum is applied.

cmake_minimum_required(VERSION 3.18)

set(UI_SOURCE_DIR     "" CACHE STRING "UI source directory (to run npm build)")
set(UI_BINARY_DIR     "" CACHE STRING "UI binary directory (to store generated files)")
set(LLAMA_SOURCE_DIR  "" CACHE STRING "Project source root (to resolve version from git)")
set(HF_BUCKET         "" CACHE STRING "Hugging Face bucket name")
set(HF_VERSION        "" CACHE STRING "Version to download (empty = resolve from git)")
set(HF_ENABLED        "" CACHE STRING "Whether to allow HF Bucket download (ON/OFF)")
set(BUILD_UI          "" CACHE STRING "Build UI via npm (ON/OFF)")
set(LLAMA_UI_GZIP     "" CACHE STRING "Apply gzip compress to assets to save bandwidth")

set(DIST_DIR     "${UI_BINARY_DIR}/dist")
set(SRC_DIST_DIR "${UI_SOURCE_DIR}/dist")
set(WORK_DIR     "${UI_BINARY_DIR}/ui-src")
set(STAMP_FILE   "${UI_BINARY_DIR}/.ui-stamp")
set(EMBED_STAMP  "${UI_BINARY_DIR}/.ui-embed.sha256")
set(UI_CPP       "${UI_BINARY_DIR}/ui.cpp")
set(UI_H         "${UI_BINARY_DIR}/ui.h")

function(mime_from_ext name out_var)
    string(FIND "${name}" "." ext REVERSE)
    if(ext GREATER -1)
        string(SUBSTRING "${name}" ${ext} -1 ext_full)
        string(SUBSTRING "${ext_full}" 1 -1 ext_str)
    else()
        set(ext_str "")
    endif()
    if(ext_str STREQUAL "html")
        set(m "text/html; charset=utf-8")
    elseif(ext_str STREQUAL "css")
        set(m "text/css")
    elseif(ext_str STREQUAL "js")
        set(m "application/javascript")
    elseif(ext_str STREQUAL "json")
        set(m "application/json")
    elseif(ext_str STREQUAL "webmanifest")
        set(m "application/manifest+json")
    elseif(ext_str STREQUAL "svg")
        set(m "image/svg+xml")
    elseif(ext_str STREQUAL "png")
        set(m "image/png")
    elseif(ext_str STREQUAL "jpg" OR ext_str STREQUAL "jpeg")
        set(m "image/jpeg")
    elseif(ext_str STREQUAL "ico")
        set(m "image/x-icon")
    elseif(ext_str STREQUAL "woff")
        set(m "font/woff")
    elseif(ext_str STREQUAL "woff2")
        set(m "font/woff2")
    else()
        set(m "application/octet-stream")
    endif()
    set(${out_var} "${m}" PARENT_SCOPE)
endfunction()

# A non-empty asset tree only needs index.html. PWA files (sw.js, manifest,
# workbox, version.json) are not required, so a locally modified UI still embeds.
function(ui_validate_assets files in_dir)
    list(LENGTH files n_assets)
    if(n_assets EQUAL 0)
        return()
    endif()

    set(found_index FALSE)
    foreach(f ${files})
        get_filename_component(base "${f}" NAME)
        if(base STREQUAL "index.html")
            set(found_index TRUE)
        endif()
    endforeach()

    if(NOT found_index)
        message(FATAL_ERROR "UI: asset tree ${in_dir} has files but no index.html")
    endif()
endfunction()

# Generate ui.cpp/ui.h embedding every file of ${dist_dir} (empty table when
# it has no index.html), gzip-compressed when LLAMA_UI_GZIP is enabled.
function(emit_files dist_dir)
    set(UI_TEMPLATE_DIR "${LLAMA_SOURCE_DIR}/tools/ui")

    # Collect the asset list once and reuse it for the fingerprint,
    # validation, compression and embedding.
    set(assets "")
    if(EXISTS "${dist_dir}/index.html")
        file(GLOB_RECURSE assets
            LIST_DIRECTORIES false
            RELATIVE "${dist_dir}"
            "${dist_dir}/*")
        list(FILTER assets EXCLUDE REGEX "^_gzip/")
        list(SORT assets)
    endif()

    if(LLAMA_UI_GZIP AND NOT DEFINED ENV{SOURCE_DATE_EPOCH})
        # Zero the gzip header timestamp so identical inputs give identical
        # bytes (and therefore stable ETags) on every machine.
        set(ENV{SOURCE_DATE_EPOCH} 0)
    endif()

    # Fingerprint of every input that determines ui.cpp/ui.h: compression
    # settings, the asset tree (names + SHA-256) and this script + templates.
    set(fp "${LLAMA_UI_GZIP}|$ENV{SOURCE_DATE_EPOCH}|${CMAKE_VERSION}\n")
    foreach(f ${assets})
        file(SHA256 "${dist_dir}/${f}" h)
        string(APPEND fp "${f} ${h}\n")
    endforeach()
    foreach(g
            "${CMAKE_CURRENT_FUNCTION_LIST_FILE}"
            "${UI_TEMPLATE_DIR}/ui.h.in"
            "${UI_TEMPLATE_DIR}/ui.cpp.in")
        file(SHA256 "${g}" h)
        string(APPEND fp "gen ${h}\n")
    endforeach()
    string(SHA256 fingerprint "${fp}")

    if(EXISTS "${EMBED_STAMP}" AND EXISTS "${UI_CPP}" AND EXISTS "${UI_H}")
        file(READ "${EMBED_STAMP}" fp_saved)
        string(STRIP "${fp_saved}" fp_saved)
        if(fp_saved STREQUAL "${fingerprint}")
            message(STATUS "UI: assets unchanged, skipping embedding")
            return()
        endif()
    endif()

    # Drop the old stamp up front so a crash mid-generation cannot leave
    # outputs and stamp out of sync.
    file(REMOVE "${EMBED_STAMP}")

    ui_validate_assets("${assets}" "${dist_dir}")

    set(embed_dir "${dist_dir}")
    set(use_gzip FALSE)

    if(EXISTS "${dist_dir}/index.html")
        if(EXISTS "${dist_dir}/_gzip")
            # a _gzip tree inside dist_dir can only be a leftover from an
            # older version of this script that staged it there
            file(REMOVE_RECURSE "${dist_dir}/_gzip")
            message(STATUS "UI: removed stale gzip tree ${dist_dir}/_gzip")
        endif()
        if(LLAMA_UI_GZIP)
            # Compress every asset into a parallel _gzip/ tree under the build
            # directory, served with Content-Encoding: gzip.
            set(gzip_root "${UI_BINARY_DIR}/ui-gzip")
            set(gzip_dir  "${gzip_root}/_gzip")
            file(REMOVE_RECURSE "${gzip_root}")
            foreach(f IN LISTS assets)
                get_filename_component(asset_path "${dist_dir}/${f}" REALPATH)
                get_filename_component(dst_dir "${gzip_dir}/${f}" DIRECTORY)
                file(MAKE_DIRECTORY "${dst_dir}")
                file(ARCHIVE_CREATE
                    OUTPUT "${gzip_dir}/${f}"
                    PATHS "${asset_path}"
                    FORMAT raw
                    COMPRESSION GZip
                )
            endforeach()
            message(STATUS "UI: gzip compression applied (${gzip_dir})")
            set(embed_dir "${gzip_dir}")
            set(use_gzip TRUE)
        endif()
    endif()

    list(LENGTH assets n_assets)

    # Per-asset arrays and table rows go into the ui.h.in / ui.cpp.in templates;
    # configure_file only rewrites on content change, avoiding needless recompiles.
    set(ASSET_ARRAYS "")
    set(ASSET_TABLE "")
    set(idx 0)

    foreach(f IN LISTS assets)
        file(READ "${embed_dir}/${f}" hex HEX)
        if(hex STREQUAL "")
            message(FATAL_ERROR "UI: empty file: ${embed_dir}/${f}")
        endif()

        string(REGEX REPLACE "(..)" "0x\\1," bytes "${hex}")
        file(SHA256 "${embed_dir}/${f}" etag)
        mime_from_ext("${f}" mime)

        string(APPEND ASSET_ARRAYS
            "static const unsigned char asset_${idx}[] = {${bytes}};\n")

        string(APPEND ASSET_TABLE
            "    { \"${f}\", asset_${idx}, sizeof(asset_${idx}), \"\\\"${etag}\\\"\", \"${mime}\" },\n")

        math(EXPR idx "${idx} + 1")
    endforeach()

    set(LLAMA_UI_HAS_ASSETS 0)
    if(n_assets GREATER 0)
        set(LLAMA_UI_HAS_ASSETS 1)
    endif()
    set(N_ASSETS "${n_assets}")
    set(USE_GZIP false)
    if(use_gzip)
        set(USE_GZIP true)
    endif()

    configure_file("${UI_TEMPLATE_DIR}/ui.h.in"   "${UI_H}"   @ONLY)
    configure_file("${UI_TEMPLATE_DIR}/ui.cpp.in" "${UI_CPP}" @ONLY)

    # Write the embed stamp last, after both generated files succeeded.
    file(WRITE "${EMBED_STAMP}" "${fingerprint}")
    message(STATUS "UI: embedded ${n_assets} assets")
endfunction()

function(npm_build_should_skip out_var)
    set(${out_var} FALSE PARENT_SCOPE)

    if(NOT EXISTS "${DIST_DIR}/index.html")
        return()
    endif()

    if(NOT EXISTS "${UI_SOURCE_DIR}/sources.cmake")
        return()
    endif()
    include("${UI_SOURCE_DIR}/sources.cmake")

    set(globs "")
    foreach(g ${UI_SOURCE_GLOBS})
        list(APPEND globs "${UI_SOURCE_DIR}/${g}")
    endforeach()
    file(GLOB_RECURSE sources ${globs})
    foreach(f ${UI_SOURCE_FILES})
        list(APPEND sources "${UI_SOURCE_DIR}/${f}")
    endforeach()

    file(TIMESTAMP "${DIST_DIR}/index.html" out_ts)

    foreach(s ${sources})
        if(NOT EXISTS "${s}")
            continue()
        endif()
        file(TIMESTAMP "${s}" s_ts)
        if(s_ts STRGREATER out_ts)
            return()
        endif()
    endforeach()

    set(${out_var} TRUE PARENT_SCOPE)
endfunction()

function(stage_sources)
    if(EXISTS "${WORK_DIR}")
        file(GLOB staged RELATIVE "${WORK_DIR}" "${WORK_DIR}/*")
        list(REMOVE_ITEM staged "node_modules")
        foreach(entry ${staged})
            file(REMOVE_RECURSE "${WORK_DIR}/${entry}")
        endforeach()
    endif()

    file(COPY "${UI_SOURCE_DIR}/"
        DESTINATION "${WORK_DIR}"
        NO_SOURCE_PERMISSIONS
        PATTERN "node_modules" EXCLUDE
    )
endfunction()

function(npm_build out_var)
    set(${out_var} FALSE PARENT_SCOPE)

    if(NOT EXISTS "${UI_SOURCE_DIR}/package.json")
        message(STATUS "UI: ${UI_SOURCE_DIR}/package.json not found, skipping npm")
        return()
    endif()

    npm_build_should_skip(skip)
    if(skip)
        message(STATUS "UI: npm output up-to-date, skipping build")
        set(${out_var} TRUE PARENT_SCOPE)
        return()
    endif()

    if(CMAKE_HOST_WIN32)
        find_program(NPM_EXECUTABLE NAMES npm.cmd npm.bat npm)
    else()
        find_program(NPM_EXECUTABLE npm)
    endif()
    if(NOT NPM_EXECUTABLE)
        message(STATUS "UI: npm not found, skipping npm build")
        return()
    endif()

    stage_sources()

    # npm writes node_modules/.package-lock.json on every successful install,
    # so a package-lock.json newer than this marker means node_modules is stale
    set(NPM_MARKER "${WORK_DIR}/node_modules/.package-lock.json")
    set(need_install FALSE)
    if(NOT EXISTS "${NPM_MARKER}")
        set(need_install TRUE)
    else()
        file(TIMESTAMP "${WORK_DIR}/package-lock.json" lock_ts)
        file(TIMESTAMP "${NPM_MARKER}" marker_ts)
        if(lock_ts STRGREATER marker_ts)
            set(need_install TRUE)
        endif()
    endif()

    if(need_install)
        message(STATUS "UI: running npm ci")
        execute_process(
            COMMAND ${NPM_EXECUTABLE} ci
            WORKING_DIRECTORY "${WORK_DIR}"
            RESULT_VARIABLE rc
            ERROR_VARIABLE  err
        )
        if(NOT rc EQUAL 0)
            message(STATUS "UI: npm ci failed (${rc})")
            message(STATUS "  stderr: ${err}")
            return()
        endif()
    endif()

    file(MAKE_DIRECTORY "${DIST_DIR}")

    message(STATUS "UI: running npm run build, output -> ${DIST_DIR}")
    execute_process(
        COMMAND ${CMAKE_COMMAND} -E env "LLAMA_UI_OUT_DIR=${DIST_DIR}" "LLAMA_UI_VERSION=${HF_VERSION}" "LLAMA_BUILD_NUMBER=${LLAMA_BUILD_NUMBER}"
                ${NPM_EXECUTABLE} run build
        WORKING_DIRECTORY "${WORK_DIR}"
        RESULT_VARIABLE rc
        ERROR_VARIABLE  err
    )
    if(NOT rc EQUAL 0)
        message(STATUS "UI: npm run build failed (${rc})")
        message(STATUS "  stderr: ${err}")
        return()
    endif()

    if(NOT EXISTS "${DIST_DIR}/index.html")
        message(STATUS "UI: npm build finished but assets missing in ${DIST_DIR}")
        return()
    endif()

    message(STATUS "UI: npm build succeeded")
    file(REMOVE "${STAMP_FILE}")
    set(${out_var} TRUE PARENT_SCOPE)
endfunction()

function(resolve_version out_var)
    if(NOT "${HF_VERSION}" STREQUAL "")
        set(${out_var} "${HF_VERSION}" PARENT_SCOPE)
        return()
    endif()

    if(EXISTS "${LLAMA_SOURCE_DIR}/cmake/build-info.cmake")
        include("${LLAMA_SOURCE_DIR}/cmake/build-info.cmake")
        if(NOT "${BUILD_NUMBER}" STREQUAL "" AND NOT BUILD_NUMBER EQUAL 0)
            set(${out_var} "b${BUILD_NUMBER}" PARENT_SCOPE)
            return()
        endif()
    endif()

    set(${out_var} "" PARENT_SCOPE)
endfunction()

# ---------------------------------------------------------------------------
# Vite build from this tree. tools/ui/dist does not override source changes.
# HF_ENABLED is ignored: the build never downloads a UI.
# ---------------------------------------------------------------------------
set(provisioned FALSE)

# A stamp left by an older prebuilt download must not pin the asset tree.
if(EXISTS "${STAMP_FILE}")
    file(REMOVE "${STAMP_FILE}")
endif()

if(BUILD_UI)
    resolve_version(HF_VERSION)
    npm_build(NPM_OK)
    if(NPM_OK)
        set(provisioned TRUE)
    endif()
endif()

if(provisioned)
    emit_files("${DIST_DIR}")
    return()
endif()

if(EXISTS "${SRC_DIST_DIR}/index.html")
    message(STATUS "UI: Vite build did not produce assets; using ${SRC_DIST_DIR}")
    emit_files("${SRC_DIST_DIR}")
    return()
endif()

if(EXISTS "${DIST_DIR}/index.html")
    message(WARNING "UI: Vite build failed; embedding the assets already in ${DIST_DIR}")
else()
    message(WARNING "UI: no assets available - building without an embedded UI. "
                    "Install Node.js and npm, then recompile so Vite can build tools/ui.")
endif()

emit_files("${DIST_DIR}")
