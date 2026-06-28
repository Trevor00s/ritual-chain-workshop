# Advanced Track — Ritual-Native Hidden Submissions (Design)

This is the **design** for the advanced track. The repo intentionally ships a **single implemented
contract** (`hardhat/contracts/AIJudge.sol`, commit-reveal). This document describes how a
Ritual-native version would keep answers **encrypted end to end** — no plaintext answer ever
published on-chain, not even after judging. (The homework explicitly allows the advanced track to
be a design document.)

The commit-reveal track already hides answers during submission. Its one limitation: answers become
public during the reveal phase, *before* the AI compares them. The design below closes that gap.

## Flow

```
participant                DA (HF / IPFS / GCS)        privacy contract (chain)     Ritual TEE executor
   |  encrypt(answer) to bounty DKMS key   |                    |                          |
   |------------ ciphertext --------------->|                    |                          |
   |  submitEncrypted(bountyId, commitment, ciphertextRef) ----->| store ref + hash         |
   |                                        |                    | (no plaintext)           |
  --- submission deadline passes ---        |                    |                          |
   owner: judgeAll(bountyId, llmInput, bundleRef, bundleHash) -->| LLM precompile (0x0802) ->| fetch every ciphertext
   |                                        |<--- DKMS-decrypt inside enclave --------------| (private key never leaves TEE)
   |                                        |     build ONE batch prompt -> LLM             |
   |                                        |     publish revealed bundle ----------------->|
   |                                        |    review + bundleRef + bundleHash --------->| onResult
   owner: finalizeWinner(bountyId, idx) ---------------------->| pay winner (human ratifies)|
```

## Required explanations (per the homework)

**Where do plaintext answers exist, and who can read them?**
Plaintext exists in exactly two places: (1) on the participant's own machine before they encrypt,
and (2) transiently inside the Ritual TEE enclave during the `judgeAll` inference. Nobody else —
not other participants, not the bounty owner, not an on-chain observer — can read it. At rest in the
DA provider it is ciphertext; on-chain it is only a reference and a hash.

**What is stored on-chain vs off-chain?**
- **On-chain:** bounty metadata (title, rubric, reward, deadline), and per submission a `commitment`
  hash + a `StorageRef` (platform, path, keyRef) pointing at the ciphertext. After judging: the AI
  review, plus `revealedAnswersRef` and `revealedAnswersHash`. No answer text.
- **Off-chain (DA: HF / IPFS / GCS):** the encrypted answers and the published revealed-answers
  bundle. Large content lives here; the chain only commits to it with a 32-byte hash.

**How does the LLM receive all submissions for batch judging?**
`judgeAll` makes a **single** call to the LLM inference precompile (`0x0802`). The executor, inside
the TEE, reads every ciphertext referenced on-chain, DKMS-decrypts them with the bounty key (which
exists only in the enclave), assembles **one** prompt containing the rubric and all answers, and
runs **one** inference that returns a ranked review. There is no per-answer LLM call and no loop of
inference calls in Solidity.

**How does the final reveal happen, and how does the contract commit to it?**
After judging, the TEE writes a single revealed-answers bundle to DA and returns its location and
hash. `judgeAll` stores `revealedAnswersRef` (where the bundle is) and `revealedAnswersHash`
(`keccak256` of the bundle bytes). Anyone can fetch the bundle and re-hash it to confirm it matches
what was judged — committing to the final revealed set without holding it.

**Why not store plaintext on-chain?**
Ten answers of up to a few KB each would be expensive and would also defeat the privacy goal. Store
one ciphertext reference per submission and one 32-byte hash for the final bundle instead.

## Ritual focus (beyond "just call an LLM")

- **Encrypted secrets / private inputs:** answers are ECIES-encrypted to a DKMS-derived bounty key;
  storage credentials live in the executor's encrypted secrets, never in plaintext on-chain.
- **TEE-backed execution:** judging sees private inputs while keeping them hidden from the public
  chain. Attestation is the trust anchor that decryption happened only inside the enclave.
- **Batch judging:** one inference over the whole set, not one call per answer.
- **Human-in-the-loop:** the AI recommends a ranking; the owner calls `finalizeWinner` to pay. The
  contract never auto-pays from raw AI output.

## Proposed contract surface (design)

| Function | Purpose |
|---|---|
| `createBounty(title, rubric, submissionDeadline)` | escrow reward, open submissions |
| `submitEncrypted(bountyId, commitment, ciphertextRef)` | store hash + ciphertext ref, no plaintext |
| `judgeAll(bountyId, llmInput, revealedAnswersRef, revealedAnswersHash)` | batch TEE judging, commit to bundle |
| `finalizeWinner(bountyId, winnerIndex)` | owner ratifies + pays |
| `getBounty` / `getSubmission` | views; `getSubmission` returns the ciphertext ref, never plaintext |

## Example final output shape

```json
{
  "winnerIndex": 2,
  "ranking": [{ "index": 2, "score": 94, "reason": "Best satisfies the rubric." }],
  "revealedAnswersRef": "ipfs://… or storage-ref://…",
  "revealedAnswersHash": "0x…",
  "summary": "Submission 2 is the strongest answer."
}
```

## Keeping answers out of calldata

A naive design that inlines answers into the `judgeAll` prompt would put answer plaintext into
on-chain calldata. The design keeps answers off-chain instead: the `judgeAll` calldata carries only
the rubric (public), a generic "judge the submissions in the attached history" instruction, the
`convoHistory` `StorageRef`, and the DA credential **ECIES-encrypted to the executor's public key**.
No answer plaintext appears on-chain. The executor decrypts the credential inside the TEE, loads the
bundle as context, and judges all answers in one batched inference.

Honest limitation: Ritual's LLM `convoHistory` is stored as plaintext JSONL off-chain (only the
access credential is encrypted, to the enclave), so this gives *off-chain + TEE-gated access*, not
*encryption at rest*. For answers that must stay ciphertext even at rest through judging, the FHE
precompile (`0x0807`) is the path — a larger build, noted as future work.

## Commit-reveal vs Ritual-native (summary)

| | Commit-reveal (implemented) | Ritual-native TEE (design) |
|---|---|---|
| Hidden during submission | Yes (hash) | Yes (ciphertext) |
| Hidden during judging | No (revealed first) | Yes (decrypted only in enclave) |
| Public after judging | Yes (on-chain) | Optional (bundle ref + hash) |
| Chain | Any EVM | Ritual (TEE + DKMS + LLM) |
| Best for | Open contests | Answers with lasting value |
