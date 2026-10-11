import React from "react";
import Link from "next/link";
import { INFERENCE_METRICS } from "@/data/metricsData";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "LLM Inference Metrics Guide",
  description: "Comprehensive guide to TTFT, TPOT, tail latency percentiles, throughput, concurrency scaling, and inference cost calculation.",
};

export default function MetricsGuidePage() {
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
          <span className="text-cyan-400">Metrics Spec</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>BENCHMARK SCIENCE &amp; TELEMETRY</span>
              </div>

              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                LLM Inference Metrics Reference
              </h1>

              <p className="text-sm text-[#9096a2] leading-relaxed">
                Inference performance cannot be reduced to a single average speed. InferBench evaluates prompt prefill, token decode, percentile tail latency, throughput scaling, and cost economics.
              </p>
            </div>

            {/* Honest Metrics Policy Banner */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-3">
              <h2 className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                <span>The InferBench Honest Metrics Standard</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#9096a2]">
                <div className="space-y-1">
                  <strong className="text-[#cbd2dc] block font-mono">1. Honest TTFT:</strong>
                  <p>
                    Measured strictly from the arrival timestamp of the first streaming SSE chunk. If an endpoint does not support streaming, TTFT is reported as <code className="font-mono text-cyan-400">null</code>.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-[#cbd2dc] block font-mono">2. Honest Token Usage:</strong>
                  <p>
                    Recorded directly from API usage headers whenever available. If an endpoint does not emit token counts, tokenizer estimation is used and marked with <code className="font-mono text-cyan-400">token_usage_estimated = True</code>.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-[#cbd2dc] block font-mono">3. Honest Pricing:</strong>
                  <p>
                    Calculated strictly from configured YAML rates. If unspecified, cost returns <code className="font-mono text-cyan-400">null</code> rather than speculating.
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-[#cbd2dc] block font-mono">4. Honest GPU Telemetry:</strong>
                  <p>
                    Queries NVIDIA NVML, AMD ROCm SMI, or PyTorch CUDA. When testing cloud endpoints without local GPU hardware, GPU metrics return <code className="font-mono text-cyan-400">null</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Comprehensive Metrics List */}
            <div className="space-y-8">
              {INFERENCE_METRICS.map((metric, idx) => (
                <section
                  key={metric.id}
                  id={metric.id}
                  className="p-6 rounded border border-[#1e222a] bg-[#121419] space-y-5 scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e222a] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c] flex items-center justify-center font-bold font-mono text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                          <span>{metric.name}</span>
                          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                            {metric.abbreviation}
                          </span>
                        </h3>
                        <div className="text-[11px] text-[#717886] font-mono mt-0.5">
                          Unit: {metric.unit} • Status:{" "}
                          <span className="text-cyan-400 font-semibold">{metric.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded bg-[#08090d] border border-[#1e222a] font-mono text-xs text-cyan-300">
                      <code>{metric.formula}</code>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-[#9096a2] leading-relaxed">
                    {metric.summary}
                  </p>

                  {/* Detailed 4 Points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* 1. What it means */}
                    <div className="p-3.5 rounded border border-[#1e222a] bg-[#0c0d11] space-y-1">
                      <span className="font-mono text-cyan-400 uppercase tracking-wider text-[10px] block font-semibold">
                        1. What It Means
                      </span>
                      <p className="text-[#9096a2] text-[11px] leading-relaxed">{metric.whatItMeans}</p>
                    </div>

                    {/* 2. Why it matters */}
                    <div className="p-3.5 rounded border border-[#1e222a] bg-[#0c0d11] space-y-1">
                      <span className="font-mono text-[#cbd2dc] uppercase tracking-wider text-[10px] block font-semibold">
                        2. Why It Matters
                      </span>
                      <p className="text-[#9096a2] text-[11px] leading-relaxed">{metric.whyItMatters}</p>
                    </div>

                    {/* 3. How InferBench measures it */}
                    <div className="p-3.5 rounded border border-[#1e222a] bg-[#0c0d11] space-y-1">
                      <span className="font-mono text-cyan-400 uppercase tracking-wider text-[10px] block font-semibold">
                        3. How It Is Measured
                      </span>
                      <p className="text-[#9096a2] text-[11px] leading-relaxed">{metric.howItIsMeasured}</p>
                      <div className="pt-1 font-mono text-[10px] text-[#555b68]">
                        Code: {metric.codeReference}
                      </div>
                    </div>

                    {/* 4. Interpretation */}
                    <div className="p-3.5 rounded border border-[#1e222a] bg-[#0c0d11] space-y-1.5">
                      <span className="font-mono text-[#cbd2dc] uppercase tracking-wider text-[10px] block font-semibold">
                        4. How To Interpret Values
                      </span>
                      <div className="space-y-1 text-[11px] text-[#9096a2] leading-relaxed">
                        <p>
                          <strong className="text-cyan-400 font-mono">Low: </strong>
                          {metric.interpretation.low}
                        </p>
                        <p>
                          <strong className="text-amber-400 font-mono">High: </strong>
                          {metric.interpretation.high}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* Footer Navigation */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/running"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← CLI Execution Runner
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
