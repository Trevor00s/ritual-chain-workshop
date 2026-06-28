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

## Honest limitation

The contract, the ECIES encryption (verified round-trip), the on-chain ciphertext storage, access
control, and request encoding are all implemented and tested. The one part that needs **live**
Ritual infrastructure is the in-enclave step at `judgeAll`: a funded RitualWallet, a registered TEE
executor, and a real DKMS-derived bounty key. Local hardhat tests cover everything up to (and the
guards around) that call, since the `0x0802` precompile cannot run in a local node.

## Commit-reveal vs this Sealed track

| | Commit-reveal (`AIJudge`) | Sealed (`SealedJudge`) |
|---|---|---|
| Hidden during submission | yes (hash) | yes (ciphertext) |
| Hidden during judging | no (revealed first) | yes (decrypted only in enclave) |
| Verdict | public | sealed to owner, optional reveal |
| Chain | any EVM | Ritual (TEE + DKMS + LLM) |
