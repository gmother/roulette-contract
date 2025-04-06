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

  describe("Bank Functions", function () {
    describe("depositToBank", function () {
      it("Should allow owner to deposit funds to bank", async function () {
        const depositAmount = ethers.parseEther("1.0");
        
        // Deposit funds to bank
        await expect(roulette.connect(owner).depositToBank({ value: depositAmount }))
          .to.emit(roulette, "BankDeposit")
          .withArgs(owner.address, depositAmount);

        // Check contract balance
        const contractBalance = await ethers.provider.getBalance(await roulette.getAddress());
        expect(contractBalance).to.equal(depositAmount);
      });

      it("Should not allow non-owner to deposit funds to bank", async function () {
        const depositAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).depositToBank({ value: depositAmount })
        ).to.be.revertedWithCustomError(roulette, "OwnableUnauthorizedAccount");
      });
    });

    describe("withdrawFromBank", function () {
      beforeEach(async function () {
        // Deposit initial funds to bank for tests
        const initialDeposit = ethers.parseEther("2.0");
        await roulette.connect(owner).depositToBank({ value: initialDeposit });
      });

      it("Should allow owner to withdraw funds from bank", async function () {
        const withdrawAmount = ethers.parseEther("1.0");
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
        
        // Withdraw funds from bank
        const tx = await roulette.connect(owner).withdrawFromBank(withdrawAmount);
        const receipt = await tx.wait();
        
        // Account for gas in calculations
        const gasUsed = receipt.gasUsed * receipt.gasPrice;
        
        // Check if funds were withdrawn
        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance).to.equal(initialOwnerBalance + withdrawAmount - gasUsed);
        
        // Check event
        await expect(tx)
          .to.emit(roulette, "BankWithdrawal")
          .withArgs(owner.address, withdrawAmount);
      });

      it("Should not allow non-owner to withdraw funds from bank", async function () {
        const withdrawAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).withdrawFromBank(withdrawAmount)
        ).to.be.revertedWithCustomError(roulette, "OwnableUnauthorizedAccount");
      });

      it("Should not allow zero amount withdrawal", async function () {
        await expect(
          roulette.connect(owner).withdrawFromBank(0)
        ).to.be.revertedWith("Amount must be greater than 0");
      });

      it("Should not allow withdrawal of more than available in bank", async function () {
        const totalBalance = await ethers.provider.getBalance(await roulette.getAddress());
        const tooMuch = totalBalance + ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(owner).withdrawFromBank(tooMuch)
        ).to.be.revertedWith("Cannot withdraw more than available funds");
      });
    });

    describe("setMaxBet", function () {
      it("Should allow owner to set max bet", async function () {
        const newMaxBet = ethers.parseEther("2.0");
        const oldMaxBet = await roulette.maxBet();
        
        // Set new max bet
        await expect(roulette.connect(owner).setMaxBet(newMaxBet))
          .to.emit(roulette, "MaxBetUpdated")
          .withArgs(oldMaxBet, newMaxBet);

        // Check if max bet was updated
        const updatedMaxBet = await roulette.maxBet();
        expect(updatedMaxBet).to.equal(newMaxBet);
      });

      it("Should not allow non-owner to set max bet", async function () {
        const newMaxBet = ethers.parseEther("2.0");
        
        await expect(
          roulette.connect(addr1).setMaxBet(newMaxBet)
        ).to.be.revertedWithCustomError(roulette, "OwnableUnauthorizedAccount");
      });

      it("Should not allow setting zero max bet", async function () {
        await expect(
          roulette.connect(owner).setMaxBet(0)
        ).to.be.revertedWith("Max bet must be greater than 0");
      });
    });

    describe("setWithdrawalFee", function () {
      it("Should allow owner to set withdrawal fee", async function () {
        const newFee = ethers.parseEther("0.1");
        const oldFee = await roulette.withdrawalFee();
        
        // Set new withdrawal fee
        await expect(roulette.connect(owner).setWithdrawalFee(newFee))
          .to.emit(roulette, "WithdrawalFeeUpdated")
          .withArgs(oldFee, newFee);

        // Check if withdrawal fee was updated
        const updatedFee = await roulette.withdrawalFee();
        expect(updatedFee).to.equal(newFee);
      });

      it("Should not allow non-owner to set withdrawal fee", async function () {
        const newFee = ethers.parseEther("0.1");
        
        await expect(
          roulette.connect(addr1).setWithdrawalFee(newFee)
        ).to.be.revertedWithCustomError(roulette, "OwnableUnauthorizedAccount");
      });

      it("Should not allow setting zero withdrawal fee", async function () {
        await expect(
          roulette.connect(owner).setWithdrawalFee(0)
        ).to.be.revertedWith("Fee must be greater than 0");
      });
    });
  });
}); 