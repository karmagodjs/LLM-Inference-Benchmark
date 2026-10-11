"use client";

import React, { useState } from "react";
import { DOC_GUIDES } from "@/data/docsData";
import { DocsSidebar } from "@/components/DocsSidebar";
import { DocsContent } from "@/components/DocsContent";

import Link from "next/link";

export default function DocsPage() {
  const [currentStepId, setCurrentStepId] = useState<string>("prerequisites");
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("inferbench_completed_guides");
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  // Save completed steps to localStorage
  const handleToggleCompleted = (id: string) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        localStorage.setItem("inferbench_completed_guides", JSON.stringify(next));
      } catch {
        // Fallback
      }
      return next;
    });
  };

  const currentGuide = DOC_GUIDES.find((g) => g.id === currentStepId) || DOC_GUIDES[0];
  const currentIndex = DOC_GUIDES.findIndex((g) => g.id === currentStepId);

  const handleNextStep = () => {
    if (currentIndex < DOC_GUIDES.length - 1) {
      setCurrentStepId(DOC_GUIDES[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      setCurrentStepId(DOC_GUIDES[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="py-12 bg-[#0c0d11] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Docs Breadcrumb & Header */}
        <div className="space-y-3 pb-4 border-b border-[#1e222a]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#717886]">
            <Link href="/" className="hover:text-[#e6e8ec] transition-colors">
              InferBench
            </Link>
            <span>/</span>
            <span className="text-cyan-400">Documentation</span>
            <span>/</span>
            <span className="text-[#cbd2dc]">Step {currentGuide.stepNumber}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                <span>Documentation &amp; Guides</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#9096a2] mt-1">
                Complete engineering manual from clean environment setup to concurrent stress testing and CSV export.
              </p>
            </div>

            {/* Quick Reference Shortcut Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/docs/quickstart"
                className="px-3 py-1.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 text-xs font-sans font-medium hover:bg-cyan-950 transition-colors"
              >
                <span>5-Min Quickstart</span>
              </Link>
              <Link
                href="/docs/metrics"
                className="px-3 py-1.5 rounded bg-[#121419] text-[#9096a2] border border-[#1e222a] text-xs font-sans font-medium hover:text-[#e6e8ec] hover:bg-[#181b22] transition-colors"
              >
                <span>Metrics</span>
              </Link>
              <Link
                href="/docs/configuration"
                className="px-3 py-1.5 rounded bg-[#121419] text-[#9096a2] border border-[#1e222a] text-xs font-sans font-medium hover:text-[#e6e8ec] hover:bg-[#181b22] transition-colors"
              >
                <span>Config</span>
              </Link>
              <Link
                href="/docs/troubleshooting"
                className="px-3 py-1.5 rounded bg-[#121419] text-[#9096a2] border border-[#1e222a] text-xs font-sans font-medium hover:text-[#e6e8ec] hover:bg-[#181b22] transition-colors"
              >
                <span>Troubleshooting</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Documentation Layout: Sidebar + Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Persistent Sidebar */}
          <DocsSidebar
            currentStepId={currentStepId}
            completedSteps={completedSteps}
            onSelectStep={(id) => {
              setCurrentStepId(id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

          {/* Active Guide Content */}
          <DocsContent
            guide={currentGuide}
            isCompleted={completedSteps.includes(currentGuide.id)}
            onToggleCompleted={handleToggleCompleted}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
          />
        </div>
      </div>
    </div>
  );
}
