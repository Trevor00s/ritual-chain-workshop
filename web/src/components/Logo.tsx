import type { CSSProperties } from "react";

/**
 * Brand mark for the app: a sealed hexagon with a keyhole, in the violet→cyan
 * brand gradient. The "Sealed" wordmark reflects the commit-reveal model —
 * answers stay sealed until the reveal phase.
 */
export function Logo({
  className = "",
  showWordmark = true,
  size = 36,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  const box: CSSProperties = { height: size, width: size };
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative grid place-items-center" style={box}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="sealedGrad"
              x1="2"
              y1="2"
              x2="38"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#a78bfa" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          {/* sealed hexagon */}
          <path
            d="M20 2.5 33.4 10.25 V25.75 L20 33.5 6.6 25.75 V10.25 Z"
            fill="url(#sealedGrad)"
            fillOpacity="0.12"
            stroke="url(#sealedGrad)"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          {/* keyhole */}
          <circle cx="20" cy="16.4" r="3.3" stroke="url(#sealedGrad)" strokeWidth="1.7" />
          <path d="M18.3 19.1 17.3 24.6 H22.7 L21.7 19.1 Z" fill="url(#sealedGrad)" />
        </svg>
      </span>
      {showWordmark ? (
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-tight text-zinc-100">
            Sealed
          </div>
          <div className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            AI Bounty Judge
          </div>
        </div>
      ) : null}
    </div>
  );
}
