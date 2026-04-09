// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostRegistry.sol";

/// @title AccessControl
/// @notice Manages per-post visibility settings on-chain.
///         All permission changes are logged transparently for full auditability.
contract AccessControl {

    // ── Data Structures ────────────────────────────────────────────────────

    /// @notice Visibility levels available for each post.
    enum Visibility { Public, FollowersOnly, Private }
    // 0 = Public, 1 = FollowersOnly, 2 = Private

    // ── State Variables ────────────────────────────────────────────────────

    /// @dev Reference to the PostRegistry contract for author verification
    PostRegistry private immutable registry;

    /// @dev Maps each postId to its current visibility setting
    mapping(bytes32 => Visibility) private postVisibility;

    // ── Events ─────────────────────────────────────────────────────────────

    /// @notice Emitted when a post's visibility is changed.
    ///         All changes are permanently recorded on-chain for transparency.
    event VisibilityChanged(
        bytes32 indexed postId,
        address indexed author,
        Visibility newVisibility,
        uint256 timestamp
    );

    // ── Constructor ────────────────────────────────────────────────────────

    /// @notice Sets the address of the PostRegistry contract at deployment.
    /// @param registryAddress The deployed address of PostRegistry
    constructor(address registryAddress) {
        registry = PostRegistry(registryAddress);
    }

    // ── Functions ──────────────────────────────────────────────────────────

    /// @notice Sets the visibility of a post.
    ///         Only the original author can change this setting.
    /// @param postId     The postId from PostRegistry
    /// @param visibility 0 = Public, 1 = FollowersOnly, 2 = Private
    function setVisibility(bytes32 postId, Visibility visibility) external {
        PostRegistry.Post memory post = registry.getPost(postId);
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Post is deleted");

        postVisibility[postId] = visibility;
        emit VisibilityChanged(postId, msg.sender, visibility, block.timestamp);
    }

    /// @notice Returns the current visibility setting of a post.
    /// @param postId The postId to query
    function getVisibility(bytes32 postId) external view returns (Visibility) {
        return postVisibility[postId];
    }
}