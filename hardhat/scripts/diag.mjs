import { createPublicClient, http, defineChain, formatEther } from "viem";
import { readFileSync } from "node:fs";
const ritual = defineChain({ id: 1979, name: "Ritual", nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.ritualfoundation.org"] } } });
const pc = createPublicClient({ chain: ritual, transport: http() });
const OWNER = "0xA304Fd0f5a06cb45a8eFa6EdC136cF24f878EAef";
const C = "0x14D0e0788359ef2c2B832EF36714c9b1904684c5";
const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";
const TEE_REGISTRY = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";
const art = JSON.parse(readFileSync("artifacts/contracts/SealedJudge.sol/SealedJudge.json", "utf8"));

const regAbi = [{ name: "getServicesByCapability", type: "function", stateMutability: "view",
  inputs: [{ name: "capability", type: "uint8" }, { name: "checkValidity", type: "bool" }],
  outputs: [{ name: "services", type: "tuple[]", components: [
    { name: "node", type: "tuple", components: [
      { name: "paymentAddress", type: "address" }, { name: "teeAddress", type: "address" },
      { name: "teeType", type: "uint8" }, { name: "publicKey", type: "bytes" },
      { name: "endpoint", type: "string" }, { name: "certPubKeyHash", type: "bytes32" },
      { name: "capability", type: "uint8" } ] },
    { name: "isValid", type: "bool" }, { name: "workloadId", type: "bytes32" } ] }] }];
const walletAbi = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "lockUntil", type: "function", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }];

try {
  const services = await pc.readContract({ address: TEE_REGISTRY, abi: regAbi, functionName: "getServicesByCapability", args: [1, true] });
  console.log("VALID LLM executors (capability 1):", services.length);
  for (const s of services) console.log("  paymentAddress:", s.node.paymentAddress, "| teeAddress:", s.node.teeAddress, "| pubkeyLen:", (s.node.publicKey.length-2)/2);
} catch (e) { console.log("registry query failed:", e.shortMessage || e.message); }

const bal = await pc.readContract({ address: RITUAL_WALLET, abi: walletAbi, functionName: "balanceOf", args: [OWNER] });
let lock = 0n; try { lock = await pc.readContract({ address: RITUAL_WALLET, abi: walletAbi, functionName: "lockUntil", args: [OWNER] }); } catch {}
console.log("\ntrevor RitualWallet balance:", formatEther(bal), "RIT | lockUntil:", lock.toString(), "| need >= ~0.31");
console.log("trevor EOA native balance  :", formatEther(await pc.getBalance({ address: OWNER })), "RIT");
const cur = await pc.getBlock();
console.log("current block:", cur.number.toString(), "| timestamp(ms):", cur.timestamp.toString());

const b = await pc.readContract({ address: C, abi: art.abi, functionName: "getBounty", args: [1n] });
console.log("\nbounty #1: submissionCount:", b[7].toString(), "| judged:", b[5], "| finalized:", b[6], "| deadline(ms):", b[4].toString(), "| passed:", cur.timestamp >= b[4]);
