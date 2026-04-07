// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PostRegistry {

    struct Post {
        bytes32 postId;
        address author;
        string  ipfsCid;
        uint256 createdAt;
        bool    exists;
        bool    deleted;
    }

    mapping(bytes32 => Post) private posts;
    mapping(address => bytes32[]) private authorPosts;

    event PostCreated(
        bytes32 indexed postId,
        address indexed author,
        string  ipfsCid,
        uint256 createdAt
    );

    event PostDeleted(
        bytes32 indexed postId,
        address indexed author,
        uint256 deletedAt
    );

    function createPost(string calldata ipfsCid) external returns (bytes32 postId) {
        require(bytes(ipfsCid).length > 0, "CID cannot be empty");

        postId = keccak256(
            abi.encodePacked(msg.sender, ipfsCid, block.timestamp)
        );

        posts[postId] = Post({
            postId:    postId,
            author:    msg.sender,
            ipfsCid:   ipfsCid,
            createdAt: block.timestamp,
            exists:    true,
            deleted:   false
        });

        authorPosts[msg.sender].push(postId);
        emit PostCreated(postId, msg.sender, ipfsCid, block.timestamp);
    }

    function deletePost(bytes32 postId) external {
        Post storage post = posts[postId];
        require(post.exists, "Post not found");
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Already deleted");

        post.deleted = true;
        emit PostDeleted(postId, msg.sender, block.timestamp);
    }

    function getPost(bytes32 postId) external view returns (Post memory) {
        require(posts[postId].exists, "Post not found");
        return posts[postId];
    }

    function getPostsByAuthor(address author) external view returns (bytes32[] memory) {
        return authorPosts[author];
    }
}