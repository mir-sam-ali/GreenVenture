const { Command } = require('@colyseus/command');

module.exports.OnCasinoCommand = class OnCasinoCommand extends Command {

    execute({ sessionId, income, cc }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        playerState.currentIncome += income;
        playerState.currentCC += cc;
    }

}