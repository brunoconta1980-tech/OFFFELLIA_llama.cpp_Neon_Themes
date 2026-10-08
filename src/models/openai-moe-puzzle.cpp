#include "models.h"

#include "llama-impl.h"
#include "llama-kv-cache-iswa.h"

#include <algorithm>
#include <cstdint>
#include <map>
#include <set>
#include <vector>

// One SWA cache is sized to the widest window. Narrower windows share those cells
// and read a mask filled with their own window.
struct llm_graph_input_puzzle_swa : public llm_graph_input_i {
    struct slot {
        ggml_tensor * mask;
        uint32_t      n_swa;
    };

    llm_graph_input_puzzle_swa(const llama_cparams & cparams, const llama_kv_cache_iswa_context * mctx) :
        cparams(cparams), mctx(mctx) {}

    void set_input(const llama_ubatch * ubatch) override {
        for (slot & s : masks) {
            if (s.mask && s.mask->buffer) {
                mctx->get_swa()->set_input_kq_mask(s.mask, ubatch, cparams.causal_attn, s.n_swa);
            }
        }
    }

    bool can_reuse(const llm_graph_params & params) override {
        mctx = static_cast<const llama_kv_cache_iswa_context *>(params.mctx);
        if (masks.empty()) {
            return true;
        }

        const llama_kv_cache_context * swa = mctx->get_swa();
        const int64_t n_kv     = swa->get_n_kv();
        const int64_t n_stream = params.cparams.kv_unified ? 1 : params.ubatch.n_seqs_unq;
        const int64_t n_tps    = params.ubatch.n_tokens / n_stream;

        for (const slot & s : masks) {
            if (!s.mask || !s.mask->buffer) {
                continue;
            }
            if (s.mask->ne[0] != n_kv || s.mask->ne[1] != n_tps || s.mask->ne[2] != 1 || s.mask->ne[3] != n_stream) {
                return false;
            }
        }
        return true;
    }

    std::vector<slot> masks;
    const llama_cparams cparams;
    const llama_kv_cache_iswa_context * mctx;
};

void llama_model_openai_moe_puzzle::load_arch_hparams(llama_model_loader & ml) {
    ml.get_key(LLM_KV_ATTENTION_LAYERNORM_RMS_EPS, hparams.f_norm_rms_eps);
    ml.get_key_or_arr(LLM_KV_EXPERT_FEED_FORWARD_LENGTH, hparams.n_ff_exp_arr, hparams.n_layer_all);

    if (hparams.n_expert_arr[0] == 0) {
        ml.get_key_or_arr(LLM_KV_EXPERT_COUNT, hparams.n_expert_arr, hparams.n_layer_all);
        hparams.n_expert = 0;
        for (uint32_t il = 0; il < hparams.n_layer(); ++il) {
            hparams.n_expert = std::max(hparams.n_expert, hparams.n_expert_arr[il]);
        }
    }

    ml.get_key_or_arr(LLM_KV_ATTENTION_SLIDING_WINDOW, hparams.n_swa_arr, hparams.n_layer_all);
    hparams.swa_per_layer = true;

    uint32_t n_swa_max    = 0;
    uint32_t n_expert_min = UINT32_MAX;
    for (uint32_t il = 0; il < hparams.n_layer(); ++il) {
        hparams.is_swa_impl[il] = hparams.n_swa_arr[il] > 0 ? 1 : 0;
        n_swa_max    = std::max(n_swa_max, hparams.n_swa_arr[il]);
        n_expert_min = std::min(n_expert_min, hparams.n_expert_layer(il));
    }
    for (uint32_t il = hparams.n_layer(); il < hparams.n_layer_all; ++il) {
        hparams.is_swa_impl[il] = 0;
    }

    hparams.n_swa    = n_swa_max;
    hparams.swa_type = n_swa_max > 0 ? LLAMA_SWA_TYPE_STANDARD : LLAMA_SWA_TYPE_NONE;

    hparams.rope_freq_base_train_swa  = hparams.rope_freq_base_train;
    hparams.rope_freq_scale_train_swa = hparams.rope_freq_scale_train;
    ml.get_key(LLM_KV_ROPE_FREQ_BASE_SWA, hparams.rope_freq_base_train_swa, false);

    LLAMA_LOG_INFO("%s: experts per layer     = %u..%u\n", __func__, n_expert_min, hparams.n_expert);
    LLAMA_LOG_INFO("%s: sliding window max    = %u\n",     __func__, hparams.n_swa);

    type = LLM_TYPE_UNKNOWN;
}

void llama_model_openai_moe_puzzle::load_arch_tensors(llama_model_loader &) {
    LLAMA_LOAD_LOCALS;

    const int64_t n_ff_exp = hparams.n_ff_exp();

    tok_embd = create_tensor(tn(LLM_TENSOR_TOKEN_EMBD, "weight"), {n_embd, n_vocab}, 0);

    output_norm = create_tensor(tn(LLM_TENSOR_OUTPUT_NORM, "weight"), {n_embd}, 0);
    output      = create_tensor(tn(LLM_TENSOR_OUTPUT,      "weight"), {n_embd, n_vocab}, 0);

    for (int i = 0; i < n_layer; ++i) {
        auto & layer = layers[i];
        const int64_t n_expert_i = hparams.n_expert_layer(i);

        layer.attn_norm      = create_tensor(tn(LLM_TENSOR_ATTN_NORM,      "weight", i), {n_embd}, 0);
        layer.attn_post_norm = create_tensor(tn(LLM_TENSOR_ATTN_POST_NORM, "weight", i), {n_embd}, 0);

        create_tensor_qkv(layer, i, n_embd, n_head * n_rot, n_head_kv * n_rot, n_head_kv * n_rot, 0);
        layer.wo = create_tensor(tn(LLM_TENSOR_ATTN_OUT, "weight", i), {n_head * n_rot, n_embd}, 0);

        layer.attn_sinks = create_tensor(tn(LLM_TENSOR_ATTN_SINKS, "weight", i), {n_head}, 0);

        layer.ffn_gate_inp  = create_tensor(tn(LLM_TENSOR_FFN_GATE_INP,  "weight", i), {  n_embd, n_expert_i}, 0);
        layer.ffn_gate_exps = create_tensor(tn(LLM_TENSOR_FFN_GATE_EXPS, "weight", i), {  n_embd, n_ff_exp, n_expert_i}, 0);
        layer.ffn_down_exps = create_tensor(tn(LLM_TENSOR_FFN_DOWN_EXPS, "weight", i), {n_ff_exp,   n_embd, n_expert_i}, 0);
        layer.ffn_up_exps   = create_tensor(tn(LLM_TENSOR_FFN_UP_EXPS,   "weight", i), {  n_embd, n_ff_exp, n_expert_i}, 0);

        layer.wo_b = create_tensor(tn(LLM_TENSOR_ATTN_OUT, "bias", i), {n_embd}, 0);

        layer.ffn_gate_inp_b  = create_tensor(tn(LLM_TENSOR_FFN_GATE_INP,  "bias", i), {n_expert_i}, 0);
        layer.ffn_gate_exps_b = create_tensor(tn(LLM_TENSOR_FFN_GATE_EXPS, "bias", i), {n_ff_exp, n_expert_i}, 0);
        layer.ffn_down_exps_b = create_tensor(tn(LLM_TENSOR_FFN_DOWN_EXPS, "bias", i), {  n_embd, n_expert_i}, 0);
        layer.ffn_up_exps_b   = create_tensor(tn(LLM_TENSOR_FFN_UP_EXPS,   "bias", i), {n_ff_exp, n_expert_i}, 0);
    }
}

std::unique_ptr<llm_graph_context> llama_model_openai_moe_puzzle::build_arch_graph(const llm_graph_params & params) const {
    return std::make_unique<graph>(*this, params);
}

llama_model_openai_moe_puzzle::graph::graph(const llama_model & model, const llm_graph_params & params) : llm_graph_context(params) {
    ggml_tensor * cur;
    ggml_tensor * inpL;

    inpL = build_inp_embd(model.tok_embd);

    ggml_tensor * inp_pos = build_inp_pos();

    auto * inp_attn = build_attn_inp_kv_iswa();
    const auto * mctx_iswa = static_cast<const llama_kv_cache_iswa_context *>(mctx);

    auto extra = std::make_unique<llm_graph_input_puzzle_swa>(cparams, mctx_iswa);
    std::map<uint32_t, ggml_tensor *> swa_masks;
    if (hparams.n_swa > 0) {
        const llama_kv_cache_context * swa = mctx_iswa->get_swa();
        const int64_t n_kv     = swa->get_n_kv();
        const int64_t n_stream = cparams.kv_unified ? 1 : ubatch.n_seqs_unq;
        const ggml_type type_mask = cparams.flash_attn ? GGML_TYPE_F16 : GGML_TYPE_F32;

        std::set<uint32_t> windows;
        for (int il = 0; il < n_layer; ++il) {
            const uint32_t w = hparams.n_swa_layer(il);
            if (w > 0 && w != hparams.n_swa) {
                windows.insert(w);
            }
        }

        for (uint32_t w : windows) {
            ggml_tensor * mask = ggml_new_tensor_4d(ctx0, type_mask, n_kv, n_tokens / n_stream, 1, n_stream);
            ggml_set_input(mask);
            ggml_set_name(mask, "attn_inp_kq_mask_puzzle");
            extra->masks.push_back({mask, w});
            swa_masks.emplace(w, mask);
        }
    }
    res->add_input(std::move(extra));

    // SWA layers whose window is narrower than the shared cache
    auto attn_swa = [&](ggml_tensor * kq_mask, int il) -> ggml_tensor * {
        ggml_tensor * q_cur;
        ggml_tensor * k_cur;
        ggml_tensor * v_cur;

        auto [Q, K, V] = build_qkv(model.layers[il], cur, n_rot, n_head, n_head_kv, il);
        q_cur = Q;
        k_cur = K;
        v_cur = V;

        const float freq_base_l  = model.get_rope_freq_base (cparams, il);
        const float freq_scale_l = model.get_rope_freq_scale(cparams, il);

        q_cur = ggml_rope_ext(
                ctx0, q_cur, inp_pos, nullptr,
                n_rot, rope_type, n_ctx_orig, freq_base_l, freq_scale_l,
                ext_factor, attn_factor, beta_fast, beta_slow);
        k_cur = ggml_rope_ext(
                ctx0, k_cur, inp_pos, nullptr,
                n_rot, rope_type, n_ctx_orig, freq_base_l, freq_scale_l,
                ext_factor, attn_factor, beta_fast, beta_slow);

        ggml_tensor * k_rot = inp_attn->self_k_rot_swa;
        ggml_tensor * v_rot = inp_attn->self_v_rot_swa;
        if (k_rot) {
            q_cur = llama_mul_mat_hadamard(ctx0, q_cur, k_rot);
            k_cur = llama_mul_mat_hadamard(ctx0, k_cur, k_rot);
        }
        if (v_rot) {
            v_cur = llama_mul_mat_hadamard(ctx0, v_cur, v_rot);
        }

        ggml_build_forward_expand(gf, q_cur);
        ggml_build_forward_expand(gf, k_cur);
        ggml_build_forward_expand(gf, v_cur);

        const llama_kv_cache_context * mctx_cur = mctx_iswa->get_swa();

        const bool use_kv_cur = cparams.training;
        if (use_kv_cur) {
            GGML_ASSERT(mctx_cur->get_n_kv() == n_tokens);
        }
        const bool store_kv = !use_kv_cur || hparams.n_layer_kv_from_start >= 0;
        if (store_kv) {
            ggml_build_forward_expand(gf, mctx_cur->cpy_k(ctx0, k_cur, inp_attn->get_k_idxs_swa(), il));
            ggml_build_forward_expand(gf, mctx_cur->cpy_v(ctx0, v_cur, inp_attn->get_v_idxs_swa(), il));
        }

        ggml_tensor * k = use_kv_cur ? k_cur : mctx_cur->get_k(ctx0, il);
        ggml_tensor * v = use_kv_cur ? v_cur : mctx_cur->get_v(ctx0, il);
        ggml_tensor * attn = build_attn_mha(q_cur, k, v, nullptr, kq_mask, model.layers[il].attn_sinks, nullptr, 0, 1.0f/sqrtf(float(n_rot)), il);
        cb(attn, "kqv_out", il);

        if (v_rot) {
            attn = llama_mul_mat_hadamard(ctx0, attn, v_rot);
        }
        if (model.layers[il].wo) {
            attn = build_lora_mm(model.layers[il].wo, attn, model.layers[il].wo_s);
        }
        if (model.layers[il].wo_b) {
            attn = ggml_add(ctx0, attn, model.layers[il].wo_b);
        }
        return attn;
    };

    ggml_tensor * inp_out_ids = build_inp_out_ids();

    for (int il = 0; il < n_layer; ++il) {
        res->t_layer_inp[il] = inpL;

        const float freq_base_l  = model.get_rope_freq_base (cparams, il);
        const float freq_scale_l = model.get_rope_freq_scale(cparams, il);

        ggml_tensor * inpSA = inpL;

        cur = build_norm(inpL, model.layers[il].attn_norm, nullptr, LLM_NORM_RMS, il);
        cb(cur, "attn_norm", il);

        {
            const uint32_t window = hparams.n_swa_layer(il);
            const auto mask_it = swa_masks.find(window);
            if (hparams.is_swa(il) && mask_it != swa_masks.end()) {
                cur = attn_swa(mask_it->second, il);
            } else {
                auto [Qcur, Kcur, Vcur] = build_qkv(model.layers[il], cur, n_rot, n_head, n_head_kv, il);

                Qcur = ggml_rope_ext(
                        ctx0, Qcur, inp_pos, nullptr,
                        n_rot, rope_type, n_ctx_orig, freq_base_l, freq_scale_l,
                        ext_factor, attn_factor, beta_fast, beta_slow);
                Kcur = ggml_rope_ext(
                        ctx0, Kcur, inp_pos, nullptr,
                        n_rot, rope_type, n_ctx_orig, freq_base_l, freq_scale_l,
                        ext_factor, attn_factor, beta_fast, beta_slow);

                cb(Qcur, "Qcur", il);
                cb(Kcur, "Kcur", il);
                cb(Vcur, "Vcur", il);

                cur = build_attn(inp_attn,
                        model.layers[il].wo, model.layers[il].wo_b, model.layers[il].wo_s,
                        Qcur, Kcur, Vcur, nullptr, model.layers[il].attn_sinks, nullptr, 1.0f/sqrtf(float(n_rot)), il);
            }

            cb(cur, "attn_out", il);
        }

        if (il == n_layer - 1 && inp_out_ids && cparams.embeddings_nextn_masked) {
            cur   = ggml_get_rows(ctx0,   cur, inp_out_ids);
            inpSA = ggml_get_rows(ctx0, inpSA, inp_out_ids);
        }
        ggml_tensor * ffn_inp = ggml_add(ctx0, cur, inpSA);
        cb(ffn_inp, "ffn_inp", il);

        cur = ffn_inp;
        cur = build_norm(cur, model.layers[il].attn_post_norm, nullptr, LLM_NORM_RMS, il);
        cb(cur, "attn_post_norm", il);

        const int64_t n_exp_i = hparams.n_expert_layer(il);
        int64_t n_used_i = hparams.n_expert_used(il);
        if (n_used_i > n_exp_i) {
            n_used_i = n_exp_i;
        }

        cur = build_moe_ffn(cur,
                model.layers[il].ffn_gate_inp,  model.layers[il].ffn_gate_inp_b,
                model.layers[il].ffn_up_exps,   model.layers[il].ffn_up_exps_b,
                model.layers[il].ffn_gate_exps, model.layers[il].ffn_gate_exps_b,
                model.layers[il].ffn_down_exps, model.layers[il].ffn_down_exps_b,
                nullptr,
                n_exp_i, n_used_i,
                LLM_FFN_SWIGLU_OAI_MOE, false,
                hparams.expert_weights_scale,
                LLAMA_EXPERT_GATING_FUNC_TYPE_SOFTMAX_WEIGHT,
                il);
        cb(cur, "ffn_moe_out", il);

        cur = ggml_add(ctx0, cur, ffn_inp);
        cur = build_cvec(cur, il);
        cb(cur, "l_out", il);

        inpL = cur;
    }
    cur = inpL;

    res->t_h_nextn = cur;

    if (!cparams.embeddings_nextn_masked && inp_out_ids) {
        cur = ggml_get_rows(ctx0, cur, inp_out_ids);
    }

    cur = build_norm(cur, model.output_norm, NULL, LLM_NORM_RMS, -1);

    cb(cur, "result_norm", -1);
    res->t_embd = cur;

    cur = build_lora_mm(model.output, cur, model.output_s);

    cb(cur, "result_output", -1);
    res->t_logits = cur;

    ggml_build_forward_expand(gf, cur);
}
