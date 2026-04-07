const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainPost 컨트랙트 테스트", function () {

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

    it("게시물을 생성할 수 있어야 한다", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID123");
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try { return postRegistry.interface.parseLog(log).name === "PostCreated"; }
        catch { return false; }
      });
      expect(event).to.not.be.undefined;
    });

    it("작성자가 아닌 사람은 삭제할 수 없어야 한다", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID123");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await expect(
        postRegistry.connect(owner).deletePost(postId)
      ).to.be.revertedWith("Not the author");
    });

    it("게시물을 소프트 삭제할 수 있어야 한다", async function () {
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

    it("원본 버전이 기록되어야 한다", async function () {
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

    it("수정 시 버전이 추가되어야 한다", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmOriginalCID");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await editHistory.connect(user1).recordOriginal(postId, "QmOriginalCID");
      await editHistory.connect(user1).editPost(postId, "QmEditedCID", "오타 수정");

      const history = await editHistory.getHistory(postId);
      expect(history.length).to.equal(2);
      expect(history[1].ipfsCid).to.equal("QmEditedCID");
    });

  });

  describe("AccessControl", function () {

    it("게시물 공개 범위를 설정할 수 있어야 한다", async function () {
      const tx = await postRegistry.connect(user1).createPost("QmTestCID");
      const receipt = await tx.wait();
      const parsed = postRegistry.interface.parseLog(receipt.logs[0]);
      const postId = parsed.args.postId;

      await accessControl.connect(user1).setVisibility(postId, 2);

      const visibility = await accessControl.getVisibility(postId);
      expect(visibility).to.equal(2);
    });

    it("작성자가 아닌 사람은 공개 범위를 바꿀 수 없어야 한다", async function () {
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