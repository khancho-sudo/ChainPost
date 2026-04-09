const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainPost Contract Tests", function () {

  let postRegistry, editHistory, accessControl;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const PostRegistry = await ethers.getContractFactory("PostRegistry");
    postRegistry = await PostRegistry.deploy();

    const EditHistory = await ethers.getContractFactory("EditHistory");
    editHistory = await EditHistory.deploy(await postRegistry.getAddress());

    const AccessControl = await ethers.getContractFactory("AccessControl");
    accessControl = await AccessControl.deploy(await postRegistry.getAddress());
  });

  describe("PostRegistry", function () {

    it("Should allow a user to create a post", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID123");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try { return postRegistry.interface.parseLog(log).name === "PostCreated"; }
        catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });

    it("Should prevent non-authors from deleting a post", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID123");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await expect(
        postRegistry.connect(owner).deletePost(postId)
      ).to.be.revertedWith("Not the author");
    });

    it("Should allow the author to soft-delete a post", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID123");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await postRegistry.connect(user1).deletePost(postId);

      const post = await postRegistry.getPost(postId);
      expect(post.deleted).to.equal(true);
    });

  });

  describe("EditHistory", function () {

    it("Should record the original version of a post", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmOriginalCID");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await editHistory.connect(user1).recordOriginal(postId, "QmOriginalCID");

      const history = await editHistory.getHistory(postId);
      expect(history.length).to.equal(1);
      expect(history[0].versionNumber).to.equal(0);
      expect(history[0].editNote).to.equal("Original");
    });

    it("Should append a new version when a post is edited", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmOriginalCID");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await editHistory.connect(user1).recordOriginal(postId, "QmOriginalCID");
      await editHistory.connect(user1).editPost(postId, "QmEditedCID", "Fixed typo");

      const history = await editHistory.getHistory(postId);
      expect(history.length).to.equal(2);
      expect(history[1].ipfsCid).to.equal("QmEditedCID");
    });

  });

  describe("AccessControl", function () {

    it("Should allow the author to set post visibility", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await accessControl.connect(user1).setVisibility(postId, 2);

      const visibility = await accessControl.getVisibility(postId);
      expect(visibility).to.equal(2);
    });

    it("Should prevent non-authors from changing post visibility", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await expect(
        accessControl.connect(owner).setVisibility(postId, 2)
      ).to.be.revertedWith("Not the author");
    });

  });

});