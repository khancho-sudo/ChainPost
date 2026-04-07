// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostRegistry.sol";

contract AccessControl {

    enum Visibility { Public, FollowersOnly, Private }

    PostRegistry private immutable registry;
    mapping(bytes32 => Visibility) private postVisibility;

    event VisibilityChanged(
        bytes32 indexed postId,
        address indexed author,
        Visibility newVisibility,
        uint256 timestamp
    );

    constructor(address registryAddress) {
        registry = PostRegistry(registryAddress);
    }

    function setVisibility(bytes32 postId, Visibility visibility) external {
        PostRegistry.Post memory post = registry.getPost(postId);
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Post is deleted");

        postVisibility[postId] = visibility;
        emit VisibilityChanged(postId, msg.sender, visibility, block.timestamp);
    }

    function getVisibility(bytes32 postId) external view returns (Visibility) {
        return postVisibility[postId];
    }
}