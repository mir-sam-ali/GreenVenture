// import {Schema,type,ArraySchema} from "@colyseus/schema"
const { Schema, ArraySchema, type } = require("@colyseus/schema")
const schema = require('@colyseus/schema');

class PieceState extends Schema {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
    }
}
schema.defineTypes(PieceState, {
    x: "number",
    y: "number"
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
    constructor() {
        super();
        this.playerStates = new ArraySchema();
    }
}
schema.defineTypes(GameRoomState, {
    playerStates: [ PlayerState ]
});

module.exports = {
    GameRoomState,
    PlayerState,
    PieceState
}