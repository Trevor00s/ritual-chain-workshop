import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther, toHex, getAddress } from "viem";

const { viem } = await network.connect();

const CT_A = toHex(new Uint8Array(Array.from({ length: 80 }, (_, i) => (i * 7 + 3) % 256)));
const CT_B = toHex(new Uint8Array(Array.from({ length: 96 }, (_, i) => (i * 5 + 11) % 256)));
// 65-byte uncompressed-style keys (0x04 + 64 bytes) for the bounty DKMS key + owner verdict key.
const DKMS_KEY = ("0x04" + "ab".repeat(64)) as `0x${string}`;
const VERDICT_KEY = ("0x04" + "cd".repeat(64)) as `0x${string}`;

describe("SealedJudge (Sealed advanced — DKMS-keyed + sealed verdict)", () => {
  let judge: any;
  let publicClient: any;
  let testClient: any;
  let owner: any, alice: any, bob: any;
  let bountyId: bigint;
  let subDeadline: bigint;

  before(async () => {
    publicClient = await viem.getPublicClient();
    testClient = await viem.getTestClient();
    [owner, alice, bob] = await viem.getWalletClients();
  });

  beforeEach(async () => {
    judge = await viem.deployContract("SealedJudge");
    const now = (await publicClient.getBlock()).timestamp;
    subDeadline = now + 1000n;
    await judge.write.createBounty(["Sealed bounty", "Best private answer", subDeadline, DKMS_KEY, VERDICT_KEY], {
      value: parseEther("1"),
    });
    bountyId = 1n;
  });

  async function warpTo(ts: bigint) {
    await testClient.setNextBlockTimestamp({ timestamp: ts });
    await testClient.mine({ blocks: 1 });
  }

  it("stores ciphertext + the bounty DKMS key, no plaintext", async () => {
    await judge.write.submitSealed([bountyId, CT_A], { account: alice.account });
    const sealed = await judge.read.getSealed([bountyId, 0n]); // [submitter, ciphertext]
    assert.equal(getAddress(sealed[0]), getAddress(alice.account.address));
    assert.equal(sealed[1], CT_A);
    const bounty = await judge.read.getBounty([bountyId]);
    assert.equal(bounty[7], 1n); // submissionCount
    assert.equal(bounty[9], DKMS_KEY); // dkmsPubKey
  });

  it("requires a DKMS key at creation", async () => {
    const now = (await publicClient.getBlock()).timestamp;
    await assert.rejects(
      judge.write.createBounty(["x", "y", now + 1000n, "0x", VERDICT_KEY], { value: parseEther("1") }),
      /dkms key required/,
    );
  });

  it("rejects an empty ciphertext", async () => {
    await assert.rejects(
      judge.write.submitSealed([bountyId, "0x"], { account: alice.account }),
      /empty ciphertext/,
    );
  });

  it("rejects a second submission from the same address", async () => {
    await judge.write.submitSealed([bountyId, CT_A], { account: alice.account });
    await assert.rejects(
      judge.write.submitSealed([bountyId, CT_B], { account: alice.account }),
      /already submitted/,
    );
  });

  it("rejects submissions after the deadline", async () => {
    await warpTo(subDeadline + 1n);
    await assert.rejects(
      judge.write.submitSealed([bountyId, CT_A], { account: bob.account }),
      /submissions closed/,
    );
  });

  it("getSubmissionIndex reports presence on-chain", async () => {
    await judge.write.submitSealed([bountyId, CT_A], { account: alice.account });
    const mine = await judge.read.getSubmissionIndex([bountyId, alice.account.address]);
    assert.equal(mine[0], true);
    assert.equal(mine[1], 0n);
    const none = await judge.read.getSubmissionIndex([bountyId, bob.account.address]);
    assert.equal(none[0], false);
  });

  it("getCiphertexts returns every blob in order", async () => {
    await judge.write.submitSealed([bountyId, CT_A], { account: alice.account });
    await judge.write.submitSealed([bountyId, CT_B], { account: bob.account });
    const cts = await judge.read.getCiphertexts([bountyId]);
    assert.equal(cts.length, 2);
    assert.equal(cts[0], CT_A);
    assert.equal(cts[1], CT_B);
  });

  it("rejects judging while submissions are still open", async () => {
    await judge.write.submitSealed([bountyId, CT_A], { account: alice.account });
    await assert.rejects(
      judge.write.judgeAll([bountyId, "0x"], { account: owner.account }),
      /submissions still open/,
    );
  });

  it("rejects judging by a non-owner", async () => {
    await warpTo(subDeadline + 1n);
    await assert.rejects(
      judge.write.judgeAll([bountyId, "0x"], { account: alice.account }),
      /not bounty owner/,
    );
  });

  it("rejects publishing a verdict before judging", async () => {
    await assert.rejects(
      judge.write.publishVerdict([bountyId, "winner 0"], { account: owner.account }),
      /not judged yet/,
    );
  });

  it("rejects finalize before judging", async () => {
    await judge.write.submitSealed([bountyId, CT_A], { account: alice.account });
    await assert.rejects(
      judge.write.finalizeWinner([bountyId, 0n], { account: owner.account }),
      /not judged yet/,
    );
  });
});
