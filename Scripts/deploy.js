const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // 1. Deploy PostRegistry
  const PostRegistry = await ethers.getContractFactory("PostRegistry");
  const postRegistry = await PostRegistry.deploy();
  await postRegistry.waitForDeployment();
  const postRegistryAddress = await postRegistry.getAddress();
  console.log("PostRegistry deployed to:", postRegistryAddress);

  // 2. Deploy EditHistory (requires PostRegistry address)
  const EditHistory = await ethers.getContractFactory("EditHistory");
  const editHistory = await EditHistory.deploy(postRegistryAddress);
  await editHistory.waitForDeployment();
  const editHistoryAddress = await editHistory.getAddress();
  console.log("EditHistory deployed to:", editHistoryAddress);

  // 3. Deploy AccessControl (requires PostRegistry address)
  const AccessControl = await ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy(postRegistryAddress);
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);

  console.log("\n=== Deployment Complete ===");
  console.log("PostRegistry:  ", postRegistryAddress);
  console.log("EditHistory:   ", editHistoryAddress);
  console.log("AccessControl: ", accessControlAddress);
  console.log("==========================");
  console.log("Share the above addresses with your frontend team!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});