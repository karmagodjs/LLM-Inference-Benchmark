"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

export function Footer() {
  return (
    <footer className="border-t border-[#1e222b] bg-[#090a0d] text-[#949aa6] text-xs font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 flex flex-col gap-3 font-sans">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#f0f2f5] tracking-tight">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-xs text-[#949aa6] leading-relaxed max-w-sm">
              An open-source toolkit for understanding LLM inference performance across providers and serving backends.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-sans font-medium">
              <a
                href={siteConfig.github.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded border border-[#1e222b] bg-[#13151a] hover:bg-[#181b22] text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
                aria-label="GitHub Repository"
              >
                <GithubIcon className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/docs/quickstart"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#1e222b] text-[#949aa6] hover:text-[#f0f2f5] bg-[#13151a] hover:bg-[#181b22] transition-colors"
              >
                <span>Quickstart</span>
              </Link>
              <div className="flex items-center gap-1 text-[11px] text-[#00f0ff] font-mono bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/20">
                <span>MIT License</span>
              </div>
            </div>
          </div>

          {/* Workbench Links */}
          <div className="flex flex-col gap-2.5 font-sans">
            <h4 className="font-mono text-[11px] font-semibold text-[#5b616e] uppercase tracking-wider">
              Workbench
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-[#949aa6]">
              <li>
                <Link href="/#demonstration" className="hover:text-[#f0f2f5] transition-colors">
                  Demonstration
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-[#00f0ff] transition-colors">
                  Methodology Spec
                </Link>
              </li>
              <li>
                <Link href="/docs/metrics" className="hover:text-[#f0f2f5] transition-colors">
                  Inference Metrics
                </Link>
              </li>
              <li>
                <Link href="/docs/local-inference" className="hover:text-[#f0f2f5] transition-colors">
                  Local Engines
                </Link>
              </li>
            </ul>
          </div>

          {/* Documentation Manuals */}
          <div className="flex flex-col gap-2.5 font-sans">
            <h4 className="font-mono text-[11px] font-semibold text-[#5b616e] uppercase tracking-wider">
              Documentation
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-[#949aa6]">
              <li>
                <Link href="/docs/quickstart" className="hover:text-[#f0f2f5] transition-colors">
                  Quickstart Guide
                </Link>
              </li>
              <li>
                <Link href="/docs/installation" className="hover:text-[#f0f2f5] transition-colors">
                  Installation
                </Link>
              </li>
              <li>
                <Link href="/docs/configuration" className="hover:text-[#f0f2f5] transition-colors">
                  YAML Config
                </Link>
              </li>
              <li>
                <Link href="/docs/running" className="hover:text-[#f0f2f5] transition-colors">
                  CLI Execution
                </Link>
              </li>
              <li>
                <Link href="/docs/contributing" className="hover:text-[#f0f2f5] transition-colors">
                  Contributing
                </Link>
              </li>
            </ul>
          </div>

          {/* Project & Community */}
          <div className="flex flex-col gap-2.5 font-sans">
            <h4 className="font-mono text-[11px] font-semibold text-[#5b616e] uppercase tracking-wider">
              Project
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-[#949aa6]">
              <li>
                <a
                  href={siteConfig.github.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#f0f2f5] transition-colors flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-[#5b616e]" />
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.github.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#f0f2f5] transition-colors flex items-center gap-1"
                >
                  <span>Maintainer (@{siteConfig.author})</span>
                  <ExternalLink className="w-3 h-3 text-[#5b616e]" />
                </a>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#f0f2f5] transition-colors">
                  About Project
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#f0f2f5] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-[#1e222b] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#5b616e]">
          <p>
            © 2026 {siteConfig.name} by{" "}
            <a
              href={siteConfig.github.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#949aa6] hover:text-[#f0f2f5] underline"
            >
              {siteConfig.author}
            </a>
            . Open source under {siteConfig.license}.
          </p>
          <div>
            <span>Honest telemetry: Benchmarks execute locally on user hardware or direct API endpoints.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
