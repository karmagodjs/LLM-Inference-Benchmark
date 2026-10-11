"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

interface WorkflowStage {
  id: string;
  step: string;
  title: string;
  summary: string;
  detail: string;
  sourceFile: string;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "configure",
    step: "01",
    title: "Configure",
    summary: "Declarative experiment manifests & safe credentials.",
    detail: "Define model targets, warmup iterations, concurrency tiers (e.g. 1, 2, 4, 8), and input/output token bounds in YAML. API keys are safely retrieved from local environment variables without risk of leaks.",
    sourceFile: "configs/benchmark.yaml & benchmark/config.py",
  },
  {
    id: "execute",
    step: "02",
    title: "Execute",
    summary: "Concurrent threaded worker orchestration.",
    detail: "ThreadPoolExecutor dispatches deterministic prompt sequences across target endpoints. Decoupled provider adapters normalize REST and Server-Sent Events (SSE) streaming protocols with 429 rate-limit backoff.",
    sourceFile: "benchmark/runner.py & benchmark/providers/base.py",
  },
  {
    id: "measure",
    step: "03",
    title: "Measure",
    summary: "Monotonic microsecond timing & telemetry.",
    detail: "Python's monotonic time.perf_counter() records the exact arrival timestamp of the first chunk (TTFT) and subsequent chunk deltas (TPOT). GPU telemetry queries nvidia-smi / rocm-smi without synthetic guessing.",
    sourceFile: "benchmark/metrics.py",
  },
  {
    id: "inspect",
    step: "04",
    title: "Inspect",
    summary: "Normalized JSON records & CSV export.",
    detail: "Aggregated results are written atomically to results/concurrency.json with full percentile distributions (P50, P90, P95, P99). export_results.py flattens the hierarchy for tabular data science pipelines.",
    sourceFile: "export_results.py & dashboard/app.py",
  },
];

export function WorkflowFlow() {
  const [activeStageId, setActiveStageId] = useState<string>("configure");

  const activeStage = WORKFLOW_STAGES.find((s) => s.id === activeStageId) || WORKFLOW_STAGES[0];

  return (
    <section className="py-20 border-t border-[#1e222b] bg-[#0d0e11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="max-w-xl space-y-1.5">
          <div className="text-[11px] font-mono font-semibold text-[#00f0ff] uppercase tracking-wider">
            Section 02 // Execution Pipeline
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#f0f2f5] tracking-tight">
            How it works.
          </h2>
          <p className="text-xs sm:text-sm text-[#949aa6] leading-relaxed">
            A simple, four-stage flow designed for mechanical reproducibility and zero telemetry distortion.
          </p>
        </div>

        {/* 4-Stage Flow Line */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const isActive = activeStageId === stage.id;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStageId(stage.id)}
                  className={`text-left p-4 rounded border transition-all cursor-pointer relative z-10 ${
                    isActive
                      ? "bg-[#181b22] border-[#00f0ff]/50 shadow-md ring-1 ring-[#00f0ff]/20"
                      : "bg-[#13151a] border-[#1e222b] hover:border-[#272c37] hover:bg-[#151820]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className={isActive ? "text-[#00f0ff] font-bold" : "text-[#5b616e]"}>
                      {stage.step}
                    </span>
                    {idx < WORKFLOW_STAGES.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-[#272c37] hidden md:block" />
                    )}
                  </div>

                  <h3 className={`text-base font-medium mb-1 ${isActive ? "text-[#f0f2f5]" : "text-[#949aa6]"}`}>
                    {stage.title}
                  </h3>

                  <p className="text-[11px] text-[#5b616e] line-clamp-2">
                    {stage.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Stage Deep Dive */}
          <div className="p-6 rounded border border-[#1e222b] bg-[#13151a] font-mono text-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e222b]">
              <div className="flex items-center gap-2">
                <span className="text-[#00f0ff] font-bold">STAGE {activeStage.step} {"//"}</span>
                <span className="text-[#f0f2f5] font-semibold text-sm">{activeStage.title}</span>
              </div>

              <div className="text-[11px] text-[#5b616e]">
                <span>Verified Source: </span>
                <span className="text-[#00f0ff]">{activeStage.sourceFile}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#949aa6] leading-relaxed font-sans">
              {activeStage.detail}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
