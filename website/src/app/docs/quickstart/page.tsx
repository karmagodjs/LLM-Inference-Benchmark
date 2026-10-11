import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Quickstart Guide (5 Minutes)",
  description: "Get started with InferBench in under 5 minutes. Run local or cloud LLM inference benchmarks with reproducible results.",
};

export default function QuickstartPage() {
  return (
    <div className="py-12 bg-[#0c0d11] min-h-screen text-[#e6e8ec]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#717886] pb-4 border-b border-[#1e222a]">
          <Link href="/" className="hover:text-[#e6e8ec] transition-colors">
            InferBench
          </Link>
          <span>/</span>
          <Link href="/docs" className="hover:text-[#e6e8ec] transition-colors">
            Documentation
          </Link>
          <span>/</span>
          <span className="text-cyan-400">Quickstart</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Title & Introduction */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>5-MINUTE FAST PATH</span>
              </div>

              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                InferBench Quickstart
              </h1>

              <p className="text-sm text-[#9096a2] leading-relaxed max-w-3xl">
                This guide takes you from an empty terminal to your first streaming LLM benchmark run in less than five minutes. Zero cloud accounts or credit cards are required if you benchmark locally with Ollama.
              </p>
            </div>

            {/* Step 1: Clone & Environment */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>Clone Repository &amp; Setup Environment</span>
              </h2>

              <p className="text-xs text-[#9096a2] leading-relaxed">
                Clone the official open-source InferBench repository, create an isolated virtual environment, and install requirements:
              </p>

              <CodeBlock
                title="1. Clone, virtual environment, and install dependencies"
                powershell={`# Clone repository\ngit clone ${siteConfig.github.repoUrl}.git\ncd LLM-Inference-Benchmark\n\n# Create and activate virtual environment\npython -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1\n\n# Upgrade pip & install dependencies\npip install --upgrade pip\npip install -r requirements.txt`}
                bash={`# Clone repository\ngit clone ${siteConfig.github.repoUrl}.git\ncd LLM-Inference-Benchmark\n\n# Create and activate virtual environment\npython3 -m venv .venv\nsource .venv/bin/activate\n\n# Upgrade pip & install dependencies\npip install --upgrade pip\npip install -r requirements.txt`}
                expectedOutput="Successfully installed pyyaml requests numpy pandas transformers streamlit plotly psutil pytest"
              />
            </section>

            {/* Step 2: Verification Discovery */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>Verify Credential Discovery</span>
              </h2>

              <p className="text-xs text-[#9096a2] leading-relaxed">
                Run the built-in provider discovery utility. It checks configured environment variables without crashing:
              </p>

              <CodeBlock
                title="2. Discover providers and credential status"
                powershell="python -m benchmark.providers"
                bash="python3 -m benchmark.providers"
                expectedOutput={`============================================================
InferBench - Provider Discovery & Credential Status
============================================================

Available providers:
  [OK] Ollama (ollama)
  [OK] OpenAI (openai)
  [OK] Gemini (gemini)
  [OK] Anthropic (anthropic)
  ...
Credential status:
  [OK] Ollama : Local provider (No API key required)`}
              />
            </section>

            {/* Step 3: Choose Your Benchmark Path */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>Execute Your First Benchmark Run</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Local Ollama */}
                <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-3">
                  <div className="text-cyan-400 font-semibold font-mono text-xs">
                    <span>Option A: Local Inference (Ollama)</span>
                  </div>
                  <p className="text-xs text-[#9096a2] leading-relaxed">
                    100% private, zero token costs. Ensure Ollama is running and has downloaded <code className="font-mono text-[#cbd2dc]">qwen2.5:3b</code>.
                  </p>
                  <CodeBlock
                    title="Run Ollama benchmark"
                    powershell={`# Pull model if needed\nollama pull qwen2.5:3b\n\n# Run benchmark\npython -m benchmark.run --provider ollama --model qwen2.5:3b`}
                    bash={`# Pull model if needed\nollama pull qwen2.5:3b\n\n# Run benchmark\npython3 -m benchmark.run --provider ollama --model qwen2.5:3b`}
                  />
                </div>

                {/* Option B: Cloud Provider */}
                <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-3">
                  <div className="text-[#cbd2dc] font-semibold font-mono text-xs">
                    <span>Option B: Commercial Cloud API</span>
                  </div>
                  <p className="text-xs text-[#9096a2] leading-relaxed">
                    Benchmark frontier models. Set your API key in the active terminal session and execute:
                  </p>
                  <CodeBlock
                    title="Run OpenAI gpt-4o-mini"
                    powershell={`# Set your API key\n$env:OPENAI_API_KEY = "sk-..."\n\n# Run benchmark\npython -m benchmark.run --provider openai --model gpt-4o-mini`}
                    bash={`# Set your API key\nexport OPENAI_API_KEY="sk-..."\n\n# Run benchmark\npython3 -m benchmark.run --provider openai --model gpt-4o-mini`}
                  />
                </div>
              </div>
            </section>

            {/* Step 4: Inspect & Export */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">04</span>
                <span>Export Results &amp; Launch Dashboard</span>
              </h2>

              <p className="text-xs text-[#9096a2] leading-relaxed">
                InferBench writes normalized results to <code className="font-mono text-cyan-400">results/concurrency.json</code>. Export to CSV or launch the interactive Streamlit UI:
              </p>

              <CodeBlock
                title="Export CSV and launch Streamlit dashboard"
                powershell={`# Export to CSV\npython export_results.py --input results/concurrency.json --output results/concurrency.csv\n\n# Launch Streamlit visual explorer\nstreamlit run dashboard/app.py`}
                bash={`# Export to CSV\npython3 export_results.py --input results/concurrency.json --output results/concurrency.csv\n\n# Launch Streamlit visual explorer\nstreamlit run dashboard/app.py`}
                expectedOutput={`Successfully exported rows -> results/concurrency.csv\nStreamlit dashboard accessible at http://localhost:8501`}
              />
            </section>

            {/* Navigation & Next steps */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← Documentation Index
              </Link>
              <div className="flex items-center gap-3">
                <Link
                  href="/docs/installation"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
                >
                  <span>Installation Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
