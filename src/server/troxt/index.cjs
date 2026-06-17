const { TroxtAgent } = require('./troxtAgent.cjs')

function createTroxtAgent(options = {}) {
  return new TroxtAgent(options)
}

module.exports = {
  createTroxtAgent,
  TroxtAgent,
}
