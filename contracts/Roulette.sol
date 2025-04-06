// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Roulette is Ownable {
    // Bet type constants
    uint8 constant BET_TYPE_SINGLE_NUMBER = 0;    // Bet on a single number (0-36)
    uint8 constant BET_TYPE_EVEN_ODD = 1;         // Bet on even/odd (0=even, 1=odd)
    uint8 constant BET_TYPE_RED_BLACK = 2;        // Bet on red/black (0=red, 1=black)
    uint8 constant BET_TYPE_2_TO_1 = 3;           // Bet on column (0=first, 1=second, 2=third)
    uint8 constant BET_TYPE_THIRD = 4;            // Bet on dozen (0=first, 1=second, 2=third)
    uint8 constant BET_TYPE_HALF = 5;             // Bet on half (0=first, 1=second)

    // Player balances
    mapping(address => uint256) public playerBalances;

    // Total amount of funds on all player accounts
    uint256 public totalPlayerBalances;
    // Withdrawal fee in wei
    uint256 public withdrawalFee;
    // Maximum bet size
    uint256 public maxBet;

    // Structure to hold all game state data
    struct GameState {
        uint256 bankBalance;
        uint256 totalPlayerBalances;
        uint256 maxBet;
        uint256 withdrawalFee;
        uint256 playerBalance;
    }

    // Structure to hold bet data
    struct Bet {
        uint8 betType;
        uint8 number;
        uint256 amount;
    }

    event BankDeposit(address indexed from, uint256 amount);
    event BankWithdrawal(address indexed to, uint256 amount);
    event PlayerDeposit(address indexed player, uint256 amount);
    event PlayerWithdrawal(address indexed player, uint256 amount);
    event WithdrawalFeeUpdated(uint256 oldFee, uint256 newFee);
    event MaxBetUpdated(uint256 oldMaxBet, uint256 newMaxBet);
    event BetPlaced(address indexed player, uint8 betType, uint8 number, uint256 amount);
    event BetWon(address indexed player, uint256 amount);
    event BetLost(address indexed player, uint256 amount);

    constructor() Ownable(msg.sender) {
        withdrawalFee = 100000 gwei;
        maxBet = 1000000 gwei;
    }

    // Function to deposit funds to the bank
    function depositToBank() external payable onlyOwner {
        emit BankDeposit(msg.sender, msg.value);
    }

    // Function to withdraw funds from the bank
    function withdrawFromBank(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount + totalPlayerBalances, "Cannot withdraw more than available funds");
        
        (bool success, ) = owner().call{value: amount, gas: 23000}("");
        require(success, "Transfer failed");
        
        emit BankWithdrawal(owner(), amount);
    }

    // Function to deposit funds to player's balance
    function deposit() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        playerBalances[msg.sender] += msg.value;
        totalPlayerBalances += msg.value;
        emit PlayerDeposit(msg.sender, msg.value);
    }

    // Function to withdraw funds from player's balance
    function withdraw(uint256 amount) external {
        require(amount > withdrawalFee, "Amount must be greater than withdrawal fee");
        require(amount <= playerBalances[msg.sender], "Insufficient player balance");
        
        uint256 realAmount = amount - withdrawalFee;
        
        playerBalances[msg.sender] -= amount;
        totalPlayerBalances -= amount;
        (bool success, ) = msg.sender.call{value: realAmount, gas: 23000}("");
        require(success, "Transfer failed");
        
        emit PlayerWithdrawal(msg.sender, amount);
    }

    // Function to update withdrawal fee
    function setWithdrawalFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "Fee must be greater than 0");
        uint256 oldFee = withdrawalFee;
        withdrawalFee = newFee;
        emit WithdrawalFeeUpdated(oldFee, newFee);
    }

    // Function to update maximum bet size
    function setMaxBet(uint256 newMaxBet) external onlyOwner {
        require(newMaxBet > 0, "Max bet must be greater than 0");
        uint256 oldMaxBet = maxBet;
        maxBet = newMaxBet;
        emit MaxBetUpdated(oldMaxBet, newMaxBet);
    }

    // Function to get all game state data
    function getGameState() external view returns (GameState memory) {
        return GameState({
            bankBalance: address(this).balance,
            totalPlayerBalances: totalPlayerBalances,
            maxBet: maxBet,
            withdrawalFee: withdrawalFee,
            playerBalance: playerBalances[msg.sender]
        });
    }

    // Function to place multiple bets
    function roll(Bet[] calldata bets) external {
        require(bets.length > 0, "No bets provided");
        
        // Calculate total bet amount
        uint256 totalBetAmount = 0;
        for (uint256 i = 0; i < bets.length; i++) {
            totalBetAmount += bets[i].amount;
        }
        
        // Check if player has enough balance
        require(totalBetAmount <= playerBalances[msg.sender], "Insufficient player balance");
        
        // Generate random number once for all bets
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender
        ))) % 37;

        // Process each bet
        for (uint256 i = 0; i < bets.length; i++) {
            Bet memory currentBet = bets[i];
            
            // Validate bet
            require(currentBet.amount > 0, "Amount must be greater than 0");
            require(currentBet.amount <= maxBet, "Amount exceeds maximum bet");
            
            // Validate bet type and number
            if (currentBet.betType == BET_TYPE_SINGLE_NUMBER) {
                require(currentBet.number <= 36, "Number must be between 0 and 36");
            } else if (currentBet.betType == BET_TYPE_EVEN_ODD) {
                require(currentBet.number <= 1, "Number must be 0 (even) or 1 (odd)");
            } else if (currentBet.betType == BET_TYPE_RED_BLACK) {
                require(currentBet.number <= 1, "Number must be 0 (red) or 1 (black)");
            } else if (currentBet.betType == BET_TYPE_2_TO_1) {
                require(currentBet.number <= 2, "Number must be 0 (first), 1 (second), or 2 (third)");
            } else if (currentBet.betType == BET_TYPE_THIRD) {
                require(currentBet.number <= 2, "Number must be 0 (first), 1 (second), or 2 (third)");
            } else if (currentBet.betType == BET_TYPE_HALF) {
                require(currentBet.number <= 1, "Number must be 0 (first) or 1 (second)");
            } else {
                revert("Invalid bet type");
            }

            // Check if bet won
            bool won = false;
            if (currentBet.betType == BET_TYPE_SINGLE_NUMBER) {
                won = uint8(randomNumber) == currentBet.number;
            } else if (currentBet.betType == BET_TYPE_EVEN_ODD) {
                won = (randomNumber % 2) == currentBet.number;
            } else if (currentBet.betType == BET_TYPE_RED_BLACK) {
                bool odd = randomNumber % 2 == 1;
                bool oddZone = randomNumber < 11 || randomNumber > 18 && randomNumber < 29;
                won = randomNumber > 0 && ((odd == oddZone) == (currentBet.number == 0));
            } else if (currentBet.betType == BET_TYPE_2_TO_1) {
                won = (randomNumber % 3) == currentBet.number;
            } else if (currentBet.betType == BET_TYPE_THIRD) {
                won = uint8(randomNumber) > currentBet.number * 12 &&
                      uint8(randomNumber) <= (currentBet.number + 1) * 12;

            } else if (currentBet.betType == BET_TYPE_HALF) {
                uint8 number = uint8(randomNumber);
                if (currentBet.number == 0) {
                    won = number >= 1 && number <= 18;
                } else {
                    won = number >= 19 && number <= 36;
                }
            }

            // Process bet result
            if (won) {
                uint256 winAmount;
                if (currentBet.betType == BET_TYPE_SINGLE_NUMBER) {
                    winAmount = currentBet.amount * 36;
                } else if (currentBet.betType == BET_TYPE_EVEN_ODD || 
                          currentBet.betType == BET_TYPE_RED_BLACK || 
                          currentBet.betType == BET_TYPE_HALF) {
                    winAmount = currentBet.amount * 2;
                } else if (currentBet.betType == BET_TYPE_2_TO_1 || 
                          currentBet.betType == BET_TYPE_THIRD) {
                    winAmount = currentBet.amount * 3;
                }
                playerBalances[msg.sender] += winAmount;
                totalPlayerBalances += winAmount;
                emit BetWon(msg.sender, winAmount);
            } else {
                playerBalances[msg.sender] -= currentBet.amount;
                totalPlayerBalances -= currentBet.amount;
                emit BetLost(msg.sender, currentBet.amount);
            }

            emit BetPlaced(msg.sender, currentBet.betType, currentBet.number, currentBet.amount);
        }
    }
}