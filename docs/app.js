// Bet type constants
const BET_TYPE_SINGLE_NUMBER = 0;    // Ставка на конкретное число (0-36)
const BET_TYPE_EVEN_ODD = 1;         // Ставка на четное/нечетное (0=четное, 1=нечетное)
const BET_TYPE_RED_BLACK = 2;        // Ставка на красное/черное (0=красное, 1=черное)
const BET_TYPE_2_TO_1 = 3;           // Ставка на колонку (0=первая, 1=вторая, 2=третья)
const BET_TYPE_THIRD = 4;            // Ставка на дюжину (0=первая, 1=вторая, 2=третья)
const BET_TYPE_HALF = 5;             // Ставка на половину (0=первая, 1=вторая)

let web3;
let contract;
let currentAccount;
let isOwner = false;
let currentBets = []; // Array to store current bets

// Function to load contract ABI
async function loadContractABI() {
    try {
        const response = await fetch('./Roulette.json');
        if (!response.ok) {
            throw new Error('Failed to load contract ABI');
        }
        const contractData = await response.json();
        return contractData.abi;
    } catch (error) {
        console.error('Error loading contract ABI:', error);
        showError('Error loading contract ABI: ' + error.message);
        throw error;
    }
}

// Function to call contract methods with logging
async function callContractMethod(methodName, params = [], isSend = false, sendParams = {}) {
    try {
        console.log(`Calling contract method: ${methodName}`);
        console.log(`Parameters:`, params);
        
        let result;
        if (isSend) {
            console.log(`Send parameters:`, sendParams);
            result = await contract.methods[methodName](...params).send({
                from: currentAccount,
                ...sendParams
            });
        } else {
            result = await contract.methods[methodName](...params).call({
                from: currentAccount
            });
        }
        
        console.log(`Method ${methodName} returned:`, result);
        return result;
    } catch (error) {
        console.error(`Error calling ${methodName}:`, error);
        
        // Try to extract error message from contract
        let errorMessage = error.message;
        
        // Log full error object for debugging
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // Check if error has data property
        if (error.data) {
            console.error('Error data:', error.data);
            
            // Try different ways to extract error message
            if (typeof error.data === 'string') {
                try {
                    const errorData = JSON.parse(error.data);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    console.error('Error parsing error data:', e);
                }
            } else if (error.data.message) {
                errorMessage = error.data.message;
            }
        }
        
        // Check if error has reason property (common in MetaMask errors)
        if (error.reason) {
            errorMessage = error.reason;
        }
        
        // If we still have the generic error message, try to make it more user-friendly
        if (errorMessage === 'Internal JSON-RPC error.') {
            errorMessage = 'Transaction failed. Please check your balance and try again.';
        }
        
        showError(errorMessage);
        throw error;
    }
}

// Function to determine current network
async function getCurrentNetwork() {
    if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // Determine network by chainId
        switch (chainId) {
            case CONFIG.chainIds.hardhat:
                return 'hardhat';
            case CONFIG.chainIds.mumbai:
                return 'mumbai';
            case CONFIG.chainIds.polygon:
                return 'polygon';
            default:
                return 'hardhat'; // Default to hardhat
        }
    }
    return 'hardhat';
}

// Function to switch network
async function switchNetwork(network) {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFIG.chainIds[network] }],
        });
    } catch (switchError) {
        // If network is not added to MetaMask, add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: CONFIG.chainIds[network],
                        chainName: CONFIG.chainNames[network],
                        rpcUrls: [CONFIG.rpcUrls[network]],
                        nativeCurrency: {
                            name: 'MATIC',
                            symbol: 'MATIC',
                            decimals: 18
                        }
                    }]
                });
            } catch (addError) {
                console.error('Error adding network:', addError);
            }
        } else {
            console.error('Error switching network:', switchError);
        }
    }
}

// Initialize application
async function init() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access permission
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create Web3 instance
            web3 = new Web3(window.ethereum);
            
            // Get current network
            const network = await getCurrentNetwork();
            
            // Get contract address for current network
            const contractAddress = CONFIG.contractAddresses[network];
            
            // Load contract ABI
            const contractABI = await loadContractABI();
            console.log(contractABI);
            
            // Create contract instance
            contract = new web3.eth.Contract(contractABI, contractAddress);
            
            // Get current account
            const accounts = await web3.eth.getAccounts();
            currentAccount = accounts[0];
            
            // Check if current account is contract owner
            const owner = await callContractMethod('owner');
            isOwner = currentAccount.toLowerCase() === owner.toLowerCase();
            
            // Update UI based on whether user is owner
            if (isOwner) {
                document.querySelector('.bank-controls').style.display = 'block';
            } else {
                document.querySelector('.bank-controls').style.display = 'none';
            }
            
            // Update bank state
            updateBankState();
            
            // Set up event handlers
            setupEventHandlers();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            showError('Error initializing app: ' + error.message);
        }
    } else {
        showError('Please install MetaMask to use this dApp');
    }
}

// Update bank state
async function updateBankState() {
    try {
        const gameState = await callContractMethod('getGameState');
        
        // Convert wei to gwei for display
        const bankBalanceGwei = web3.utils.fromWei(gameState.bankBalance, 'gwei');
        const totalPlayerBalancesGwei = web3.utils.fromWei(gameState.totalPlayerBalances, 'gwei');
        const maxBetGwei = web3.utils.fromWei(gameState.maxBet, 'gwei');
        const withdrawalFeeGwei = web3.utils.fromWei(gameState.withdrawalFee, 'gwei');
        const playerBalanceGwei = web3.utils.fromWei(gameState.playerBalance, 'gwei');
        
        // Update display
        document.getElementById('bank-balance').textContent = bankBalanceGwei;
        document.getElementById('total-player-balances').textContent = totalPlayerBalancesGwei;
        document.getElementById('max-bet').textContent = maxBetGwei;
        document.getElementById('withdrawal-fee').textContent = withdrawalFeeGwei;
        document.getElementById('player-balance').textContent = playerBalanceGwei;
        
    } catch (error) {
        showError('Error updating bank state: ' + error.message);
    }
}

// Function to add a bet
async function addBet(betType, number) {
    try {
        // Get current game state
        const gameState = await callContractMethod('getGameState');
        const playerBalance = BigInt(gameState.playerBalance);
        const maxBet = BigInt(gameState.maxBet);
        
        // Prompt for bet amount
        const amount = prompt('Enter bet amount (in Gwei):');
        if (amount < 1) return;
        
        // Convert amount to wei (1 Gwei = 10^9 wei)
        const weiAmount = BigInt(web3.utils.toWei(amount, 'gwei'));
        
        // Validate bet amount
        if (weiAmount <= 0) {
            showError('Bet amount must be greater than 0');
            return;
        }
        
        // Check if amount exceeds player balance
        if (weiAmount > playerBalance) {
            console.log(typeof weiAmount, typeof playerBalance);
            showError('Insufficient balance');
            return;
        }
        
        // Check if amount exceeds maximum bet
        if (weiAmount > maxBet) {
            showError('Bet amount exceeds maximum bet');
            return;
        }
        
        // Validate bet type and number
        if (betType === 0) { // BET_TYPE_SINGLE_NUMBER
            if (number > 36) {
                showError('Number must be between 0 and 36');
                return;
            }
        } else if (betType === 1) { // BET_TYPE_EVEN_ODD
            if (number > 1) {
                showError('Number must be 0 (even) or 1 (odd)');
                return;
            }
        } else if (betType === 2) { // BET_TYPE_RED_BLACK
            if (number > 1) {
                showError('Number must be 0 (red) or 1 (black)');
                return;
            }
        } else if (betType === 3) { // BET_TYPE_2_TO_1
            if (number > 2) {
                showError('Number must be 0 (first), 1 (second), or 2 (third)');
                return;
            }
        } else if (betType === 4) { // BET_TYPE_THIRD
            if (number > 2) {
                showError('Number must be 0 (first), 1 (second), or 2 (third)');
                return;
            }
        } else if (betType === 5) { // BET_TYPE_HALF
            if (number > 1) {
                showError('Number must be 0 (first) or 1 (second)');
                return;
            }
        } else {
            showError('Invalid bet type');
            return;
        }
        
        // Create bet object
        const bet = {
            betType: betType,
            number: number,
            amount: weiAmount,
            displayType: betType,
            displayNumber: number,
            displayAmount: amount,
            outcome: 'pending'
        };
        
        // Add bet to array
        currentBets.push(bet);
        
        // Update bets display
        updateBetsDisplay();
        
        // Enable Roll button if there are bets
        if (currentBets.length > 0) {
            document.getElementById('roll-btn').disabled = false;
        }
        
    } catch (error) {
        showError('Error adding bet: ' + error.message);
    }
}

// Function to update bets display
function updateBetsDisplay() {
    const betsContainer = document.getElementById('bets-container');
    betsContainer.innerHTML = '';
    
    if (currentBets.length === 0) {
        betsContainer.innerHTML = '<p class="no-bets">No bets placed yet</p>';
        return;
    }
    
    // Add each bet to container
    currentBets.forEach((bet, index) => {
        const betItem = document.createElement('div');
        betItem.className = 'bet-item';
        
        // Determine bet type name
        let betTypeName = '';
        switch (bet.betType) {
            case 0: betTypeName = 'Single Number'; break;
            case 1: betTypeName = 'Even/Odd'; break;
            case 2: betTypeName = 'Red/Black'; break;
            case 3: betTypeName = 'Column'; break;
            case 4: betTypeName = 'Dozen'; break;
            case 5: betTypeName = 'Half'; break;
        }
        
        // Determine bet number name
        let betNumberName = '';
        if (bet.betType === 0) {
            betNumberName = bet.number.toString();
        } else if (bet.betType === 1) {
            betNumberName = bet.number === 0 ? 'Even' : 'Odd';
        } else if (bet.betType === 2) {
            betNumberName = bet.number === 0 ? 'Red' : 'Black';
        } else if (bet.betType === 3) {
            betNumberName = bet.number === 0 ? 'First' : (bet.number === 1 ? 'Second' : 'Third');
        } else if (bet.betType === 4) {
            betNumberName = bet.number === 0 ? 'First' : (bet.number === 1 ? 'Second' : 'Third');
        } else if (bet.betType === 5) {
            betNumberName = bet.number === 0 ? 'First' : 'Second';
        }
        
        betItem.innerHTML = `
            <div class="bet-info">
                <span class="bet-type">${betTypeName}</span>
                <span class="bet-number">${betNumberName}</span>
                <span class="bet-amount">${bet.displayAmount} Gwei</span>
            </div>
            <div class="bet-outcome ${bet.outcome}">
                ${bet.outcome === 'pending' ? 'Pending' : (bet.outcome === 'won' ? 'Won' : 'Lost')}
            </div>
        `;
        
        betsContainer.appendChild(betItem);
    });
}

// Function to send all bets
async function rollAllBets() {
    try {
        if (currentBets.length === 0) {
            showError('No bets to roll');
            return;
        }
        
        // Get current game state
        const gameState = await callContractMethod('getGameState');
        const playerBalance = gameState.playerBalance;
        
        // Calculate total bet amount
        const totalBetAmount = currentBets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));
        
        // Check if total bet amount exceeds player balance
        if (totalBetAmount > BigInt(playerBalance)) {
            showError('Total bet amount exceeds your balance');
            return;
        }
        
        // Prepare bets array for sending to contract
        const betsToSend = currentBets.map(bet => ({
            betType: bet.betType,
            number: bet.number,
            amount: bet.amount
        }));
        
        // Send transaction and get roll result with increased gas limit
        const tx = await callContractMethod('roll', [betsToSend], true, { 
            gas: 500000,
        });
        
        // Get result from Roll event
        const rollEvent = tx.events.Roll;
        if (!rollEvent) {
            throw new Error('Roll event not found in transaction');
        }
        
        const result = rollEvent.returnValues.result;
        const randomNumber = result.randomNumber;
        const betResults = result.betResults;
        
        // Update state
        updateBankState();
        
        // Process bet results
        let totalWinAmount = 0;
        
        for (let i = 0; i < currentBets.length; i++) {
            const bet = currentBets[i];
            const winAmount = betResults[i];
            
            // Update bet outcome
            if (winAmount > 0) {
                currentBets[i].outcome = 'won';
                totalWinAmount += parseFloat(web3.utils.fromWei(winAmount.toString(), 'gwei'));
            } else {
                currentBets[i].outcome = 'lost';
            }
        }
        
        // Update bets display
        updateBetsDisplay();
        
        // Update last bet information
        document.getElementById('last-result').textContent = randomNumber;
        
        // Calculate total bet amount
        const totalBetAmountGwei = currentBets.reduce((sum, bet) => sum + parseFloat(bet.displayAmount), 0);
        document.getElementById('total-bet-amount').textContent = totalBetAmountGwei.toFixed(4);
        document.getElementById('total-win-amount').textContent = totalWinAmount.toFixed(4);
        
    } catch (error) {
        showError('Error rolling bets: ' + error.message);
    }
}

// Function to clear bets
function clearBets() {
    currentBets = [];
    updateBetsDisplay();
    document.getElementById('roll-btn').disabled = true;
    document.getElementById('last-result').textContent = '-';
    document.getElementById('total-bet-amount').textContent = '0';
    document.getElementById('total-win-amount').textContent = '0';
}

// Function to setup event handlers
function setupEventHandlers() {
    // Bank controls
    document.getElementById('deposit-to-bank-btn').addEventListener('click', () => {
        const amount = prompt('Enter amount to deposit (in Gwei):');
        if (amount) {
            depositToBank(web3.utils.toWei(amount, 'gwei'));
        }
    });

    document.getElementById('withdraw-from-bank-btn').addEventListener('click', () => {
        const amount = prompt('Enter amount to withdraw (in Gwei):');
        if (amount) {
            withdrawFromBank(web3.utils.toWei(amount, 'gwei'));
        }
    });

    document.getElementById('set-max-bet-btn').addEventListener('click', () => {
        const amount = prompt('Enter new maximum bet (in Gwei):');
        if (amount) {
            setMaxBet(web3.utils.toWei(amount, 'gwei'));
        }
    });

    document.getElementById('set-withdrawal-fee-btn').addEventListener('click', () => {
        const amount = prompt('Enter new withdrawal fee (in Gwei):');
        if (amount) {
            setWithdrawalFee(web3.utils.toWei(amount, 'gwei'));
        }
    });

    // Account controls
    document.getElementById('deposit-to-account-btn').addEventListener('click', () => {
        const amount = prompt('Enter amount to deposit (in Gwei):');
        if (amount) {
            deposit(web3.utils.toWei(amount, 'gwei'));
        }
    });

    document.getElementById('withdraw-from-account-btn').addEventListener('click', () => {
        const amount = prompt('Enter amount to withdraw (in Gwei):');
        if (amount) {
            withdraw(web3.utils.toWei(amount, 'gwei'));
        }
    });

    // Create number buttons
    const numbersGrid = document.querySelector('.numbers-grid');
    for (let i = 1; i <= 36; i++) {
        const button = document.createElement('button');
        button.id = `bet-number-${i}-btn`;
        button.className = 'bet-btn number';
        button.setAttribute('data-number', i);
        button.textContent = i;
        button.addEventListener('click', () => addBet(BET_TYPE_SINGLE_NUMBER, i));
        numbersGrid.appendChild(button);
    }

    // Zero bet
    const zeroButton = document.getElementById('bet-zero-btn');
    zeroButton.setAttribute('data-number', '0');
    zeroButton.addEventListener('click', () => addBet(BET_TYPE_SINGLE_NUMBER, 0));

    // Red/Black bets
    document.getElementById('bet-red-btn').addEventListener('click', () => addBet(BET_TYPE_RED_BLACK, 0));
    document.getElementById('bet-black-btn').addEventListener('click', () => addBet(BET_TYPE_RED_BLACK, 1));

    // Even/Odd bets
    document.getElementById('bet-even-btn').addEventListener('click', () => addBet(BET_TYPE_EVEN_ODD, 0));
    document.getElementById('bet-odd-btn').addEventListener('click', () => addBet(BET_TYPE_EVEN_ODD, 1));

    // 2 to 1 bets
    document.getElementById('bet-2to1-0-btn').addEventListener('click', () => addBet(BET_TYPE_2_TO_1, 0));
    document.getElementById('bet-2to1-1-btn').addEventListener('click', () => addBet(BET_TYPE_2_TO_1, 1));
    document.getElementById('bet-2to1-2-btn').addEventListener('click', () => addBet(BET_TYPE_2_TO_1, 2));

    // Dozens bets
    document.getElementById('bet-dozen-0-btn').addEventListener('click', () => addBet(BET_TYPE_THIRD, 0));
    document.getElementById('bet-dozen-1-btn').addEventListener('click', () => addBet(BET_TYPE_THIRD, 1));
    document.getElementById('bet-dozen-2-btn').addEventListener('click', () => addBet(BET_TYPE_THIRD, 2));

    // Halves bets
    document.getElementById('bet-half-0-btn').addEventListener('click', () => addBet(BET_TYPE_HALF, 0));
    document.getElementById('bet-half-1-btn').addEventListener('click', () => addBet(BET_TYPE_HALF, 1));

    // Roll button
    document.getElementById('roll-btn').addEventListener('click', rollAllBets);

    // Error message close button
    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('error-message').style.display = 'none';
    });
}

// Function to show error message
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = errorMessage.querySelector('.error-text');
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    
    // Hide error message after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    init();
}); 