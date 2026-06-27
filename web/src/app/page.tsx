"use client";

import { useCallback, useEffect, useState } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { CreateBountyForm } from "@/components/CreateBountyForm";
import { LoadBountyPanel } from "@/components/LoadBountyPanel";
import { BountyView } from "@/components/BountyView";
import { Logo } from "@/components/Logo";
import { PhaseTimeline } from "@/components/PhaseTimeline";
import { useRecentBounties } from "@/hooks/useRecentBounties";
import { isContractConfigured, contractAddress } from "@/config/contract";
import { ritualChain } from "@/config/wagmi";
import { shortenAddress } from "@/lib/format";
import { Notice, Dot } from "@/components/ui";

const GUARANTEES = [
  {
    title: "Sealed submissions",
    body: "Commits are hash-only. No answer is readable on-chain until the reveal phase opens.",
    color: "violet" as const,
  },
  {
    title: "One batch verdict",
    body: "Every revealed answer is judged together in a single Ritual AI call — never one call per entry.",
    color: "cyan" as const,
  },
  {
    title: "Human-in-the-loop",
    body: "The AI ranking is advisory. The bounty owner ratifies and releases the reward.",
    color: "emerald" as const,
  },
];

const DOT: Record<string, string> = {
  violet: "bg-violet-400",
  cyan: "bg-cyan-400",
  emerald: "bg-emerald-400",
};

export default function Home() {
  const [selectedId, setSelectedId] = useState<bigint | null>(null);
  const { ids, add } = useRecentBounties();

  // Track any opened bounty in the recent list too. `add` is a no-op when the
  // id is already most-recent, so this won't loop.
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
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 sm:inline-flex">
              <Dot tone="cyan" />
              {ritualChain.name}
            </span>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* ------------------------------------------------------------ Hero */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/50 to-transparent px-5 py-8 sm:px-8 sm:py-10">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              <Dot tone="violet" />
              Privacy-preserving · Commit-Reveal · Ritual TEE
            </span>

            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Bounties that stay <span className="text-gradient">sealed</span> until
              the&nbsp;AI&nbsp;has judged.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Participants commit a hash of their answer, reveal it after the deadline,
              and Ritual AI ranks every entry in one batch pass. No one can read — or
              copy — an answer before judging begins.
            </p>

            {/* lifecycle timeline */}
            <div className="mt-8 rounded-2xl border border-white/[0.07] bg-zinc-950/40 p-5 sm:p-6">
              <PhaseTimeline />
            </div>

            {/* guarantees */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {GUARANTEES.map((g) => (
                <div
                  key={g.title}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${DOT[g.color]}`} />
                    <h3 className="text-sm font-semibold text-zinc-100">{g.title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                    {g.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {!isContractConfigured && (
          <div className="mb-8">
            <Notice tone="amber">
              No contract address configured. Copy{" "}
              <code className="font-mono">.env.example</code> to{" "}
              <code className="font-mono">.env.local</code> and set{" "}
              <code className="font-mono">NEXT_PUBLIC_CONTRACT_ADDRESS</code> to start
              interacting on-chain.
            </Notice>
          </div>
        )}

        {/* ------------------------------------------------- Create + Load */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CreateBountyForm onCreated={handleCreated} />
          <LoadBountyPanel selectedId={selectedId} onSelect={setSelectedId} recentIds={ids} />
        </section>

        {/* ------------------------------------------------ Selected bounty */}
        {selectedId !== null && (
          <section className="mt-6">
            <BountyView bountyId={selectedId} />
          </section>
        )}

        {/* ---------------------------------------------------------- Footer */}
        <footer className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/[0.07] pt-5 text-xs text-zinc-600 sm:flex-row sm:items-center">
          <Logo showWordmark={false} size={22} />
          <div className="font-mono">
            {contractAddress ? (
              <>
                {shortenAddress(contractAddress, 6)} · chain {ritualChain.id}
              </>
            ) : (
              <>Sealed · {ritualChain.name}</>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}
