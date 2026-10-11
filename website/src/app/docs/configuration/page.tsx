import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";

export const metadata = {
  title: "Configuration & CLI Reference",
  description: "Complete guide to configs/benchmark.yaml, environment variables, CLI parameter overrides, and experiment modes in InferBench.",
};

export default function ConfigurationPage() {
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
          <span className="text-cyan-400">Configuration</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>SPECIFICATION REFERENCE</span>
              </div>

              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Configuration &amp; CLI Reference
              </h1>

              <p className="text-sm text-[#9096a2] leading-relaxed">
                Configure benchmark parameters in declarative YAML manifests or override them dynamically from the command line.
              </p>
            </div>

            {/* Section 1: configs/benchmark.yaml */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>Declarative Manifest: configs/benchmark.yaml</span>
              </h2>

              <p className="text-xs text-[#9096a2] leading-relaxed">
                The canonical configuration file verified in the repository defines providers, pricing tables, workload dimensions, seed randomness, and resource monitoring:
              </p>

              <CodeBlock
                title="configs/benchmark.yaml (Official Schema)"
                language="yaml"
                code={`project:
  name: InferBench
  version: "0.2"

# Benchmark mode: 'model_comparison' or 'serving_comparison'
mode: model_comparison

providers:
  - name: ollama
    model: qwen2.5:3b
    base_url: http://localhost:11434

  - name: openai
    model: gpt-4o-mini
    api_key_env: OPENAI_API_KEY
    pricing:
      input_per_1m_tokens: 0.15
      output_per_1m_tokens: 0.60
      currency: USD

  - name: gemini
    model: gemini-2.5-flash
    api_key_env: GEMINI_API_KEY
    pricing:
      input_per_1m_tokens: 0.075
      output_per_1m_tokens: 0.30
      currency: USD

  - name: anthropic
    model: claude-3-5-sonnet-20241022
    api_key_env: ANTHROPIC_API_KEY
    pricing:
      input_per_1m_tokens: 3.00
      output_per_1m_tokens: 15.00
      currency: USD

  - name: custom
    type: openai_compatible
    base_url: http://localhost:8000/v1
    model: meta-llama/Llama-3.2-3B-Instruct
    api_key_env: CUSTOM_API_KEY

workload:
  warmup_requests: 2
  benchmark_requests: 5
  concurrency:
    - 1
    - 2
    - 4
  input_tokens:
    - 128
    - 256
    - 512
  output_tokens:
    - 128
  seed: 42
  workload_file: results/workload.json

cost:
  enabled: true
  gpu_hourly_cost: 0.0
  input_cost_per_1m_tokens: 0.0
  output_cost_per_1m_tokens: 0.0

monitoring:
  enabled: true
  monitor_cpu: true
  monitor_ram: true
  monitor_gpu: true`}
              />
            </section>

            {/* Section 2: Environment Variables */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>Environment Variables Setup</span>
              </h2>

              <p className="text-xs text-[#9096a2] leading-relaxed">
                API keys are never stored in git or configuration files. Set the appropriate environment variables in your active shell:
              </p>

              <CodeBlock
                title="Environment Variable Setup"
                powershell={`# Windows PowerShell\n$env:OPENAI_API_KEY = "sk-..."\n$env:GEMINI_API_KEY = "AIza..."\n$env:ANTHROPIC_API_KEY = "sk-ant-..."\n$env:XAI_API_KEY = "xai-..."\n$env:HF_TOKEN = "hf_..."\n$env:OPENROUTER_API_KEY = "sk-or-..."\n$env:CUSTOM_API_KEY = "custom-..."`}
                bash={`# macOS / Linux\nexport OPENAI_API_KEY="sk-..."\nexport GEMINI_API_KEY="AIza..."\nexport ANTHROPIC_API_KEY="sk-ant-..."\nexport XAI_API_KEY="xai-..."\nexport HF_TOKEN="hf_..."\nexport OPENROUTER_API_KEY="sk-or-..."\nexport CUSTOM_API_KEY="custom-..."`}
              />
            </section>

            {/* Section 3: CLI Flags & Arguments */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>CLI Flags &amp; Parameter Overrides</span>
              </h2>

              <p className="text-xs text-[#9096a2] leading-relaxed">
                All parameters in YAML can be overridden dynamically through the CLI (<code className="font-mono text-[#cbd2dc]">benchmark/run.py</code>):
              </p>

              <div className="overflow-x-auto rounded border border-[#1e222a] bg-[#121419]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0e1015] text-[#717886] uppercase tracking-wider border-b border-[#1e222a]">
                    <tr>
                      <th className="py-2.5 px-3">Flag</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e222a] text-[#cbd2dc]">
                    <tr>
                      <td className="py-2 px-3 text-cyan-400">--provider, -p</td>
                      <td className="py-2 px-3 text-[#717886]">string</td>
                      <td className="py-2 px-3">Target provider name</td>
                      <td className="py-2 px-3">--provider openai</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-400">--all-providers</td>
                      <td className="py-2 px-3 text-[#717886]">flag</td>
                      <td className="py-2 px-3">Benchmark all configured providers</td>
                      <td className="py-2 px-3">--all-providers</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-400">--dry-run</td>
                      <td className="py-2 px-3 text-[#717886]">flag</td>
                      <td className="py-2 px-3">Display planned matrix without requests</td>
                      <td className="py-2 px-3">--dry-run</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-400">--mode, -m</td>
                      <td className="py-2 px-3 text-[#717886]">string</td>
                      <td className="py-2 px-3">model_comparison or serving_comparison</td>
                      <td className="py-2 px-3">-m serving_comparison</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-400">--concurrency</td>
                      <td className="py-2 px-3 text-[#717886]">list[int]</td>
                      <td className="py-2 px-3">Concurrency levels to sweep</td>
                      <td className="py-2 px-3">--concurrency 1 2 4 8</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-400">--requests, -n</td>
                      <td className="py-2 px-3 text-[#717886]">int</td>
                      <td className="py-2 px-3">Number of requests per configuration</td>
                      <td className="py-2 px-3">-n 20</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-cyan-400">--warmup</td>
                      <td className="py-2 px-3 text-[#717886]">int</td>
                      <td className="py-2 px-3">Number of warm-up requests</td>
                      <td className="py-2 px-3">--warmup 2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Footer Navigation */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/local-inference"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← Local Inference
              </Link>
              <Link
                href="/docs/running"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>CLI Execution Runner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
