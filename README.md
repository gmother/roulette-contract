# Ethereum Roulette Smart Contract

A Solidity implementation of a classic roulette game with a modern web interface.

## Live Demo

Try the live demo at: [https://gmother.github.io/roulette-contract/](https://gmother.github.io/roulette-contract/)

## Features

- Classic roulette betting options:
  - Single number bets (0-36)
  - Red/Black
  - Even/Odd
  - Columns (2 to 1)
  - Dozens (1-12, 13-24, 25-36)
  - Halves (1-18, 19-36)
- Bank management system
- Player account management
- Secure random number generation
- Real-time bet results

## Prerequisites

To interact with the DApp, you'll need:

1. [MetaMask](https://metamask.io/) wallet installed in your browser
2. An account on the Sepolia test network
3. Some Sepolia test ETH (you can get it from [Sepolia Faucet](https://sepoliafaucet.com/))

## Smart Contract Details

The contract is deployed on the Sepolia test network. It implements:

- Secure bank management
- Player balance tracking
- Bet validation and processing
- Random number generation
- Event emission for bet results

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Testing

Run the test suite:
```bash
npx hardhat test
```

### Deployment

To deploy to Sepolia:
```bash
npx hardhat ignition deploy ./ignition/modules/Roulette.js --network hardhat
```

## Security

The contract includes several security features:
- Maximum bet limits
- Withdrawal fees
- Bank balance protection
- Secure random number generation

## License

MIT License

## Contact

For questions or suggestions, please open an issue in the repository.
