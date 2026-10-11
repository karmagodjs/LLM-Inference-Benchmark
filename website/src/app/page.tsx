"use client";

import React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroInferenceVisualizer } from "@/components/HeroInferenceVisualizer";
import { BenchmarkDemonstration } from "@/components/BenchmarkDemonstration";
import { MeasurementRows } from "@/components/MeasurementRows";
import { WorkflowFlow } from "@/components/WorkflowFlow";
import { OpenSourceSection } from "@/components/OpenSourceSection";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#0d0e11] text-[#f0f2f5] overflow-x-hidden selection:bg-[#00f0ff]/20 selection:text-[#00f0ff]">
      {/* Subtle Engineering Grid Substrate */}
      <div className="absolute inset-0 engineering-grid opacity-40 pointer-events-none -z-10" />

      {/* Hero Section: Distinctive Split Composition */}
      <section className="pt-20 pb-20 sm:pt-28 sm:pb-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Side: Editorial Typography & Intentional Actions */}
          <div className="lg:col-span-6 space-y-6">
            {/* Editorial Headline */}
            <h1 className="hero-animate-headline text-3xl sm:text-5xl lg:text-[52px] font-semibold tracking-tight text-[#f0f2f5] leading-[1.12]">
              Measure what happens between{" "}
              <span className="text-[#00f0ff] font-mono">prompt</span> and{" "}
              <span className="text-[#00f0ff] font-mono">token.</span>
            </h1>

            {/* Supporting Text */}
            <p className="hero-animate-subtext text-base sm:text-lg text-[#949aa6] leading-relaxed max-w-lg font-normal">
              An open-source toolkit for understanding LLM inference performance across providers and serving backends.
            </p>

            {/* Two Understated Actions */}
            <div className="hero-animate-actions flex flex-wrap items-center gap-4 pt-2 font-sans font-medium text-xs">
              <Link
                href="/#demonstration"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#00f0ff] hover:bg-[#22d3ee] text-[#0d0e11] font-semibold transition-all shadow-sm"
              >
                <span>Explore the benchmark</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/docs/quickstart"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] bg-[#13151a] hover:bg-[#181b22] border border-[#1e222b] hover:border-[#272c37] text-[#f0f2f5] transition-colors"
              >
                <span>Read the documentation</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#949aa6]" />
              </Link>
            </div>

            {/* Subtle Reproducibility Snippet */}
            <div className="hero-animate-actions pt-2 flex items-center gap-2 text-[11px] font-mono text-[#5b616e]">
              <span>Run locally: </span>
              <code className="text-[#949aa6] bg-[#13151a] px-2 py-0.5 rounded border border-[#1e222b] select-all truncate max-w-full">
                python -m benchmark.run --provider ollama
              </code>
            </div>
          </div>

          {/* Right Side: Interactive Inference Timeline Instrument */}
          <div className="lg:col-span-6 hero-animate-visual">
            <HeroInferenceVisualizer />
          </div>

        </div>
      </section>

      {/* One Integrated Interactive Demonstration */}
      <BenchmarkDemonstration />

      {/* Section A: What It Measures (Concise Editorial Rows) */}
      <MeasurementRows />

      {/* Section B: How It Works (Simple 4-Stage Flow) */}
      <WorkflowFlow />

      {/* Section C: Open Source (Confident, Understated Closing) */}
      <OpenSourceSection />
    </div>
  );
}
