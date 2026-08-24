# InferBench: Provider-Agnostic LLM Benchmarking & Optimization Platform

**InferBench** is an open-source, provider-agnostic LLM benchmarking platform designed for AI engineers, ML infrastructure teams, and performance researchers. It provides high-precision, reproducible measurements of streaming time-to-first-token (TTFT), time-per-output-token (TPOT), decode generation speed, aggregate token throughput, concurrency scaling behavior, resource utilization (CPU, RAM, GPU), and pricing costs across any LLM API provider or local serving engine.

---

## Supported Providers & Serving Engines

InferBench supports benchmarking across any supported provider or local runtime using a unified provider abstraction:

| Provider / Engine | Interface Type | Default Environment Variable | Streaming / TTFT |
| :--- | :--- | :--- | :--- |
| **OpenAI** | Official REST / SSE | `OPENAI_API_KEY` | Supported |
| **Google Gemini** | Google GenAI REST / SSE | `GEMINI_API_KEY` | Supported |
| **Anthropic Claude** | Messages REST / SSE | `ANTHROPIC_API_KEY` | Supported |
| **xAI Grok** | OpenAI-Compatible REST | `XAI_API_KEY` | Supported |
| **Hugging Face** | Serverless / Endpoints | `HF_TOKEN` | Supported |
| **OpenRouter** | OpenAI-Compatible REST | `OPENROUTER_API_KEY` | Supported |
| **Ollama** | Local Native REST | *(None required)* | Supported |
| **OpenAI Compatible** | Universal REST (vLLM, llama.cpp, SGLang, TGI, TensorRT-LLM, LocalAI) | `CUSTOM_API_KEY` | Supported |

---

## Core Architecture

The benchmark engine is completely decoupled from provider-specific APIs:

```
                    ┌─────────────────────┐
                    │     InferBench      │
                    │  Benchmark Engine   │
                    └──────────┬──────────┘
                               │
                       Provider Interface
                       (InferenceProvider)
                               │
          ┌────────────┬───────┼────────┬─────────────┐
          ↓            ↓       ↓        ↓             ↓
       OpenAI       Gemini   Claude    Grok         Ollama
          │            │       │        │             │
          └────────────┴───────┼────────┴─────────────┘
                               ↓
                      Normalized Results
                     (NormalizedResponse)
                               ↓
                    ┌──────────┴─────────┐
                    ↓                    ↓
               JSON / CSV           Streamlit
                Artifacts           Dashboard
                    │                    │
                    └──────────┬─────────┘
                               ↓
                    Comparative Analysis
```

### Key Architectural Components

1. **`InferenceProvider` Interface** (`benchmark/providers/base.py`): Base abstraction with standard methods:
   - `health_check() -> Tuple[bool, str]`
   - `list_models() -> List[str]`
   - `generate(request: BenchmarkRequest) -> NormalizedResponse`
   - `generate_stream(request: BenchmarkRequest) -> NormalizedResponse`
   - `validate_credentials() -> Tuple[bool, str]`
2. **Normalized Request & Response** (`benchmark/schemas.py`):
   - `BenchmarkRequest`: Provider-independent parameters (model, prompt, max_output_tokens, temperature, stream).
   - `NormalizedResponse`: Uniform return structure (start_time, first_token_time, end_time, input_tokens, output_tokens, token_usage_estimated, finish_reason, raw_usage, error, retry_count, rate_limited).
3. **Provider Factory & Discovery** (`benchmark/provider_factory.py`):
   - Instantiates provider adapters dynamically.
   - Discovers available providers and credentials without crashing.
4. **Resilience & Rate Limiting**:
   - Automatic exponential backoff for HTTP 429 and transient 5xx errors.
   - Does not retry permanent client errors (400, 401, 403, 404).
   - Rate limiting via `requests_per_second_limit`.

---

## Two Distinct Benchmark Modes

InferBench provides two dedicated, non-mixed benchmarking modes:

### Mode 1: Model / API Comparison
> *"Which LLM/API gives the best performance, latency, and cost for my workload?"*
- Compares different LLM providers (OpenAI, Gemini, Anthropic, Grok, Hugging Face, OpenRouter, Ollama) using the **exact same reproducible workload**.
- Measures TTFT, P50/P95/P99 Latency, TPOT, Generation Speed, Aggregate Throughput, and Cost per 1M tokens.

### Mode 2: Serving / Infrastructure Comparison
> *"Which inference engine serves the SAME MODEL most efficiently on my infrastructure?"*
- Compares how the **same model weights & quantization** are served across local engines (e.g. Ollama vs. llama.cpp vs. vLLM vs. SGLang vs. TGI vs. TensorRT-LLM).
- Measures Throughput, Latency, TPOT, CPU Utilization (%), RAM Usage (GB), and GPU VRAM (MB) & GPU Utilization (%).

---

## Honest Metrics & Pricing Policy

InferBench enforces strict integrity in all reported metrics:

1. **Honest TTFT**:
   - For providers supporting streaming, TTFT is measured directly from the first token timestamp.
   - For non-streaming requests or unsupported endpoints, TTFT is explicitly set to `null` (`None`). **InferBench never fakes or estimates TTFT from end-to-end latency.**
2. **Honest Token Usage**:
   - When exact token counts are returned by the API (`usageMetadata`, `usage`, `prompt_eval_count`), they are recorded as exact.
   - If an endpoint does not report token counts, a tokenizer heuristic is used and the result is explicitly marked with `token_usage_estimated = True`.
3. **Configurable, Honest Pricing**:
   - Pricing is user-configured via YAML or CLI (e.g., input/output cost per 1M tokens).
   - If pricing is unknown, cost is reported as `null`—**never fabricating pricing**.
4. **Honest GPU Telemetry**:
   - Queries real ROCm SMI, NVML, or PyTorch CUDA devices. If GPU telemetry is unavailable on the machine, GPU metrics return `null`.

---

## API Key Security & Configuration

**Never commit API keys to version control, YAML files, JSON results, or logs.**
InferBench loads credentials exclusively from environment variables:

```bash
$env:OPENAI_API_KEY = "sk-..."
$env:GEMINI_API_KEY = "AIza..."
$env:ANTHROPIC_API_KEY = "sk-ant-..."
$env:XAI_API_KEY = "xai-..."
$env:HF_TOKEN = "hf_..."
$env:OPENROUTER_API_KEY = "sk-or-..."
$env:CUSTOM_API_KEY = "custom-..."

export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="AIza..."
export ANTHROPIC_API_KEY="sk-ant-..."
export XAI_API_KEY="xai-..."
export HF_TOKEN="hf_..."
export OPENROUTER_API_KEY="sk-or-..."
export CUSTOM_API_KEY="custom-..."
```

If an API key is missing, InferBench reports `Status: API key missing` and continues without crashing.

---

## CLI Commands & Usage

### 1. Discover Providers & Check Credentials
Inspect available providers and credential status:
```bash
python -m benchmark.providers
```

Example Output:
```
============================================================
InferBench - Provider Discovery & Credential Status
============================================================

Available providers:

  [OK] Ollama (ollama)
  [OK] OpenAI (openai)
  [OK] Gemini (gemini)
  [OK] Anthropic (anthropic)
  [OK] Grok (grok)
  [OK] Hugging Face (huggingface)
  [OK] OpenRouter (openrouter)
  [OK] OpenAI Compatible (openai_compatible)

Credential status:

  [OK] Ollama               : Local provider (No API key required)
  [OK] OpenAI               : OPENAI_API_KEY is configured
  [MISSING] Gemini          : API key missing (GEMINI_API_KEY not set)
  ...
============================================================
```

### 2. Preview Planned Experiment Matrix (Dry Run)
```bash
python -m benchmark.run --provider openai --dry-run
python -m benchmark.run --all-providers --dry-run
```

### 3. Run Benchmark for a Specific Provider
```bash
python -m benchmark.run --provider openai --model gpt-4o-mini

python -m benchmark.run --provider gemini --model gemini-2.5-flash

python -m benchmark.run --provider anthropic --model claude-3-5-sonnet-20241022

python -m benchmark.run --provider grok --model grok-2-latest

python -m benchmark.run --provider huggingface --model meta-llama/Llama-3.2-3B-Instruct

python -m benchmark.run --provider openrouter --model meta-llama/llama-3.3-70b-instruct

python -m benchmark.run --provider ollama --model qwen2.5:3b

python -m benchmark.run --provider custom --base-url http://localhost:8000/v1 --model my-model
```

### 4. Run Multi-Provider Matrix
Benchmark all providers that have valid credentials configured:
```bash
python -m benchmark.run --all-providers
```

### 5. Run Dedicated Serving Comparison Mode
```bash
python -m benchmark.run --mode serving_comparison --config configs/benchmark.yaml
```

### 6. Export Results to CSV
```bash
python export_results.py --input results/concurrency.json --output results/concurrency.csv
```

### 7. Launch Interactive Dashboard
```bash
streamlit run dashboard/app.py
```

---

## Configuration (`configs/benchmark.yaml`)

```yaml
project:
  name: InferBench
  version: "0.2"

mode: model_comparison

providers:
  - name: ollama
    model: qwen2.5:3b
    base_url: http://localhost:11434

  - name: openai
    model: gpt-4o-mini
    api_key_env: OPENAI_API_KEY
    pricing:
      input_per_1m_tokens: 0.15
      output_per_1m_tokens: 0.60
      currency: USD

  - name: gemini
    model: gemini-2.5-flash
    api_key_env: GEMINI_API_KEY
    pricing:
      input_per_1m_tokens: 0.075
      output_per_1m_tokens: 0.30
      currency: USD

  - name: anthropic
    model: claude-3-5-sonnet-20241022
    api_key_env: ANTHROPIC_API_KEY
    pricing:
      input_per_1m_tokens: 3.00
      output_per_1m_tokens: 15.00
      currency: USD

  - name: grok
    model: grok-2-latest
    api_key_env: XAI_API_KEY

  - name: huggingface
    model: meta-llama/Llama-3.2-3B-Instruct
    api_key_env: HF_TOKEN

  - name: openrouter
    model: meta-llama/llama-3.3-70b-instruct
    api_key_env: OPENROUTER_API_KEY

  - name: custom
    type: openai_compatible
    base_url: http://localhost:8000/v1
    model: default-model
    api_key_env: CUSTOM_API_KEY

workload:
  warmup_requests: 2
  benchmark_requests: 5
  concurrency:
    - 1
    - 2
    - 4
  input_tokens:
    - 128
    - 256
    - 512
  output_tokens:
    - 128
  seed: 42
  workload_file: results/workload.json

cost:
  enabled: true
  gpu_hourly_cost: 0.0
  input_cost_per_1m_tokens: 0.0
  output_cost_per_1m_tokens: 0.0

monitoring:
  enabled: true
  monitor_cpu: true
  monitor_ram: true
  monitor_gpu: true
```

---

## Running Automated Unit Tests

Run the full pytest suite:
```bash
pytest -v
```
All unit tests mock external API calls; no API keys or active servers are needed during testing.

---

## License

MIT License.
