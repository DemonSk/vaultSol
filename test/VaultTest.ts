import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, utils } from "ethers";
import { Vault, MockERC20 } from "../typechain";

describe("Vault test", function () {
  // users
  let owner: SignerWithAddress;
  let feeAddress: SignerWithAddress;
  let newFeeAddress: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  // contracts
  let token1: MockERC20;
  let token2: MockERC20;
  let token3: MockERC20;
  let vault: Vault;
  // variables
  let deposit1: BigNumber;
  let deposit2: BigNumber;
  let deposit3: BigNumber;
  let expectedFee1: BigNumber;
  let expectedFee2: BigNumber;
  let expectedFee3: BigNumber;
  let balance1: BigNumber;
  let balance2: BigNumber;
  let balance3: BigNumber;

  before(async function () {
    owner = (await ethers.getSigners())[0];
    feeAddress = (await ethers.getSigners())[9];
    newFeeAddress = (await ethers.getSigners())[10];
    user1 = (await ethers.getSigners())[1];
    user2 = (await ethers.getSigners())[2];

    const Token = await ethers.getContractFactory("MockERC20");
    token1 = await Token.deploy();
    token2 = await Token.deploy();
    token3 = await Token.deploy();

    await token1.deployed();
    await token2.deployed();
    await token3.deployed();

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(feeAddress.address);

    await vault.deployed();
  });

  it("Constants check", async function () {
    expect(await vault.FEE_1()).eq(1);
    expect(await vault.FEE_2()).eq(2);
    expect(await vault.FEE_3()).eq(3);
    expect(await vault.FEE_DENOMINATOR()).eq(100);
  });

  it("Deposit to contract", async function () {
    await expect(vault.deposit(token1.address, "0")).revertedWith(
      "Deposit should be more, than 0"
    );
    console.log("Fee 1%");
    deposit1 = utils.parseEther("50");
    expectedFee1 = deposit1.div("100");
    balance1 = deposit1.sub(expectedFee1);
    await token1.approve(vault.address, utils.parseEther("10000000"));
    await expect(vault.deposit(token1.address, deposit1))
      .to.emit(vault, "Deposit")
      .withArgs(token1.address, deposit1, owner.address, expectedFee1);
    expect(await vault.balanceOf(token1.address, owner.address)).eq(balance1);
    expect(await token1.balanceOf(feeAddress.address)).eq(deposit1.div("100"));
    console.log("Fee 2%");
    deposit2 = utils.parseEther("1000");
    expectedFee2 = deposit2.mul("2").div("100");
    balance2 = deposit2.sub(expectedFee2);
    await token2.approve(vault.address, utils.parseEther("10000000"));
    await expect(vault.deposit(token2.address, deposit2))
      .to.emit(vault, "Deposit")
      .withArgs(token2.address, deposit2, owner.address, expectedFee2);
    expect(await vault.balanceOf(token2.address, owner.address)).eq(balance2);
    expect(await token2.balanceOf(feeAddress.address)).eq(expectedFee2);
    console.log("Fee 3%");
    deposit3 = utils.parseEther("2000");
    expectedFee3 = deposit3.mul("3").div("100");
    balance3 = deposit3.sub(expectedFee3);
    await token3.approve(vault.address, utils.parseEther("10000000"));
    await expect(vault.deposit(token3.address, deposit3))
      .to.emit(vault, "Deposit")
      .withArgs(token3.address, deposit3, owner.address, expectedFee3);
    expect(await vault.balanceOf(token3.address, owner.address)).eq(balance3);
    expect(await token3.balanceOf(feeAddress.address)).eq(expectedFee3);
    expect(
      await vault.getBalance(owner.address, [
        token1.address,
        token2.address,
        token3.address,
      ])
    ).to.eql([balance1, balance2, balance3]);
  });

  it("Should withdraw tokens", async function () {
    const balanceToken1 = await token1.balanceOf(owner.address);
    await expect(
      vault.withdraw(token1.address, utils.parseUnits("1000000"))
    ).revertedWith("Low balance");
    await vault.withdraw(token1.address, balance1);
    expect(await token1.balanceOf(owner.address)).eq(
      balanceToken1.add(balance1)
    );
    expect(await vault.getBalance(owner.address, [token1.address])).eql([
      BigNumber.from(0),
    ]);
  });

  it("Low deposit", async function () {
    await token1.transfer(user1.address, utils.parseEther("1"));
    await token1.connect(user1).approve(vault.address, utils.parseEther("1"));
    await vault.connect(user1).deposit(token1.address, BigNumber.from(1));
    expect(await vault.balanceOf(token1.address, user1.address)).eq(1);
  });

  it("Should change fee address", async function () {
    expect(await vault.feeReceiver()).eq(feeAddress.address);
    await expect(vault.changeFeeReceiver(newFeeAddress.address))
      .to.emit(vault, "ChangeFeeReceiver")
      .withArgs(newFeeAddress.address);
    expect(await vault.feeReceiver()).eq(newFeeAddress.address);
  });
});
