"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { ritualChain } from "@/config/wagmi";
import { shortenAddress } from "@/lib/format";
import { Button, Badge, Spinner } from "@/components/ui";

export function WalletConnect() {
  // `chainId` here is the connected wallet's ACTUAL chain (can be a chain that
  // isn't in our config — e.g. Ethereum mainnet). useChainId() would only ever
  // return our configured chain, so it can't detect a wrong network.
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  const wrongChain = isConnected && chainId !== undefined && chainId !== ritualChain.id;

  // Auto switch/add Ritual whenever the wallet is connected on the wrong chain.
  // wagmi calls wallet_switchEthereumChain and falls back to
  // wallet_addEthereumChain (using ritualChain's rpc/explorer/native currency)
  // if the wallet doesn't have it yet. One-shot per wrong-chain state so a
  // rejected prompt isn't spammed; resets once back on Ritual.
  const autoSwitched = useRef(false);
  useEffect(() => {
    if (wrongChain) {
      if (!autoSwitched.current) {
        autoSwitched.current = true;
        switchChain({ chainId: ritualChain.id });
      }
    } else {
      autoSwitched.current = false;
    }
  }, [wrongChain, switchChain]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {wrongChain ? (
          <Button
            variant="secondary"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: ritualChain.id })}
          >
            {isSwitching ? (
              <>
                <Spinner /> Switching…
              </>
            ) : (
              <>Switch to {ritualChain.name}</>
            )}
          </Button>
        ) : (
          <Badge tone="green">{ritualChain.name}</Badge>
        )}
        <Button variant="secondary" onClick={() => disconnect()}>
          {shortenAddress(address)}
        </Button>
      </div>
    );
  }

  // Dedupe connectors by name (injected + metaMask can overlap).
  const seen = new Set<string>();
  const list = connectors.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  return (
    <div className="relative">
      <Button onClick={() => setOpen((v) => !v)} disabled={isPending}>
        {isPending ? "Connecting…" : "Connect Wallet"}
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl">
          {list.length === 0 && (
            <div className="px-3 py-2 text-xs text-zinc-500">
              No wallet connectors found.
            </div>
          )}
          {list.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector });
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/10"
            >
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
