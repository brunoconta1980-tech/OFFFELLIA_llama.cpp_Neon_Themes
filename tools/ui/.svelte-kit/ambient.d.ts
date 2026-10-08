
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const SVELTEKIT_FORK: string;
	export const PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS: string;
	export const NODE_ENV: string;
	export const EDITOR: string;
	export const INIT_CWD: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const npm_config_allow_scripts: string;
	export const npm_config_global_prefix: string;
	export const npm_execpath: string;
	export const LESS_TERMCAP_me: string;
	export const npm_config_globalconfig: string;
	export const XDG_VTNR: string;
	export const LESS_TERMCAP_mb: string;
	export const DOCKER_HOST: string;
	export const _JAVA_AWT_WM_NONREPARENTING: string;
	export const npm_config_init_module: string;
	export const QT_ACCESSIBILITY: string;
	export const npm_lifecycle_event: string;
	export const SSH_AUTH_SOCK: string;
	export const npm_lifecycle_script: string;
	export const LS_COLORS: string;
	export const XDG_SESSION_DESKTOP: string;
	export const POWERSHELL_UPDATECHECK: string;
	export const LANG: string;
	export const npm_config_global_ignore_file: string;
	export const DISPLAY: string;
	export const XDG_SESSION_PATH: string;
	export const NODE: string;
	export const SESSION_MANAGER: string;
	export const INVOCATION_ID: string;
	export const KDE_SESSION_UID: string;
	export const ICEAUTHORITY: string;
	export const PATH: string;
	export const SHELL: string;
	export const npm_config_node_gyp: string;
	export const GTK2_RC_FILES: string;
	export const FLATPAK_TTY_PROGRESS: string;
	export const npm_config_ignore_scripts: string;
	export const XDG_SESSION_ID: string;
	export const KDE_APPLICATIONS_AS_SCOPE: string;
	export const HOME: string;
	export const XDG_CONFIG_DIRS: string;
	export const TERM: string;
	export const LESS_TERMCAP_ue: string;
	export const npm_config_npm_version: string;
	export const XAUTHORITY: string;
	export const npm_config_local_prefix: string;
	export const LD_LIBRARY_PATH: string;
	export const npm_node_execpath: string;
	export const npm_package_version: string;
	export const XDG_SEAT: string;
	export const LANGUAGE: string;
	export const npm_command: string;
	export const GPG_AGENT_INFO: string;
	export const LOGNAME: string;
	export const DESKTOP_SESSION: string;
	export const KDE_FULL_SESSION: string;
	export const KONSOLE_DBUS_SERVICE: string;
	export const HSA_OVERRIDE_GFX_VERSION: string;
	export const XDG_SESSION_TYPE: string;
	export const npm_config_cache: string;
	export const npm_config_engine_strict: string;
	export const GEMINI_API_KEY: string;
	export const JOURNAL_STREAM: string;
	export const PYENV_ROOT: string;
	export const XDG_RUNTIME_DIR: string;
	export const LESS_TERMCAP_se: string;
	export const WINDOWID: string;
	export const POWERSHELL_TELEMETRY_OPTOUT: string;
	export const XDG_DATA_DIRS: string;
	export const KDE_SESSION_VERSION: string;
	export const OLDPWD: string;
	export const GTK_RC_FILES: string;
	export const NVM_CD_FLAGS: string;
	export const RUSTICL_ENABLE: string;
	export const DOTNET_CLI_TELEMETRY_OPTOUT: string;
	export const CPATH: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const npm_package_json: string;
	export const KONSOLE_DBUS_WINDOW: string;
	export const NVM_DIR: string;
	export const QT_WAYLAND_RECONNECT: string;
	export const PROFILEHOME: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const _: string;
	export const USER: string;
	export const LIBRARY_PATH: string;
	export const npm_config_user_agent: string;
	export const PKG_CONFIG_PATH: string;
	export const COLORTERM: string;
	export const PAM_KWALLET5_LOGIN: string;
	export const SHELL_SESSION_ID: string;
	export const MANAGERPIDFDID: string;
	export const XDG_SEAT_PATH: string;
	export const MANAGERPID: string;
	export const PWD: string;
	export const LESS_TERMCAP_so: string;
	export const COLORFGBG: string;
	export const NMAP_PRIVILEGED: string;
	export const KONSOLE_VERSION: string;
	export const SYSTEMD_EXEC_PID: string;
	export const KONSOLE_DBUS_ACTIVATION_COOKIE: string;
	export const COLOR: string;
	export const LESS_TERMCAP_md: string;
	export const SHLVL: string;
	export const COMMAND_NOT_FOUND_INSTALL_PROMPT: string;
	export const XDG_MENU_PREFIX: string;
	export const npm_package_name: string;
	export const XKB_DEFAULT_LAYOUT: string;
	export const XKB_DEFAULT_MODEL: string;
	export const XDG_SESSION_CLASS: string;
	export const PYENV_VIRTUALENV_INIT: string;
	export const WAYLAND_DISPLAY: string;
	export const npm_config_noproxy: string;
	export const LESS_TERMCAP_us: string;
	export const npm_config_prefix: string;
	export const npm_config_userconfig: string;
	export const KONSOLE_DBUS_SESSION: string;
	export const MEMORY_PRESSURE_WATCH: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		SVELTEKIT_FORK: string;
		PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS: string;
		NODE_ENV: string;
		EDITOR: string;
		INIT_CWD: string;
		MEMORY_PRESSURE_WRITE: string;
		npm_config_allow_scripts: string;
		npm_config_global_prefix: string;
		npm_execpath: string;
		LESS_TERMCAP_me: string;
		npm_config_globalconfig: string;
		XDG_VTNR: string;
		LESS_TERMCAP_mb: string;
		DOCKER_HOST: string;
		_JAVA_AWT_WM_NONREPARENTING: string;
		npm_config_init_module: string;
		QT_ACCESSIBILITY: string;
		npm_lifecycle_event: string;
		SSH_AUTH_SOCK: string;
		npm_lifecycle_script: string;
		LS_COLORS: string;
		XDG_SESSION_DESKTOP: string;
		POWERSHELL_UPDATECHECK: string;
		LANG: string;
		npm_config_global_ignore_file: string;
		DISPLAY: string;
		XDG_SESSION_PATH: string;
		NODE: string;
		SESSION_MANAGER: string;
		INVOCATION_ID: string;
		KDE_SESSION_UID: string;
		ICEAUTHORITY: string;
		PATH: string;
		SHELL: string;
		npm_config_node_gyp: string;
		GTK2_RC_FILES: string;
		FLATPAK_TTY_PROGRESS: string;
		npm_config_ignore_scripts: string;
		XDG_SESSION_ID: string;
		KDE_APPLICATIONS_AS_SCOPE: string;
		HOME: string;
		XDG_CONFIG_DIRS: string;
		TERM: string;
		LESS_TERMCAP_ue: string;
		npm_config_npm_version: string;
		XAUTHORITY: string;
		npm_config_local_prefix: string;
		LD_LIBRARY_PATH: string;
		npm_node_execpath: string;
		npm_package_version: string;
		XDG_SEAT: string;
		LANGUAGE: string;
		npm_command: string;
		GPG_AGENT_INFO: string;
		LOGNAME: string;
		DESKTOP_SESSION: string;
		KDE_FULL_SESSION: string;
		KONSOLE_DBUS_SERVICE: string;
		HSA_OVERRIDE_GFX_VERSION: string;
		XDG_SESSION_TYPE: string;
		npm_config_cache: string;
		npm_config_engine_strict: string;
		GEMINI_API_KEY: string;
		JOURNAL_STREAM: string;
		PYENV_ROOT: string;
		XDG_RUNTIME_DIR: string;
		LESS_TERMCAP_se: string;
		WINDOWID: string;
		POWERSHELL_TELEMETRY_OPTOUT: string;
		XDG_DATA_DIRS: string;
		KDE_SESSION_VERSION: string;
		OLDPWD: string;
		GTK_RC_FILES: string;
		NVM_CD_FLAGS: string;
		RUSTICL_ENABLE: string;
		DOTNET_CLI_TELEMETRY_OPTOUT: string;
		CPATH: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		npm_package_json: string;
		KONSOLE_DBUS_WINDOW: string;
		NVM_DIR: string;
		QT_WAYLAND_RECONNECT: string;
		PROFILEHOME: string;
		XDG_CURRENT_DESKTOP: string;
		_: string;
		USER: string;
		LIBRARY_PATH: string;
		npm_config_user_agent: string;
		PKG_CONFIG_PATH: string;
		COLORTERM: string;
		PAM_KWALLET5_LOGIN: string;
		SHELL_SESSION_ID: string;
		MANAGERPIDFDID: string;
		XDG_SEAT_PATH: string;
		MANAGERPID: string;
		PWD: string;
		LESS_TERMCAP_so: string;
		COLORFGBG: string;
		NMAP_PRIVILEGED: string;
		KONSOLE_VERSION: string;
		SYSTEMD_EXEC_PID: string;
		KONSOLE_DBUS_ACTIVATION_COOKIE: string;
		COLOR: string;
		LESS_TERMCAP_md: string;
		SHLVL: string;
		COMMAND_NOT_FOUND_INSTALL_PROMPT: string;
		XDG_MENU_PREFIX: string;
		npm_package_name: string;
		XKB_DEFAULT_LAYOUT: string;
		XKB_DEFAULT_MODEL: string;
		XDG_SESSION_CLASS: string;
		PYENV_VIRTUALENV_INIT: string;
		WAYLAND_DISPLAY: string;
		npm_config_noproxy: string;
		LESS_TERMCAP_us: string;
		npm_config_prefix: string;
		npm_config_userconfig: string;
		KONSOLE_DBUS_SESSION: string;
		MEMORY_PRESSURE_WATCH: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
