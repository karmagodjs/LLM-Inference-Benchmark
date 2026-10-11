import React from "react";
import Link from "next/link";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Benchmarking Rigor & Reproducibility Guide",
  description: "Scientific benchmarking principles: deterministic workloads, warmups, sample size requirements, and fair comparison disclosures.",
};

export default function ReproducibilityPage() {
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
          <span className="text-cyan-400">Reproducibility</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>SCIENTIFIC INTEGRITY</span>
              </div>
              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Benchmarking Rigor &amp; Reproducibility
              </h1>
              <p className="text-sm text-[#9096a2] leading-relaxed">
                Benchmark numbers without methodology are marketing claims. InferBench enforces rigorous experimental controls to guarantee every observation can be reproduced independently.
              </p>
            </div>

            {/* Principle 1: Deterministic Workloads */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>Deterministic Workload Generation (Seed 42)</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Random prompt lengths distort inference comparisons because TTFT scales linearly with input token count (O(N) prefill complexity). InferBench generates prompts using a deterministic seed (default: <code className="font-mono text-cyan-400">seed: 42</code>) mapped to exact token buckets (e.g. 128, 256, 512 tokens).
              </p>
              <div className="p-3.5 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc]">
                <pre>{`workload:
  seed: 42
  input_tokens: [128, 256]
  output_tokens: [128]
  benchmark_requests: 10`}</pre>
              </div>
            </section>

            {/* Principle 2: Warm-up Isolation */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>KV Cache &amp; Hardware Warm-up Isolation</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                The first request to an inference engine frequently incurs severe cold penalties:
              </p>
              <ul className="space-y-1 text-xs text-[#9096a2] list-disc list-inside">
                <li>Local runtimes: Model weight paging into GPU VRAM and CUDA graph compilation (1–5 seconds).</li>
                <li>Cloud providers: TLS handshake negotiation and container autoscaling wake-ups.</li>
              </ul>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                InferBench executes configurable unrecorded warmup queries (<code className="font-mono text-cyan-400">warmup_requests: 2</code>) before recording metrics. This prevents cold start anomalies from distorting steady-state P50/P95 latencies.
              </p>
            </section>

            {/* Principle 3: Sample Size Requirements */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>Sample Size Requirements (N &gt;= 20 for P95/P99)</span>
              </h2>
              <div className="p-3.5 rounded border border-amber-900/40 bg-amber-950/20 text-xs text-amber-200/90 space-y-1.5">
                <div className="font-mono text-[11px] text-amber-400 font-semibold">
                  <span>Small Sample Size Distortion Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  For quick smoke testing, a small batch (e.g. N = 3) is fast and cost-effective. However, computing 95th percentile (P95) on 3 requests is mathematically unreliable. For published benchmarks, always configure at least 20 recorded requests per concurrency tier (<code className="font-mono text-cyan-300">--requests 20</code>).
                </p>
              </div>
            </section>

            {/* Principle 4: Concurrency Sweeps */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">04</span>
                <span>Concurrency Sweeps vs Single Stream</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Never evaluate an LLM serving backend at a single concurrency level. Single-stream speed (<code className="font-mono text-[#cbd2dc]">concurrency = 1</code>) tells you how fast one user receives tokens. High concurrency (<code className="font-mono text-[#cbd2dc]">concurrency = 4, 8, 16</code>) reveals when continuous batching saturates and tail latency spikes exponentially.
              </p>
            </section>

            {/* Principle 5: Data Provenance */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">05</span>
                <span>Explicit Data Provenance Protocol</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Every metric displayed in InferBench carries one of three explicit provenance labels:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#121419] border border-[#1e222a] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-semibold text-[11px]">
                    Recorded benchmark
                  </span>
                  <span className="text-[#9096a2]">Authentic measurement saved to <code className="text-[#cbd2dc]">results/concurrency.json</code></span>
                </div>
                <div className="p-2.5 rounded bg-[#121419] border border-[#1e222a] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#181b22] text-[#9096a2] border border-[#2b303c] font-semibold text-[11px]">
                    Illustrative example
                  </span>
                  <span className="text-[#9096a2]">Calibrated sample dataset for demonstration and UI visualization</span>
                </div>
                <div className="p-2.5 rounded bg-[#121419] border border-[#1e222a] flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#181b22] text-amber-400 border border-amber-900/60 font-semibold text-[11px]">
                    Simulated preview
                  </span>
                  <span className="text-[#9096a2]">Synthetic stress profile to test saturation behavior without cloud API spend</span>
                </div>
              </div>
            </section>

            {/* Navigation footer */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/results"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← Results Schema
              </Link>
              <Link
                href="/docs/contributing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>Contributing Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
