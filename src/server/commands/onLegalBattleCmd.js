const { Command } = require('@colyseus/command');

module.exports.OnLegalBattleCommand = class OnLegalBattleCommand extends Command {

    execute({ sessionId, status }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];

        if(status) {
            let income = 0;
            this.state.playerStates.forEach(player => {
                const incomeLost = player.currentIncome * 0.2;
                player.currentIncome -= incomeLost;
                income += incomeLost;
            })
            playerState.currentIncome += income;
        }
        else {
            const incomeLost = playerState.currentIncome * 0.4;
            playerState.currentIncome -= incomeLost;
            const nbPlayers = this.state.playerStates.length;
            const incomeToEach = incomeLost/nbPlayers;
            this.state.playerStates.forEach(player => {
                player.currentIncome += incomeToEach;
            })
        }   
    }

}