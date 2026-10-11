export type DataProvenance = "Recorded benchmark" | "Illustrative example" | "Simulated preview";

export interface LatencyDistribution {
  count: number;
  mean: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface BenchmarkRunItem {
  id: string;
  provenance: DataProvenance;
  provenanceDetails: string;
  provider: string;
  model: string;
  framework: string;
  concurrency: number;
  input_tokens: number;
  actual_input_tokens_avg?: number;
  output_tokens: number;
  requests: number;
  completed: number;
  failed: number;
  duration_s: number;
  throughput_tokens_per_s: number;
  requests_per_s: number;
  ttft_p50_s: number | null;
  ttft_p90_s?: number | null;
  ttft_p95_s: number | null;
  ttft_p99_s?: number | null;
  latency_p50_s: number;
  latency_p90_s?: number;
  latency_p95_s: number;
  latency_p99_s?: number;
  decode_time_p50_s?: number;
  tpot_p50_ms: number | null;
  tpot_p95_ms: number | null;
  gen_speed_p50_tok_s: number | null;
  cost_per_1m_tokens_usd: number | null;
  cost_per_request_usd: number | null;
  token_status: "Exact (API)" | "Estimated";
  streaming_supported: boolean;
  warmup_requests: number;
  seed: number;
  system_metrics?: {
    cpu_percent: number;
    ram_used_gb: number;
    gpu_memory_used_mb?: number | null;
    gpu_utilization?: number | null;
    gpu_power_watts?: number | null;
  };
  latency_distribution?: LatencyDistribution;
  measurement_limitations: string[];
  timestamp: string;
}

export const BENCHMARK_RUNS: BenchmarkRunItem[] = [
  {
    id: "exp-20260823_153132",
    provenance: "Recorded benchmark",
    provenanceDetails: "Direct output record from results/concurrency.json in repository",
    provider: "Ollama",
    model: "qwen2.5:3b",
    framework: "ollama",
    concurrency: 1,
    input_tokens: 128,
    actual_input_tokens_avg: 127.67,
    output_tokens: 128,
    requests: 3,
    completed: 3,
    failed: 0,
    duration_s: 41.06,
    throughput_tokens_per_s: 9.35,
    requests_per_s: 0.07,
    ttft_p50_s: 2.064,
    ttft_p90_s: 2.170,
    ttft_p95_s: 2.183,
    ttft_p99_s: 2.193,
    latency_p50_s: 14.094,
    latency_p90_s: 14.687,
    latency_p95_s: 14.761,
    latency_p99_s: 14.820,
    decode_time_p50_s: 12.030,
    tpot_p50_ms: 94.73,
    tpot_p95_ms: 99.04,
    gen_speed_p50_tok_s: 10.56,
    cost_per_1m_tokens_usd: null,
    cost_per_request_usd: null,
    token_status: "Exact (API)",
    streaming_supported: true,
    warmup_requests: 1,
    seed: 42,
    system_metrics: {
      cpu_percent: 48.2,
      ram_used_gb: 3.4,
      gpu_memory_used_mb: null,
      gpu_utilization: null,
      gpu_power_watts: null,
    },
    latency_distribution: {
      count: 3,
      mean: 13.686,
      min: 12.129,
      max: 14.835,
      p50: 14.094,
      p90: 14.687,
      p95: 14.761,
      p99: 14.820,
    },
    measurement_limitations: [
      "Low sample size (N=3 requests). Statistical variance is elevated.",
      "Hardware telemetry: Host CPU only. GPU metrics honestly reported as null.",
      "Single-worker concurrency (c=1); does not test continuous batching saturation.",
    ],
    timestamp: "2026-08-23T15:32:28",
  },
  {
    id: "run-ill-002",
    provenance: "Illustrative example",
    provenanceDetails: "Calibrated illustrative example based on OpenAI gpt-4o-mini REST endpoint",
    provider: "OpenAI",
    model: "gpt-4o-mini",
    framework: "openai",
    concurrency: 4,
    input_tokens: 256,
    output_tokens: 128,
    requests: 20,
    completed: 20,
    failed: 0,
    duration_s: 3.42,
    throughput_tokens_per_s: 748.5,
    requests_per_s: 5.85,
    ttft_p50_s: 0.285,
    ttft_p90_s: 0.395,
    ttft_p95_s: 0.442,
    ttft_p99_s: 0.520,
    latency_p50_s: 1.12,
    latency_p90_s: 1.45,
    latency_p95_s: 1.58,
    latency_p99_s: 1.85,
    tpot_p50_ms: 12.4,
    tpot_p95_ms: 15.8,
    gen_speed_p50_tok_s: 80.6,
    cost_per_1m_tokens_usd: 0.60,
    cost_per_request_usd: 0.000115,
    token_status: "Exact (API)",
    streaming_supported: true,
    warmup_requests: 2,
    seed: 42,
    measurement_limitations: [
      "Cloud API multi-tenant queuing varies by geographical region and time of day.",
      "Network roundtrip latency included in TTFT.",
    ],
    timestamp: "2026-10-11T08:30:12",
  },
  {
    id: "run-ill-003",
    provenance: "Illustrative example",
    provenanceDetails: "Calibrated illustrative example based on Google Gemini 2.5 Flash endpoint",
    provider: "Google Gemini",
    model: "gemini-2.5-flash",
    framework: "gemini",
    concurrency: 4,
    input_tokens: 256,
    output_tokens: 128,
    requests: 20,
    completed: 20,
    failed: 0,
    duration_s: 2.86,
    throughput_tokens_per_s: 895.1,
    requests_per_s: 6.99,
    ttft_p50_s: 0.218,
    ttft_p90_s: 0.310,
    ttft_p95_s: 0.365,
    ttft_p99_s: 0.440,
    latency_p50_s: 0.94,
    latency_p90_s: 1.18,
    latency_p95_s: 1.28,
    latency_p99_s: 1.45,
    tpot_p50_ms: 9.8,
    tpot_p95_ms: 13.1,
    gen_speed_p50_tok_s: 102.0,
    cost_per_1m_tokens_usd: 0.30,
    cost_per_request_usd: 0.000057,
    token_status: "Exact (API)",
    streaming_supported: true,
    warmup_requests: 2,
    seed: 42,
    measurement_limitations: [
      "Subject to Google GenAI serverless rate limits and dynamic queue routing.",
    ],
    timestamp: "2026-10-11T08:31:05",
  },
  {
    id: "run-ill-004",
    provenance: "Illustrative example",
    provenanceDetails: "Calibrated illustrative example based on Anthropic Messages API",
    provider: "Anthropic",
    model: "claude-3-5-sonnet-20241022",
    framework: "anthropic",
    concurrency: 4,
    input_tokens: 256,
    output_tokens: 128,
    requests: 20,
    completed: 20,
    failed: 0,
    duration_s: 4.88,
    throughput_tokens_per_s: 524.6,
    requests_per_s: 4.10,
    ttft_p50_s: 0.462,
    ttft_p90_s: 0.690,
    ttft_p95_s: 0.785,
    ttft_p99_s: 0.920,
    latency_p50_s: 1.62,
    latency_p90_s: 1.98,
    latency_p95_s: 2.15,
    latency_p99_s: 2.45,
    tpot_p50_ms: 18.2,
    tpot_p95_ms: 22.4,
    gen_speed_p50_tok_s: 54.9,
    cost_per_1m_tokens_usd: 15.00,
    cost_per_request_usd: 0.002688,
    token_status: "Exact (API)",
    streaming_supported: true,
    warmup_requests: 2,
    seed: 42,
    measurement_limitations: [
      "Frontier reasoning model with larger parameter count; higher per-token compute intensity.",
    ],
    timestamp: "2026-10-11T08:32:15",
  },
  {
    id: "run-sim-005",
    provenance: "Simulated preview",
    provenanceDetails: "Simulated profile for local vLLM server via universal openai_compatible adapter",
    provider: "vLLM (Local Server)",
    model: "meta-llama/Llama-3.2-3B-Instruct",
    framework: "vllm",
    concurrency: 4,
    input_tokens: 256,
    output_tokens: 128,
    requests: 20,
    completed: 20,
    failed: 0,
    duration_s: 3.12,
    throughput_tokens_per_s: 820.5,
    requests_per_s: 6.41,
    ttft_p50_s: 0.145,
    ttft_p90_s: 0.190,
    ttft_p95_s: 0.210,
    ttft_p99_s: 0.245,
    latency_p50_s: 1.05,
    latency_p90_s: 1.25,
    latency_p95_s: 1.34,
    latency_p99_s: 1.48,
    tpot_p50_ms: 11.2,
    tpot_p95_ms: 14.5,
    gen_speed_p50_tok_s: 89.3,
    cost_per_1m_tokens_usd: null,
    cost_per_request_usd: null,
    token_status: "Exact (API)",
    streaming_supported: true,
    warmup_requests: 2,
    seed: 42,
    system_metrics: {
      cpu_percent: 42.1,
      ram_used_gb: 6.2,
      gpu_memory_used_mb: 5800,
      gpu_utilization: 98.6,
      gpu_power_watts: 145.0,
    },
    measurement_limitations: [
      "Requires GPU with CUDA support and vLLM runtime installed locally.",
      "PagedAttention memory block size affects KV cache utilization.",
    ],
    timestamp: "2026-10-11T08:35:50",
  },
];

export const SAMPLE_BENCHMARK_RUNS = BENCHMARK_RUNS;

