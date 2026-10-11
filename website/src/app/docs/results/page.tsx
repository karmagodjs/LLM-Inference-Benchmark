import React from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Results Schema & CSV Export Guide",
  description: "Normalized JSON benchmark results schema, percentile distribution structures, and CSV export using export_results.py.",
};

export default function ResultsPage() {
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
          <span className="text-cyan-400">Results Schema</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>NORMALIZED DATA ARCHITECTURE</span>
              </div>
              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Results Schema &amp; CSV Export
              </h1>
              <p className="text-sm text-[#9096a2] leading-relaxed">
                InferBench persists all benchmark runs into structured, schema-validated JSON files with full percentile distributions, hardware telemetry, and zero credential leaks.
              </p>
            </div>

            {/* Normalized JSON Structure */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>The results/concurrency.json Structure</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Every benchmark writes atomic records to <code className="font-mono text-cyan-400">results/concurrency.json</code>. Here is an authentic snippet from our recorded local run:
              </p>
              <div className="p-4 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc] overflow-x-auto leading-relaxed shadow-inner">
                <pre>{`{
  "experiment_id": "exp-20260823_153132",
  "timestamp": "2026-08-23T15:31:32Z",
  "mode": "model_comparison",
  "provider": "ollama",
  "model": "qwen2.5:3b",
  "workload": {
    "warmup_requests": 2,
    "benchmark_requests": 3,
    "concurrency": 1,
    "input_tokens": 128,
    "output_tokens": 128,
    "seed": 42
  },
  "metrics": {
    "ttft": {
      "mean": 2.102,
      "p50": 2.064,
      "p90": 2.215,
      "p95": 2.248,
      "p99": 2.274
    },
    "tpot": {
      "mean": 0.0964,
      "p50": 0.0947,
      "p90": 0.1012,
      "p95": 0.1035,
      "p99": 0.1051
    },
    "latency": {
      "mean": 14.185,
      "p50": 14.188,
      "p90": 14.646,
      "p95": 14.761,
      "p99": 14.853
    },
    "throughput": {
      "tokens_per_second": 9.35,
      "requests_per_second": 0.0705
    },
    "errors": {
      "failed_requests": 0,
      "error_rate": 0.0
    },
    "system_telemetry": {
      "cpu_percent": 34.2,
      "memory_mb": 4812,
      "gpu_memory_mb": null
    }
  }
}`}</pre>
              </div>
            </section>

            {/* Field Definitions Table */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>Field Dictionary</span>
              </h2>
              <div className="rounded border border-[#1e222a] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0e1015] border-b border-[#1e222a] text-[#717886]">
                    <tr>
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e222a] bg-[#121419] text-[#cbd2dc]">
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">ttft.p50</td>
                      <td className="py-2.5 px-3 text-[#717886]">float | null</td>
                      <td className="py-2.5 px-3">Median seconds to first SSE token chunk. Strictly null for non-streaming endpoints.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">tpot.p50</td>
                      <td className="py-2.5 px-3 text-[#717886]">float</td>
                      <td className="py-2.5 px-3">Median seconds per generated token: (total_time - ttft) / (out_tokens - 1).</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">throughput.tokens_per_second</td>
                      <td className="py-2.5 px-3 text-[#717886]">float</td>
                      <td className="py-2.5 px-3">Aggregate output tokens divided by total batch duration in wall-clock seconds.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">latency.p95</td>
                      <td className="py-2.5 px-3 text-[#717886]">float</td>
                      <td className="py-2.5 px-3">95th percentile end-to-end request turnaround duration.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-400">system_telemetry.gpu_memory_mb</td>
                      <td className="py-2.5 px-3 text-[#717886]">int | null</td>
                      <td className="py-2.5 px-3">Peak VRAM footprint. Null if no NVIDIA/ROCm GPU driver attached.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* CSV Exporter */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>Exporting to CSV via export_results.py</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                InferBench includes a standalone utility script to flatten nested JSON structures into tabular CSV files for Pandas, R, or Excel analysis:
              </p>
              <CodeBlock
                title="Flatten JSON to CSV"
                powershell="python export_results.py --input results/concurrency.json --output results/concurrency.csv"
                bash="python3 export_results.py --input results/concurrency.json --output results/concurrency.csv"
              />
              <p className="text-xs text-[#9096a2] leading-relaxed">
                You can then inspect the flattened data in Python:
              </p>
              <div className="p-3.5 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc] overflow-x-auto">
                <pre>{`import pandas as pd

df = pd.read_csv("results/concurrency.csv")
print(df[["provider", "model", "concurrency", "ttft_p50", "throughput_tps", "latency_p95"]])`}</pre>
              </div>
            </section>

            {/* Navigation footer */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/running"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← CLI Execution Runner
              </Link>
              <Link
                href="/docs/reproducibility"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>Reproducibility &amp; Rigor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
