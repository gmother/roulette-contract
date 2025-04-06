const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Roulette", function () {
  let roulette;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get test accounts
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    const Roulette = await ethers.getContractFactory("Roulette");
    roulette = await Roulette.deploy();
    await roulette.waitForDeployment();
  });

  describe("Player Account Functions", function () {
    describe("deposit", function () {
      it("Should allow player to deposit funds to their account", async function () {
        const depositAmount = ethers.parseEther("1.0");
        const initialBalance = await roulette.playerBalances(addr1.address);
        
        // Deposit funds to player account
        await expect(roulette.connect(addr1).deposit({ value: depositAmount }))
          .to.emit(roulette, "PlayerDeposit")
          .withArgs(addr1.address, depositAmount);

        // Check if player balance was updated
        const finalBalance = await roulette.playerBalances(addr1.address);
        expect(finalBalance).to.equal(initialBalance + depositAmount);

        // Check if total player balances was updated
        const totalBalances = await roulette.totalPlayerBalances();
        expect(totalBalances).to.equal(depositAmount);
      });

      it("Should not allow zero amount deposit", async function () {
        await expect(
          roulette.connect(addr1).deposit({ value: 0 })
        ).to.be.revertedWith("Amount must be greater than 0");
      });

      it("Should update total player balances correctly for multiple deposits", async function () {
        const depositAmount1 = ethers.parseEther("1.0");
        const depositAmount2 = ethers.parseEther("2.0");
        
        // First deposit
        await roulette.connect(addr1).deposit({ value: depositAmount1 });
        // Second deposit
        await roulette.connect(addr2).deposit({ value: depositAmount2 });

        // Check total balances
        const totalBalances = await roulette.totalPlayerBalances();
        expect(totalBalances).to.equal(depositAmount1 + depositAmount2);
      });
    });

    describe("withdraw", function () {
      beforeEach(async function () {
        // Deposit initial funds to player account for tests
        const initialDeposit = ethers.parseEther("2.0");
        await roulette.connect(addr1).deposit({ value: initialDeposit });
      });

      it("Should allow player to withdraw funds from their account", async function () {
        const withdrawAmount = ethers.parseEther("1.0");
        const withdrawalFee = await roulette.withdrawalFee();
        const initialBalance = await roulette.playerBalances(addr1.address);
        const initialTotalBalances = await roulette.totalPlayerBalances();
        const initialAddr1Balance = await ethers.provider.getBalance(addr1.address);
        
        // Withdraw funds from player account
        const tx = await roulette.connect(addr1).withdraw(withdrawAmount);
        const receipt = await tx.wait();
        
        // Account for gas in calculations
        const gasUsed = receipt.gasUsed * receipt.gasPrice;
        
        // Check if player balance was updated
        const finalBalance = await roulette.playerBalances(addr1.address);
        expect(finalBalance).to.equal(initialBalance - withdrawAmount);

        // Check if total player balances was updated
        const finalTotalBalances = await roulette.totalPlayerBalances();
        expect(finalTotalBalances).to.equal(initialTotalBalances - withdrawAmount);

        // Check if player received funds (minus fee and gas)
        const finalAddr1Balance = await ethers.provider.getBalance(addr1.address);
        expect(finalAddr1Balance).to.equal(
          initialAddr1Balance + withdrawAmount - withdrawalFee - gasUsed
        );
        
        // Check event
        await expect(tx)
          .to.emit(roulette, "PlayerWithdrawal")
          .withArgs(addr1.address, withdrawAmount);
      });

      it("Should not allow withdrawal of more than player balance", async function () {
        const playerBalance = await roulette.playerBalances(addr1.address);
        const tooMuch = playerBalance + ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).withdraw(tooMuch)
        ).to.be.revertedWith("Insufficient player balance");
      });

      it("Should not allow withdrawal less than withdrawal fee", async function () {
        const withdrawalFee = await roulette.withdrawalFee();
        const tooLittle = withdrawalFee - 1n;
        
        await expect(
          roulette.connect(addr1).withdraw(tooLittle)
        ).to.be.revertedWith("Amount must be greater than withdrawal fee");
      });

      it("Should not allow withdrawal of zero amount", async function () {
        await expect(
          roulette.connect(addr1).withdraw(0)
        ).to.be.revertedWith("Amount must be greater than withdrawal fee");
      });

      it("Should not allow other players to withdraw from someone's account", async function () {
        const withdrawAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr2).withdraw(withdrawAmount)
        ).to.be.revertedWith("Insufficient player balance");
      });
    });
  });
}); 