const { Command } = require('@colyseus/command');
const { randomInt } = require('../../shared/math/random');

module.exports.OnUpdatePositionCommand = class OnUpdatePositionCommand extends Command {

    execute({ sessionId }) {
        const playerIndex = this.state.playerStates.findIndex(player => player.id === sessionId);
        let playerState = this.state.playerStates[playerIndex];
        let offset = this.state.lastDiceValue;
        console.log(offset);

        let newPosition = playerState.piece.tilePosition + offset;
        if (newPosition >= 36) {
            newPosition = newPosition - 36;
        }

        playerState.piece.tilePosition = newPosition;

        this.room.broadcast("NewPlayerPosition",{index:playerIndex,id:playerState.id,newPosition,})
    }

}