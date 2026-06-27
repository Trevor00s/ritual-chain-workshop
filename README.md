<div align="center">

# 🔒 Sealed — AI Bounty Judge

**Privacy-preserving bounties on Ritual Chain.**

Answers stay *sealed* behind a commit–reveal flow, are judged by Ritual AI in a single batch, and a human owner signs off before any reward moves.

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![Tests](https://img.shields.io/badge/tests-27%20passing-3fb950)
![Ritual](https://img.shields.io/badge/Ritual-chain%201979-8b5cf6)

</div>

---

## The problem

The original workshop judge wrote every answer to chain in plaintext the instant it was submitted. Because state is public, a latecomer could read the strongest entry, refine it, and submit a better version before the deadline — in a contest where only one entry can win, that is decisive. **Sealed removes the information advantage**: nothing about an answer is visible until the submission window has already closed.

## How it works

A bounty moves through four phases. Answers are only ever exposed *after* the commit window shuts.

| # | Phase | Who | What happens |
|---|-------|-----|--------------|
| 1 | **Commit** | participant | Posts only `keccak256(abi.encodePacked(answer, salt, msg.sender, bountyId))`. The hash leaks nothing. |
| 2 | **Reveal** | participant | After the submission deadline, sends `answer + salt`; the contract re-derives the hash and must match. |
| 3 | **Judge** | owner | One batched Ritual AI call ranks every *revealed* answer against the rubric. |
| 4 | **Finalize** | owner | The owner ratifies the result and the contract pays the single winner. |

```
createBounty ─▶ COMMIT (hash only) ─▶ REVEAL (answer+salt) ─▶ JUDGE (1 batch LLM) ─▶ FINALIZE (pay)
                  answer hidden            proof of commit         ranked review        winner paid
```

Binding the commitment to `msg.sender` and `bountyId` means a hash cannot be replayed by someone else or reused across bounties.

## Two tracks in this repo

| | Required — Commit-Reveal | Advanced — Ritual-Native TEE |
|---|---|---|
| Contract | [`AIJudge.sol`](hardhat/contracts/AIJudge.sol) | [`AIJudgeTEE.sol`](hardhat/contracts/AIJudgeTEE.sol) |
| Hidden during submission | ✅ hash only | ✅ ciphertext only |
| Hidden during judging | revealed first (public) | ✅ decrypted only inside the enclave |
| On-chain footprint after judging | plaintext answers | AI review + `revealedAnswersRef` / `revealedAnswersHash` |
| Runs on | any EVM chain | Ritual (TEE + DKMS + LLM precompile) |

Design write-ups: **[`SUBMISSION.md`](SUBMISSION.md)** (architecture note + reflection) and **[`ADVANCED.md`](ADVANCED.md)** (the encrypted-submission flow and diagram).

## Repository layout

```
.
├── hardhat/                     # Solidity + tests (Hardhat 3 · viem)
│   ├── contracts/
│   │   ├── AIJudge.sol          # Required track — commit-reveal bounty
│   │   ├── AIJudgeTEE.sol       # Advanced track — encrypted submissions
│   │   └── utils/               # Ritual precompile helper
│   ├── test/
│   │   ├── AIJudge.ts           # 11 commit-reveal cases (valid + invalid reveals)
│   │   └── AIJudgeTEE.ts        # 16 advanced-track cases
│   └── scripts/                 # deploy + live commit→reveal→judge→finalize demos
└── web/                         # Next.js 16 frontend (App Router · Tailwind v4 · wagmi)
    └── src/{app,components,hooks,lib,config,abi}
```

## Quickstart

> Prerequisites: Node 18+, a browser wallet, and a Ritual RPC endpoint. `pnpm` or `npm` both work.

**Contracts — compile & test (27 passing: 11 commit-reveal + 16 TEE):**

```bash
cd hardhat
npm install
npx hardhat test
```

**Frontend — run locally:**

```bash
cd web
npm install
cp .env.example .env.local      # set NEXT_PUBLIC_CONTRACT_ADDRESS
npm run dev                     # http://localhost:3000
```

## Live on Ritual testnet (chain `1979`)

| Contract | Address |
|----------|---------|
| `AIJudge` (commit-reveal) | `0x09d9973048fdc9b8d9dd04575d25093df798b121` |
| `AIJudgeTEE` (encrypted) | `0x8fb50452524fda4284b17b793d519a90fdd72b5d` |

Both were exercised end-to-end on-chain (commit → reveal → batched judge → finalize). See [`hardhat/scripts`](hardhat/scripts).

> ⚠️ Ritual reports `block.timestamp` in **milliseconds**, so all deadlines — in the contract and the UI — use millisecond timestamps.

## The frontend

A polished dashboard ("Sealed") built with **Next.js 16 · TypeScript · Tailwind v4 · wagmi · viem**:

- A phase timeline that walks a visitor through commit → reveal → judge → finalize.
- Create a bounty, load any bounty by id, and track recent ones (kept in `localStorage`, no indexer needed).
- Phase-aware submission panel — it shows a hashed commit form before the deadline and a reveal form after.
- Owner-only **Judge** and **Finalize** actions, with the AI ranking rendered as a scored table. The AI result is advisory; the owner makes the final call.

## Security & design notes

- **Hash-only commits.** No answer text reaches chain until `revealAnswer`, after the commit window closes.
- **Collision-safe packing.** In `abi.encodePacked(answer, salt, msg.sender, bountyId)` only `answer` is dynamic and it leads; the trailing fields are fixed-width, so no packing ambiguity exists.
- **Batch judging.** `judgeAll` makes a single LLM precompile call over all revealed answers — never one call per entry.
- **Human-in-the-loop payout.** `finalizeWinner` is owner-only and pays exactly one revealed winner; funds are zeroed before the external call (checks-effects-interactions).
- **Strict phase gates.** Commit before the submission deadline, reveal in the reveal window, judge after it, finalize only once judged.

## Assignment deliverables

| Deliverable | Where |
|-------------|-------|
| Commit-reveal Solidity contract | [`hardhat/contracts/AIJudge.sol`](hardhat/contracts/AIJudge.sol) |
| Advanced encrypted-submission contract | [`hardhat/contracts/AIJudgeTEE.sol`](hardhat/contracts/AIJudgeTEE.sol) |
| Lifecycle README | this file |
| Tests — valid & invalid reveal cases | [`hardhat/test/AIJudge.ts`](hardhat/test/AIJudge.ts) |
| Architecture note (commit-reveal vs Ritual-native) | [`SUBMISSION.md`](SUBMISSION.md) · [`ADVANCED.md`](ADVANCED.md) |
| Reflection (5–8 sentences) | [`SUBMISSION.md`](SUBMISSION.md) |

---

<div align="center">
<sub>Built for the Ritual Chain workshop · commit-reveal + TEE batch judging.</sub>
</div>
