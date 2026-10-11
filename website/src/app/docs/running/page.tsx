import React from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "CLI Execution Runner Reference",
  description: "Comprehensive CLI command-line parameter reference, dry run flags, and execution lifecycle for InferBench.",
};

export default function RunningPage() {
  return (
    <div className="py-12 bg-[#0c0d11] min-h-screen text-[#e6e8ec]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#717886] pb-4 border-b border-[#1e222a]">
          <Link href="/" className="hover:text-[#e6e8ec] transition-colors">
            InferBench
          </Link>
          <span>/</span>
          <Link href="/docs" className="hover:text-[#e6e8ec] transition-colors">
            Documentation
          </Link>
          <span>/</span>
          <span className="text-cyan-400">CLI Runner</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>CLI EXECUTION REFERENCE</span>
              </div>
              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Benchmark CLI Runner &amp; Flags
              </h1>
              <p className="text-sm text-[#9096a2] leading-relaxed">
                InferBench is driven by <code className="font-mono text-cyan-400 text-xs">benchmark.run</code>, supporting modular flags, dry runs, concurrency sweeps, and automated exports.
              </p>
            </div>

            {/* Quick Invocation Cheatsheet */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>Common CLI Invocations</span>
              </h2>
              <CodeBlock
                title="Common CLI Examples"
                powershell={`# 1. Discover active providers & keys\npython -m benchmark.providers\n\n# 2. Preview experiment matrix (Dry Run - zero cost)\npython -m benchmark.run --provider openai --dry-run\n\n# 3. Benchmark local Ollama\npython -m benchmark.run --provider ollama --model qwen2.5:3b\n\n# 4. Benchmark OpenAI with custom concurrency tiers\npython -m benchmark.run --provider openai --model gpt-4o-mini --concurrency 1 2 4 8\n\n# 5. Benchmark all configured providers with valid credentials\npython -m benchmark.run --all-providers`}
                bash={`# 1. Discover active providers & keys\npython3 -m benchmark.providers\n\n# 2. Preview experiment matrix (Dry Run - zero cost)\npython3 -m benchmark.run --provider openai --dry-run\n\n# 3. Benchmark local Ollama\npython3 -m benchmark.run --provider ollama --model qwen2.5:3b\n\n# 4. Benchmark OpenAI with custom concurrency tiers\npython3 -m benchmark.run --provider openai --model gpt-4o-mini --concurrency 1 2 4 8\n\n# 5. Benchmark all configured providers with valid credentials\npython3 -m benchmark.run --all-providers`}
              />
            </section>

            {/* CLI Flag Reference Table */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>Command-Line Flag Reference</span>
              </h2>
              <div className="rounded border border-[#1e222a] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0e1015] border-b border-[#1e222a] text-[#717886]">
                    <tr>
                      <th className="py-2.5 px-3">Flag</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Default</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e222a] bg-[#121419] text-[#cbd2dc]">
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--provider</td>
                      <td className="py-2.5 px-3 text-[#717886]">string</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">None</td>
                      <td className="py-2.5 px-3">Target provider (<code className="text-cyan-300">ollama</code>, <code className="text-cyan-300">openai</code>, <code className="text-cyan-300">gemini</code>, etc.)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--all-providers</td>
                      <td className="py-2.5 px-3 text-[#717886]">flag</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">false</td>
                      <td className="py-2.5 px-3">Run benchmark across all providers with valid credentials</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--model</td>
                      <td className="py-2.5 px-3 text-[#717886]">string</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">From YAML</td>
                      <td className="py-2.5 px-3">Override target model identifier for this run</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--dry-run</td>
                      <td className="py-2.5 px-3 text-[#717886]">flag</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">false</td>
                      <td className="py-2.5 px-3">Simulate matrix, verify credentials &amp; print plan without HTTP requests</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--concurrency</td>
                      <td className="py-2.5 px-3 text-[#717886]">int...</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">[1, 2, 4]</td>
                      <td className="py-2.5 px-3">List of concurrent worker thread counts to sweep</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--warmup</td>
                      <td className="py-2.5 px-3 text-[#717886]">int</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">2</td>
                      <td className="py-2.5 px-3">Number of unrecorded warm-up requests to prime caches</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--requests</td>
                      <td className="py-2.5 px-3 text-[#717886]">int</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">5</td>
                      <td className="py-2.5 px-3">Number of recorded requests per concurrency/token tier</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--seed</td>
                      <td className="py-2.5 px-3 text-[#717886]">int</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">42</td>
                      <td className="py-2.5 px-3">Deterministic random seed for workload generation</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">--config</td>
                      <td className="py-2.5 px-3 text-[#717886]">path</td>
                      <td className="py-2.5 px-3 text-[#9096a2]">configs/benchmark.yaml</td>
                      <td className="py-2.5 px-3">Path to alternate YAML configuration manifest</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Execution Lifecycle */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>Execution Lifecycle</span>
              </h2>
              <div className="space-y-2 text-xs text-[#9096a2] leading-relaxed">
                <p>When you trigger <code className="font-mono text-cyan-400">python -m benchmark.run</code>, the engine performs the following ordered steps:</p>
                <ol className="space-y-2 list-decimal list-inside font-mono text-[11px] text-[#cbd2dc]">
                  <li><strong>Manifest Validation:</strong> Validates <code className="text-[#9096a2]">configs/benchmark.yaml</code> against dataclass schemas.</li>
                  <li><strong>Credential Check:</strong> Verifies provider API keys or local endpoint sockets.</li>
                  <li><strong>Workload Calibration:</strong> Generates deterministic prompt tiers with seed 42.</li>
                  <li><strong>Cache Warmup:</strong> Dispatches unrecorded warmup requests to prime server caches.</li>
                  <li><strong>Concurrent Threaded Sweep:</strong> Dispatches batches via ThreadPoolExecutor. Monotonic timestamps are logged for each token event.</li>
                  <li><strong>Metrics Aggregation:</strong> Computes P50/P90/P95/P99 latency, TTFT, TPOT, and throughput.</li>
                  <li><strong>Atomic Persistence:</strong> Saves results to <code className="text-cyan-400">results/concurrency.json</code>.</li>
                </ol>
              </div>
            </section>

            {/* Launching Visualization */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">04</span>
                <span>Visualizing Results in Streamlit</span>
              </h2>
              <p className="text-xs text-[#9096a2]">
                Once a benchmark finishes, launch the interactive visual analytics console:
              </p>
              <CodeBlock
                title="Launch Streamlit Dashboard"
                powershell="streamlit run dashboard/app.py"
                bash="streamlit run dashboard/app.py"
              />
              <p className="text-xs text-[#9096a2]">
                Opens at <code className="font-mono text-cyan-400">http://localhost:8501</code> with Model Comparison, Serving Comparison, Concurrency Curves, and Raw Data Explorer tabs.
              </p>
            </section>

            {/* Navigation footer */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/configuration"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← YAML Configuration
              </Link>
              <Link
                href="/docs/results"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>Results Schema &amp; Export</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
