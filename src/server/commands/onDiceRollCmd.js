const { Command } = require('@colyseus/command');
const { randomInt } = require('../../shared/math/random');

module.exports.OnDiceRollCommand = class OnDiceRollCommand extends Command {

    execute({ sessionId }) {
        const value = randomInt(1, 7);
        // console.log("DiceRoll", value)
        this.state.lastDiceValue = value
        this.state.allowTurn = false;

        setTimeout(()=>{                
            this.room.broadcast("DiceRollResult", this.state.lastDiceValue);
        },1000);
    }

}