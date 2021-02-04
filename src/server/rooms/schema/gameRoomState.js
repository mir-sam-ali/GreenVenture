// import {Schema,type,ArraySchema} from "@colyseus/schema"
const {Schema,type,ArraySchema}=require("@colyseus/schema")



class PieceState extends Schema{
    constructor(){
        super();
        this.x=0;
        this.y=0;
    }
}

class PlayerState extends Schema {
    
    constructor(){
        super();
        // this.id=id;
        this.piece=new PieceState();
        console.log(this.piece)
    }
}

module.exports.GameRoomState = class GameRoomState {
    constructor(){
        
        this.mySynchronizedProperty = "Hello World";
        this.playerStates=new ArraySchema();

        this.playerStates.push(new PlayerState());
        this.playerStates.push(new PlayerState());
        this.playerStates.push(new PlayerState());
        this.playerStates.push(new PlayerState());
    }
    
}