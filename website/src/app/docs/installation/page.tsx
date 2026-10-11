import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Installation & Setup Guide",
  description: "Step-by-step instructions for installing InferBench, configuring Python 3.10+ virtual environments, and verifying test suites.",
};

export default function InstallationPage() {
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
          <span className="text-cyan-400">Installation</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>ENVIRONMENT SETUP</span>
              </div>
              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Installation &amp; Setup Guide
              </h1>
              <p className="text-sm text-[#9096a2] leading-relaxed">
                InferBench is designed to install cleanly on any modern workstation or Linux server with Python 3.10 or higher.
              </p>
            </div>

            {/* Prerequisites */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>System Prerequisites</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Before installing, verify that Python 3.10+ and Git are installed on your path:
              </p>
              <CodeBlock
                title="Verify Environment"
                powershell="python --version&#10;git --version"
                bash="python3 --version&#10;git --version"
              />
              <div className="p-3 rounded border border-[#1e222a] bg-[#121419] text-xs text-[#9096a2] space-y-1">
                <div className="font-mono text-[#cbd2dc] font-semibold">Minimum Version Requirements:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Python: &gt;= 3.10 (uses modern union typing and dataclass slots)</li>
                  <li>Git: &gt;= 2.30</li>
                  <li>Optional GPU Drivers: NVIDIA CUDA / ROCm (auto-detected via nvidia-smi / rocm-smi)</li>
                </ul>
              </div>
            </section>

            {/* Clone Repository */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>Clone the Repository</span>
              </h2>
              <CodeBlock
                title="Clone Repository"
                powershell={`git clone ${siteConfig.github.repoUrl}.git\ncd LLM-Inference-Benchmark`}
                bash={`git clone ${siteConfig.github.repoUrl}.git\ncd LLM-Inference-Benchmark`}
              />
            </section>

            {/* Create Virtual Environment */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>Create &amp; Activate Virtual Environment</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Always isolate benchmark dependencies in a dedicated virtual environment:
              </p>
              <CodeBlock
                title="Setup Virtual Environment"
                powershell="# Create virtual environment&#10;python -m venv .venv&#10;&#10;# Activate in PowerShell&#10;.\.venv\Scripts\Activate.ps1"
                bash="# Create virtual environment&#10;python3 -m venv .venv&#10;&#10;# Activate in Bash / Zsh&#10;source .venv/bin/activate"
              />
              <div className="p-3 rounded border border-amber-900/40 bg-amber-950/20 text-xs text-amber-200/90 space-y-1">
                <div className="font-semibold font-mono text-[11px] text-amber-400">
                  <span>PowerShell Script Execution Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  If Windows prevents script activation with an execution policy error, run:
                  <code className="block mt-1 p-1 bg-black/40 rounded font-mono text-cyan-300">Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser</code>
                </p>
              </div>
            </section>

            {/* Install Dependencies */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">04</span>
                <span>Install Dependencies</span>
              </h2>
              <CodeBlock
                title="Install Requirements"
                powershell="python -m pip install --upgrade pip&#10;pip install -r requirements.txt"
                bash="python3 -m pip install --upgrade pip&#10;pip install -r requirements.txt"
              />
              <p className="text-xs text-[#9096a2]">
                Key dependencies include <code className="font-mono text-cyan-400">pyyaml</code> (manifest parsing), <code className="font-mono text-cyan-400">requests</code> (HTTP/SSE), <code className="font-mono text-cyan-400">numpy/pandas</code> (percentiles &amp; dataframes), <code className="font-mono text-cyan-400">streamlit/plotly</code> (visual analytics), and <code className="font-mono text-cyan-400">pytest</code>.
              </p>
            </section>

            {/* Verify Installation */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">05</span>
                <span>Verify Installation with Pytest</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Run the test suite to verify provider mocks, metrics calculation, and configuration parsing:
              </p>
              <CodeBlock
                title="Run Unit Tests"
                powershell="pytest -v"
                bash="pytest -v"
              />
              <div className="p-3.5 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-cyan-300">
                ============================== 67 passed in 1.45s ==============================
              </div>
            </section>

            {/* Next Steps */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/quickstart"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← Quickstart (5 min)
              </Link>
              <Link
                href="/docs/local-inference"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>Local Inference Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
