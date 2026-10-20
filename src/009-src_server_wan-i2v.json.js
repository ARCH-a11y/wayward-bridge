// src/server/wan-i2v.json
var require_wan_i2v = __commonJS({
  "src/server/wan-i2v.json"(exports2, module2) {
    module2.exports = {
      "6": {
        inputs: {
          text: "2D anime animation, slow breathing, hair sway",
          clip: [
            "95",
            0
          ]
        },
        class_type: "CLIPTextEncode",
        _meta: {
          title: "CLIP Text Encode (Positive Prompt)"
        }
      },
      "7": {
        inputs: {
          text: "",
          clip: [
            "95",
            0
          ]
        },
        class_type: "CLIPTextEncode",
        _meta: {
          title: "CLIP Text Encode (Negative Prompt)"
        }
      },
      "50": {
        inputs: {
          width: 400,
          height: 608,
          length: 33,
          batch_size: 1,
          positive: [
            "6",
            0
          ],
          negative: [
            "7",
            0
          ],
          vae: [
            "93",
            0
          ],
          start_image: [
            "52",
            0
          ]
        },
        class_type: "WanImageToVideo",
        _meta: {
          title: "WanImageToVideo"
        }
      },
      "52": {
        inputs: {
          image: "patron_big dick futa_00001_.png"
        },
        class_type: "LoadImage",
        _meta: {
          title: "Load Image"
        }
      },
      "57": {
        inputs: {
          add_noise: "enable",
          noise_seed: 922155916148768,
          steps: 4,
          cfg: 1,
          sampler_name: "lcm",
          scheduler: "simple",
          start_at_step: 0,
          end_at_step: 2,
          return_with_leftover_noise: "enable",
          model: [
            "64",
            0
          ],
          positive: [
            "50",
            0
          ],
          negative: [
            "50",
            1
          ],
          latent_image: [
            "50",
            2
          ]
        },
        class_type: "KSamplerAdvanced",
        _meta: {
          title: "KSampler (Advanced)"
        }
      },
      "58": {
        inputs: {
          add_noise: "disable",
          noise_seed: 0,
          steps: 4,
          cfg: 1,
          sampler_name: "lcm",
          scheduler: "simple",
          start_at_step: 2,
          end_at_step: 1e4,
          return_with_leftover_noise: "disable",
          model: [
            "65",
            0
          ],
          positive: [
            "50",
            0
          ],
          negative: [
            "50",
            1
          ],
          latent_image: [
            "57",
            0
          ]
        },
        class_type: "KSamplerAdvanced",
        _meta: {
          title: "KSampler (Advanced)"
        }
      },
      "63": {
        inputs: {
          frame_rate: 16,
          loop_count: 0,
          filename_prefix: "AnimateDiff",
          format: "image/gif",
          pingpong: false,
          save_output: true,
          images: [
            "76",
            0
          ]
        },
        class_type: "VHS_VideoCombine",
        _meta: {
          title: "Video Combine \u{1F3A5}\u{1F165}\u{1F157}\u{1F162}"
        }
      },
      "64": {
        inputs: {
          PowerLoraLoaderHeaderWidget: {
            type: "PowerLoraLoaderHeaderWidget"
          },
          lora_1: {
            on: true,
            lora: "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors",
            strength: 1
          },
          lora_2: {
            on: false,
            lora: "None",
            strength: 0.8
          },
          "\u2795 Add Lora": "",
          model: [
            "85",
            0
          ]
        },
        class_type: "Power Lora Loader (rgthree)",
        _meta: {
          title: "Power Lora Loader (rgthree)"
        }
      },
      "65": {
        inputs: {
          PowerLoraLoaderHeaderWidget: {
            type: "PowerLoraLoaderHeaderWidget"
          },
          lora_1: {
            on: true,
            lora: "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors",
            strength: 1
          },
          lora_2: {
            on: false,
            lora: "None",
            strength: 0.8
          },
          "\u2795 Add Lora": "",
          model: [
            "84",
            0
          ]
        },
        class_type: "Power Lora Loader (rgthree)",
        _meta: {
          title: "Power Lora Loader (rgthree)"
        }
      },
      "76": {
        inputs: {
          tile_size: 256,
          overlap: 64,
          temporal_size: 32,
          temporal_overlap: 8,
          samples: [
            "58",
            0
          ],
          vae: [
            "93",
            0
          ]
        },
        class_type: "VAEDecodeTiled",
        _meta: {
          title: "VAE Decode (Tiled)"
        }
      },
      "84": {
        inputs: {
          gguf_name: "wan2.2_i2v_low_noise_14B_Q4_K_M.gguf"
        },
        class_type: "LoaderGGUF",
        _meta: {
          title: "GGUF Loader"
        }
      },
      "85": {
        inputs: {
          gguf_name: "wan2.2_i2v_high_noise_14B_Q4_K_M.gguf"
        },
        class_type: "LoaderGGUF",
        _meta: {
          title: "GGUF Loader"
        }
      },
      "93": {
        inputs: {
          vae_name: "wan_2.1_vae.safetensors"
        },
        class_type: "VAELoader",
        _meta: {
          title: "Load VAE"
        }
      },
      "95": {
        inputs: {
          clip_name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
          type: "wan",
          device: "cpu"
        },
        class_type: "CLIPLoader",
        _meta: {
          title: "Load CLIP"
        }
      }
    };
  }
});

