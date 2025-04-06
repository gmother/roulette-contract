const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployRoulette", (m) => {
  // Deploy Roulette contract
  const roulette = m.contract("Roulette", []);

  return { roulette };
}); 