const { Command } = require('@colyseus/command');

module.exports.OnPayTaxCommand = class OnPayTaxCommand extends Command {

    execute({ sessionId }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        const numberOfIndustries = playerState.industriesOwned.length;

        playerState.currentIncome -= numberOfIndustries * 20;

        playerState.currentIncome = playerState.currentIncome > 0? playerState.currentIncome: 0;
    }

}