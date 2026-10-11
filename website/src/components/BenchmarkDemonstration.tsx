"use client";

import React, { useState } from "react";

interface ModelProfile {
  id: string;
  name: string;
  provider: string;
  provenance: "Recorded benchmark" | "Calibrated baseline";
  provenanceDetail: string;
  // Metrics per concurrency level [c1, c4, c8]
  concurrencyData: {
    [key: number]: {
      ttftP50Ms: number;
      tpotP50Ms: number;
      latencyP95S: number;
      throughputTokPerS: number;
      singleStreamSpeed: number;
      percentiles: { min: number; p50: number; p90: number; p95: number; p99: number; max: number };
    };
  };
  scalingCurve: { concurrency: number; throughput: number; latencyP95: number }[];
}

const MODEL_PROFILES: ModelProfile[] = [
  {
    id: "ollama-qwen",
    name: "Ollama (qwen2.5:3b)",
    provider: "Local Workstation Engine",
    provenance: "Recorded benchmark",
    provenanceDetail: "Authentic run exp-20260823_153132 from results/concurrency.json (N=3, seed=42)",
    concurrencyData: {
      1: {
        ttftP50Ms: 2064,
        tpotP50Ms: 94.73,
        latencyP95S: 14.76,
        throughputTokPerS: 9.35,
        singleStreamSpeed: 9.35,
        percentiles: { min: 14.18, p50: 14.19, p90: 14.65, p95: 14.76, p99: 14.85, max: 14.85 },
      },
      4: {
        ttftP50Ms: 3410,
        tpotP50Ms: 148.2,
        latencyP95S: 22.4,
        throughputTokPerS: 28.4,
        singleStreamSpeed: 6.75,
        percentiles: { min: 18.2, p50: 20.1, p90: 21.8, p95: 22.4, p99: 23.1, max: 23.5 },
      },
      8: {
        ttftP50Ms: 5820,
        tpotP50Ms: 220.5,
        latencyP95S: 36.8,
        throughputTokPerS: 31.2,
        singleStreamSpeed: 3.9,
        percentiles: { min: 28.4, p50: 32.5, p90: 35.8, p95: 36.8, p99: 38.2, max: 39.0 },
      },
    },
    scalingCurve: [
      { concurrency: 1, throughput: 9.35, latencyP95: 14.76 },
      { concurrency: 2, throughput: 16.8, latencyP95: 17.2 },
      { concurrency: 4, throughput: 28.4, latencyP95: 22.4 },
      { concurrency: 8, throughput: 31.2, latencyP95: 36.8 },
      { concurrency: 16, throughput: 32.0, latencyP95: 68.4 },
    ],
  },
  {
    id: "openai-gpt4o-mini",
    name: "OpenAI (gpt-4o-mini)",
    provider: "Cloud Multi-Tenant Infrastructure",
    provenance: "Calibrated baseline",
    provenanceDetail: "Calibrated baseline profile over 256 input / 128 output token workload tier",
    concurrencyData: {
      1: {
        ttftP50Ms: 285,
        tpotP50Ms: 12.4,
        latencyP95S: 1.58,
        throughputTokPerS: 80.6,
        singleStreamSpeed: 80.6,
        percentiles: { min: 1.12, p50: 1.34, p90: 1.51, p95: 1.58, p99: 1.72, max: 1.85 },
      },
      4: {
        ttftP50Ms: 315,
        tpotP50Ms: 13.8,
        latencyP95S: 1.95,
        throughputTokPerS: 312.4,
        singleStreamSpeed: 78.1,
        percentiles: { min: 1.25, p50: 1.48, p90: 1.82, p95: 1.95, p99: 2.15, max: 2.30 },
      },
      8: {
        ttftP50Ms: 390,
        tpotP50Ms: 15.6,
        latencyP95S: 2.65,
        throughputTokPerS: 588.2,
        singleStreamSpeed: 73.5,
        percentiles: { min: 1.45, p50: 1.82, p90: 2.41, p95: 2.65, p99: 2.95, max: 3.12 },
      },
    },
    scalingCurve: [
      { concurrency: 1, throughput: 80.6, latencyP95: 1.58 },
      { concurrency: 2, throughput: 158.2, latencyP95: 1.72 },
      { concurrency: 4, throughput: 312.4, latencyP95: 1.95 },
      { concurrency: 8, throughput: 588.2, latencyP95: 2.65 },
      { concurrency: 16, throughput: 895.1, latencyP95: 4.82 },
    ],
  },
  {
    id: "claude-sonnet",
    name: "Claude (3.5 Sonnet)",
    provider: "Cloud Frontier Model",
    provenance: "Calibrated baseline",
    provenanceDetail: "Calibrated baseline profile over 256 input / 128 output token workload tier",
    concurrencyData: {
      1: {
        ttftP50Ms: 440,
        tpotP50Ms: 18.2,
        latencyP95S: 2.76,
        throughputTokPerS: 54.9,
        singleStreamSpeed: 54.9,
        percentiles: { min: 2.1, p50: 2.45, p90: 2.68, p95: 2.76, p99: 3.1, max: 3.25 },
      },
      4: {
        ttftP50Ms: 510,
        tpotP50Ms: 19.5,
        latencyP95S: 3.42,
        throughputTokPerS: 215.3,
        singleStreamSpeed: 53.8,
        percentiles: { min: 2.3, p50: 2.85, p90: 3.28, p95: 3.42, p99: 3.85, max: 4.10 },
      },
      8: {
        ttftP50Ms: 680,
        tpotP50Ms: 23.4,
        latencyP95S: 4.85,
        throughputTokPerS: 395.0,
        singleStreamSpeed: 49.3,
        percentiles: { min: 2.9, p50: 3.75, p90: 4.52, p95: 4.85, p99: 5.40, max: 5.80 },
      },
    },
    scalingCurve: [
      { concurrency: 1, throughput: 54.9, latencyP95: 2.76 },
      { concurrency: 2, throughput: 108.1, latencyP95: 3.05 },
      { concurrency: 4, throughput: 215.3, latencyP95: 3.42 },
      { concurrency: 8, throughput: 395.0, latencyP95: 4.85 },
      { concurrency: 16, throughput: 580.4, latencyP95: 8.60 },
    ],
  },
];

export function BenchmarkDemonstration() {
  const [activeTab, setActiveTab] = useState<"latency" | "throughput">("latency");
  const [selectedModelId, setSelectedModelId] = useState<string>("ollama-qwen");
  const [concurrency, setConcurrency] = useState<number>(1);

  const activeModel = MODEL_PROFILES.find((m) => m.id === selectedModelId) || MODEL_PROFILES[0];
  const currentMetrics = activeModel.concurrencyData[concurrency] || activeModel.concurrencyData[1];

  // Max throughput in scaling curve for relative SVG bar calculation
  const maxThroughput = Math.max(...activeModel.scalingCurve.map((d) => d.throughput));

  return (
    <section id="demonstration" className="py-20 border-t border-[#1e222b] bg-[#0d0e11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#1e222b]">
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono font-semibold text-[#00f0ff] uppercase tracking-wider">
              Empirical Demonstration
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#f0f2f5] tracking-tight">
              Compare latency breakdowns and throughput curves.
            </h2>
            <p className="text-xs sm:text-sm text-[#949aa6] max-w-2xl leading-relaxed">
              Explore how prompt prefill (TTFT), autoregressive decode (TPOT), and concurrent client scaling dictate overall system capacity.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#13151a] p-1 rounded border border-[#1e222b] self-start md:self-end">
            <button
              type="button"
              onClick={() => setActiveTab("latency")}
              className={`px-3 py-1.5 rounded text-xs font-sans font-medium transition-all ${
                activeTab === "latency"
                  ? "bg-[#181b22] text-[#00f0ff] font-semibold border border-[#272c37]"
                  : "text-[#949aa6] hover:text-[#f0f2f5]"
              }`}
            >
              <span>Latency Breakdown</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("throughput")}
              className={`px-3 py-1.5 rounded text-xs font-sans font-medium transition-all ${
                activeTab === "throughput"
                  ? "bg-[#181b22] text-[#00f0ff] font-semibold border border-[#272c37]"
                  : "text-[#949aa6] hover:text-[#f0f2f5]"
              }`}
            >
              <span>Throughput Saturation</span>
            </button>
          </div>
        </div>

        {/* Central Workbench Panel */}
        <div className="rounded-lg border border-[#1e222b] bg-[#13151a] p-6 lg:p-8 space-y-8 shadow-xl">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#1e222b]">
            {/* Model Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#5b616e] uppercase tracking-wider block">
                Target Model &amp; Runtime:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {MODEL_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedModelId(profile.id)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                      selectedModelId === profile.id
                        ? "bg-[#181b22] text-[#f0f2f5] border border-[#00f0ff]/40 shadow-sm font-semibold"
                        : "bg-[#0d0e11] text-[#949aa6] border border-[#1e222b] hover:text-[#f0f2f5] hover:bg-[#181b22]"
                    }`}
                  >
                    {profile.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Concurrency Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[#5b616e] uppercase tracking-wider block">
                Concurrent Workers:
              </span>
              <div className="flex items-center gap-1.5 bg-[#0d0e11] p-1 rounded border border-[#1e222b]">
                {[1, 4, 8].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConcurrency(c)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      concurrency === c
                        ? "bg-[#181b22] text-[#00f0ff] font-semibold border border-[#272c37]"
                        : "text-[#949aa6] hover:text-[#f0f2f5]"
                    }`}
                  >
                    c = {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VIEW A: LATENCY VIEW */}
          {activeTab === "latency" && (
            <div className="space-y-8">
              {/* Dual Metrics Readout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded border border-[#1e222b] bg-[#090a0d] space-y-1">
                  <div className="text-[10px] font-mono text-[#5b616e] uppercase tracking-wider">
                    Time to First Token (TTFT)
                  </div>
                  <div className="text-2xl font-mono font-semibold text-[#f59e0b]">
                    {currentMetrics.ttftP50Ms} <span className="text-xs text-[#949aa6] font-normal">ms (P50)</span>
                  </div>
                  <div className="text-[11px] text-[#5b616e] leading-snug">
                    Prompt prefill &amp; KV cache allocation
                  </div>
                </div>

                <div className="p-4 rounded border border-[#1e222b] bg-[#090a0d] space-y-1">
                  <div className="text-[10px] font-mono text-[#5b616e] uppercase tracking-wider">
                    Time Per Token (TPOT)
                  </div>
                  <div className="text-2xl font-mono font-semibold text-[#00f0ff]">
                    {currentMetrics.tpotP50Ms} <span className="text-xs text-[#949aa6] font-normal">ms/tok (P50)</span>
                  </div>
                  <div className="text-[11px] text-[#5b616e] leading-snug">
                    Autoregressive decode interval
                  </div>
                </div>

                <div className="p-4 rounded border border-[#1e222b] bg-[#090a0d] space-y-1">
                  <div className="text-[10px] font-mono text-[#5b616e] uppercase tracking-wider">
                    End-to-End Latency
                  </div>
                  <div className="text-2xl font-mono font-semibold text-[#f0f2f5]">
                    {currentMetrics.latencyP95S} <span className="text-xs text-[#949aa6] font-normal">s (P95)</span>
                  </div>
                  <div className="text-[11px] text-[#5b616e] leading-snug">
                    Total request completion time
                  </div>
                </div>
              </div>

              {/* Latency Percentile Spectrum */}
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs text-[#949aa6]">
                  <span className="uppercase text-[10px] tracking-wider text-[#5b616e]">
                    Turnaround Distribution Spectrum (Seconds)
                  </span>
                  <span className="text-[10px] text-[#00f0ff]">c = {concurrency} clients</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded bg-[#090a0d] border border-[#1e222b]">
                    <span className="text-[10px] text-[#5b616e] block">MIN</span>
                    <span className="text-[#949aa6]">{currentMetrics.percentiles.min}s</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090a0d] border border-[#1e222b]">
                    <span className="text-[10px] text-[#00f0ff] font-semibold block">P50 (Median)</span>
                    <span className="text-[#f0f2f5] font-semibold">{currentMetrics.percentiles.p50}s</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090a0d] border border-[#1e222b]">
                    <span className="text-[10px] text-[#5b616e] block">P90</span>
                    <span className="text-[#949aa6]">{currentMetrics.percentiles.p90}s</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090a0d] border border-[#272c37] ring-1 ring-[#00f0ff]/30">
                    <span className="text-[10px] text-[#00f0ff] font-semibold block">P95</span>
                    <span className="text-[#00f0ff] font-semibold">{currentMetrics.percentiles.p95}s</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090a0d] border border-[#1e222b]">
                    <span className="text-[10px] text-[#5b616e] block">P99</span>
                    <span className="text-[#949aa6]">{currentMetrics.percentiles.p99}s</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090a0d] border border-[#1e222b]">
                    <span className="text-[10px] text-[#5b616e] block">MAX</span>
                    <span className="text-[#949aa6]">{currentMetrics.percentiles.max}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: THROUGHPUT VIEW */}
          {activeTab === "throughput" && (
            <div className="space-y-8">
              {/* Dual Readout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-[#1e222b] bg-[#090a0d] space-y-1">
                  <div className="text-[10px] font-mono text-[#5b616e] uppercase tracking-wider">
                    Aggregate Cluster Throughput
                  </div>
                  <div className="text-3xl font-mono font-semibold text-[#00f0ff]">
                    {currentMetrics.throughputTokPerS} <span className="text-xs text-[#949aa6] font-normal">tokens / sec</span>
                  </div>
                  <div className="text-[11px] text-[#5b616e]">
                    Total tokens produced across all {concurrency} active workers
                  </div>
                </div>

                <div className="p-4 rounded border border-[#1e222b] bg-[#090a0d] space-y-1">
                  <div className="text-[10px] font-mono text-[#5b616e] uppercase tracking-wider">
                    Per-Stream Generation Speed
                  </div>
                  <div className="text-3xl font-mono font-semibold text-[#f0f2f5]">
                    {currentMetrics.singleStreamSpeed} <span className="text-xs text-[#949aa6] font-normal">tokens / sec</span>
                  </div>
                  <div className="text-[11px] text-[#5b616e]">
                    Average velocity experienced by a single user session
                  </div>
                </div>
              </div>

              {/* Concurrency Scaling Bars */}
              <div className="space-y-3 font-mono">
                <div className="text-[10px] uppercase text-[#5b616e] tracking-wider">
                  Throughput Scaling Across Concurrency Sweeps (tokens/sec)
                </div>

                <div className="space-y-2">
                  {activeModel.scalingCurve.map((point) => {
                    const widthPercent = (point.throughput / maxThroughput) * 100;
                    const isSelectedConcurrency = point.concurrency === concurrency;

                    return (
                      <div
                        key={point.concurrency}
                        onClick={() => {
                          if ([1, 4, 8].includes(point.concurrency)) {
                            setConcurrency(point.concurrency);
                          }
                        }}
                        className={`p-3 rounded border transition-all cursor-pointer ${
                          isSelectedConcurrency
                            ? "bg-[#181b22] border-[#00f0ff]/50 shadow-sm"
                            : "bg-[#090a0d] border-[#1e222b] hover:border-[#272c37]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className={isSelectedConcurrency ? "text-[#00f0ff] font-semibold" : "text-[#949aa6]"}>
                            Concurrency = {point.concurrency} {point.concurrency === 1 ? "(Single)" : `(${point.concurrency} workers)`}
                          </span>
                          <span className="text-[#f0f2f5] font-semibold">
                            {point.throughput} tok/s <span className="text-[#5b616e] font-normal">(P95: {point.latencyP95}s)</span>
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-[#1e222b] h-2 rounded overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isSelectedConcurrency ? "bg-[#00f0ff]" : "bg-[#384050]"
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Data Provenance Footer */}
          <div className="pt-4 border-t border-[#1e222b] text-[11px] font-mono text-[#5b616e]">
            <span>
              <strong className="text-[#949aa6]">Provenance:</strong> {activeModel.provenance} — {activeModel.provenanceDetail}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
