import * as dotenv from "dotenv";

import { ethers } from "hardhat";
const hre = require("hardhat");

dotenv.config();

async function main() {
  const feeAddress = process.env.FEE_ADDRESS;
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(`${feeAddress}`);

  await vault.deployed();

  console.log("Vault deployed to:", vault.address);

  console.log(
    "Waiting 30 seconds for Etherscan update before verification requests..."
  );
  await new Promise((resolve) => setTimeout(resolve, 30000)); // pause for Etherscan update

  try {
    await hre.run("verify:verify", {
      address: vault.address,
      constuctorArguments: [feeAddress],
      contract: "contracts/Vault.sol:Vault",
    });
  } catch (err) {
    console.log(err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
