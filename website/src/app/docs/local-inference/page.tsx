import React from "react";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Local LLM Inference Benchmarking Guide",
  description: "Benchmarking local inference runtimes: Ollama, vLLM, llama.cpp, and OpenAI-compatible engines with zero API costs.",
};

export default function LocalInferencePage() {
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
          <span className="text-cyan-400">Local Inference</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>LOCAL RUNTIMES &amp; ENGINES</span>
              </div>
              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Local LLM Inference Benchmarking
              </h1>
              <p className="text-sm text-[#9096a2] leading-relaxed">
                Benchmark local open-weights models running directly on your laptop, workstation, or private GPU server with zero cloud API subscriptions or token bills.
              </p>
            </div>

            {/* Architecture Overview */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-2 text-xs">
              <span className="font-mono text-cyan-400 uppercase font-semibold text-[11px] block">
                Two Local Execution Methods
              </span>
              <ul className="space-y-1.5 text-[#9096a2]">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Native Ollama REST Adapter:</strong> Out-of-the-box streaming and generation via Ollama&apos;s REST endpoint (<code className="font-mono text-[#cbd2dc]">http://localhost:11434</code>). Zero API keys required.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>OpenAI-Compatible Adapter:</strong> Universal wrapper for vLLM, llama.cpp, SGLang, LocalAI, and TGI serving backends on configurable ports.</span>
                </li>
              </ul>
            </div>

            {/* Method 1: Ollama Setup */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>Benchmarking with Ollama (Fastest Local Setup)</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Download and install Ollama from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">ollama.com</a>. Then pull a lightweight benchmark model like <code className="font-mono text-[#cbd2dc]">qwen2.5:3b</code>:
              </p>
              <CodeBlock
                title="Pull and Start Ollama"
                powershell="ollama pull qwen2.5:3b&#10;ollama run qwen2.5:3b &quot;Hello&quot;"
                bash="ollama pull qwen2.5:3b&#10;ollama run qwen2.5:3b &quot;Hello&quot;"
              />
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Run the benchmark against Ollama using InferBench&apos;s CLI:
              </p>
              <CodeBlock
                title="Run Ollama Benchmark"
                powershell="python -m benchmark.run --provider ollama --model qwen2.5:3b"
                bash="python3 -m benchmark.run --provider ollama --model qwen2.5:3b"
              />
              <p className="text-xs text-[#9096a2]">
                InferBench automatically queries <code className="font-mono text-cyan-400">http://localhost:11434/api/tags</code> for health check, streams tokens via <code className="font-mono text-cyan-400">/api/generate</code>, and gathers microsecond TTFT and decode throughput.
              </p>
            </section>

            {/* Method 2: vLLM / llama.cpp Setup */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>Benchmarking vLLM / llama.cpp / SGLang</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Modern high-performance inference servers expose OpenAI-compatible REST endpoints. Start your server (for example, vLLM on port 8000):
              </p>
              <CodeBlock
                title="Start vLLM Server"
                powershell="vllm serve meta-llama/Llama-3.2-3B-Instruct --port 8000"
                bash="vllm serve meta-llama/Llama-3.2-3B-Instruct --port 8000"
              />
              <p className="text-xs text-[#9096a2] leading-relaxed">
                In <code className="font-mono text-[#cbd2dc]">configs/benchmark.yaml</code>, configure the custom provider:
              </p>
              <div className="p-3.5 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc] overflow-x-auto">
                <pre>{`providers:
  openai_compatible:
    base_url: "http://localhost:8000/v1"
    api_key_env: "CUSTOM_API_KEY"  # Or leave dummy value: "EMPTY"
    models:
      - "meta-llama/Llama-3.2-3B-Instruct"`}</pre>
              </div>
              <CodeBlock
                title="Run Benchmark on Local OpenAI-Compatible Server"
                powershell="python -m benchmark.run --provider openai_compatible --model meta-llama/Llama-3.2-3B-Instruct"
                bash="python3 -m benchmark.run --provider openai_compatible --model meta-llama/Llama-3.2-3B-Instruct"
              />
            </section>

            {/* Mode 2: Serving Comparison Mode */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>Mode 2: Serving Infrastructure Comparison</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Want to compare how Ollama vs vLLM vs llama.cpp serve the exact same model weights? Set mode to <code className="font-mono text-cyan-400">serving_comparison</code>:
              </p>
              <div className="p-3.5 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc] overflow-x-auto">
                <pre>{`# configs/benchmark.yaml
mode: serving_comparison
serving_comparison:
  model: "qwen2.5:3b"
  backends:
    - name: "ollama"
      type: "ollama"
      endpoint: "http://localhost:11434"
    - name: "vllm"
      type: "openai_compatible"
      endpoint: "http://localhost:8000/v1"`}</pre>
              </div>
              <p className="text-xs text-[#9096a2]">
                This benchmarks memory allocation, startup time, TTFT differences caused by prefix caching, and throughput under heavy concurrent load.
              </p>
            </section>

            {/* Hardware Telemetry Note */}
            <div className="p-3.5 rounded border border-[#1e222a] bg-[#121419] space-y-1.5 text-xs">
              <div className="text-cyan-400 font-mono font-semibold text-[11px]">
                <span>HARDWARE METRICS TELEMETRY</span>
              </div>
              <p className="text-[#9096a2] text-[11px] leading-relaxed">
                During local benchmarks, InferBench records host CPU usage, RAM footprint via <code className="font-mono text-[#cbd2dc]">psutil</code>, and GPU VRAM usage via <code className="font-mono text-[#cbd2dc]">nvidia-smi</code> / <code className="font-mono text-[#cbd2dc]">rocm-smi</code>. If run on a CPU-only machine or Mac without NVIDIA/AMD tools, GPU fields cleanly return <code className="font-mono text-cyan-400">null</code> without throwing errors.
              </p>
            </div>

            {/* Navigation footer */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/installation"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← Installation
              </Link>
              <Link
                href="/docs/configuration"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>YAML Configuration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
