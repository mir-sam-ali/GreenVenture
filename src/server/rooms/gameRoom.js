const { Room } = require("colyseus");
const  { GameRoomState, PlayerState }  = require('./schema/gameRoomState');
const { Dispatcher } = require('@colyseus/command');
const { OnJoinCommand } = require("../commands/onJoinCmd");


module.exports.GameRoom = class GameRoom extends Room {
    // this room supports only 5 clients connected
    dispatcher = new Dispatcher(this);
    constructor(){
        super();
        
        this.maxClients = 5;
    }
   

    onCreate (client, options) {
        this.setState(new GameRoomState());
        // this.onMessage("keydown",(client,message)=>{
        //     this.broadcast('keydown',message,{
        //         except:client,
        //     })
        // })
    }

    onJoin (client, options) {
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