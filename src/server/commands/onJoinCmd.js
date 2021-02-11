const { Command } = require('@colyseus/command');
const { PlayerState } = require('../rooms/schema/gameRoomState');

module.exports.OnJoinCommand = class OnJoinCommand extends Command {
    
    execute({ sessionId, username })
    {
        const index = this.state.playerStates.length;
        //console.log(sessionId, index);
        this.state.playerStates.push(new PlayerState(sessionId, index, username));
        //console.log(this.state.playerStates);
    }

}