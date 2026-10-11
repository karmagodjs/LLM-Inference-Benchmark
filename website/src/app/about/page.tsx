import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

export const metadata = {
  title: "About InferBench",
  description: "Learn about the mission, engineering philosophy, and open-source principles behind InferBench.",
};

export default function AboutPage() {
  return (
    <div className="py-12 bg-[#0c0d11] min-h-screen text-[#e6e8ec]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#717886] pb-4 border-b border-[#1e222a]">
          <Link href="/" className="hover:text-[#e6e8ec] transition-colors">
            InferBench
          </Link>
          <span>/</span>
          <span className="text-cyan-400">About</span>
        </div>

        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-[#1e222a]">
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
            <span>MISSION &amp; PHILOSOPHY</span>
          </div>

          <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
            About InferBench
          </h1>

          <p className="text-sm text-[#9096a2] leading-relaxed max-w-3xl">
            {siteConfig.tagline} InferBench is an open-source, provider-agnostic harness built to provide clear, reproducible insights into LLM inference latency, token velocity, and serving efficiency.
          </p>
        </div>

        {/* Why InferBench Exists */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#e6e8ec] tracking-tight">
            Why InferBench Exists
          </h2>
          <div className="space-y-2.5 text-xs text-[#9096a2] leading-relaxed">
            <p>
              In modern AI engineering, choosing a model or serving framework is often clouded by vendor marketing, proprietary speed claims, and superficial average latency measurements that mask critical tail latency spikes.
            </p>
            <p>
              A model that appears &quot;fast&quot; on a single short query may experience severe queue degradation when five users query it simultaneously. Similarly, comparing a 128-token prompt against a 512-token prompt produces apples-to-oranges throughput numbers that lead to costly infrastructure misjudgments.
            </p>
            <p>
              InferBench was created to solve this. It provides a standardized, scientifically rigorous workbench that runs identical prompt distributions across commercial APIs (OpenAI, Gemini, Claude, Grok, OpenRouter) and local engines (Ollama, vLLM, llama.cpp), reporting true percentiles, streaming TTFT, and hardware consumption.
            </p>
          </div>
        </section>

        {/* Core Engineering Principles */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e6e8ec] tracking-tight">
            Core Engineering Principles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Principle 1 */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-2">
              <div className="text-cyan-400 font-semibold text-xs font-mono">
                <span>1. Honest Metrics Integrity</span>
              </div>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                We never fake or extrapolate metrics. Non-streaming endpoints report TTFT as <code className="font-mono text-cyan-400">null</code>. Unconfigured pricing returns <code className="font-mono text-cyan-400">null</code>. If GPU telemetry is unavailable, it is logged as <code className="font-mono text-cyan-400">null</code> rather than producing simulated numbers.
              </p>
            </div>

            {/* Principle 2 */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-2">
              <div className="text-[#cbd2dc] font-semibold text-xs font-mono">
                <span>2. Decoupled Provider Abstraction</span>
              </div>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                The benchmark engine communicates through a single <code className="font-mono text-cyan-400">InferenceProvider</code> interface. Adding a new cloud provider or local runtime requires implementing four standard methods without altering orchestrator logic or metrics collectors.
              </p>
            </div>

            {/* Principle 3 */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-2">
              <div className="text-cyan-400 font-semibold text-xs font-mono">
                <span>3. Scientific Reproducibility</span>
              </div>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Deterministic random seed (seed: 42), isolated pre-benchmark warmup requests to prime KV caches, exact input/output token bounds, and exportable JSON/CSV artifacts ensure that any experiment can be verified and audited by third parties.
              </p>
            </div>

            {/* Principle 4 */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-2">
              <div className="text-[#cbd2dc] font-semibold text-xs font-mono">
                <span>4. Real Hardware Telemetry</span>
              </div>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Direct integration with NVIDIA NVML (<code className="font-mono text-[#cbd2dc]">nvidia-smi</code>), AMD ROCm SMI, and <code className="font-mono text-[#cbd2dc]">psutil</code> provides immediate visibility into host CPU percent, RAM allocation, GPU VRAM utilization, and wattage.
              </p>
            </div>
          </div>
        </section>

        {/* Open Source & Maintainer */}
        <section className="p-6 rounded border border-[#1e222a] bg-[#121419] space-y-3">
          <h2 className="text-base font-semibold text-[#e6e8ec] tracking-tight">
            <span>Open Source &amp; Community</span>
          </h2>
          <p className="text-xs text-[#9096a2] leading-relaxed">
            InferBench is developed as open-source software under the permissive <strong>{siteConfig.license} License</strong> by{" "}
            <a
              href={siteConfig.github.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              @{siteConfig.author}
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={siteConfig.github.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] text-xs font-mono font-semibold transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-3.5 py-2 rounded border border-[#1e222a] bg-[#0c0d11] hover:bg-[#181b22] text-[#9096a2] hover:text-[#e6e8ec] text-xs font-mono transition-colors"
            >
              <span>Contact &amp; Contribution Info</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
