<div align="center">

# 🔒 Sealed AI Bounty Judge

**Privacy-preserving bounties on Ritual Chain.**

Answers stay *sealed* behind a commit–reveal flow, are judged by Ritual AI in a single batch, and a human owner signs off before any reward moves.

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![Tests](https://img.shields.io/badge/tests-11%20passing-3fb950)
![Ritual](https://img.shields.io/badge/Ritual-chain%201979-8b5cf6)

**[▶ Live demo](https://trevor00s.github.io/ritual-chain-workshop/)** · contract [`0x378F…34B0`](https://explorer.ritualfoundation.org/address/0x378F770b8DE19b8eFdf5e69ab129D38c321d34B0) on Ritual (chain 1979)

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

## Tracks

- **Required — Commit-Reveal (implemented):** [`AIJudge.sol`](hardhat/contracts/AIJudge.sol), deployed live on Ritual and wired into the app.
- **Advanced — Sealed submissions (implemented + deployed):** [`SealedJudge.sol`](hardhat/contracts/SealedJudge.sol) — answers are ECIES-encrypted to a **per-bounty DKMS key** (never public, no reveal phase) and the AI **verdict is sealed to the owner**. Deployed on Ritual at [`0x14D0…84c5`](https://explorer.ritualfoundation.org/address/0x14D0e0788359ef2c2B832EF36714c9b1904684c5); client in [`ritualSecrets.ts`](web/src/lib/ritualSecrets.ts); see [`ADVANCED.md`](ADVANCED.md).

| | Commit-Reveal (`AIJudge`) | Sealed (`SealedJudge`) |
|---|---|---|
| Hidden during submission | ✅ hash only | ✅ ciphertext only |
| Hidden during judging | revealed first (public) | ✅ decrypted only inside the enclave |
| Verdict | public | ✅ sealed to owner, optional reveal |
| Runs on | any EVM chain | Ritual (TEE + DKMS + LLM precompile) |

Write-ups: **[`SUBMISSION.md`](SUBMISSION.md)** (architecture note + reflection) · **[`ADVANCED.md`](ADVANCED.md)** (the encrypted-submission design + diagram).

## Repository layout

```
.
├── hardhat/                     # Solidity + tests (Hardhat 3 · viem)
│   ├── contracts/
│   │   ├── AIJudge.sol          # The contract — commit-reveal bounty
│   │   └── utils/               # Ritual precompile helper
│   ├── test/AIJudge.ts          # 11 commit-reveal cases (valid + invalid reveals)
│   └── scripts/                 # deploy + live commit→reveal→judge→finalize demos
└── web/                         # Next.js 16 frontend (App Router · Tailwind v4 · wagmi)
    └── src/{app,components,hooks,lib,config,abi}
```

## Quickstart

> Prerequisites: Node 18+, a browser wallet, and a Ritual RPC endpoint. `pnpm` or `npm` both work.

**Contracts — compile & test (11 commit-reveal cases):**

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
| `AIJudge` (commit-reveal) | [`0x378F770b8DE19b8eFdf5e69ab129D38c321d34B0`](https://explorer.ritualfoundation.org/address/0x378F770b8DE19b8eFdf5e69ab129D38c321d34B0) |

Deployed from the Trevor00s wallet — **deploy tx** `0xa4654826bf6ee9e43ed8af4eaf8cdd5ecc1156152fc292e5f296aeaf1a467e2a` (block 38738042). Exercised end-to-end on-chain (commit → reveal → batched judge → finalize). See [`hardhat/scripts`](hardhat/scripts).

> ⚠️ Ritual reports `block.timestamp` in **milliseconds**, so all deadlines — in the contract and the UI — use millisecond timestamps.

## The frontend

A polished dashboard ("Sealed") built with **Next.js 16 · TypeScript · Tailwind v4 · wagmi · viem**:

- A phase timeline that walks a visitor through commit → reveal → judge → finalize.
- Create a bounty, load any bounty by id, and track recent ones (kept in `localStorage`, no indexer needed).
- Phase-aware submission panel: a hash-only commit form before the deadline (salt shown so you can keep it) and a reveal form after — with on-chain detection of your own commitment.
- Auto add/switch to the Ritual network on connect.
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
| Lifecycle README | this file |
| Tests — valid & invalid reveal cases | [`hardhat/test/AIJudge.ts`](hardhat/test/AIJudge.ts) |
| Architecture note (commit-reveal vs Ritual-native) | [`SUBMISSION.md`](SUBMISSION.md) · [`ADVANCED.md`](ADVANCED.md) |
| Advanced track (design) | [`ADVANCED.md`](ADVANCED.md) |
| Reflection (5–8 sentences) | [`SUBMISSION.md`](SUBMISSION.md) |

## Reflection — what's public, hidden, and decided by AI vs. a human

Public: the rules — prompt, rubric, deadlines, reward, and each participant's commitment hash — so the contest is auditable. Hidden: each answer's content during the submission phase, so no one can copy an earlier entry (revealed after the deadline, or kept encrypted in a TEE design). The AI does the first pass — scoring every revealed answer against the rubric in one batch, fast and consistently. A human keeps the final say — ratifying the winner and releasing the reward — because rubrics are interpretive and accountability for real money should rest with a person. In short: the chain enforces fairness and timing, the AI recommends a ranking, and a human makes the final call.

---

<div align="center">
<sub>Built for the Ritual Chain workshop · commit-reveal with batched AI judging.</sub>
</div>
