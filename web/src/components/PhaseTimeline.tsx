import type { ReactNode } from "react";

type PhaseColor = "violet" | "amber" | "cyan" | "emerald";

type Phase = {
  n: string;
  title: string;
  blurb: string;
  color: PhaseColor;
};

const PHASES: Phase[] = [
  {
    n: "01",
    title: "Commit",
    blurb: "Publish only a keccak256 hash of your answer — nothing leaks.",
    color: "violet",
  },
  {
    n: "02",
    title: "Reveal",
    blurb: "After the deadline, reveal your answer + salt to prove it.",
    color: "amber",
  },
  {
    n: "03",
    title: "Judge",
    blurb: "Ritual AI scores every revealed answer in one batch call.",
    color: "cyan",
  },
  {
    n: "04",
    title: "Finalize",
    blurb: "The owner ratifies the ranking and the reward is paid.",
    color: "emerald",
  },
];

const NODE_STYLE: Record<PhaseColor, string> = {
  violet:
    "border-violet-500/50 text-violet-200 shadow-[0_0_22px_-6px_rgba(139,92,246,0.7)]",
  amber:
    "border-amber-500/50 text-amber-200 shadow-[0_0_22px_-6px_rgba(251,191,36,0.7)]",
  cyan: "border-cyan-500/50 text-cyan-200 shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)]",
  emerald:
    "border-emerald-500/50 text-emerald-200 shadow-[0_0_22px_-6px_rgba(52,211,153,0.7)]",
};

export function PhaseTimeline({ children }: { children?: ReactNode }) {
  return (
    <div className="relative">
      <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-4 sm:gap-4">
        {/* connecting rail (desktop) */}
        <div className="pointer-events-none absolute left-6 right-6 top-5 hidden h-px bg-gradient-to-r from-violet-500/50 via-cyan-400/50 to-emerald-400/50 sm:block" />
        {PHASES.map((p) => (
          <div
            key={p.n}
            className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
          >
            <div
              className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-zinc-950 font-mono text-sm font-semibold ${NODE_STYLE[p.color]}`}
            >
              {p.n}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-100">{p.title}</div>
              <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-zinc-500">
                {p.blurb}
              </p>
            </div>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
