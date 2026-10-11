import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { 
  ExternalLink, 
  GitPullRequest
} from "lucide-react";
import { GithubIcon } from "@/components/icons/GithubIcon";

export const metadata = {
  title: "Contact & Community",
  description: "Connect with InferBench maintainer, report issues, contribute provider adapters, and collaborate.",
};

export default function ContactPage() {
  return (
    <div className="py-12 bg-[#0c0d11] min-h-screen text-[#e6e8ec]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#717886] pb-4 border-b border-[#1e222a]">
          <Link href="/" className="hover:text-[#e6e8ec] transition-colors">
            InferBench
          </Link>
          <span>/</span>
          <span className="text-cyan-400">Contact</span>
        </div>

        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-[#1e222a]">
          <div className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-400">
            <span>OPEN SOURCE COLLABORATION</span>
          </div>

          <h1 className="text-3xl font-semibold text-[#e6e8ec] tracking-tight">
            Contact &amp; Contributing
          </h1>

          <p className="text-sm text-[#9096a2] leading-relaxed max-w-3xl">
            InferBench is maintained in the open. Find official channels to discuss inference optimizations, report bugs, request provider adapters, or submit pull requests.
          </p>
        </div>

        {/* Maintainer & Channels Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GitHub Profile Card */}
          <div className="p-5 rounded border border-[#1e222a] bg-[#121419] space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded bg-[#181b22] border border-[#2b303c] flex items-center justify-center text-[#cbd2dc]">
                <GithubIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-[#e6e8ec]">
                Maintainer Profile
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Project maintainer: <strong className="text-[#cbd2dc]">@{siteConfig.author}</strong> on GitHub. Follow development updates and repository releases.
              </p>
            </div>
            <a
              href={siteConfig.github.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between px-3.5 py-2 rounded border border-[#1e222a] bg-[#0c0d11] hover:bg-[#181b22] text-xs font-mono text-[#cbd2dc] hover:text-white transition-colors"
            >
              <span>View @{siteConfig.author} on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#717886]" />
            </a>
          </div>

          {/* Issues & Discussions Card */}
          <div className="p-5 rounded border border-[#1e222a] bg-[#121419] space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-[#e6e8ec]">
                Discussions &amp; Issue Tracker
              </h2>
              <p className="text-xs text-[#9096a2] leading-relaxed">
                Community support, bug reports, and roadmap proposals are managed directly through GitHub Issues and Discussions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={siteConfig.github.issuesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-[#0c0d11] text-xs font-mono font-semibold transition-colors"
              >
                <span>GitHub Issues</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={siteConfig.github.discussionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3.5 py-2 rounded border border-[#1e222a] bg-[#0c0d11] hover:bg-[#181b22] text-xs font-mono text-[#9096a2] hover:text-white transition-colors"
              >
                Discussions
              </a>
            </div>
          </div>
        </div>

        {/* Contributing Summary Card */}
        <div className="p-5 rounded border border-[#1e222a] bg-[#121419] space-y-3">
          <div className="text-cyan-400 font-mono text-xs font-semibold">
            <span>HOW TO CONTRIBUTE</span>
          </div>
          <p className="text-xs text-[#9096a2] leading-relaxed">
            We actively seek PRs adding new provider adapters (e.g., DeepSeek, Mistral, Cohere), local serving backends, and metrics visualizations. All contributions must maintain 100% mocked unit test coverage via <code className="font-mono text-cyan-400">pytest -v</code>.
          </p>
          <div className="pt-1">
            <Link
              href="/docs/contributing"
              className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline"
            >
              <span>Read the Adapter Contributing Guide →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
