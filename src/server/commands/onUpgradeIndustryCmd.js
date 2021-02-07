const { Command } = require('@colyseus/command');

module.exports.OnUpgradeIndustryCommand = class OnUpgradeIndustryCommand extends Command {

    execute({ sessionId, level }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        const industryIndex = playerState.industriesOwned.findIndex(industry => industry.tile === playerState.piece.tilePosition);

        playerState.currentIncome -= playerState.industriesOwned[industryIndex].industryBuyUpgradeCost[`level${level}Cost`];

        playerState.industriesOwned[industryIndex].level = level;
        playerState.industriesOwned[industryIndex].income = playerState.industriesOwned[industryIndex].industryBuyUpgradeCost[`level${level}Income`];
        playerState.industriesOwned[industryIndex].cc = playerState.industriesOwned[industryIndex].industryBuyUpgradeCost[`level${level}CC`];
    }

}