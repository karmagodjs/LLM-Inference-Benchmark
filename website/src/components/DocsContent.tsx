"use client";

import React from "react";
import { DocGuide, DOC_GUIDES } from "@/data/docsData";
import { CodeBlock } from "@/components/CodeBlock";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft
} from "lucide-react";

interface DocsContentProps {
  guide: DocGuide;
  isCompleted: boolean;
  onToggleCompleted: (id: string) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

export function DocsContent({
  guide,
  isCompleted,
  onToggleCompleted,
  onNextStep,
  onPrevStep,
}: DocsContentProps) {
  const currentIndex = DOC_GUIDES.findIndex((g) => g.id === guide.id);
  const prevGuide = currentIndex > 0 ? DOC_GUIDES[currentIndex - 1] : null;
  const nextGuide = currentIndex < DOC_GUIDES.length - 1 ? DOC_GUIDES[currentIndex + 1] : null;

  return (
    <article className="flex-1 max-w-4xl space-y-6">
      {/* Header Info */}
      <div className="space-y-4 pb-6 border-b border-[#1e222a]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 text-xs font-mono font-semibold">
              Guide {guide.stepNumber} of {DOC_GUIDES.length}
            </span>
            <span className="text-xs text-[#717886] font-mono">
              Category: <strong className="text-[#cbd2dc]">{guide.category}</strong>
            </span>
            <span className="text-xs text-[#717886] font-mono">
              <span>{guide.estimatedMinutes} min read</span>
            </span>
          </div>

          {/* Mark as completed button */}
          <button
            type="button"
            onClick={() => onToggleCompleted(guide.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-sans font-medium transition-all border ${
              isCompleted
                ? "bg-cyan-950/40 border-cyan-800/40 text-cyan-400 hover:bg-cyan-950/60"
                : "bg-[#121419] border-[#1e222a] text-[#9096a2] hover:text-[#e6e8ec] hover:bg-[#181b22]"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 text-[#555b68]" />
                <span>Mark completed</span>
              </>
            )}
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-[#e6e8ec] tracking-tight">
          {guide.title}
        </h1>

        <p className="text-sm text-[#9096a2] leading-relaxed">
          {guide.summary}
        </p>
      </div>

      {/* Narrative content paragraphs */}
      <div className="space-y-3 text-sm text-[#cbd2dc] leading-relaxed">
        {guide.content.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Copyable Command Section */}
      {guide.commands && (
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-mono font-semibold text-[#717886] uppercase tracking-wider">
            {guide.commands.label}
          </h2>
          <CodeBlock
            title={guide.commands.label}
            powershell={guide.commands.powershell}
            bash={guide.commands.bash}
          />
        </div>
      )}

      {/* Expected Output Card */}
      {guide.expectedOutput && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-mono font-semibold text-[#717886] uppercase tracking-wider">
            Expected Console Output
          </h3>
          <div className="p-3.5 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc] overflow-x-auto leading-relaxed shadow-inner">
            <pre>{guide.expectedOutput}</pre>
          </div>
        </div>
      )}

      {/* Common Mistakes & Troubleshooting */}
      {guide.commonMistakes && guide.commonMistakes.length > 0 && (
        <div className="space-y-3 pt-3">
          <h3 className="text-xs font-mono font-semibold text-[#717886] uppercase tracking-wider">
            <span>Common Pitfalls &amp; Solutions</span>
          </h3>

          <div className="space-y-2.5">
            {guide.commonMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="p-3 rounded border border-amber-900/30 bg-amber-950/10 space-y-1.5 text-xs font-mono"
              >
                <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <span>Issue:</span>
                  <span className="text-[#e6e8ec] font-normal">{mistake.issue}</span>
                </div>
                <div className="text-[#9096a2] text-[11px] leading-relaxed">
                  <span className="text-cyan-400 font-semibold">Solution: </span>
                  <span>{mistake.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Implementation Files */}
      {guide.keyFiles && guide.keyFiles.length > 0 && (
        <div className="p-3 rounded border border-[#1e222a] bg-[#0c0d11] space-y-2">
          <span className="text-[10px] font-mono font-semibold text-[#717886] uppercase tracking-wider block">
            Relevant Implementation Files
          </span>
          <div className="flex flex-wrap gap-2">
            {guide.keyFiles.map((f, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-[#181b22] border border-[#2b303c] text-xs font-mono text-cyan-400"
              >
                <span>{f}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons: Previous & Next */}
      <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between gap-4">
        {prevGuide ? (
          <button
            type="button"
            onClick={onPrevStep}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#1e222a] bg-[#121419] text-xs font-sans font-medium text-[#9096a2] hover:text-[#e6e8ec] hover:bg-[#181b22] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Prev: {prevGuide.title}</span>
          </button>
        ) : (
          <div />
        )}

        {nextGuide ? (
          <button
            type="button"
            onClick={onNextStep}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-sans text-xs font-semibold transition-colors"
          >
            <span>Next: {nextGuide.title}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="text-xs font-sans text-cyan-400">
            All Onboarding Steps Complete
          </div>
        )}
      </div>
    </article>
  );
}
