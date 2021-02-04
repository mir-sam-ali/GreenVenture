const { Room } = require("colyseus");
const { randomInt } = require("../../shared/math/random");
//const  ClientMessage  = require("../../ClientMessage");
const  {GameRoomState}  = require('./schema/gameRoomState');

module.exports.GameRoom = class GameRoom extends Room {
    // this room supports only 4 clients connected
    constructor(){
        super();
        
        
        this.maxClients = 5;
    }
   

    onCreate (options) {
        this.setState(new GameRoomState());
        this.onMessage("keydown",(client,message)=>{
            this.broadcast('keydown',message,{
                except:client,
            })
        })

        this.onMessage("DiceRoll",(client)=>{
            const value=randomInt(1,7);
            
            this.state.lastDiceValue=value
            this.broadcast("DiceRollResult",value);
            console.log(this.state)
            console.log(`dice roll: ${client.sessionId}`)
        })
    }

    onJoin (client) {
        
    }

    onLeave (client) {
        
    }

    onDispose () {
        
    }

}