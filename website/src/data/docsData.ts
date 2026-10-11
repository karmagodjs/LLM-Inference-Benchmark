export interface DocGuide {
  id: string;
  stepNumber: number;
  title: string;
  summary: string;
  category: "Setup" | "Configuration" | "Execution" | "Analysis" | "Advanced";
  estimatedMinutes: number;
  commands?: {
    label: string;
    powershell: string;
    bash: string;
  };
  expectedOutput?: string;
  content: string[];
  commonMistakes: {
    issue: string;
    solution: string;
  }[];
  keyFiles: string[];
}

export const DOC_GUIDES: DocGuide[] = [
  {
    id: "prerequisites",
    stepNumber: 1,
    title: "Prerequisites & Environment",
    summary: "Ensure Python 3.10+, Git, and optional hardware runtime drivers (NVIDIA CUDA / ROCm / Ollama) are installed on your machine.",
    category: "Setup",
    estimatedMinutes: 3,
    commands: {
      label: "Verify Python & Git versions",
      powershell: "python --version\ngit --version",
      bash: "python3 --version\ngit --version",
    },
    expectedOutput: `Python 3.11.x (or >= 3.10)
git version 2.40.x (or higher)`,
    content: [
      "InferBench requires Python 3.10 or higher for modern typing, dataclasses, and async execution support.",
      "Git is required to clone the repository and stay up-to-date with upstream improvements.",
      "Optional Local Inference: If you plan to benchmark local models with zero cloud API keys, install Ollama (https://ollama.com) or an OpenAI-compatible runtime such as vLLM or llama.cpp.",
      "Optional GPU Telemetry: If you run local models on NVIDIA or AMD GPUs, InferBench auto-queries nvidia-smi or rocm-smi. If not present, hardware metrics are honestly reported as null without throwing errors.",
    ],
    commonMistakes: [
      {
        issue: "Python 3.8 or 3.9 installed",
        solution: "InferBench uses typing and union syntax requiring Python 3.10+. Upgrade your Python installation.",
      },
      {
        issue: "Running commands with python instead of python3 on Linux/macOS",
        solution: "On Unix systems, use python3 -m venv rather than python if python points to 2.7.",
      },
    ],
    keyFiles: ["requirements.txt"],
  },
  {
    id: "clone-repo",
    stepNumber: 2,
    title: "Clone the Repository",
    summary: "Clone the official open-source InferBench repository from GitHub onto your local workstation or server.",
    category: "Setup",
    estimatedMinutes: 2,
    commands: {
      label: "Clone and navigate to repository",
      powershell: "git clone https://github.com/karmagodjs/LLM-Inference-Benchmark.git\ncd LLM-Inference-Benchmark",
      bash: "git clone https://github.com/karmagodjs/LLM-Inference-Benchmark.git\ncd LLM-Inference-Benchmark",
    },
    expectedOutput: `Cloning into 'LLM-Inference-Benchmark'...
remote: Enumerating objects: 120, done.
remote: Counting objects: 100% (120/120), done.
Resolving deltas: 100% (78/78), done.`,
    content: [
      "The repository contains the decoupled benchmark engine (benchmark/), configuration files (configs/benchmark.yaml), results exporter (export_results.py), Streamlit analytics dashboard (dashboard/app.py), and pytest test suite (tests/).",
      "Ensure you are in the root directory LLM-Inference-Benchmark before executing subsequent Python module commands.",
    ],
    commonMistakes: [
      {
        issue: "Cloning into a directory with restricted write permissions",
        solution: "Clone into your user profile directory or development folder where you have read/write permissions for result JSON outputs.",
      },
    ],
    keyFiles: ["README.md", "configs/benchmark.yaml"],
  },
  {
    id: "virtual-environment",
    stepNumber: 3,
    title: "Create a Virtual Environment",
    summary: "Isolate InferBench dependencies from your system Python packages using a dedicated virtual environment.",
    category: "Setup",
    estimatedMinutes: 2,
    commands: {
      label: "Create and activate virtual environment",
      powershell: "# Create virtual environment\npython -m venv .venv\n\n# Activate on Windows PowerShell\n.\\.venv\\Scripts\\Activate.ps1",
      bash: "# Create virtual environment\npython3 -m venv .venv\n\n# Activate on macOS / Linux\nsource .venv/bin/activate",
    },
    expectedOutput: `(.venv) PS C:\\LLM-Inference-Benchmark>`,
    content: [
      "Creating an isolated virtual environment guarantees reproducible package versions without interfering with your system Python packages or other ML environments.",
      "Once activated, your terminal prompt will display the (.venv) prefix.",
    ],
    commonMistakes: [
      {
        issue: "PowerShell Script Execution Policy error: 'running scripts is disabled on this system'",
        solution: "Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser in PowerShell, then re-run .\\.venv\\Scripts\\Activate.ps1.",
      },
    ],
    keyFiles: [".venv/"],
  },
  {
    id: "install-dependencies",
    stepNumber: 4,
    title: "Install Dependencies",
    summary: "Install the verified Python dependencies specified in requirements.txt.",
    category: "Setup",
    estimatedMinutes: 3,
    commands: {
      label: "Install required packages",
      powershell: "pip install --upgrade pip\npip install -r requirements.txt",
      bash: "pip install --upgrade pip\npip install -r requirements.txt",
    },
    expectedOutput: `Successfully installed pyyaml-6.0 requests-2.31.0 numpy-1.26.4 pandas-2.2.1 transformers-4.38.2 streamlit-1.32.0 plotly-5.19.0 psutil-5.9.8 pytest-8.0.2`,
    content: [
      "InferBench relies on lightweight, battle-tested packages: pyyaml (configs), requests (REST/SSE streaming), pandas & numpy (percentiles & metrics aggregation), streamlit & plotly (interactive visualization), psutil (CPU/RAM telemetry), and pytest (test suite).",
      "transformers is included for deterministic workload token estimation when exact provider usage headers are unavailable.",
    ],
    commonMistakes: [
      {
        issue: "Slow pip download or timeout",
        solution: "Use pip install -r requirements.txt --timeout 120 or a local pip mirror.",
      },
    ],
    keyFiles: ["requirements.txt"],
  },
  {
    id: "configure-providers",
    stepNumber: 5,
    title: "Configure Providers & Credentials",
    summary: "Set up provider environment variables or configure configs/benchmark.yaml with complete credential security.",
    category: "Configuration",
    estimatedMinutes: 5,
    commands: {
      label: "Set provider environment variables",
      powershell: `# For local Ollama, no API key is required!
# For cloud providers, configure your own keys:
$env:OPENAI_API_KEY = "sk-..."
$env:GEMINI_API_KEY = "AIza..."
$env:ANTHROPIC_API_KEY = "sk-ant-..."
$env:XAI_API_KEY = "xai-..."
$env:HF_TOKEN = "hf_..."
$env:OPENROUTER_API_KEY = "sk-or-..."
$env:CUSTOM_API_KEY = "custom-..."`,
      bash: `# For local Ollama, no API key is required!
# For cloud providers, configure your own keys:
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="AIza..."
export ANTHROPIC_API_KEY="sk-ant-..."
export XAI_API_KEY="xai-..."
export HF_TOKEN="hf_..."
export OPENROUTER_API_KEY="sk-or-..."
export CUSTOM_API_KEY="custom-..."`,
    },
    expectedOutput: `# Verify configured providers with discovery tool:
python -m benchmark.providers`,
    content: [
      "Never commit API keys to version control, configuration files, or logs. InferBench strictly retrieves credentials from environment variables.",
      "If an API key is not present in your environment, InferBench cleanly marks that provider as missing and skips it rather than crashing.",
      "For custom private backends (vLLM, llama.cpp, LocalAI), set base_url: http://localhost:8000/v1 and CUSTOM_API_KEY in configs/benchmark.yaml.",
    ],
    commonMistakes: [
      {
        issue: "Hardcoding API keys inside configs/benchmark.yaml",
        solution: "Keep api_key_env: OPENAI_API_KEY in the YAML file and set the actual secret in your environment.",
      },
      {
        issue: "Setting environment variables in a different terminal session",
        solution: "Environment variables set via export or $env: exist only within that terminal session. Set them in your profile or the active terminal.",
      },
    ],
    keyFiles: ["configs/benchmark.yaml", "benchmark/providers/base.py"],
  },
  {
    id: "run-first-benchmark",
    stepNumber: 6,
    title: "Run Your First Benchmark",
    summary: "Execute your first live benchmark using the unified CLI runner across single or multiple providers.",
    category: "Execution",
    estimatedMinutes: 5,
    commands: {
      label: "Run discovery and first benchmark",
      powershell: `# 1. Discover active providers & credentials
python -m benchmark.providers

# 2. Preview experiment matrix (Dry Run)
python -m benchmark.run --provider openai --dry-run

# 3. Run benchmark on Ollama (Local - zero cost)
python -m benchmark.run --provider ollama --model qwen2.5:3b

# 4. Or benchmark OpenAI gpt-4o-mini
python -m benchmark.run --provider openai --model gpt-4o-mini

# 5. Or run all providers with valid credentials
python -m benchmark.run --all-providers`,
      bash: `# 1. Discover active providers & credentials
python3 -m benchmark.providers

# 2. Preview experiment matrix (Dry Run)
python3 -m benchmark.run --provider openai --dry-run

# 3. Run benchmark on Ollama (Local - zero cost)
python3 -m benchmark.run --provider ollama --model qwen2.5:3b

# 4. Or benchmark OpenAI gpt-4o-mini
python3 -m benchmark.run --provider openai --model gpt-4o-mini

# 5. Or run all providers with valid credentials
python3 -m benchmark.run --all-providers`,
    },
    expectedOutput: `======================================================================
InferBench - Starting Benchmark Run
Experiment ID: 20261011_083012 | Mode: model_comparison
======================================================================
[Warmup] Group 1 (In: 128 tokens) - 2 warmup requests completed.
[Test] Provider: openai | Model: gpt-4o-mini | Concurrency: 4
  Progress: [====================] 20/20 requests completed (100.0%)
----------------------------------------------------------------------
Summary Metrics:
  Median TTFT (P50)   : 0.285 s
  Median TPOT (P50)   : 12.40 ms
  P95 Latency         : 1.580 s
  Aggregate Throughput: 748.5 tok/s
  Single Stream Speed : 80.6 tok/s
  Cost / 1M Tokens    : $0.60
======================================================================
Results written to results/concurrency.json`,
    content: [
      "InferBench supports single-provider benchmarking, multi-provider matrix runs (--all-providers), and dedicated serving comparisons (--mode serving_comparison).",
      "All requests run with precise microsecond timestamps for first token arrival (TTFT) and chunk intervals (TPOT).",
    ],
    commonMistakes: [
      {
        issue: "Ollama connection refused at localhost:11434",
        solution: "Ensure Ollama is running (run 'ollama serve' in a separate terminal) and pull the model: 'ollama pull qwen2.5:3b'.",
      },
    ],
    keyFiles: ["benchmark/run.py", "results/concurrency.json"],
  },
  {
    id: "read-results",
    stepNumber: 7,
    title: "Read & Export Results",
    summary: "Inspect normalized JSON results, export to CSV, or launch the interactive Streamlit analytics dashboard.",
    category: "Analysis",
    estimatedMinutes: 3,
    commands: {
      label: "Export CSV and launch dashboard",
      powershell: `# Export JSON results to CSV
python export_results.py --input results/concurrency.json --output results/concurrency.csv

# Launch interactive Streamlit dashboard
streamlit run dashboard/app.py`,
      bash: `# Export JSON results to CSV
python3 export_results.py --input results/concurrency.json --output results/concurrency.csv

# Launch interactive Streamlit dashboard
streamlit run dashboard/app.py`,
    },
    expectedOutput: `Successfully exported 7 rows from results/concurrency.json -> results/concurrency.csv

  You can now view your Streamlit app in your browser.
  Local URL: http://localhost:8501`,
    content: [
      "The results directory holds structured JSON files containing full percentiles (P50, P90, P95, P99), latency breakdowns, throughput, cost estimates, and hardware telemetry.",
      "The Streamlit dashboard (dashboard/app.py) provides multi-tab visual analytics: Model/API Comparison, Serving Infrastructure Comparison, Concurrency Scaling Curves, and Full Data Export.",
    ],
    commonMistakes: [
      {
        issue: "Streamlit shows 'No benchmark results found'",
        solution: "Check the sidebar file path in Streamlit. Ensure you ran a benchmark first so results/concurrency.json exists.",
      },
    ],
    keyFiles: ["export_results.py", "dashboard/app.py", "results/concurrency.json"],
  },
  {
    id: "troubleshooting",
    stepNumber: 8,
    title: "Troubleshooting Common Errors",
    summary: "Resolve rate limits (HTTP 429), missing credentials, GPU telemetry caveats, and network timeouts.",
    category: "Analysis",
    estimatedMinutes: 4,
    commands: {
      label: "Run unit tests to verify local setup",
      powershell: "pytest -v",
      bash: "pytest -v",
    },
    expectedOutput: `============================= test session starts =============================
tests/test_backends.py .. [ 15%]
tests/test_config.py ... [ 30%]
tests/test_metrics.py ... [ 50%]
tests/test_providers.py ...... [ 85%]
tests/test_serving_reliability.py .. [100%]
============================== 13 passed in 1.45s ==============================`,
    content: [
      "HTTP 429 Rate Limits: InferBench automatically performs exponential backoff for 429 and transient 5xx errors. You can also configure requests_per_second_limit in configs/benchmark.yaml.",
      "GPU Telemetry is null: GPU telemetry queries nvidia-smi, rocm-smi, or PyTorch CUDA. On systems without active GPU drivers (or cloud API benchmarks), GPU metrics are honestly reported as null.",
      "Streaming TTFT is null: Non-streaming endpoints do not emit token timestamps. InferBench strictly marks TTFT as null rather than faking it from total duration.",
    ],
    commonMistakes: [
      {
        issue: "Model not found on provider (HTTP 404 / 400)",
        solution: "Verify model name in configs/benchmark.yaml matches the provider's exact identifier (e.g. gpt-4o-mini or gemini-2.5-flash).",
      },
    ],
    keyFiles: ["tests/", "benchmark/providers/base.py"],
  },
  {
    id: "reproducibility",
    stepNumber: 9,
    title: "Benchmarking Rigor & Reproducibility",
    summary: "Apply scientific benchmarking methodology: deterministic seeds, prompt length controls, KV cache warmups, and hardware tracking.",
    category: "Advanced",
    estimatedMinutes: 4,
    commands: {
      label: "Run benchmark with explicit seed & workload",
      powershell: "python -m benchmark.run --config configs/benchmark.yaml --warmup 3 --requests 10",
      bash: "python3 -m benchmark.run --config configs/benchmark.yaml --warmup 3 --requests 10",
    },
    expectedOutput: `[Warmup] Group 1 (In: 128 tokens) - 3 warmup requests completed.
[Test] Provider: openai | Concurrency: 1, 2, 4 | Input: 128, 256 | Output: 128
Seed: 42 | Workload verified.`,
    content: [
      "InferBench uses a fixed random seed (default: 42) to generate deterministic prompt workloads across all benchmarked providers.",
      "KV Cache Warmup: Initial cold requests often include model loading, graph compilation, or cold server overhead. InferBench runs configurable warmup requests before recording metrics.",
      "Concurrency Sweeps: Always benchmark across multiple concurrency levels (e.g. 1, 2, 4, 8) to distinguish single-stream speed from saturation throughput.",
      "Strict Cost Tracking: Costs are calculated from verified provider pricing tables or configured YAML rates, preventing fabricated cost claims.",
    ],
    commonMistakes: [
      {
        issue: "Comparing models with different prompt lengths",
        solution: "Always use fixed input_tokens and output_tokens tiers (e.g., 256 in / 128 out) across all compared providers.",
      },
    ],
    keyFiles: ["configs/benchmark.yaml", "benchmark/workload.py"],
  },
];
