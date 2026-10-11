import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CodeBlock } from "@/components/CodeBlock";
import { DocsSidebar } from "@/components/DocsSidebar";
import { 
  ArrowRight, 
  ExternalLink
} from "lucide-react";

export const metadata = {
  title: "Troubleshooting Handbook",
  description: "Solutions for common issues: HTTP 429 rate limits, missing environment credentials, Ollama connection errors, and GPU telemetry in InferBench.",
};

const TROUBLESHOOTING_ITEMS = [
  {
    id: "rate-limits-429",
    title: "HTTP 429: Too Many Requests / Rate Limit Exceeded",
    category: "Network & API",
    symptom: "Benchmark run slows down or console logs show backoff retries with status 429.",
    explanation:
      "Commercial providers enforce strict Tier-based requests-per-minute (RPM) and tokens-per-minute (TPM) limits. InferBench includes built-in exponential backoff up to 3 retries, but sustained high concurrency can exhaust your account's quota.",
    solution:
      "Reduce concurrency (e.g. from --concurrency 8 to --concurrency 2), add requests_per_second_limit in configs/benchmark.yaml, or upgrade your API tier.",
    snippet: `# In configs/benchmark.yaml, set request throttling:
providers:
  - name: openai
    model: gpt-4o-mini
    requests_per_second_limit: 2.0`,
  },
  {
    id: "missing-api-keys",
    title: "Status: API Key Missing (Provider Skipped)",
    category: "Configuration",
    symptom: "Provider discovery marks provider as [MISSING] and skips it during benchmark.",
    explanation:
      "InferBench reads credentials strictly from environment variables. If an environment variable is not defined in the current shell session, InferBench protects your workflow by skipping it rather than crashing.",
    solution:
      "Ensure environment variables are set in your ACTIVE terminal window. In Windows PowerShell use $env:OPENAI_API_KEY = 'sk-...'. In Bash use export OPENAI_API_KEY='sk-...'.",
    snippet: `# PowerShell
$env:OPENAI_API_KEY = "sk-..."

# Verify with discovery
python -m benchmark.providers`,
  },
  {
    id: "ollama-refused",
    title: "Connection Refused: http://localhost:11434 (Ollama)",
    category: "Local Serving",
    symptom: "Requests to Ollama fail with ConnectionRefusedError or Errno 111.",
    explanation:
      "The Ollama daemon is not currently active on your local machine, or the specified model has not been downloaded yet.",
    solution:
      "Open a separate terminal window and start Ollama by running 'ollama serve'. Verify that the model is downloaded by running 'ollama pull qwen2.5:3b'.",
    snippet: `# In terminal 1:
ollama serve

# In terminal 2:
ollama pull qwen2.5:3b
python -m benchmark.run --provider ollama --model qwen2.5:3b`,
  },
  {
    id: "gpu-telemetry-null",
    title: "GPU Telemetry Reports as null (Not an Error)",
    category: "Hardware",
    symptom: "Benchmark JSON outputs show gpu_available: false, gpu_memory_used_mb: null.",
    explanation:
      "InferBench strictly enforces an Honest Metrics Policy. It queries real nvidia-smi (NVIDIA), rocm-smi (AMD), or torch.cuda devices. If you are benchmarking cloud APIs, running on a CPU-only machine, or lack NVML drivers, InferBench records null rather than fabricating fake telemetry.",
    solution:
      "If you have an NVIDIA GPU, verify nvidia-smi is in your PATH. If running on AMD, verify rocm-smi. For pure cloud API benchmarking (OpenAI, Gemini), GPU metrics are expected to be null.",
    snippet: `# Verify your local GPU drivers
nvidia-smi
# or on AMD:
rocm-smi`,
  },
  {
    id: "powershell-execution-policy",
    title: "PowerShell Script Execution Policy Error (.venv)",
    category: "Windows Environment",
    symptom: "Running .\\.venv\\Scripts\\Activate.ps1 outputs 'File cannot be loaded because running scripts is disabled'.",
    explanation:
      "Windows PowerShell restricts script execution by default for security.",
    solution:
      "Run the command Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser in PowerShell, then re-activate.",
    snippet: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\\.venv\\Scripts\\Activate.ps1`,
  },
  {
    id: "token-usage-estimated",
    title: "Warning: token_usage_estimated = True",
    category: "Metrics Integrity",
    symptom: "Results table displays 'Token Usage: Estimated' badge.",
    explanation:
      "Some providers or custom endpoints do not return token counts in their streaming headers. In these cases, InferBench uses local Hugging Face tokenizers to estimate the token count and explicitly flags the result to preserve benchmark honesty.",
    solution:
      "No action required; this is standard behavior when serving endpoints lack usage headers.",
    snippet: `# Results flag schema:
"token_usage_estimated": true`,
  },
];

export function TroubleshootingPage() {
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
          <span className="text-cyan-400">Troubleshooting</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <DocsSidebar />

          <main className="flex-1 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-3 pb-6 border-b border-[#1e222a]">
              <div className="inline-flex items-center px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-xs font-mono text-amber-400">
                <span>PROBLEM RESOLUTION HANDBOOK</span>
              </div>

              <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
                Troubleshooting Handbook
              </h1>

              <p className="text-sm text-[#9096a2] leading-relaxed">
                Quick diagnosis and fixes for rate limits, local server timeouts, credential scopes, and hardware telemetry caveats.
              </p>
            </div>

            {/* Run Test Suite Verification Box */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#121419] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                  <span>Verify Local Codebase Integrity</span>
                </h2>
                <span className="text-[11px] font-mono text-cyan-400">All tests mocked</span>
              </div>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Run the full pytest suite to verify that your environment, providers, schemas, and metrics calculations are operating correctly:
              </p>
              <CodeBlock
                title="Run pytest test suite"
                powershell="pytest -v"
                bash="pytest -v"
                expectedOutput="============================== 67 passed in 1.45s =============================="
              />
            </div>

            {/* Diagnostic Items */}
            <div className="space-y-4">
              {TROUBLESHOOTING_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded border border-[#1e222a] bg-[#121419] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#e6e8ec]">
                      <span>{item.title}</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181b22] text-[#9096a2] border border-[#2b303c]">
                      {item.category}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-[#717886] font-mono uppercase tracking-wider text-[10px] block mb-0.5">
                        Symptom:
                      </strong>
                      <p className="text-[#9096a2] leading-relaxed">{item.symptom}</p>
                    </div>

                    <div className="pt-1">
                      <strong className="text-[#717886] font-mono uppercase tracking-wider text-[10px] block mb-0.5">
                        Root Cause:
                      </strong>
                      <p className="text-[#9096a2] leading-relaxed">{item.explanation}</p>
                    </div>

                    <div className="pt-1">
                      <strong className="text-cyan-400 font-mono uppercase tracking-wider text-[10px] block mb-0.5">
                        Fix / Resolution:
                      </strong>
                      <p className="text-[#cbd2dc] leading-relaxed">{item.solution}</p>
                    </div>
                  </div>

                  {item.snippet && (
                    <div className="pt-1">
                      <div className="p-3 rounded bg-[#08090d] border border-[#141720] font-mono text-xs text-[#cbd2dc] overflow-x-auto">
                        <pre>{item.snippet}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still Need Help? */}
            <div className="p-4 rounded border border-[#1e222a] bg-[#0c0d11] text-center space-y-2">
              <h3 className="text-sm font-semibold text-[#e6e8ec]">Still encountering an issue?</h3>
              <p className="text-xs text-[#9096a2] max-w-xl mx-auto">
                Check open issues or submit a detailed bug report on the official GitHub repository.
              </p>
              <div className="pt-1 flex justify-center gap-3">
                <a
                  href={siteConfig.github.issuesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181b22] hover:bg-[#202530] border border-[#2b303c] text-xs font-mono text-cyan-400 transition-colors"
                >
                  <span>Browse GitHub Issues</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div className="pt-6 border-t border-[#1e222a] flex items-center justify-between">
              <Link
                href="/docs/reproducibility"
                className="text-xs font-mono text-[#9096a2] hover:text-[#e6e8ec]"
              >
                ← Reproducibility &amp; Rigor
              </Link>
              <Link
                href="/docs/contributing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] font-mono text-xs font-semibold"
              >
                <span>Contributing Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default TroubleshootingPage;
