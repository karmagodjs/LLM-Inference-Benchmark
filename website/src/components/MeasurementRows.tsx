"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MetricRowItem {
  id: string;
  symbol: string;
  name: string;
  unit: string;
  shortSummary: string;
  physics: string;
  whyItMatters: string;
  formula: string;
  sourceFile: string;
}

const METRIC_ROWS: MetricRowItem[] = [
  {
    id: "ttft",
    symbol: "TTFT",
    name: "Time to First Token",
    unit: "seconds (s)",
    shortSummary: "Elapsed time between dispatching the prompt and arrival of the first non-empty output chunk.",
    physics: "Measures the compute-heavy prompt prefill phase. All input prompt tokens are processed concurrently in the initial forward pass to populate the attention key-value (KV) cache.",
    whyItMatters: "Directly determines perceived responsiveness in interactive streaming chat, agents, and real-time completions. If an endpoint does not stream, TTFT is recorded as null.",
    formula: "t_first_chunk - t_dispatch",
    sourceFile: "benchmark/providers/base.py & benchmark/metrics.py",
  },
  {
    id: "tpot",
    symbol: "TPOT",
    name: "Time Per Output Token",
    unit: "milliseconds / token (ms/tok)",
    shortSummary: "Average time required to generate each subsequent token after the initial token has arrived.",
    physics: "Captures the autoregressive decode phase. Because each token depends on the previous token, this phase is memory-bandwidth bound: weights must be re-streamed from VRAM to compute cores for every token.",
    whyItMatters: "Governs continuous reading smoothness. A TPOT of 15ms corresponds to ~66 tok/s (exceeding human reading speed); a TPOT of 100ms feels noticeably sluggish.",
    formula: "(t_end - t_first_token) / (output_tokens - 1)",
    sourceFile: "benchmark/metrics.py",
  },
  {
    id: "latency",
    symbol: "E2E",
    name: "End-to-End Latency",
    unit: "seconds (s)",
    shortSummary: "Total turnaround duration from request initiation to final chunk stream completion.",
    physics: "The sum of connection overhead, queueing wait, prompt prefill duration, and total token decode intervals.",
    whyItMatters: "The primary metric for offline batch pipelines, RAG summarization, and task agents that must await complete responses before proceeding.",
    formula: "t_end - t_dispatch",
    sourceFile: "benchmark/runner.py & benchmark/schemas.py",
  },
  {
    id: "throughput",
    symbol: "TPS",
    name: "Token Throughput",
    unit: "tokens / second (tok/s)",
    shortSummary: "Aggregate rate of token production across all active concurrent client streams.",
    physics: "Measures how effectively continuous batching mechanisms (such as PagedAttention) saturate hardware memory bandwidth and compute cores under parallel load.",
    whyItMatters: "Critical for server provisioning and capacity planning. Single-stream speed measures individual experience; throughput measures cluster cost efficiency.",
    formula: "sum(output_tokens) / total_wall_clock_seconds",
    sourceFile: "benchmark/metrics.py",
  },
];

export function MeasurementRows() {
  const [expandedId, setExpandedId] = useState<string | null>("ttft");

  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="py-20 border-t border-[#1e222b] bg-[#0d0e11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="max-w-xl space-y-1.5">
          <div className="text-[11px] font-mono font-semibold text-[#00f0ff] uppercase tracking-wider">
            Section 01 // Measurement Physics
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#f0f2f5] tracking-tight">
            What InferBench measures.
          </h2>
          <p className="text-xs sm:text-sm text-[#949aa6] leading-relaxed">
            Inference cannot be reduced to a single speed number. We isolate prompt prefill from token decode to expose true serving behavior.
          </p>
        </div>

        {/* Editorial Rows */}
        <div className="divide-y divide-[#1e222b] border-y border-[#1e222b]">
          {METRIC_ROWS.map((metric) => {
            const isExpanded = expandedId === metric.id;

            return (
              <div key={metric.id} className="transition-colors hover:bg-[#13151a]/50">
                <button
                  type="button"
                  onClick={() => toggleRow(metric.id)}
                  className="w-full py-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isExpanded}
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-12 text-xs font-mono font-bold text-[#00f0ff]">
                        {metric.symbol}
                      </span>
                      <span className="text-base font-medium text-[#f0f2f5]">
                        {metric.name}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-[#5b616e]">
                      [{metric.unit}]
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="hidden md:inline text-xs text-[#949aa6] max-w-sm truncate text-right">
                      {metric.shortSummary}
                    </span>
                    <span className="text-[#5b616e] hover:text-[#f0f2f5] transition-colors p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#00f0ff]" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pb-6 pt-1 grid grid-cols-1 md:grid-cols-12 gap-6 text-xs text-[#949aa6] font-mono border-t border-[#1e222b]/50">
                    <div className="md:col-span-4 space-y-1">
                      <span className="text-[10px] text-[#5b616e] uppercase tracking-wider block font-semibold">
                        Physical Phase
                      </span>
                      <p className="text-[#cbd2dc] leading-relaxed font-sans text-xs">
                        {metric.physics}
                      </p>
                    </div>

                    <div className="md:col-span-5 space-y-1">
                      <span className="text-[10px] text-[#5b616e] uppercase tracking-wider block font-semibold">
                        Practical Implication
                      </span>
                      <p className="text-[#cbd2dc] leading-relaxed font-sans text-xs">
                        {metric.whyItMatters}
                      </p>
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <div>
                        <span className="text-[10px] text-[#5b616e] uppercase tracking-wider block font-semibold">
                          Formula
                        </span>
                        <code className="text-[#00f0ff] text-[11px] block mt-0.5">
                          {metric.formula}
                        </code>
                      </div>

                      <div className="pt-1 text-[10px] text-[#5b616e]">
                        <span>Source: </span>
                        <span className="text-[#949aa6]">{metric.sourceFile}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
