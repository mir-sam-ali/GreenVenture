const { Command } = require('@colyseus/command');

module.exports.OnUpgradeAutomobileCommand = class OnUpgradeAutomobileCommand extends Command {

    execute({ sessionId, type }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        const automobile = this.state.automobileDetails[type];

        playerState.currentIncome -= automobile.upgradeCost

        playerState.automobile.type = type;
        playerState.automobile.fuelCost = automobile.fuelCost;
        playerState.automobile.carbonCost = automobile.carbonCost;
    }

}