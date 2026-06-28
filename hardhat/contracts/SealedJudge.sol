// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PrecompileConsumer} from "./utils/PrecompileConsumer.sol";

/// @title SealedJudge — Sealed advanced track (Ritual-native, DKMS-keyed, sealed verdict)
/// @notice trevor's "Sealed" take on hidden submissions. It differs from the sibling profiles:
///         - rivale (AIJudgeTEE): ciphertext lives OFF-chain in a DA provider (StorageRef).
///         - roan   (SealedAIJudge): on-chain ciphertext encrypted to the EXECUTOR key; public verdict.
///         - trevor (this): on-chain ciphertext encrypted to a per-bounty **DKMS key** (bound to the
///           bounty's on-chain identity, portable across executors), and the AI **verdict is itself
///           sealed** — returned ECIES-encrypted to the owner, then optionally published with a hash.
/// @dev    Mechanism per Ritual docs: DKMS (0x081B) derives a deterministic secp256k1 keypair inside
///         the TEE bound to an on-chain owner; entrants ECIES-encrypt to that bounty key. At judging
///         the request carries the ciphertexts as encryptedSecrets (piiEnabled) and a userPublicKey so
///         the completion (verdict) comes back encrypted. Plaintext answers + verdict exist only in a
///         browser and inside the enclave — never in calldata, state, or logs.
contract SealedJudge is PrecompileConsumer {
    uint256 public constant MAX_SUBMISSIONS = 10;
    uint256 public constant MAX_CIPHERTEXT_BYTES = 8_000;

    uint256 public nextBountyId = 1;

    struct Sealed {
        address submitter;
        bytes ciphertext; // ECIES blob to the bounty DKMS key; decryptable only in the TEE
    }

    struct Bounty {
        address owner;
        string title;
        string rubric;
        uint256 reward;
        uint256 submissionDeadline; // submissions close here; judging opens
        bytes dkmsPubKey; // per-bounty DKMS public key entrants encrypt to
        bytes ownerVerdictKey; // 65-byte key the sealed verdict is encrypted to
        bool judged;
        bool finalized;
        bytes encryptedVerdict; // AI ranking, ECIES-encrypted to ownerVerdictKey (not public)
        string publishedVerdict; // optional plaintext the owner later publishes
        bytes32 verdictHash; // keccak256 of the published verdict (transparency commitment)
        uint256 winnerIndex;
        Sealed[] submissions;
        mapping(address => uint256) submitterSlot; // 1-based; 0 = none
    }

    struct ConvoHistory {
        string storageType;
        string path;
        string secretsName;
    }

    mapping(uint256 => Bounty) internal bounties;

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed owner,
        string title,
        uint256 reward,
        uint256 submissionDeadline
    );
    event SealedSubmitted(uint256 indexed bountyId, uint256 indexed index, address indexed submitter);
    event SealedVerdict(uint256 indexed bountyId, bytes encryptedVerdict);
    event VerdictPublished(uint256 indexed bountyId, bytes32 verdictHash);
    event WinnerFinalized(
        uint256 indexed bountyId,
        uint256 indexed winnerIndex,
        address indexed winner,
        uint256 reward
    );

    modifier onlyOwner(uint256 bountyId) {
        require(msg.sender == bounties[bountyId].owner, "not bounty owner");
        _;
    }
    modifier bountyExists(uint256 bountyId) {
        require(bounties[bountyId].owner != address(0), "bounty not found");
        _;
    }

    /// @notice Open a sealed bounty. `dkmsPubKey` is the per-bounty key entrants encrypt to;
    ///         `ownerVerdictKey` is where the sealed AI verdict will be encrypted.
    function createBounty(
        string calldata title,
        string calldata rubric,
        uint256 submissionDeadline,
        bytes calldata dkmsPubKey,
        bytes calldata ownerVerdictKey
    ) external payable returns (uint256 bountyId) {
        require(msg.value > 0, "reward required");
        require(submissionDeadline > block.timestamp, "submission deadline in past");
        require(dkmsPubKey.length > 0, "dkms key required");

        bountyId = nextBountyId++;
        Bounty storage b = bounties[bountyId];
        b.owner = msg.sender;
        b.title = title;
        b.rubric = rubric;
        b.reward = msg.value;
        b.submissionDeadline = submissionDeadline;
        b.dkmsPubKey = dkmsPubKey;
        b.ownerVerdictKey = ownerVerdictKey;
        b.winnerIndex = type(uint256).max;

        emit BountyCreated(bountyId, msg.sender, title, msg.value, submissionDeadline);
    }

    /// @notice Submit an answer already ECIES-encrypted to the bounty DKMS key.
    function submitSealed(
        uint256 bountyId,
        bytes calldata ciphertext
    ) external bountyExists(bountyId) {
        Bounty storage b = bounties[bountyId];
        require(block.timestamp < b.submissionDeadline, "submissions closed");
        require(!b.judged, "already judged");
        require(ciphertext.length > 0, "empty ciphertext");
        require(ciphertext.length <= MAX_CIPHERTEXT_BYTES, "ciphertext too long");
        require(b.submitterSlot[msg.sender] == 0, "already submitted");
        require(b.submissions.length < MAX_SUBMISSIONS, "too many submissions");

        b.submissions.push(Sealed({submitter: msg.sender, ciphertext: ciphertext}));
        uint256 index = b.submissions.length - 1;
        b.submitterSlot[msg.sender] = index + 1;
        emit SealedSubmitted(bountyId, index, msg.sender);
    }

    /// @notice Batched judging in the TEE. `llmInput` carries the ciphertexts as encryptedSecrets
    ///         (piiEnabled) and userPublicKey = ownerVerdictKey, so the returned verdict is sealed.
    function judgeAll(
        uint256 bountyId,
        bytes calldata llmInput
    ) external bountyExists(bountyId) onlyOwner(bountyId) {
        Bounty storage b = bounties[bountyId];
        require(block.timestamp >= b.submissionDeadline, "submissions still open");
        require(!b.judged, "already judged");
        require(!b.finalized, "already finalized");
        require(b.submissions.length > 0, "no submissions");

        bytes memory output = _executePrecompile(LLM_INFERENCE_PRECOMPILE, llmInput);
        (bool hasError, bytes memory completionData, , string memory errorMessage, ) =
            abi.decode(output, (bool, bytes, bytes, string, ConvoHistory));
        require(!hasError, errorMessage);

        b.judged = true;
        b.encryptedVerdict = completionData; // sealed to the owner's key
        emit SealedVerdict(bountyId, completionData);
    }

    /// @notice Owner decrypts the verdict off-chain and may publish it for transparency. The hash
    ///         lets anyone confirm the published text matches what was sealed at judging.
    function publishVerdict(
        uint256 bountyId,
        string calldata plaintextVerdict
    ) external bountyExists(bountyId) onlyOwner(bountyId) {
        Bounty storage b = bounties[bountyId];
        require(b.judged, "not judged yet");
        b.publishedVerdict = plaintextVerdict;
        b.verdictHash = keccak256(bytes(plaintextVerdict));
        emit VerdictPublished(bountyId, b.verdictHash);
    }

    /// @notice Pay the winning entrant (owner ratifies after reading the decrypted verdict).
    function finalizeWinner(
        uint256 bountyId,
        uint256 winnerIndex
    ) external bountyExists(bountyId) onlyOwner(bountyId) {
        Bounty storage b = bounties[bountyId];
        require(b.judged, "not judged yet");
        require(!b.finalized, "already finalized");
        require(winnerIndex < b.submissions.length, "invalid index");

        b.finalized = true;
        b.winnerIndex = winnerIndex;
        address winner = b.submissions[winnerIndex].submitter;
        uint256 reward = b.reward;
        b.reward = 0;
        (bool ok, ) = payable(winner).call{value: reward}("");
        require(ok, "payment failed");
        emit WinnerFinalized(bountyId, winnerIndex, winner, reward);
    }

    // ----------------------------------------------------------------- views

    function getBounty(
        uint256 bountyId
    )
        external
        view
        bountyExists(bountyId)
        returns (
            address owner,
            string memory title,
            string memory rubric,
            uint256 reward,
            uint256 submissionDeadline,
            bool judged,
            bool finalized,
            uint256 submissionCount,
            uint256 winnerIndex,
            bytes memory dkmsPubKey
        )
    {
        Bounty storage b = bounties[bountyId];
        return (
            b.owner,
            b.title,
            b.rubric,
            b.reward,
            b.submissionDeadline,
            b.judged,
            b.finalized,
            b.submissions.length,
            b.winnerIndex,
            b.dkmsPubKey
        );
    }

    /// @notice The sealed verdict (ciphertext) and any later-published plaintext + its hash.
    function getVerdict(
        uint256 bountyId
    )
        external
        view
        bountyExists(bountyId)
        returns (bytes memory encryptedVerdict, string memory publishedVerdict, bytes32 verdictHash)
    {
        Bounty storage b = bounties[bountyId];
        return (b.encryptedVerdict, b.publishedVerdict, b.verdictHash);
    }

    /// @notice One sealed submission — submitter + ciphertext only, never plaintext.
    function getSealed(
        uint256 bountyId,
        uint256 index
    ) external view bountyExists(bountyId) returns (address submitter, bytes memory ciphertext) {
        Bounty storage b = bounties[bountyId];
        require(index < b.submissions.length, "invalid index");
        Sealed storage s = b.submissions[index];
        return (s.submitter, s.ciphertext);
    }

    /// @notice All ciphertexts in order — convenient for assembling `encryptedSecrets`.
    function getCiphertexts(
        uint256 bountyId
    ) external view bountyExists(bountyId) returns (bytes[] memory ciphertexts) {
        Bounty storage b = bounties[bountyId];
        uint256 n = b.submissions.length;
        ciphertexts = new bytes[](n);
        for (uint256 i = 0; i < n; i++) {
            ciphertexts[i] = b.submissions[i].ciphertext;
        }
    }

    /// @notice O(1) "has this wallet submitted?" lookup.
    function getSubmissionIndex(
        uint256 bountyId,
        address submitter
    ) external view bountyExists(bountyId) returns (bool exists, uint256 index) {
        uint256 slot = bounties[bountyId].submitterSlot[submitter];
        if (slot == 0) return (false, 0);
        return (true, slot - 1);
    }
}
