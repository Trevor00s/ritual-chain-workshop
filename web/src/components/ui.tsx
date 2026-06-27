"use client";

import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { TxState } from "@/hooks/useWriteTx";

/* ------------------------------------------------------------------ Card */

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`border-gradient glass relative overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ${
        glow ? "card-glow" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
        <div className="min-w-0">
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-zinc-100">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

/* ----------------------------------------------------------------- Badge */

type Tone = "green" | "amber" | "indigo" | "violet" | "cyan" | "zinc" | "red";

const TONES: Record<Tone, string> = {
  green: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  indigo: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
  violet: "bg-violet-500/15 text-violet-200 ring-violet-500/30",
  cyan: "bg-cyan-500/15 text-cyan-200 ring-cyan-500/30",
  zinc: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  red: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export function Badge({
  children,
  tone = "zinc",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------- Dot */

export function Dot({ tone = "violet" }: { tone?: Tone }) {
  const color: Record<Tone, string> = {
    green: "bg-emerald-400",
    amber: "bg-amber-400",
    indigo: "bg-violet-400",
    violet: "bg-violet-400",
    cyan: "bg-cyan-400",
    zinc: "bg-zinc-400",
    red: "bg-red-400",
  };
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className={`absolute inline-flex h-full w-full animate-pulse-soft rounded-full opacity-60 ${color[tone]}`}
      />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color[tone]}`} />
    </span>
  );
}

/* ---------------------------------------------------------------- Button */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50";
  const styles: Record<string, string> = {
    primary:
      "shimmer bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-950/50 ring-1 ring-inset ring-white/10 hover:from-violet-400 hover:to-violet-500 hover:shadow-violet-900/50 active:translate-y-px",
    secondary:
      "bg-white/[0.06] text-zinc-100 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] active:translate-y-px",
    ghost: "text-zinc-300 hover:bg-white/5 hover:text-zinc-100",
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ----------------------------------------------------------- Form fields */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-zinc-600">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-100 shadow-inner shadow-black/20 transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet-500/25";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${inputBase} resize-y leading-relaxed ${props.className ?? ""}`} />
  );
}

/* ---------------------------------------------------------- Tx status UI */

const TX_LABEL: Record<TxState, string> = {
  idle: "",
  wallet: "Waiting for wallet…",
  pending: "Confirming on-chain…",
  confirmed: "Confirmed",
  failed: "Failed",
};

const TX_TONE: Record<TxState, Tone> = {
  idle: "zinc",
  wallet: "amber",
  pending: "violet",
  confirmed: "green",
  failed: "red",
};

export function TxStatus({
  state,
  error,
  hash,
  explorerBase,
}: {
  state: TxState;
  error?: string | null;
  hash?: `0x${string}`;
  explorerBase?: string;
}) {
  if (state === "idle" && !error) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <Badge tone={TX_TONE[state]}>
        {(state === "wallet" || state === "pending") && <Spinner />}
        {state === "failed" && error ? error : TX_LABEL[state]}
      </Badge>
      {hash && explorerBase ? (
        <a
          href={`${explorerBase}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
        >
          View tx
        </a>
      ) : null}
    </div>
  );
}

export function Spinner() {
  return (
    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

export function Notice({
  tone = "zinc",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-zinc-100">{value}</div>
    </div>
  );
}
