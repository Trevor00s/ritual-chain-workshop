"use client";

import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { config } from "@/config/wagmi";

/**
 * Client-side provider tree. Next.js App Router layouts are Server Components,
 * so wagmi + React Query (which rely on client state/context) must live in a
 * dedicated `"use client"` wrapper that the server layout renders.
 *
 * MotionConfig(reducedMotion="user") makes every Framer Motion animation honor
 * the user's prefers-reduced-motion setting.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Keep the QueryClient stable across re-renders within this client boundary.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
