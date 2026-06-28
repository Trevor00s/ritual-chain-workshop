"use client";

import { useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

type Accent = "violet" | "amber" | "cyan" | "emerald";

const A: Record<
  Accent,
  { text: string; chip: string; glow: string; dot: string }
> = {
  violet: {
    text: "text-violet-200",
    chip: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
    glow: "bg-violet-600/30",
    dot: "bg-violet-400",
  },
  amber: {
    text: "text-amber-200",
    chip: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
    glow: "bg-amber-500/25",
    dot: "bg-amber-400",
  },
  cyan: {
    text: "text-cyan-200",
    chip: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30",
    glow: "bg-cyan-500/25",
    dot: "bg-cyan-400",
  },
  emerald: {
    text: "text-emerald-200",
    chip: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
    glow: "bg-emerald-500/25",
    dot: "bg-emerald-400",
  },
};

function Icon({ name, className = "h-3.5 w-3.5" }: { name: string; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "lock":
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "key":
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <circle cx="8" cy="8" r="4" />
          <path d="M11 11l9 9M17 17l2-2M14 14l2-2" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} {...common}>
          <path d="M5 12l4 4L19 7" />
        </svg>
      );
  }
}

type Phase = {
  tag: string;
  status: string;
  accent: Accent;
  icon: string;
  body: ReactNode;
  foot: string;
};

const PHASES: Phase[] = [
  {
    tag: "01 · Commit",
    status: "Sealed",
    accent: "violet",
    icon: "lock",
    foot: "hash only — nothing leaks",
    body: (
      <div>
        <div className="text-[11px] uppercase tracking-widest text-zinc-500">commitment</div>
        <div className="mt-1 break-all font-mono text-lg text-zinc-100">
          0x9f3a…<span className="text-zinc-500">c1d2</span>
        </div>
      </div>
    ),
  },
  {
    tag: "02 · Reveal",
    status: "Revealed",
    accent: "amber",
    icon: "key",
    foot: "answer + salt verified on-chain",
    body: (
      <div>
        <div className="text-[11px] uppercase tracking-widest text-zinc-500">answer</div>
        <p className="mt-1 text-[15px] leading-snug text-zinc-100">
          “Use a commit–reveal scheme so entries stay sealed until the deadline.”
        </p>
      </div>
    ),
  },
  {
    tag: "03 · Judge",
    status: "Scored",
    accent: "cyan",
    icon: "spark",
    foot: "one batched Ritual AI call",
    body: (
      <div className="flex items-end justify-between gap-3">
        <p className="text-[13px] leading-snug text-zinc-400">
          “…answers stay sealed until the deadline.”
        </p>
        <div className="text-right">
          <div className="font-display text-4xl font-bold text-cyan-200">94</div>
          <div className="text-[11px] uppercase tracking-widest text-zinc-500">AI rank #1</div>
        </div>
      </div>
    ),
  },
  {
    tag: "04 · Finalize",
    status: "Winner",
    accent: "emerald",
    icon: "check",
    foot: "owner ratified the payout",
    body: (
      <div>
        <div className="text-[11px] uppercase tracking-widest text-zinc-500">reward released</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-zinc-100">1.0 ETH</span>
          <span className="font-mono text-sm text-emerald-200">→ 0xA1…F9</span>
        </div>
      </div>
    ),
  },
];

export function SealVisual() {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: ReactMouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg)`;
  }
  function handleLeave() {
    const el = ref.current;
    if (el) el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div className="relative mx-auto h-[22rem] w-full max-w-md animate-floaty">
      {/* rotating gradient halo */}
      <div
        className="animate-spin-slow pointer-events-none absolute -inset-10 -z-10 rounded-[44px] opacity-50 blur-2xl"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(139,92,246,0.55), rgba(34,211,238,0.45), rgba(251,191,36,0.35), rgba(52,211,153,0.45), rgba(139,92,246,0.55))",
        }}
      />

      {/* tilt surface (follows the cursor) */}
      <div
        ref={ref}
        className="tilt relative h-full"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {/* AI scan line */}
        <div className="animate-scan pointer-events-none absolute inset-x-8 top-1 z-20 h-px bg-cyan-300/70 shadow-[0_0_14px_2px_rgba(34,211,238,0.55)]" />

        {PHASES.map((p, i) => {
          const a = A[p.accent];
          return (
            <div
              key={p.tag}
              className="phase-layer absolute inset-0"
              style={{ animationDelay: `${-i * 3.25}s` }}
            >
              <div className={`absolute -inset-6 rounded-[34px] blur-3xl ${a.glow}`} />
              <div className="border-gradient glass relative flex h-full flex-col justify-between rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${a.chip}`}
                  >
                    <Icon name={p.icon} />
                    {p.tag}
                  </span>
                  <span className={`text-xs font-semibold ${a.text}`}>{p.status}</span>
                </div>

                <div className="py-2">{p.body}</div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
                  {p.foot}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
