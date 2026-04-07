// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostRegistry.sol";

contract EditHistory {

    struct Version {
        uint256 versionNumber;
        string  ipfsCid;
        string  editNote;
        uint256 timestamp;
    }

    PostRegistry private immutable registry;
    mapping(bytes32 => Version[]) private history;

    event PostEdited(
        bytes32 indexed postId,
        address indexed editor,
        uint256 versionNumber,
        string  newIpfsCid,
        uint256 timestamp
    );

    constructor(address registryAddress) {
        registry = PostRegistry(registryAddress);
    }

    function recordOriginal(bytes32 postId, string calldata ipfsCid) external {
        PostRegistry.Post memory post = registry.getPost(postId);
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Post is deleted");
        require(bytes(ipfsCid).length > 0, "CID cannot be empty");

        if (history[postId].length == 0) {
            history[postId].push(Version({
                versionNumber: 0,
                ipfsCid:       ipfsCid,
                editNote:      "Original",
                timestamp:     block.timestamp
            }));
        }
    }

    function editPost(
        bytes32 postId,
        string calldata newCid,
        string calldata editNote
    ) external {
        PostRegistry.Post memory post = registry.getPost(postId);
        require(post.author == msg.sender, "Not the author");
        require(!post.deleted, "Post is deleted");
        require(bytes(newCid).length > 0, "CID cannot be empty");

        uint256 nextVersion = history[postId].length;

        history[postId].push(Version({
            versionNumber: nextVersion,
            ipfsCid:       newCid,
            editNote:      editNote,
            timestamp:     block.timestamp
        }));

        emit PostEdited(postId, msg.sender, nextVersion, newCid, block.timestamp);
    }

    function getHistory(bytes32 postId) external view returns (Version[] memory) {
        return history[postId];
    }

    function getVersion(bytes32 postId, uint256 versionNumber)
        external view returns (Version memory)
    {
        require(versionNumber < history[postId].length, "Version does not exist");
        return history[postId][versionNumber];
    }
}