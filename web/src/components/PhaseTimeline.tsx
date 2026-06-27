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
    blurb: "Publish only a keccak256 hash of your answer. Nothing leaks.",
    color: "violet",
  },
  {
    n: "02",
    title: "Reveal",
    blurb: "After the deadline, reveal your answer + salt to prove the hash.",
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

const NODE: Record<PhaseColor, string> = {
  violet: "border-violet-400/60 text-violet-100 bg-violet-500/10 shadow-[0_0_28px_-4px_rgba(139,92,246,0.8)]",
  amber: "border-amber-400/60 text-amber-100 bg-amber-500/10 shadow-[0_0_28px_-4px_rgba(251,191,36,0.8)]",
  cyan: "border-cyan-400/60 text-cyan-100 bg-cyan-500/10 shadow-[0_0_28px_-4px_rgba(34,211,238,0.8)]",
  emerald: "border-emerald-400/60 text-emerald-100 bg-emerald-500/10 shadow-[0_0_28px_-4px_rgba(52,211,153,0.8)]",
};

export function PhaseTimeline() {
  return (
    <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-4 sm:gap-5">
      {/* gradient rail (desktop) */}
      <div className="pointer-events-none absolute left-7 right-7 top-7 hidden h-0.5 rounded-full bg-gradient-to-r from-violet-500/60 via-cyan-400/60 to-emerald-400/60 sm:block" />

      {PHASES.map((p) => (
        <div
          key={p.n}
          className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:gap-3 sm:text-center"
        >
          <div
            className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border font-display text-lg font-bold backdrop-blur ${NODE[p.color]}`}
          >
            {p.n}
          </div>
          <div className="min-w-0 sm:max-w-[15rem]">
            <div className="font-display text-base font-semibold text-zinc-100">
              {p.title}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{p.blurb}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
