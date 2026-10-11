"use client";

import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Pause } from "lucide-react";

interface TimelinePreset {
  id: string;
  label: string;
  provider: string;
  model: string;
  ttftMs: number;
  tpotMs: number;
  tokenCount: number;
  tokens: string[];
  provenance: string;
}

const PRESETS: TimelinePreset[] = [
  {
    id: "cloud-stream",
    label: "Cloud API (Streaming)",
    provider: "Hosted Fast Gateway",
    model: "gpt-4o-mini",
    ttftMs: 218,
    tpotMs: 14.2,
    tokenCount: 12,
    tokens: ["The", " inference", " engine", " resolves", " prompt", " tokens", " before", " emitting", " the", " first", " output", " token."],
    provenance: "Calibrated cloud baseline",
  },
  {
    id: "local-ollama",
    label: "Local Workstation (Ollama)",
    provider: "Ollama (Local Engine)",
    model: "qwen2.5:3b",
    ttftMs: 2064,
    tpotMs: 94.7,
    tokenCount: 8,
    tokens: ["Prompt", " prefill", " computes", " attention", " across", " entire", " input", " sequence."],
    provenance: "Recorded run exp-20260823_153132",
  },
];

export function HeroInferenceVisualizer() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("cloud-stream");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0.75); // 0.0 to 1.0
  const [hoveredTokenIndex, setHoveredTokenIndex] = useState<number | null>(null);

  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  // Total timeline span represented in visualization: TTFT + (tokenCount * TPOT)
  const totalDurationMs = activePreset.ttftMs + activePreset.tokenCount * activePreset.tpotMs;

  // Percentage of timeline consumed by TTFT prefill
  const ttftPercent = (activePreset.ttftMs / totalDurationMs) * 100;

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlaybackProgress((prev) => {
        if (prev >= 1) return 0;
        return prev + 0.008;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentMs = Math.round(playbackProgress * totalDurationMs);
  const isPrefillActive = currentMs < activePreset.ttftMs;

  return (
    <div className="rounded-lg border border-[#1e222b] bg-[#13151a] p-4 sm:p-5 font-mono text-xs shadow-2xl relative overflow-hidden transition-all">
      {/* Top Instrument Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1e222b] text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
          <span className="text-[#949aa6] uppercase tracking-wider font-semibold">
            Inference Timeline Instrument
          </span>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1 bg-[#0d0e11] p-0.5 rounded border border-[#1e222b]">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPresetId(preset.id);
                setPlaybackProgress(0.1);
              }}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                selectedPresetId === preset.id
                  ? "bg-[#181b22] text-[#00f0ff] font-semibold border border-[#272c37]"
                  : "text-[#5b616e] hover:text-[#949aa6]"
              }`}
            >
              {preset.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Visual Instrument Area */}
      <div className="py-5 space-y-5">
        {/* State readout & Current Time */}
        <div className="flex items-baseline justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-[#5b616e]">PHASE:</span>
            <span className={`font-semibold ${isPrefillActive ? "text-[#f59e0b]" : "text-[#00f0ff]"}`}>
              {isPrefillActive ? "Prefill (Evaluating Prompt)" : "Autoregressive Decode (Streaming)"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[#949aa6]">
            <span className="text-[#5b616e]">T:</span>
            <span className="text-[#f0f2f5] font-semibold w-16 text-right">{currentMs} ms</span>
          </div>
        </div>

        {/* The Two-Phase Timeline Graphic */}
        <div className="space-y-2">
          <div className="relative h-14 w-full bg-[#090a0d] border border-[#1e222b] rounded flex items-center px-3 overflow-hidden">
            {/* TTFT Prefill Zone */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-[#f59e0b]/[0.06] border-r border-[#f59e0b]/40 flex items-center justify-start px-2"
              style={{ width: `${ttftPercent}%` }}
            >
              <span className="text-[9px] uppercase tracking-wider text-[#f59e0b]/80 truncate">
                Prefill ({activePreset.ttftMs}ms)
              </span>
            </div>

            {/* Decode Phase Zone */}
            <div
              className="absolute right-0 top-0 bottom-0 bg-[#00f0ff]/[0.03] flex items-center justify-end px-2"
              style={{ width: `${100 - ttftPercent}%` }}
            >
              <span className="text-[9px] uppercase tracking-wider text-[#00f0ff]/70 truncate">
                Decode ({Math.round(activePreset.tokenCount * activePreset.tpotMs)}ms)
              </span>
            </div>

            {/* Central Timeline Baseline Rule */}
            <div className="w-full h-[1px] bg-[#272c37] relative z-10" />

            {/* First-Token Milestone Pin (TTFT) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
              style={{ left: `${ttftPercent}%` }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#00f0ff] border-2 border-[#090a0d] shadow-[0_0_10px_#00f0ff]" />
              <div className="absolute top-4 text-[9px] text-[#00f0ff] whitespace-nowrap font-semibold">
                TTFT
              </div>
            </div>

            {/* Subsequent Generated Tokens Stream */}
            {activePreset.tokens.map((token, idx) => {
              // Calculate token position along the remaining width
              const tokenTimeMs = activePreset.ttftMs + (idx + 1) * activePreset.tpotMs;
              const posPercent = (tokenTimeMs / totalDurationMs) * 100;
              const isEmitted = currentMs >= tokenTimeMs;
              const isHovered = hoveredTokenIndex === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setHoveredTokenIndex(idx)}
                  onMouseLeave={() => setHoveredTokenIndex(null)}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group transition-all duration-150 ${
                    isEmitted ? "opacity-100" : "opacity-25"
                  }`}
                  style={{ left: `${posPercent}%` }}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      isHovered
                        ? "w-3 h-3 bg-white ring-2 ring-[#00f0ff]"
                        : isEmitted
                        ? "bg-[#00f0ff]"
                        : "bg-[#384050]"
                    }`}
                  />
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#181b22] border border-[#272c37] px-2 py-1 rounded shadow-xl text-[10px] text-[#f0f2f5] whitespace-nowrap z-50 pointer-events-none">
                      <span className="text-[#00f0ff] font-bold">#{idx + 1}:</span> &quot;{token.trim()}&quot; (+{Math.round(tokenTimeMs)}ms)
                    </div>
                  )}
                </button>
              );
            })}

            {/* Time Sweep Scrubber Needle */}
            <div
              className="absolute top-0 bottom-0 w-[1.5px] bg-white z-30 pointer-events-none"
              style={{ left: `${playbackProgress * 100}%` }}
            >
              <div className="w-2 h-2 bg-white rounded-full -ml-[3px] -mt-[1px]" />
            </div>
          </div>

          {/* Time axis labels */}
          <div className="flex justify-between text-[10px] text-[#5b616e] px-1 font-mono">
            <span>0 ms (Prompt In)</span>
            <span style={{ marginLeft: `${ttftPercent - 15}%` }}>{activePreset.ttftMs}ms (First Token)</span>
            <span>{Math.round(totalDurationMs)}ms (Done)</span>
          </div>
        </div>

        {/* Emitted Tokens Live Preview Stream */}
        <div className="p-3 rounded bg-[#090a0d] border border-[#1e222b] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#5b616e]">
            <span>GENERATED TOKEN STREAM:</span>
            <span className="text-[#949aa6]">
              {Math.min(
                activePreset.tokens.length,
                Math.max(0, Math.floor((currentMs - activePreset.ttftMs) / activePreset.tpotMs) + 1)
              )} / {activePreset.tokens.length} tokens
            </span>
          </div>

          <div className="text-xs text-[#f0f2f5] min-h-[22px] flex flex-wrap gap-1 items-center">
            {isPrefillActive ? (
              <span className="text-[#5b616e] italic">Awaiting first token chunk (KV cache loading)...</span>
            ) : (
              activePreset.tokens.map((token, i) => {
                const tokenTimeMs = activePreset.ttftMs + (i + 1) * activePreset.tpotMs;
                if (currentMs < tokenTimeMs) return null;
                return (
                  <span
                    key={i}
                    className="px-1 py-0.5 rounded bg-[#181b22] border border-[#272c37] text-[11px] text-[#00f0ff]"
                  >
                    {token}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls & Provenance Tag */}
      <div className="pt-3 border-t border-[#1e222b] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#5b616e]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#181b22] hover:bg-[#202530] border border-[#272c37] text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
          >
            {isPlaying ? <Pause className="w-3 h-3 text-[#00f0ff]" /> : <Play className="w-3 h-3 text-[#00f0ff]" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <button
            type="button"
            onClick={() => setPlaybackProgress(0)}
            className="p-1 rounded bg-[#181b22] hover:bg-[#202530] border border-[#272c37] text-[#949aa6] hover:text-[#f0f2f5] transition-colors"
            title="Reset to 0ms"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        <div className="text-[10px] text-[#5b616e]">
          <span>Data: </span>
          <span className="text-[#949aa6]">{activePreset.provenance}</span>
        </div>
      </div>
    </div>
  );
}
