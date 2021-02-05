const { Command } = require('@colyseus/command');

module.exports.OnLeaveCommand = class OnLeaveCommand extends Command {
    
    execute({ sessionId })
    {
        const index  = this.state.playerStates.findIndex(player => player.id === sessionId);
        // console.log();
        if(!index && index !== 0) {
            return
        }

        this.state.playerStates.splice(index, 1);
    }

}