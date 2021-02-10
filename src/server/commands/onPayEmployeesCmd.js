const { Command } = require('@colyseus/command');

module.exports.OnPayEmployeesCommand = class OnPayEmployeesCommand extends Command {

    execute({ sessionId }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        const numberOfIndustries = playerState.industriesOwned.length;

        playerState.currentIncome -= numberOfIndustries * 15;

        playerState.currentIncome = playerState.currentIncome;
    }

}