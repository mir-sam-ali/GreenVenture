const { Room } = require("colyseus");
const { randomInt } = require("../../shared/math/random");
//const  ClientMessage  = require("../../ClientMessage");
const  { GameRoomState, PlayerState }  = require('./schema/gameRoomState');
const { Dispatcher } = require('@colyseus/command');
const { OnJoinCommand } = require("../commands/onJoinCmd");


module.exports.GameRoom = class GameRoom extends Room {
    // this room supports only 5 clients connected
  
    constructor(){
        super();
        this.dispatcher = new Dispatcher(this);
        
        this.maxClients = 5;
    
    }
   

    onCreate (client, options) {
        this.setState(new GameRoomState());
        // this.onMessage("keydown",(client,message)=>{
        //     this.broadcast('keydown',message,{
        //         except:client,
        //     })
        // })

        this.onMessage("DiceRoll",(client)=>{
            const value=randomInt(1,7);
            console.log("DiceRoll",this.state.currentPlayerTurnIndex)
            this.state.lastDiceValue=value
            this.broadcast("DiceRollResult",value);
            // console.log(this.state)
            // console.log(`dice roll: ${client.sessionId}`)
        })

        // this.onMessage("UpdatePlayerTurn",(client,newTurn)=>{
        //     console.log(newTurn);
        //     this.state.currentPlayerTurnIndex=newTurn;
        // })
       
    }

    onJoin (client, options) {
        console.log(this.state.currentPlayerTurnIndex)
        this.dispatcher.dispatch(new OnJoinCommand(), {
            sessionId: client.sessionId
        })
    }

    onLeave (client) {
        const { index } = this.state.playerStates.find(player => player.id === client.sessionId);
       // console.log("removing", index);
        if(!index) {
            return
        }
        
        this.state.playerStates.splice(index, 1);
    }

    onDispose () {
        
    }

}