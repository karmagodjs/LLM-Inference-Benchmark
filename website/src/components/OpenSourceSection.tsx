"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { ArrowUpRight, Copy, Check } from "lucide-react";

export function OpenSourceSection() {
  const [copied, setCopied] = useState(false);
  const cloneCmd = `git clone ${siteConfig.github.repoUrl}.git`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cloneCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section className="py-20 border-t border-[#1e222b] bg-[#0d0e11]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#1e222b] bg-[#13151a] p-8 lg:p-12 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-[11px] font-mono font-semibold text-[#00f0ff] uppercase tracking-wider">
                Section 03 // Open Source
              </div>

              <h2 className="text-2xl sm:text-4xl font-semibold text-[#f0f2f5] tracking-tight">
                Built for transparent inference engineering.
              </h2>

              <p className="text-xs sm:text-sm text-[#949aa6] leading-relaxed max-w-xl">
                InferBench is an open-source project created by{" "}
                <strong className="text-[#f0f2f5]">@{siteConfig.author}</strong> for developers, ML engineers, and researchers who want to understand LLM serving performance with reproducible precision.
              </p>

              {/* Action Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2 font-sans font-medium text-xs">
                <a
                  href={siteConfig.github.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#181b22] hover:bg-[#202530] border border-[#272c37] text-[#f0f2f5] transition-all"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="w-3 h-3 text-[#00f0ff]" />
                </a>

                <Link
                  href="/docs/quickstart"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-[#1e222b] hover:border-[#272c37] text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
                >
                  <span>Documentation</span>
                </Link>

                <Link
                  href="/docs/contributing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded border border-[#1e222b] hover:border-[#272c37] text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
                >
                  <span>Contributing</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Clean Terminal Box */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs">
              <div className="p-4 rounded border border-[#1e222b] bg-[#090a0d] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#5b616e]">
                  <span>Clone &amp; Install Locally</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[#949aa6] hover:text-[#f0f2f5] flex items-center gap-1 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-[#00f0ff]" />
                        <span className="text-[#00f0ff]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded bg-[#0d0e11] border border-[#1e222b] text-[#f0f2f5] select-all overflow-x-auto text-[11px]">
                  <code>{cloneCmd}</code>
                </div>
              </div>

              <div className="p-3 rounded bg-[#090a0d] border border-[#1e222b] text-[11px] text-[#5b616e] flex items-center justify-between">
                <span>License: MIT License</span>
                <span className="text-[#949aa6]">Branch: main</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
