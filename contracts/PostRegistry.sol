// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PostRegistry
/// @notice Registers posts on-chain. Actual content is stored on IPFS;
///         only the CID (content hash) is recorded here to minimise gas costs.
contract PostRegistry {

    // ── Data Structures ────────────────────────────────────────────────────

    /// @notice Represents a single post entry stored on-chain.
    struct Post {
        bytes32 postId;    // Unique identifier derived from author + CID + timestamp
        address author;    // Wallet address of the post creator
        string  ipfsCid;   // IPFS Content Identifier pointing to the actual content
        uint256 createdAt; // Block timestamp at the time of creation
        bool    exists;    // True if the post has been registered
        bool    deleted;   // True if the author has soft-deleted the post
    }

    // ── State Variables ────────────────────────────────────────────────────

    /// @dev Maps postId to its Post struct
    mapping(bytes32 => Post) private posts;

    /// @dev Maps each author address to their list of postIds
    mapping(address => bytes32[]) private authorPosts;

    // ── Events ─────────────────────────────────────────────────────────────

    /// @notice Emitted when a new post is created.
    /// @dev indexed fields allow efficient filtering in frontend queries
    event PostCreated(
        bytes32 indexed postId,
        address indexed author,
        string  ipfsCid,
        uint256 createdAt
    );

    /// @notice Emitted when a post is soft-deleted by its author.
    event PostDeleted(
        bytes32 indexed postId,
        address indexed author,
        uint256 deletedAt
    );

    // ── Functions ──────────────────────────────────────────────────────────

    /// @notice Registers a new post on-chain after uploading content to IPFS.
    /// @param ipfsCid The IPFS CID returned after uploading content (e.g. "Qm...")
    /// @return postId The unique identifier assigned to this post
    function createPost(string calldata ipfsCid) external returns (bytes32 postId) {
        require(bytes(ipfsCid).length > 0, "CID cannot be empty");

        // Generate a unique postId by hashing author address, CID, and timestamp
        postId = keccak256(
            abi.encodePacked(msg.sender, ipfsCid, block.timestamp)
        );

        // Store the post on-chain
        posts[postId] = Post({
            postId:    postId,
            author:    msg.sender,
            ipfsCid:   ipfsCid,
            createdAt: block.timestamp,
            exists:    true,
            deleted:   false
        });

        // Track this postId under the author's address
        authorPosts[msg.sender].push(postId);

        emit PostCreated(postId, msg.sender, ipfsCid, block.timestamp);
    }

    /// @notice Soft-deletes a post. The record remains on-chain as proof of existence.
    /// @param postId The unique identifier of the post to delete
    function deletePost(bytes32 postId) external {
        Post storage post = posts[postId];
        require(post.exists, "Post not found");
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Already deleted");

        // Mark as deleted without erasing the record — immutability preserved
        post.deleted = true;
        emit PostDeleted(postId, msg.sender, block.timestamp);
    }

    /// @notice Returns the full metadata of a post.
    /// @param postId The unique identifier of the post
    function getPost(bytes32 postId) external view returns (Post memory) {
        require(posts[postId].exists, "Post not found");
        return posts[postId];
    }

    /// @notice Returns all postIds created by a given wallet address.
    /// @param author The wallet address of the author
    function getPostsByAuthor(address author) external view returns (bytes32[] memory) {
        return authorPosts[author];
    }
}