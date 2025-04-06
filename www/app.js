const contractAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';

let web3;
let contract;
let userAccount;

// Initialize Web3 and contract
async function init() {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
        showError('Please install MetaMask to use this application');
        return;
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Initialize Web3 with local network
        web3 = new Web3('http://127.0.0.1:8545');
        
        // Get user account
        const accounts = await web3.eth.getAccounts();
        userAccount = accounts[0];
        
        // Initialize contract
        contract = new web3.eth.Contract(contractABI, contractAddress);
        
        // Check if user is owner
        const owner = await contract.methods.owner().call();
        if (owner.toLowerCase() === userAccount.toLowerCase()) {
            $('#bank-controls').removeClass('hidden');
        }
        
        // Update bank state
        updateBankState();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        showError('Error initializing application: ' + error.message);
    }
}

// Update bank state
async function updateBankState() {
    try {
        const gameState = await contract.methods.getGameState().call({ from: userAccount });
        
        $('#bank-balance').text(web3.utils.fromWei(gameState.bankBalance, 'ether'));
        $('#total-player-balances').text(web3.utils.fromWei(gameState.totalPlayerBalances, 'ether'));
        $('#max-bet').text(web3.utils.fromWei(gameState.maxBet, 'ether'));
        $('#withdrawal-fee').text(web3.utils.fromWei(gameState.withdrawalFee, 'ether'));
        $('#player-balance').text(web3.utils.fromWei(gameState.playerBalance, 'ether'));
    } catch (error) {
        showError('Error updating bank state: ' + error.message);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Bank management buttons
    $('#deposit-bank-btn').click(async () => {
        const amount = prompt('Enter amount to deposit (in ETH):');
        if (amount) {
            try {
                const weiAmount = web3.utils.toWei(amount, 'ether');
                await contract.methods.depositToBank(weiAmount).send({
                    from: userAccount,
                    value: weiAmount
                });
                updateBankState();
            } catch (error) {
                showError('Error depositing to bank: ' + error.message);
            }
        }
    });

    $('#withdraw-bank-btn').click(async () => {
        const amount = prompt('Enter amount to withdraw (in ETH):');
        if (amount) {
            try {
                const weiAmount = web3.utils.toWei(amount, 'ether');
                await contract.methods.withdrawFromBank(weiAmount).send({
                    from: userAccount
                });
                updateBankState();
            } catch (error) {
                showError('Error withdrawing from bank: ' + error.message);
            }
        }
    });

    $('#set-max-bet-btn').click(async () => {
        const amount = prompt('Enter new maximum bet amount (in ETH):');
        if (amount) {
            try {
                const weiAmount = web3.utils.toWei(amount, 'ether');
                await contract.methods.setMaxBet(weiAmount).send({
                    from: userAccount
                });
                updateBankState();
            } catch (error) {
                showError('Error setting maximum bet: ' + error.message);
            }
        }
    });

    $('#set-withdrawal-fee-btn').click(async () => {
        const amount = prompt('Enter new withdrawal fee (in ETH):');
        if (amount) {
            try {
                const weiAmount = web3.utils.toWei(amount, 'ether');
                await contract.methods.setWithdrawalFee(weiAmount).send({
                    from: userAccount
                });
                updateBankState();
            } catch (error) {
                showError('Error setting withdrawal fee: ' + error.message);
            }
        }
    });

    // Player account buttons
    $('#deposit-player-btn').click(async () => {
        const amount = prompt('Enter amount to deposit to your account (in ETH):');
        if (amount) {
            try {
                const weiAmount = web3.utils.toWei(amount, 'ether');
                await contract.methods.deposit().send({
                    from: userAccount,
                    value: weiAmount
                });
                updateBankState();
            } catch (error) {
                showError('Error depositing to your account: ' + error.message);
            }
        }
    });

    $('#withdraw-player-btn').click(async () => {
        const amount = prompt('Enter amount to withdraw from your account (in ETH):');
        if (amount) {
            try {
                const weiAmount = web3.utils.toWei(amount, 'ether');
                await contract.methods.withdraw(weiAmount).send({
                    from: userAccount
                });
                updateBankState();
            } catch (error) {
                showError('Error withdrawing from your account: ' + error.message);
            }
        }
    });
}

// Show error message
function showError(message) {
    $('#error-message').text(message).show();
    setTimeout(() => {
        $('#error-message').fadeOut();
    }, 5000);
}

// Initialize when document is ready
$(document).ready(() => {
    init();
}); 