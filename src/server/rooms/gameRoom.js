const { Room } = require("colyseus");
const { GameRoomState } = require('./schema/gameRoomState');

module.exports.GameRoom = class GameRoom extends Room {
    // this room supports only 4 clients connected
    constructor(){
        super();
        
        this.maxClients = 5;
    }
   

    onCreate (options) {
        this.setState(new GameRoomState());
    }

    onJoin (client) {
        
    }

    onLeave (client) {
        
    }

    onDispose () {
        
    }

}