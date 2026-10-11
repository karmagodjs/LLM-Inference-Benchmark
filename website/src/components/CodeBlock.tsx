"use client";

import React, { useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface CodeBlockProps {
  title?: string;
  powershell?: string;
  bash?: string;
  code?: string;
  language?: string;
  expectedOutput?: string;
  defaultTab?: "powershell" | "bash";
}

export function CodeBlock({
  title,
  powershell,
  bash,
  code,
  language = "bash",
  expectedOutput,
  defaultTab = "powershell",
}: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState<"powershell" | "bash">(defaultTab);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(true);

  // Determine the content to show/copy
  const hasTabs = Boolean(powershell && bash);
  const currentCode = hasTabs
    ? activeTab === "powershell"
      ? powershell || ""
      : bash || ""
    : code || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0e17] overflow-hidden my-4 shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f1422] border-b border-white/[0.08] text-xs">
        <div className="flex items-center gap-3">
          {/* Terminal dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          {/* Title or language */}
          {title && <span className="font-medium text-slate-300 ml-1">{title}</span>}
          {!hasTabs && language && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/10 ml-1">
              {language}
            </span>
          )}

          {/* PowerShell / Bash Tab Switcher */}
          {hasTabs && (
            <div className="flex items-center p-0.5 bg-black/40 rounded-lg border border-white/10 ml-2">
              <button
                type="button"
                onClick={() => setActiveTab("powershell")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all ${
                  activeTab === "powershell"
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                PowerShell (Windows)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bash")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-all ${
                  activeTab === "bash"
                    ? "bg-indigo-600 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Bash (macOS / Linux)
              </button>
            </div>
          )}
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors border border-white/10"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed bg-[#0a0d15]">
        <pre className="whitespace-pre">{currentCode}</pre>
      </div>

      {/* Optional Expected Output Section */}
      {expectedOutput && (
        <div className="border-t border-white/[0.08] bg-[#080b12]">
          <button
            type="button"
            onClick={() => setShowOutput(!showOutput)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors bg-white/[0.02]"
          >
            <span className="text-slate-400">
              Expected Output / Terminal Response
            </span>
            {showOutput ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showOutput && (
            <div className="px-4 py-3 bg-black/50 font-mono text-xs text-emerald-400/90 whitespace-pre overflow-x-auto border-t border-white/[0.04]">
              {expectedOutput}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
