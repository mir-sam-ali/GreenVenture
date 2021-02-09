const { Command } = require('@colyseus/command');

module.exports.OnEventCommand = class OnEventCommand extends Command {

    execute({ sessionId, income, cc }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        playerState.currentIncome += income;
        playerState.currentCC += cc;
        //playerState.currentIncome = playerState.currentIncome > 0? playerState.currentIncome: 0;
    }

}