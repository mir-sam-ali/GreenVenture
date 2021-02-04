// import {Schema,type,ArraySchema} from "@colyseus/schema"
const {Schema,type,ArraySchema,defineTypes}=require("@colyseus/schema")



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

class GameRoomState extends Schema {
    constructor(){
        super();
        this.lastDiceValue=0;
        this.mySynchronizedProperty = "Hello World";
        this.playerStates=new ArraySchema();

        this.playerStates.push(new PlayerState());
        this.playerStates.push(new PlayerState());
        this.playerStates.push(new PlayerState());
        this.playerStates.push(new PlayerState());
    }
    
}
module.exports.GameRoomState = GameRoomState;

defineTypes(GameRoomState, {
    lastDiceValue: "number",
    playerStates: [PlayerState],
  });