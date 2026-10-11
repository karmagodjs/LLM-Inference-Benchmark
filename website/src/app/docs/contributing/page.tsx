import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Contributing Guide & Provider Adapters",
  description: "How to contribute new provider adapters, implement the InferenceProvider interface, write mocked unit tests, and submit PRs.",
};

export default function ContributingPage() {
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
          <span className="text-cyan-400">Contributing</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
                <span>OPEN SOURCE CONTRIBUTIONS</span>
              </div>
              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Contributing to InferBench
              </h1>
              <p className="text-sm text-[#9096a2] leading-relaxed">
                InferBench is licensed under the permissive MIT License. We welcome contributions from developers and researchers, especially new provider adapters and serving engine integrations.
              </p>
            </div>

            {/* Step 1: Fork & Setup */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">01</span>
                <span>Development Workflow</span>
              </h2>
              <CodeBlock
                title="Fork and Branch Setup"
                powershell={`# Fork repo on GitHub, then clone your fork:\ngit clone https://github.com/<your-username>/LLM-Inference-Benchmark.git\ncd LLM-Inference-Benchmark\n\n# Create a feature branch\ngit checkout -b feat/add-deepseek-adapter`}
                bash={`# Fork repo on GitHub, then clone your fork:\ngit clone https://github.com/<your-username>/LLM-Inference-Benchmark.git\ncd LLM-Inference-Benchmark\n\n# Create a feature branch\ngit checkout -b feat/add-deepseek-adapter`}
              />
            </section>

            {/* Step 2: Implement InferenceProvider */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">02</span>
                <span>Implementing a New Provider Adapter</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Every provider adapter subclasses <code className="font-mono text-cyan-400">InferenceProvider</code> in <code className="font-mono text-[#cbd2dc]">benchmark/providers/base.py</code>. Create a new file, for example <code className="font-mono text-[#cbd2dc]">benchmark/providers/custom_provider.py</code>:
              </p>
              <div className="p-4 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc] overflow-x-auto leading-relaxed shadow-inner">
                <pre>{`from typing import Tuple, Optional
import time
from benchmark.providers.base import InferenceProvider
from benchmark.schemas import BenchmarkRequest, NormalizedResponse

class CustomInferenceProvider(InferenceProvider):
    def __init__(self, config: dict):
        super().__init__(config)
        self.api_key = self.get_env_key("CUSTOM_API_KEY")

    def health_check(self) -> Tuple[bool, str]:
        if not self.api_key:
            return False, "Missing CUSTOM_API_KEY environment variable"
        # Validate socket / endpoint connectivity
        return True, "Provider ready"

    def generate_stream(self, request: BenchmarkRequest) -> NormalizedResponse:
        start_time = time.perf_counter()
        first_token_time: Optional[float] = None
        output_tokens = 0

        # Perform streaming HTTP POST request with SSE chunks
        # Record first non-empty token arrival
        # first_token_time = time.perf_counter()
        
        end_time = time.perf_counter()
        return NormalizedResponse(
            start_time=start_time,
            first_token_time=first_token_time,
            end_time=end_time,
            input_tokens=request.prompt_tokens,
            output_tokens=output_tokens,
            ttft=(first_token_time - start_time) if first_token_time else None,
            tpot=((end_time - first_token_time) / (output_tokens - 1)) if (first_token_time and output_tokens > 1) else None
        )`}</pre>
              </div>
            </section>

            {/* Step 3: Register in Factory */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">03</span>
                <span>Register in Provider Factory</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Add your provider mapping into <code className="font-mono text-cyan-400">benchmark/provider_factory.py</code>:
              </p>
              <div className="p-3.5 rounded border border-[#1e222a] bg-[#08090d] font-mono text-xs text-[#cbd2dc] overflow-x-auto">
                <pre>{`PROVIDER_REGISTRY = {
    "ollama": OllamaProvider,
    "openai": OpenAIProvider,
    "gemini": GeminiProvider,
    "anthropic": AnthropicProvider,
    "custom": CustomInferenceProvider,  # Add your class here
}`}</pre>
              </div>
            </section>

            {/* Step 4: Write Mocked Tests */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">04</span>
                <span>Write Mocked Tests (tests/test_providers.py)</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                <strong>Important:</strong> Unit tests must NEVER require active paid API keys or live network connections. Use <code className="font-mono text-cyan-400">unittest.mock</code> or <code className="font-mono text-cyan-400">responses</code> to simulate API chunks.
              </p>
              <CodeBlock
                title="Verify Tests"
                powershell="pytest -v tests/test_providers.py"
                bash="pytest -v tests/test_providers.py"
              />
            </section>

            {/* Step 5: Submit Pull Request */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e6e8ec] flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b22] text-cyan-400 border border-[#2b303c]">05</span>
                <span>Submit Your Pull Request</span>
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Push your branch and submit a PR to the <code className="font-mono text-cyan-400">main</code> branch of <a href={siteConfig.github.repoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">{siteConfig.github.repoUrl}</a>.
              </p>
              <div className="p-3.5 rounded border border-[#1e222a] bg-[#121419] space-y-1.5 text-xs">
                <span className="font-mono text-[#cbd2dc] font-semibold text-[11px] block">
                  PR Checklist:
                </span>
                <ul className="space-y-1 text-[#9096a2] text-[11px]">
                  <li>• Code follows PEP 8 standards and strict type annotations.</li>
                  <li>• All 67 unit tests pass without errors (<code className="font-mono text-cyan-400">pytest -v</code>).</li>
                  <li>• No credentials, tokens, or private endpoints committed.</li>
                  <li>• Docstrings and README updated if new CLI flags were added.</li>
                </ul>
              </div>
            </section>

            {/* Navigation footer */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/reproducibility"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← Reproducibility &amp; Rigor
              </Link>
              <Link
                href="/docs/troubleshooting"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>Troubleshooting Handbook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
