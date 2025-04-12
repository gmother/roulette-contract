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

    // Fund the bank for testing
    const bankDeposit = ethers.parseEther("100.0");
    await roulette.connect(owner).depositToBank({ value: bankDeposit });
    const maxBet = ethers.parseEther("1.0");
    await roulette.connect(owner).setMaxBet(maxBet);
  });

  describe("Roll Function", function () {
    beforeEach(async function () { 
      // Deposit initial funds to player account for tests
      const initialDeposit = ethers.parseEther("5.0");
      await roulette.connect(addr1).deposit({ value: initialDeposit });
    });

    describe("Single Number Bet", function () {
      it("Should allow placing a single number bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        const betNumber = 7;
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 0, // BET_TYPE_SINGLE_NUMBER
            number: betNumber,
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should not allow single number bet with invalid number", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 0,
            number: 37, // Invalid number > 36
            amount: betAmount
          }])
        ).to.be.revertedWith("Number must be between 0 and 36");
      });
    });

    describe("Even/Odd Bet", function () {
      it("Should allow placing an even bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 1, // BET_TYPE_EVEN_ODD
            number: 0, // 0 for even
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should allow placing an odd bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 1,
            number: 1, // 1 for odd
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should not allow even/odd bet with invalid number", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 1,
            number: 2, // Invalid number > 1
            amount: betAmount
          }])
        ).to.be.revertedWith("Number must be 0 (even) or 1 (odd)");
      });
    });

    describe("Red/Black Bet", function () {
      it("Should allow placing a red bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 2, // BET_TYPE_RED_BLACK
            number: 0, // 0 for red
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should allow placing a black bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 2,
            number: 1, // 1 for black
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should not allow red/black bet with invalid number", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 2,
            number: 2, // Invalid number > 1
            amount: betAmount
          }])
        ).to.be.revertedWith("Number must be 0 (red) or 1 (black)");
      });
    });

    describe("Column Bet (2 to 1)", function () {
      it("Should allow placing a column bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 3, // BET_TYPE_2_TO_1
            number: 0, // First column
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should not allow column bet with invalid number", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 3,
            number: 3, // Invalid number > 2
            amount: betAmount
          }])
        ).to.be.revertedWith("Number must be 0 (first), 1 (second), or 2 (third)");
      });
    });

    describe("Dozen Bet", function () {
      it("Should allow placing a dozen bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 4, // BET_TYPE_THIRD
            number: 0, // First dozen (1-12)
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should not allow dozen bet with invalid number", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 4,
            number: 3, // Invalid number > 2
            amount: betAmount
          }])
        ).to.be.revertedWith("Number must be 0 (first), 1 (second), or 2 (third)");
      });
    });

    describe("Half Bet", function () {
      it("Should allow placing a half bet", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 5, // BET_TYPE_HALF
            number: 0, // First half (1-18)
            amount: betAmount
          }])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 1;
          });
      });

      it("Should not allow half bet with invalid number", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 5,
            number: 2, // Invalid number > 1
            amount: betAmount
          }])
        ).to.be.revertedWith("Number must be 0 (first) or 1 (second)");
      });
    });

    describe("Multiple Bets", function () {
      it("Should allow placing multiple bets in one roll", async function () {
        const betAmount = ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([
            {
              betType: 0,
              number: 7,
              amount: betAmount
            },
            {
              betType: 1,
              number: 0,
              amount: betAmount
            }
          ])
        ).to.emit(roulette, "Roll")
          .withArgs(addr1.address, (result) => {
            return result.randomNumber >= 0 && 
                   result.randomNumber <= 36 &&
                   Array.isArray(result.betResults) &&
                   result.betResults.length === 2;
          });
      });

      it("Should not allow empty bet array", async function () {
        await expect(
          roulette.connect(addr1).roll([])
        ).to.be.revertedWith("No bets provided");
      });
    });

    describe("Bet Amount Validation", function () {
      it("Should not allow bet amount greater than player balance", async function () {
        const playerBalance = await roulette.playerBalances(addr1.address);
        const tooMuch = playerBalance + ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 0,
            number: 7,
            amount: tooMuch
          }])
        ).to.be.revertedWith("Insufficient player balance");
      });

      it("Should not allow bet amount greater than max bet", async function () {
        const maxBet = await roulette.maxBet();
        const tooMuch = maxBet + ethers.parseEther("1.0");
        
        await expect(
          roulette.connect(addr1).roll([{
            betType: 0,
            number: 7,
            amount: tooMuch
          }])
        ).to.be.revertedWith("Amount exceeds maximum bet");
      });

      it("Should not allow zero amount bet", async function () {
        await expect(
          roulette.connect(addr1).roll([{
            betType: 0,
            number: 7,
            amount: 0
          }])
        ).to.be.revertedWith("Amount must be greater than 0");
      });
    });

    describe("Win/Loss Processing", function () {
      it("Should emit Roll event", async function () {
        // Note: This test might fail due to randomness
        // In a real scenario, you might want to mock the random number generation
        const betAmount = ethers.parseEther("1.0");
        
        const tx = await roulette.connect(addr1).roll([{
          betType: 0,
          number: 0,
          amount: betAmount
        }]);

        // Check if either BetWon or BetLost was emitted
        const receipt = await tx.wait();
        const events = receipt.logs.filter(log => 
          log.fragment && log.fragment.name === "Roll"
        );
        expect(events.length).to.be.greaterThan(0);
      });

      it("Should update player balance correctly after win/loss", async function () {
        const betAmount = ethers.parseEther("1.0");
        const initialBalance = await roulette.playerBalances(addr1.address);
        
        await roulette.connect(addr1).roll([{
          betType: 0,
          number: 0,
          amount: betAmount
        }]);

        const finalBalance = await roulette.playerBalances(addr1.address);
        // Balance should be different from initial (either increased by win or decreased by loss)
        expect(finalBalance).to.not.equal(initialBalance);
      });
    });
  });
}); 