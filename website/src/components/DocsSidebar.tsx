"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_GUIDES } from "@/data/docsData";
import { CheckCircle2 } from "lucide-react";

export const DOC_MANUALS = [
  { label: "Quickstart (5 min)", href: "/docs/quickstart" },
  { label: "Installation & Setup", href: "/docs/installation" },
  { label: "Local Inference", href: "/docs/local-inference" },
  { label: "YAML Configuration", href: "/docs/configuration" },
  { label: "CLI Execution Runner", href: "/docs/running" },
  { label: "Inference Metrics Spec", href: "/docs/metrics" },
  { label: "Results Schema & Export", href: "/docs/results" },
  { label: "Reproducibility & Rigor", href: "/docs/reproducibility" },
  { label: "Troubleshooting", href: "/docs/troubleshooting" },
  { label: "Contributing Adapters", href: "/docs/contributing" },
];

interface DocsSidebarProps {
  currentStepId?: string;
  completedSteps?: string[];
  onSelectStep?: (id: string) => void;
}

export function DocsSidebar({
  currentStepId,
  completedSteps = [],
  onSelectStep,
}: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      {/* Step-by-Step Onboarding Guides (if on interactive /docs page) */}
      {onSelectStep && (
        <div className="rounded border border-[#1e222a] bg-[#121419] p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-[#717886] uppercase tracking-wider px-1">
            <span>Onboarding Steps</span>
            <span className="text-cyan-400">{completedSteps.length}/{DOC_GUIDES.length}</span>
          </div>

          <nav className="space-y-1">
            {DOC_GUIDES.map((guide) => {
              const isCompleted = completedSteps.includes(guide.id);
              const isActive = currentStepId === guide.id;

              return (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => onSelectStep(guide.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs font-sans font-medium transition-all ${
                    isActive
                      ? "bg-[#181b22] text-cyan-400 border border-[#2b303c]"
                      : "text-[#9096a2] hover:text-[#e6e8ec] hover:bg-[#151820]"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded text-[10px] font-mono flex items-center justify-center shrink-0 border border-[#2b303c] text-[#717886]">
                      {guide.stepNumber}
                    </span>
                  )}
                  <span className="truncate">{guide.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Dedicated Reference Manuals List */}
      <div className="rounded border border-[#1e222a] bg-[#121419] p-3 space-y-2.5">
        <div className="text-[10px] font-mono font-semibold text-[#717886] uppercase tracking-wider px-1">
          Reference Manuals
        </div>

        <nav className="space-y-1">
          {DOC_MANUALS.map((manual) => {
            const isActive = pathname === manual.href;

            return (
              <Link
                key={manual.href}
                href={manual.href}
                className={`flex items-center px-2.5 py-1.5 rounded text-xs transition-all font-sans font-medium ${
                  isActive
                    ? "bg-[#181b22] text-cyan-400 border border-[#2b303c]"
                    : "text-[#9096a2] hover:text-[#e6e8ec] hover:bg-[#151820]"
                }`}
              >
                <span className="truncate">{manual.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Methodology Spec Shortcut */}
      <div className="p-3 rounded border border-[#1e222a] bg-[#0c0d11] space-y-1.5 text-xs font-sans">
        <span className="text-[10px] font-mono text-[#717886] uppercase tracking-wider font-semibold block">
          Measurement Spec
        </span>
        <p className="text-[11px] text-[#9096a2] leading-relaxed">
          Inspect all 13 inference measurement principles and implementation status.
        </p>
        <Link
          href="/methodology"
          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-0.5 font-medium"
        >
          <span>View Methodology Spec →</span>
        </Link>
      </div>
    </aside>
  );
}
