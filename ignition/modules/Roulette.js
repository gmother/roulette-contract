const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Roulette", (m) => {
  // Deploy Roulette contract
  const roulette = m.contract("Roulette", []);

  return { roulette };
}); 