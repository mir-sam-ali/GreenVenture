const { Command } = require('@colyseus/command');

module.exports.OnBuyFuelCommand = class OnBuyFuelCommand extends Command {

    execute({ sessionId }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        const automobile = playerState.automobile

        playerState.currentIncome -= automobile.fuelCost;
    }

}