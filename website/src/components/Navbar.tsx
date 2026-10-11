"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0d0e11]/85 backdrop-blur-md border-b border-[#1e222b]/80 py-4"
          : "bg-transparent border-b border-transparent py-5"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center">
          {/* Centered Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 md:gap-10 lg:gap-14 text-lg md:text-[21px] font-sans font-medium tracking-tight">
            <Link
              href="/#demonstration"
              className="text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
            >
              Benchmark
            </Link>
            <Link
              href="/methodology"
              className="text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/docs/quickstart"
              className="text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
            >
              Documentation
            </Link>

            <a
              href={siteConfig.github.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
              aria-label="GitHub Repository"
            >
              <GithubIcon className="w-5 h-5 shrink-0" />
              <span>GitHub</span>
            </a>
          </nav>

          {/* Mobile Menu Button - positioned on mobile */}
          <div className="flex md:hidden w-full items-center justify-end">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 rounded text-[#949aa6] hover:text-[#f0f2f5] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#1e222b] bg-[#13151a] rounded-lg p-5 space-y-4 font-sans font-medium text-base max-w-md mx-auto">
            <Link
              href="/#demonstration"
              onClick={() => setMobileOpen(false)}
              className="block text-[#949aa6] hover:text-[#f0f2f5] py-1"
            >
              Benchmark
            </Link>
            <Link
              href="/methodology"
              onClick={() => setMobileOpen(false)}
              className="block text-[#949aa6] hover:text-[#f0f2f5] py-1"
            >
              Methodology
            </Link>
            <Link
              href="/docs/quickstart"
              onClick={() => setMobileOpen(false)}
              className="block text-[#949aa6] hover:text-[#f0f2f5] py-1"
            >
              Documentation
            </Link>
            <a
              href={siteConfig.github.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[#949aa6] hover:text-[#f0f2f5] py-1"
            >
              <GithubIcon className="w-5 h-5" />
              <span>GitHub</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
