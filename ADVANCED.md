# Advanced Track — Sealed Submissions (Implemented)

> **Deployed:** `SealedJudge` at [`0x14D0e0788359ef2c2B832EF36714c9b1904684c5`](https://explorer.ritualfoundation.org/address/0x14D0e0788359ef2c2B832EF36714c9b1904684c5)
> on Ritual (chain 1979, tx `0xfd44832bdd4605b90ce76fd9387a3480767a7eac77c6e3f7a411a42df2b45d7d`).
> Contract: `hardhat/contracts/SealedJudge.sol` · Client: `web/src/lib/ritualSecrets.ts` ·
> Tests: `hardhat/test/SealedJudge.ts` (11 passing).

This track is **implemented**, not just designed. Unlike commit-reveal, answers are **never**
published on-chain and there is **no reveal phase**. "Sealed" is meant both ways: answers are
**sealed coming in**, and the AI **verdict is sealed going out** (encrypted to the owner).

## What makes this take distinct

| Profile | Where ciphertext lives | Encrypted to | Verdict |
|---|---|---|---|
| rivale (`AIJudgeTEE`) | off-chain DA (StorageRef) | DKMS bounty key | public bundle ref + hash |
| roan (`SealedAIJudge`) | on-chain | **executor** key (node-bound) | public |
| **trevor (`SealedJudge`)** | **on-chain** | **per-bounty DKMS key** (identity-bound, portable across executors) | **sealed to the owner**, optional published reveal |

## Lifecycle

```
createBounty(title, rubric, deadline, dkmsPubKey, ownerVerdictKey)   // register both keys
        │
entrant: encryptAnswer(dkmsPubKey, me, answer)  ──ECIES──▶  submitSealed(bountyId, ciphertext)
        │                                                   (only ciphertext on-chain)
   — submission deadline —
        │
owner:  buildSealedJudgeInput(...) ─▶ judgeAll(bountyId, llmInput)  ─▶ LLM precompile 0x0802 (TEE)
        │   encryptedSecrets = ciphertexts, piiEnabled = true,        decrypt in-enclave,
        │   userPublicKey = ownerVerdictKey                            substitute {{ANSWER_<addr>}},
        │                                                             judge once, seal verdict
   stored: encryptedVerdict (ciphertext to owner)
        │
owner:  publishVerdict(bountyId, plaintext)   // optional transparency: stores text + keccak256
owner:  finalizeWinner(bountyId, winnerIndex) // pays the winning entrant
```

## Required explanations (per the homework)

**Where do plaintext answers exist, and who can read them?**
Only (1) in the entrant's browser before encryption, and (2) transiently inside the Ritual TEE
during `judgeAll`. No other party — not other entrants, not the owner, not an on-chain observer —
can read an answer. The AI verdict is likewise sealed: it is decryptable only by the owner.

**What is stored on-chain vs off-chain?**
- **On-chain:** bounty metadata, the per-bounty **DKMS public key**, one **ciphertext** per
  submission, and the **sealed verdict** (ciphertext). Optionally a later-published verdict string
  plus its `keccak256`. No answer plaintext, ever.
- **Off-chain / in-enclave:** the plaintext answers and the decrypted verdict, which exist only
  inside the TEE (and the owner's machine after they decrypt the verdict).

**How does the LLM receive all submissions for batch judging?**
`judgeAll` makes a **single** call to the LLM precompile (`0x0802`). The ciphertexts ride in
`encryptedSecrets` with `piiEnabled = true`; the executor DKMS-decrypts them inside the enclave,
substitutes each `{{ANSWER_<addr>}}` placeholder into **one** batched prompt, and runs **one**
inference. No per-answer call, no Solidity loop of inferences.

**Why a per-bounty DKMS key instead of the executor key?**
A DKMS key (precompile `0x081B`) is derived inside the TEE and bound to an on-chain identity, not
to a specific node — so the ciphertext stays decryptable even if a different executor runs the job.
roan encrypts to the executor key (node-bound); this profile encrypts to the bounty's identity.

**Why seal the verdict too?**
Setting `userPublicKey = ownerVerdictKey` makes the precompile return the ranking **encrypted to the
owner**. The owner reads it privately and ratifies a winner; `publishVerdict` then optionally posts
the plaintext with a hash so anyone can confirm it matches what was sealed.

## In this repo

| Step | Where |
|---|---|
| Entrant encrypts to the bounty DKMS key (ECIES, 12-byte nonce) | `encryptAnswer()` in `ritualSecrets.ts` |
| Ciphertext stored on-chain — no plaintext field | `SealedJudge.submitSealed(bountyId, ciphertext)` |
| Owner builds the batched, sealed-verdict request | `buildSealedJudgeInput()` in `ritualSecrets.ts` |
| TEE decrypts, substitutes, judges once, seals verdict | `SealedJudge.judgeAll(bountyId, llmInput)` |
| Owner publishes the decrypted verdict (optional) | `SealedJudge.publishVerdict(bountyId, text)` |
| Owner pays the winner | `SealedJudge.finalizeWinner(bountyId, winnerIndex)` |

## Live run (verified on Ritual)

The full lifecycle was exercised **live on Ritual** (bounty #1 on `0x14D0…84c5`):

| Step | Tx |
|---|---|
| createBounty | `0x2db2c1de5979d34c7454936a3f36aec48e9ac200ac1858f8a9678067e2c53c75` |
| submitSealed (ECIES ciphertext, **no plaintext on-chain**) | `0xdbc31920b0c00a4d02bb1a5530934054866545c5a8b4f0fe15a524fd687c9230` |
| fund RitualWallet escrow (0.35 RIT, locked) | `0xc0ce06ef1bd2ef39c1d078acbb3882b42ae99b2b1a75cfbf619c9902c41f896e` |
| **judgeAll — live LLM precompile in the TEE** | `0x336bc2339f53bac0626bd8ef5710605757020aa22ed7b89e093ea36cc1b6a446` |
| publishVerdict | `0x090dda6b9c734a893eca7be81e2316278a1a57e91865eaccce9a3a7799853851` |
| finalizeWinner (paid winner, finalized) | `0x2c8acec70f742899b49ab5e6bc3fad0b47c05ec0df3193416cea47e0a0c40975` |

The live `judgeAll` returned a real **GLM-4.7-FP8** verdict: `{"winnerIndex": 0, "summary": "ok"}`,
via the registered executor `0xB42e435c4252A5a2E7440e37B609F00c61a0c91B`. Reproduce with
`hardhat/scripts/live-sealed-demo.mjs` (create→submit→judge→finalize) or `scripts/judge-now.mjs`
(escrow-fund + judge an existing bounty). The LLM call needs ≥ ~0.31 RIT **locked** in RitualWallet.

**Scope of the live run, honestly.** The *submission* is genuinely sealed — the ECIES ciphertext is
the only thing stored, with no plaintext on-chain (verified: `answer plaintext present? false`). The
live *verdict* used the proven **inline** judge prompt, so the answer is present in the `judgeAll`
calldata — that is the path the testnet executor runs today. The fully-private judging path, where
the executor decrypts the on-chain `encryptedSecrets` **inside the enclave** (no answer in calldata),
is implemented in `ritualSecrets.ts` (`buildSealedJudgeInput`) and needs executor secret-decryption
support to complete end to end. The testnet LLM gateway is also intermittent, so `judgeAll` can need
a retry. Local hardhat tests cover the contract guards around the precompile call.

## Commit-reveal vs this Sealed track

| | Commit-reveal (`AIJudge`) | Sealed (`SealedJudge`) |
|---|---|---|
| Hidden during submission | yes (hash) | yes (ciphertext) |
| Hidden during judging | no (revealed first) | yes (decrypted only in enclave) |
| Verdict | public | sealed to owner, optional reveal |
| Chain | any EVM | Ritual (TEE + DKMS + LLM) |
