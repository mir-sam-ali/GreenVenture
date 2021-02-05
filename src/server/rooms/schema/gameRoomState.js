// import {Schema,type,ArraySchema} from "@colyseus/schema"
const { Schema, ArraySchema } = require("@colyseus/schema")

const schema = require('@colyseus/schema');

class PieceState extends Schema {
    constructor() {
        super();
        this.tilePosition=0;
    }
}
schema.defineTypes(PieceState, {
    tilePosition:"number",
});

class PlayerState extends Schema {
    constructor(id, index) {
        super();
        this.id = id;
        this.index = index;
        this.piece = new PieceState();
        // console.log(this.piece)
    }
}
schema.defineTypes(PlayerState, {
    id: "string",
    index: "number",
    piece: PieceState
});

class GameRoomState extends Schema {
    constructor(){
        super();
        this.lastDiceValue=0;
        this.currentPlayerTurnIndex=0;

        this.mySynchronizedProperty = "Hello World";
        this.playerStates = new ArraySchema();
    }
    
}
    
schema.defineTypes(GameRoomState, {
    playerStates: [ PlayerState ],
    lastDiceValue: "number",
    currentPlayerTurnIndex:"number",
});

module.exports = {
    GameRoomState,
    PlayerState,
    PieceState
}
