"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { CreateBountyForm } from "@/components/CreateBountyForm";
import { LoadBountyPanel } from "@/components/LoadBountyPanel";
import { BountyView } from "@/components/BountyView";
import { Logo } from "@/components/Logo";
import { PhaseTimeline } from "@/components/PhaseTimeline";
import { SealVisual } from "@/components/SealVisual";
import { Reveal } from "@/components/Reveal";
import { useRecentBounties } from "@/hooks/useRecentBounties";
import { isContractConfigured, contractAddress } from "@/config/contract";
import { ritualChain } from "@/config/wagmi";
import { shortenAddress } from "@/lib/format";
import { Notice, Dot } from "@/components/ui";

/* --------------------------------------------------------------- helpers */

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
        <span className="h-1 w-6 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" />
        {eyebrow}
      </div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
        {title}
      </h2>
      {sub ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{sub}</p> : null}
    </div>
  );
}

const GLYPH: Record<string, string> = {
  violet: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
  cyan: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30",
  emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
};

function Feature({
  icon,
  title,
  body,
  color,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  color: keyof typeof GLYPH;
  className?: string;
}) {
  return (
    <div
      className={`hover-lift border-gradient glass relative overflow-hidden rounded-2xl p-5 ${className}`}
    >
      <div
        className={`mb-3 inline-grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${GLYPH[color]}`}
      >
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}

const ic = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ------------------------------------------------------------------ page */

export default function Home() {
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const { ids, add } = useRecentBounties();

  useEffect(() => {
    if (selectedId !== null) add(selectedId);
  }, [selectedId, add]);

  const handleCreated = useCallback(
    (id: bigint) => {
      add(id);
      setSelectedId(id);
    },
    [add],
  );

  return (
    <div className="min-h-full">
      {/* ---------------------------------------------------------- Header */}
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <div className="border-gradient glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
          <Logo />
          <div className="flex items-center gap-2">
            <a
              href="#how"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-100 md:inline-block"
            >
              How it works
            </a>
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 sm:inline-flex">
              <Dot tone="cyan" />
              {ritualChain.name}
            </span>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span
              className="animate-hero-in inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200"
              style={{ animationDelay: "0ms" }}
            >
              <Dot tone="violet" />
              Privacy-preserving · Commit-Reveal · Ritual TEE
            </span>

            <h1
              className="animate-hero-in mt-5 font-display text-5xl font-bold leading-[0.92] tracking-tight sm:text-7xl"
              style={{ animationDelay: "90ms" }}
            >
              Submit <span className="text-aurora">blind</span>.
              <br />
              Reveal late.
              <br />
              Win fair.
            </h1>

            <p
              className="animate-hero-in mt-6 max-w-xl text-base leading-relaxed text-zinc-400"
              style={{ animationDelay: "190ms" }}
            >
              A bounty where answers stay <span className="text-zinc-200">sealed</span> until the
              deadline closes. Commit a hash, reveal later, and let Ritual AI rank every entry in a
              single batch — no one can read or copy an answer before judging begins.
            </p>

            <div
              className="animate-hero-in mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "290ms" }}
            >
              <a
                href="#app"
                className="shimmer relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/50 ring-1 ring-inset ring-white/10 transition hover:from-violet-400 hover:to-violet-500"
              >
                Launch a bounty
                <span aria-hidden>→</span>
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]"
              >
                How it works
              </a>
            </div>

            <div
              className="animate-hero-in mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500"
              style={{ animationDelay: "390ms" }}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                27 tests passing
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Live on {ritualChain.name} ({ritualChain.id})
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Zero answer leaks pre-deadline
              </span>
            </div>
          </div>

          <div className="animate-hero-in" style={{ animationDelay: "240ms" }}>
            <SealVisual />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Lifecycle"
            title="Four phases, zero leaks"
            sub="Answers are only ever exposed after the submission window has already closed."
          />
        </Reveal>
        <Reveal delay={120}>
          <div className="border-gradient glass mt-8 rounded-3xl p-6 sm:p-8">
            <PhaseTimeline />
          </div>
        </Reveal>
      </section>

      {/* -------------------------------------------------------- Bento grid */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Feature
              color="violet"
              className="sm:col-span-2"
              title="Sealed submissions"
              body="During the commit phase the chain stores only keccak256(answer, salt, sender, bountyId). The hash reveals nothing — latecomers can't read or clone an earlier answer."
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" {...ic}>
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              }
            />
            <Feature
              color="cyan"
              title="One batch verdict"
              body="judgeAll runs a single Ritual AI call over every revealed answer — never one call per entry."
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" {...ic}>
                  <path d="M12 3l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 17l8 4 8-4" />
                </svg>
              }
            />
            <Feature
              color="emerald"
              title="Human-in-the-loop"
              body="The AI ranking is advisory. The bounty owner ratifies and releases the single reward."
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" {...ic}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                  <circle cx="9.5" cy="7" r="3.5" />
                  <path d="M17 11l2 2 4-4" />
                </svg>
              }
            />
            <Feature
              color="amber"
              className="sm:col-span-2"
              title="Portable, or fully private on Ritual"
              body="The commit-reveal contract runs on any EVM chain. The advanced AIJudgeTEE variant keeps answers encrypted end-to-end and decrypts them only inside a Ritual TEE for judging."
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" {...ic}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z" />
                </svg>
              }
            />
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------- App section */}
      <section id="app" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionHeading eyebrow="Get started" title="Launch or open a bounty" />
        </Reveal>

        {!isContractConfigured && (
          <div className="mt-6">
            <Notice tone="amber">
              No contract address configured. Copy{" "}
              <code className="font-mono">.env.example</code> to{" "}
              <code className="font-mono">.env.local</code> and set{" "}
              <code className="font-mono">NEXT_PUBLIC_CONTRACT_ADDRESS</code> to start interacting
              on-chain.
            </Notice>
          </div>
        )}

        <Reveal delay={100}>
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <CreateBountyForm onCreated={handleCreated} />
            <LoadBountyPanel selectedId={selectedId} onSelect={setSelectedId} recentIds={ids} />
          </div>
        </Reveal>

        {selectedId !== null && (
          <div className="mt-6">
            <BountyView bountyId={selectedId} />
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- Footer */}
      <footer className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <Logo size={22} />
          <div className="font-mono">
            {contractAddress ? (
              <>
                {shortenAddress(contractAddress, 6)} · chain {ritualChain.id}
              </>
            ) : (
              <>Sealed · {ritualChain.name}</>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
