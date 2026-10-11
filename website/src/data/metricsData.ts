export interface MetricDetail {
  id: string;
  name: string;
  abbreviation: string;
  unit: string;
  status: "Implemented" | "Configurable" | "Hardware-dependent";
  summary: string;
  whatItMeans: string;
  whyItMatters: string;
  howItIsMeasured: string;
  formula: string;
  interpretation: {
    low: string;
    high: string;
  };
  bestFor: string;
  codeReference: string;
}

export const INFERENCE_METRICS: MetricDetail[] = [
  {
    id: "ttft",
    name: "Time to First Token",
    abbreviation: "TTFT",
    unit: "seconds (s) or milliseconds (ms)",
    status: "Implemented",
    summary: "The elapsed time between sending the inference request and receiving the very first streaming response token.",
    whatItMeans:
      "TTFT captures the prompt-processing phase (prefill phase). It includes network transit time, queue waiting time at the server, GPU memory allocation, and the forward pass that consumes all input prompt tokens before the first token can be sampled.",
    whyItMatters:
      "For human-facing conversational AI, search agents, and interactive copilots, TTFT directly governs perceived responsiveness. Users perceive an application as snappy if the first token appears in under 300ms, even if the total answer takes seconds to finish generating.",
    howItIsMeasured:
      "InferBench records `start_time = time.perf_counter()` immediately before sending the HTTP SSE stream request, and records `first_token_time = time.perf_counter()` the instant the first non-empty text chunk is decoded from the SSE stream. `ttft = first_token_time - start_time`. For non-streaming requests, TTFT is recorded as `null`—InferBench never estimates TTFT.",
    formula: "TTFT = t_{first_token} - t_{request_sent}",
    interpretation: {
      low: "Outstanding prefill speed, low server queue, and fast network roundtrip. Ideal for interactive chat, autocomplete, and live voice AI.",
      high: "Prefill bottleneck, high queue time, long input context, or high network latency. Common when servers are overloaded or prompt caching is cold.",
    },
    bestFor: "Real-time user interfaces, conversational bots, live search copilots.",
    codeReference: "benchmark/schemas.py & benchmark/providers/base.py",
  },
  {
    id: "tpot",
    name: "Time Per Output Token",
    abbreviation: "TPOT",
    unit: "milliseconds (ms) or seconds (s)",
    status: "Implemented",
    summary: "The average time elapsed between successive generated tokens during the streaming decode phase.",
    whatItMeans:
      "TPOT represents the speed of the autoregressive decode loop. Once the first token is produced, the model generates each subsequent token one at a time using its KV cache. TPOT is the reciprocal of generation speed.",
    whyItMatters:
      "A human reader reads at roughly 4–5 words per second (about 200–250ms per token). A smooth streaming experience requires a TPOT under 40–50ms (> 20 tokens/sec). If TPOT spikes, text appears jerky or frozen.",
    howItIsMeasured:
      "InferBench records total decode time `t_{end} - t_{first_token}` and divides it by the total output tokens produced minus one: `tpot = decode_time / (output_tokens - 1)`. If fewer than 2 tokens were produced, TPOT is set to `null`.",
    formula: "TPOT = (t_{end} - t_{first_token}) / (N_{output} - 1)",
    interpretation: {
      low: "Rapid token streaming (e.g. < 15ms is > 65 tok/s). Text appears instantaneously to human readers.",
      high: "Slow decode loop, memory bandwidth bottleneck, small batch size, or quantization overhead.",
    },
    bestFor: "Streaming UX quality, voice synthesizer pipelining, real-time code completion.",
    codeReference: "benchmark/schemas.py (lines 40, NormalizedResponse.tpot)",
  },
  {
    id: "latency",
    name: "End-to-End Latency",
    abbreviation: "Latency (P50, P90, P95, P99)",
    unit: "seconds (s)",
    status: "Implemented",
    summary: "Total wall-clock duration from initiating the request until the final token is received and the connection closes.",
    whatItMeans:
      "End-to-end latency covers both prefill (TTFT) and decode phases: `Latency = TTFT + Total Decode Time`. InferBench reports percentiles (Median P50, P90, P95, and Peak P99) to highlight tail latency risks.",
    whyItMatters:
      "For batch processing, synthetic data generation, automated testing, and multi-turn backend agent chains, total latency dictates the pipeline runtime and service level agreements (SLAs).",
    howItIsMeasured:
      "Measured as `end_time - start_time` using high-resolution monotonic clocks (`time.perf_counter()`). Aggregated across all requests in the configuration into numpy percentiles.",
    formula: "Latency = t_{end} - t_{start}",
    interpretation: {
      low: "Fast end-to-end task completion. Essential for complex multi-agent workflows where steps run sequentially.",
      high: "Prolonged turnaround time. In long responses, total latency is dominated by output token count multiplied by TPOT.",
    },
    bestFor: "Batch evaluation, asynchronous workers, agent chain budgeting.",
    codeReference: "benchmark/orchestrator.py & benchmark/metrics.py",
  },
  {
    id: "throughput",
    name: "Aggregate Token Throughput",
    abbreviation: "Throughput",
    unit: "tokens / second (tok/s)",
    status: "Implemented",
    summary: "The total number of output tokens generated by the inference system across all concurrent streams per second.",
    whatItMeans:
      "Throughput reflects system-level capacity. Unlike single-stream generation speed, aggregate throughput increases as concurrency increases until the GPU or cluster compute/memory bandwidth saturates.",
    whyItMatters:
      "Throughput determines infrastructure return on investment (ROI). Higher throughput means more users or background tasks can be served concurrently on the same hardware without adding expensive GPUs.",
    howItIsMeasured:
      "Calculated as total completed output tokens divided by the total wall-clock duration of the benchmark configuration batch: `throughput = total_output_tokens / batch_duration_seconds`.",
    formula: "Throughput = \\sum(Tokens_{out}) / Duration_{batch}",
    interpretation: {
      low: "Underutilized compute hardware or severe lock contention. At high concurrency, low throughput indicates thrashing or queue exhaustion.",
      high: "High hardware utilization and efficient continuous batching (e.g. vLLM PagedAttention or TensorRT-LLM).",
    },
    bestFor: "Infrastructure sizing, multi-tenant cluster capacity planning, cost optimization.",
    codeReference: "benchmark/orchestrator.py (throughput_tokens_per_second)",
  },
  {
    id: "rps",
    name: "Requests Per Second",
    abbreviation: "RPS",
    unit: "requests / second (req/s)",
    status: "Implemented",
    summary: "The frequency of complete inference requests successfully answered by the provider or serving engine per unit time.",
    whatItMeans:
      "RPS measures how many independent user prompts or API queries can be resolved concurrently. It is tightly correlated with prompt length and output token budget.",
    whyItMatters:
      "Critical for API gateway rate limits, load balancing configurations, and verifying that autoscaling policies trigger appropriately under burst traffic.",
    howItIsMeasured:
      "Calculated as total completed requests divided by the total duration of the benchmark configuration: `completed_requests / batch_duration_seconds`.",
    formula: "RPS = N_{completed} / Duration_{batch}",
    interpretation: {
      low: "Long execution times per request or high request contention. Expected when generating large paragraphs (512+ tokens).",
      high: "Fast turnaround or short output tokens. Common in classification, router models, and short summary workloads.",
    },
    bestFor: "API gateway throttling, server stress testing, capacity benchmarking.",
    codeReference: "benchmark/orchestrator.py (requests_per_second)",
  },
  {
    id: "concurrency",
    name: "Concurrency Level",
    abbreviation: "Concurrency",
    unit: "parallel workers (clients)",
    status: "Implemented",
    summary: "The number of simultaneous inference requests submitted in parallel to the serving engine or API.",
    whatItMeans:
      "InferBench executes workloads at stepped concurrency levels (e.g. 1, 2, 4, 8, 16) using an asynchronous thread pool to measure scaling efficiency and identify saturation plateaus.",
    whyItMatters:
      "Inference engines behave completely differently under single-stream load compared to multi-user load. Benchmarking only at concurrency=1 gives zero insight into how an engine handles real-world production traffic.",
    howItIsMeasured:
      "Configured via `concurrency: [1, 2, 4, 8]` in YAML or `--concurrency 1 2 4` via CLI. Orchestrated using Python's `concurrent.futures.ThreadPoolExecutor`.",
    formula: "Concurrency = C \\in \\{1, 2, 4, 8, ...\\}",
    interpretation: {
      low: "Single-user latency baseline. Useful for testing raw silicon compute speed without queue contention.",
      high: "Multi-tenant stress test. Reveals memory limits, KV cache fragmentation, and queue degradation.",
    },
    bestFor: "Load testing, saturation analysis, identifying maximum sustainable traffic.",
    codeReference: "benchmark/runner.py & benchmark/orchestrator.py",
  },
  {
    id: "tokens",
    name: "Input & Output Tokens",
    abbreviation: "Prompt / Completion Tokens",
    unit: "tokens",
    status: "Implemented",
    summary: "The exact or estimated token counts for the prompt sent to the LLM and the completion generated.",
    whatItMeans:
      "LLM inference cost, latency, and memory footprints scale directly with input and output token lengths. Prefill computational cost scales quadratically or linearly with input length; decode scales linearly with output length.",
    whyItMatters:
      "Reproducible benchmarking requires enforcing consistent token lengths. Comparing a 128-token response against a 512-token response yields meaningless throughput comparisons.",
    howItIsMeasured:
      "InferBench extracts exact token metrics directly from provider responses (`usage.prompt_tokens`, `usage.completion_tokens`). If a provider does not report token counts, InferBench uses Hugging Face tokenizers and explicitly flags `token_usage_estimated = True`.",
    formula: "Tokens_{total} = Tokens_{in} + Tokens_{out}",
    interpretation: {
      low: "Fast prompt evaluation and brief responses (e.g. single-word classification or short answers).",
      high: "Extended documents, complex RAG context, chain-of-thought reasoning steps, or verbose code outputs.",
    },
    bestFor: "Workload standardization, token normalization, fair head-to-head comparisons.",
    codeReference: "benchmark/workload.py & benchmark/schemas.py",
  },
  {
    id: "cost",
    name: "Cost Per Request & Per 1M Tokens",
    abbreviation: "Cost ($)",
    unit: "USD ($) per request / per 1M tokens",
    status: "Configurable",
    summary: "The financial cost of inference based on user-configured pricing tables in YAML or CLI.",
    whatItMeans:
      "Calculated from provider pricing rates for input tokens and output tokens. Local models report zero direct token fees, but can incorporate hardware hourly costs.",
    whyItMatters:
      "Performance without cost awareness is incomplete. A model that is 10% faster but 20x more expensive may be inappropriate for high-volume production deployments.",
    howItIsMeasured:
      "Calculated strictly when pricing rates are configured in `configs/benchmark.yaml`: `cost = (input_tokens * input_rate_per_1m + output_tokens * output_rate_per_1m) / 1,000,000`. If rates are not provided, cost is honestly recorded as `null`—InferBench never fabricates pricing.",
    formula: "Cost = (Tokens_{in} \\cdot P_{in} + Tokens_{out} \\cdot P_{out}) / 10^6",
    interpretation: {
      low: "High cost-efficiency (e.g. gpt-4o-mini at $0.15/$0.60 per 1M tokens or local open-weights models).",
      high: "High-capability frontier models (e.g. Claude 3.5 Sonnet at $3.00/$15.00 per 1M tokens).",
    },
    bestFor: "Budget planning, ROI trade-off analysis, model tier selection.",
    codeReference: "benchmark/cost.py & configs/benchmark.yaml",
  },
];
