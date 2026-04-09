// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostRegistry.sol";

/// @title EditHistory
/// @notice Tracks every edit to a post as an immutable version chain.
///         Version 0 is always the original; subsequent versions are edits.
contract EditHistory {

    // ── Data Structures ────────────────────────────────────────────────────

    /// @notice Represents a single version of a post.
    struct Version {
        uint256 versionNumber; // 0 = original, 1+ = edited versions
        string  ipfsCid;       // IPFS CID of this version's content
        string  editNote;      // Optional description of what changed
        uint256 timestamp;     // Block timestamp when this version was recorded
    }

    // ── State Variables ────────────────────────────────────────────────────

    /// @dev Reference to the PostRegistry contract for author verification
    PostRegistry private immutable registry;

    /// @dev Maps postId to its ordered list of versions
    mapping(bytes32 => Version[]) private history;

    // ── Events ─────────────────────────────────────────────────────────────

    /// @notice Emitted when a post is edited and a new version is recorded.
    event PostEdited(
        bytes32 indexed postId,
        address indexed editor,
        uint256 versionNumber,
        string  newIpfsCid,
        uint256 timestamp
    );

    // ── Constructor ────────────────────────────────────────────────────────

    /// @notice Sets the address of the PostRegistry contract at deployment.
    /// @param registryAddress The deployed address of PostRegistry
    constructor(address registryAddress) {
        registry = PostRegistry(registryAddress);
    }

    // ── Functions ──────────────────────────────────────────────────────────

    /// @notice Records the original version of a post (version 0).
    ///         Should be called once immediately after createPost().
    /// @param postId  The postId from PostRegistry
    /// @param ipfsCid The IPFS CID of the original content
    function recordOriginal(bytes32 postId, string calldata ipfsCid) external {
        PostRegistry.Post memory post = registry.getPost(postId);
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Post is deleted");
        require(bytes(ipfsCid).length > 0, "CID cannot be empty");

        // Only record if no versions exist yet to prevent overwriting
        if (history[postId].length == 0) {
            history[postId].push(Version({
                versionNumber: 0,
                ipfsCid:       ipfsCid,
                editNote:      "Original",
                timestamp:     block.timestamp
            }));
        }
    }

    /// @notice Records a new edited version of a post.
    /// @param postId   The postId from PostRegistry
    /// @param newCid   IPFS CID of the updated content
    /// @param editNote Short description of what changed (can be empty string)
    function editPost(
        bytes32 postId,
        string calldata newCid,
        string calldata editNote
    ) external {
        PostRegistry.Post memory post = registry.getPost(postId);
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Post is deleted");
        require(bytes(newCid).length > 0, "CID cannot be empty");

        // Version number = current length (0-indexed)
        uint256 nextVersion = history[postId].length;

        history[postId].push(Version({
            versionNumber: nextVersion,
            ipfsCid:       newCid,
            editNote:      editNote,
            timestamp:     block.timestamp
        }));

        emit PostEdited(postId, msg.sender, nextVersion, newCid, block.timestamp);
    }

    /// @notice Returns the full version history of a post.
    /// @param postId The postId to query
    function getHistory(bytes32 postId) external view returns (Version[] memory) {
        return history[postId];
    }

    /// @notice Returns a specific version of a post.
    /// @param postId        The postId to query
    /// @param versionNumber The version index (0 = original)
    function getVersion(bytes32 postId, uint256 versionNumber)
        external view returns (Version memory)
    {
        require(versionNumber < history[postId].length, "Version does not exist");
        return history[postId][versionNumber];
    }
}