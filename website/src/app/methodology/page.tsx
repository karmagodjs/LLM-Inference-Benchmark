import React from "react";
import Link from "next/link";


export const metadata = {
  title: "Benchmarking Methodology & Experimental Rigor",
  description: "A technical guide to LLM inference benchmarking physics, latency distributions, continuous batching saturation, and measurement limitations.",
};

interface MethodologyTopic {
  number: string;
  title: string;
  implementedInInferBench: boolean;
  implementationDetail: string;
  physicsAndMechanics: string;
  implications: string;
}

const METHODOLOGY_TOPICS: MethodologyTopic[] = [
  {
    number: "01",
    title: "Cold Starts versus Warm Runs",
    implementedInInferBench: true,
    implementationDetail: "Implemented via configurable warmup_requests in configs/benchmark.yaml.",
    physicsAndMechanics:
      "When an inference engine loads a model, the first request triggers CUDA/ROCm kernel compilation, weights allocation from disk or host RAM into VRAM, and thread pool initialization. If unisolated, cold-start latency inflates P99 metrics by 300–800%.",
    implications:
      "InferBench dispatches a configurable warm-up batch before recording timer metrics. The warm-up requests prime the model graph and KV cache buffers.",
  },
  {
    number: "02",
    title: "Model Loading and Runtime Warm-up",
    implementedInInferBench: true,
    implementationDetail: "CLI flag --measure-model-load and --measure-startup in benchmark/run.py.",
    physicsAndMechanics:
      "Cold server startup time and model loading latency are decoupled from live inference requests. InferBench allows launching local backends (e.g. 'ollama serve' or 'vllm serve') and polling health endpoints until readiness.",
    implications:
      "Prevents mixing one-time process initialization costs with ongoing request-serving throughput.",
  },
  {
    number: "03",
    title: "Time to First Token (TTFT) & Prefill Phase",
    implementedInInferBench: true,
    implementationDetail: "Measured at the arrival instant of the first non-empty SSE chunk. Strictly null for non-streaming.",
    physicsAndMechanics:
      "TTFT captures the prompt-processing (prefill) phase. All input prompt tokens are evaluated in parallel during the first forward pass. Prefill compute complexity scales quadratically with input length in standard dense attention (O(N^2)).",
    implications:
      "TTFT is recorded via high-resolution monotonic clocks (time.perf_counter()). If an endpoint does not stream, TTFT is recorded as null—never estimated from total duration.",
  },
  {
    number: "04",
    title: "Time Per Output Token (TPOT) & Decode Phase",
    implementedInInferBench: true,
    implementationDetail: "TPOT = decode_time / (output_tokens - 1), where decode_time = end_time - first_token_time.",
    physicsAndMechanics:
      "The decode phase is strictly autoregressive: each token depends on the previous token. Decode throughput is memory-bandwidth bound rather than compute-bound because all model weights must be loaded from HBM/VRAM to the GPU SM registers for each single generated token.",
    implications:
      "TPOT represents single-stream user reading experience. InferBench reports median TPOT in milliseconds and verifies output token counts.",
  },
  {
    number: "05",
    title: "End-to-End Tail Latency (P50, P90, P95, P99)",
    implementedInInferBench: true,
    implementationDetail: "Numpy percentile aggregation in benchmark/metrics.py across all completed requests.",
    physicsAndMechanics:
      "Averaging latencies (mean) masks micro-stutters, GC pauses, and queue backpressure. In multi-tenant systems, tail latency (P95/P99) is dominated by concurrent request arrivals contending for GPU memory bandwidth.",
    implications:
      "InferBench records complete percentile arrays (P50, P90, P95, P99). SLAs and capacity planning should always be anchored to P95/P99 rather than means.",
  },
  {
    number: "06",
    title: "Request Throughput vs. Token Throughput",
    implementedInInferBench: true,
    implementationDetail: "Both reported: requests_per_second and throughput_tokens_per_second in NormalizedResponse.",
    physicsAndMechanics:
      "Request throughput (req/s) varies wildly depending on output token lengths. Token throughput (tokens/s) reflects total hardware utilization across concurrent streams: Throughput = sum(output_tokens) / duration.",
    implications:
      "Evaluating engines solely on req/s without fixed output token lengths produces deceptive metrics. InferBench standardizes output token lengths.",
  },
  {
    number: "07",
    title: "Concurrency and Workload Saturation",
    implementedInInferBench: true,
    implementationDetail: "Configurable concurrency sweeps: concurrency: [1, 2, 4, 8, 16] using ThreadPoolExecutor.",
    physicsAndMechanics:
      "Under single-stream workloads (c=1), GPU compute cores are underutilized. As concurrency increases, continuous batching (PagedAttention) batches parallel requests into uniform matrix multiplications, increasing throughput until memory bandwidth saturates.",
    implications:
      "InferBench runs stepped sweeps to reveal the saturation knee where throughput plateaus and tail latency begins to climb steeply.",
  },
  {
    number: "08",
    title: "Input vs. Output Token Footprints",
    implementedInInferBench: true,
    implementationDetail: "Controlled token tiers (e.g. 128, 256, 512 in / 128 out) in configs/benchmark.yaml.",
    physicsAndMechanics:
      "Input tokens govern prompt prefill duration and KV cache memory allocation. Output tokens govern generation loops and connection holding times. Varying either variable between models invalidates comparison.",
    implications:
      "InferBench enforces deterministic prompt generation calibrated to exact token lengths with seed=42.",
  },
  {
    number: "09",
    title: "Streaming vs. Non-Streaming Measurements",
    implementedInInferBench: true,
    implementationDetail: "stream: true parameter passed to provider adapters; SSE chunks decoded in streaming generator.",
    physicsAndMechanics:
      "Non-streaming requests buffer all generated tokens in memory before returning a single HTTP payload. TTFT cannot be directly observed in non-streaming mode without server-side telemetry.",
    implications:
      "InferBench distinguishes streaming from non-streaming runs and never guesses TTFT for non-streaming calls.",
  },
  {
    number: "10",
    title: "Network and Provider-Side Variability",
    implementedInInferBench: true,
    implementationDetail: "Automatic exponential backoff on HTTP 429 and transient 5xx errors; logs retry count.",
    physicsAndMechanics:
      "Commercial cloud API latency includes public internet transit, TLS handshakes, load balancer queuing, and multi-tenant scheduling contention. Running benchmarks at different times of day produces variance.",
    implications:
      "Cloud API results represent client-observed external performance under internet network conditions, not bare-metal GPU compute.",
  },
  {
    number: "11",
    title: "Hardware, Quantization & Runtime Dependencies",
    implementedInInferBench: true,
    implementationDetail: "NVIDIA NVML, AMD ROCm SMI, psutil CPU/RAM monitoring in benchmark/system_metrics.py.",
    physicsAndMechanics:
      "Model weights precision (FP16 vs AWQ vs Q4_K_M) dramatically impacts VRAM size and memory bandwidth pressure. Comparing FP16 on vLLM against 4-bit Ollama measures quantization differences rather than runtime efficiency.",
    implications:
      "Mode 2 (Serving Comparison) tests the exact same model weights and quantization format across competing local engines.",
  },
  {
    number: "12",
    title: "Repeated Trials & Statistical Interpretation",
    implementedInInferBench: true,
    implementationDetail: "Configurable benchmark_requests per group; reports distributions and sample counts.",
    physicsAndMechanics:
      "A sample size of N=3 or N=5 has high standard error. Outliers caused by OS context switching or network packet drops skew low-N experiments.",
    implications:
      "InferBench records request counts and timestamps for every entry. Recommendations: run at least N=20–50 requests for production baselines.",
  },
  {
    number: "13",
    title: "Fair Comparisons & Controlled Conditions",
    implementedInInferBench: true,
    implementationDetail: "Strict Honest Metrics Policy: unconfigured pricing is null, missing GPU is null.",
    physicsAndMechanics:
      "A comparison is only scientifically valid when independent variables (seed, prompt tokens, output budget, concurrency) are held constant while altering a single dependent variable (provider or engine).",
    implications:
      "InferBench documents limitations for every run and prevents fabricating results.",
  },
];

export function MethodologyPage() {
  return (
    <div className="py-12 bg-[#0c0d11] min-h-screen text-[#e6e8ec]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#9096a2]">
          <Link href="/" className="hover:text-white transition-colors">
            InferBench
          </Link>
          <span>/</span>
          <span className="text-teal-400">Methodology</span>
        </div>

        {/* Header */}
        <div className="space-y-4 pb-6 border-b border-[#1e222a]">
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#181b22] border border-[#282d37] text-xs font-mono text-teal-400">
            <span>SCIENTIFIC BENCHMARKING PROTOCOL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#e6e8ec]">
            Benchmarking Methodology &amp; Inference Physics
          </h1>

          <p className="text-sm text-[#9096a2] leading-relaxed max-w-3xl">
            A comprehensive engineering guide to prompt prefill, autoregressive token decode, continuous batching saturation, tail latency distributions, and fair comparison boundaries.
          </p>
        </div>

        {/* Disclosure & Standards Matrix */}
        <section className="p-5 rounded-lg border border-[#232731] bg-[#121419] font-mono text-xs space-y-3">
          <div className="text-[#e6e8ec] font-semibold text-sm">
            <span>Implementation Disclosure Matrix</span>
          </div>
          <p className="text-[#9096a2] text-[11px] leading-relaxed">
            The table below clarifies which measurement controls are automatically enforced by the InferBench runtime engine versus experimental controls that must be managed by the researcher.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-[11px] text-[#e6e8ec]">
              <thead className="bg-[#181b22] text-[#9096a2] uppercase tracking-wider border-b border-[#232731]">
                <tr>
                  <th className="py-2 px-3">Protocol Requirement</th>
                  <th className="py-2 px-3">InferBench Engine Support</th>
                  <th className="py-2 px-3">Source Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e222a]">
                <tr>
                  <td className="py-2 px-3 font-semibold">KV Cache Warmup Isolation</td>
                  <td className="py-2 px-3 text-teal-400">Enforced (configurable warmup_requests)</td>
                  <td className="py-2 px-3 text-[#9096a2]">benchmark/orchestrator.py</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">High-Precision Streaming TTFT</td>
                  <td className="py-2 px-3 text-teal-400">Enforced (Microsecond time.perf_counter)</td>
                  <td className="py-2 px-3 text-[#9096a2]">benchmark/schemas.py</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Non-Streaming TTFT Honesty</td>
                  <td className="py-2 px-3 text-teal-400">Enforced (Strictly reported as null)</td>
                  <td className="py-2 px-3 text-[#9096a2]">benchmark/providers/base.py</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Deterministic Seed Randomness</td>
                  <td className="py-2 px-3 text-teal-400">Enforced (seed: 42 in workload generator)</td>
                  <td className="py-2 px-3 text-[#9096a2]">benchmark/workload.py</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Local GPU Telemetry Queries</td>
                  <td className="py-2 px-3 text-teal-400">Enforced (NVML / ROCm SMI / PyTorch)</td>
                  <td className="py-2 px-3 text-[#9096a2]">benchmark/system_metrics.py</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Pricing &amp; Cost Calculation</td>
                  <td className="py-2 px-3 text-[#9096a2]">User-configured (Returns null if unset)</td>
                  <td className="py-2 px-3 text-[#9096a2]">benchmark/cost.py</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold">Cross-Cloud Network Jitter Control</td>
                  <td className="py-2 px-3 text-[#5e6470]">Recommended (Run on co-located VM)</td>
                  <td className="py-2 px-3 text-[#9096a2]">Methodology Section 10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Detailed 13 Methodology Sections */}
        <section className="space-y-8">
          <h2 className="text-xl font-bold tracking-tight text-[#e6e8ec] pb-2 border-b border-[#1e222a]">
            Core Measurement Topics
          </h2>

          <div className="space-y-6">
            {METHODOLOGY_TOPICS.map((topic) => (
              <div
                key={topic.number}
                className="p-5 rounded-lg border border-[#1e222a] bg-[#121419] space-y-3 shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e222a] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#181b22] border border-[#282d37] text-teal-400">
                      {topic.number}
                    </span>
                    <h3 className="text-sm font-bold text-[#e6e8ec]">
                      {topic.title}
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    InferBench Implementation Verified
                  </span>
                </div>

                <div className="space-y-2 text-xs leading-relaxed">
                  <div>
                    <strong className="text-[#9096a2] uppercase tracking-wider text-[10px] block mb-0.5 font-mono">
                      Physics &amp; Mechanics:
                    </strong>
                    <p className="text-[#e6e8ec]">{topic.physicsAndMechanics}</p>
                  </div>

                  <div className="pt-1">
                    <strong className="text-teal-400 uppercase tracking-wider text-[10px] block mb-0.5 font-mono">
                      InferBench Implementation:
                    </strong>
                    <p className="text-[#9096a2]">{topic.implications}</p>
                  </div>

                  <div className="pt-1.5 text-[10px] font-mono text-[#5e6470] border-t border-[#1a1d24]">
                    Engine reference: {topic.implementationDetail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-[#1e222a] flex items-center justify-between font-mono text-xs">
          <Link
            href="/#benchmarks"
            className="flex items-center gap-1.5 text-[#9096a2] hover:text-[#e6e8ec]"
          >
            <span>← Return to Results Explorer</span>
          </Link>
          <Link
            href="/docs/metrics"
            className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold"
          >
            <span>Read Metrics Reference →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MethodologyPage;
