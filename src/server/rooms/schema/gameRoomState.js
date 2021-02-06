// import {Schema,type,ArraySchema} from "@colyseus/schema"
const { Schema, ArraySchema, MapSchema } = require("@colyseus/schema")

const schema = require('@colyseus/schema');

class AutomobileCost extends Schema {
    constructor(type, fuelCost, upgradeCost, carbonCost) {
        super();
        this.type = type;
        this.fuelCost = fuelCost;
        this.upgradeCost = upgradeCost;
        this.carbonCost = carbonCost;
    }
}
schema.defineTypes(AutomobileCost, {
    type: "string",
    fuelCost: "number",
    upgradeCost: "number",
    carbonCost: "number"
});

class AutomobileDetails extends Schema {
    constructor() {
        super();
        this.automobile = new MapSchema();

        this.automobile.set("bs3", new AutomobileCost("bs3", 10, 0, 60));
        this.automobile.set("bs4", new AutomobileCost("bs3", 5, 30, 30));
        this.automobile.set("bs6", new AutomobileCost("bs3", 1, 50, 0));
    }
}
schema.defineTypes(AutomobileDetails, {
    automobile: {map: AutomobileCost},
});


class IndustryBuyUpgradeCost extends Schema {
    constructor(type, name, baseCost, level2Cost, level3Cost, baseIncome, level2Income, level3Income, baseCC, level2CC, level3CC) {
        super();
        this.type = type;
        this.name = name;
        this.baseCost = baseCost;
        this.level2Cost = level2Cost;
        this.level3Cost = level3Cost;
        this.baseIncome = baseIncome;
        this.level2Income = level2Income;
        this.level3Income = level3Income;
        this.baseCC = baseCC;
        this.level2CC = level2CC;
        this.level3CC = level3CC;
    }
}
schema.defineTypes(IndustryBuyUpgradeCost, {
    type: "string", 
    name: "string", 
    baseCost: "number", 
    level2Cost: "number", 
    level3Cost: "number", 
    baseIncome: "number", 
    level2Income: "number", 
    level3Income: "number", 
    baseCC: "number", 
    level2CC: "number", 
    level3CC: "number",
});

class IndustryDetails extends Schema {
    constructor() {
        super();
        this.industries = new ArraySchema();

        this.industries.push(
            new IndustryBuyUpgradeCost("urban", "IT Industry", 20, 30, 50, 50, 70, 100, 300, 150, 50),
            new IndustryBuyUpgradeCost("urban", "Construction Industry", 30, 30, 50, 60, 80, 100, 500, 300, 100),
            new IndustryBuyUpgradeCost("mines", "Coal Industry", 30, 30, 50, 50, 80, 120, 700, 400, 150),
            new IndustryBuyUpgradeCost("mines", "Oil Industry", 50, 60, 80, 90, 120, 150, 700, 400, 150),
            new IndustryBuyUpgradeCost("farms", "Agriculture", 5, 20, 30, 20, 40, 60, 200, 100, 30),
            new IndustryBuyUpgradeCost("farms", "Animal Husbandry", 10, 30, 40, 30, 60, 80, 200, 100, 30),
            new IndustryBuyUpgradeCost("rivers", "Fisheries", 5, 10, 20, 30, 40, 60, 200, 100, 30),
            new IndustryBuyUpgradeCost("rivers", "Shipping Industry", 30, 60, 90, 70, 100, 170, 600, 300, 100),
            new IndustryBuyUpgradeCost("forest", "Paper", 10, 20, 40, 20, 40, 70, 400, 200, 50),
            new IndustryBuyUpgradeCost("forest", "Furniture", 20, 30, 50, 50, 70, 90, 500, 250, 100),
            new IndustryBuyUpgradeCost("hills", "Plantation", 5, 20, 40, 15, 30, 50, 150, 50, 30),
            new IndustryBuyUpgradeCost("hills", "WindMill", 5, 20, 40, 15, 30, 50, 150, 50, 30)
        );
    }
}
schema.defineTypes(IndustryDetails, {
    industries: [IndustryBuyUpgradeCost]
});


class IndustryState extends Schema {
    constructor(type, name, level, income, cc, tile) {
        super();

        this.type = type;
        this.name = name;
        this.level = level;
        this.income = income;
        this.cc = cc;
        this.tile = tile;
    }
}
schema.defineTypes(IndustryState, {
    type: "string", 
    name: "string", 
    level: "string", 
    income: "string",
    cc: "string", 
    tile: "string"
});

class AutomobileState extends Schema {
    constructor() {
        super();
        const baseAutomobile = (new AutomobileDetails()).automobile.get("bs3");
        this.type = baseAutomobile.type;
        this.fuelCost = baseAutomobile.fuelCost;
        this.carbonCost = baseAutomobile.carbonCost;
    }
}
schema.defineTypes(AutomobileState, {
    type: "string", 
    fuelCost: "number",
    carbonCost: "number" 
});

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
        this.industriesOwned = new ArraySchema();
        this.automobile = new AutomobileState();
        // console.log(this.piece)
    }
}
schema.defineTypes(PlayerState, {
    id: "string",
    index: "number",
    piece: PieceState,
    industriesOwned: [IndustryState],
    automobile: AutomobileState
});

class GameRoomState extends Schema {
    constructor(){
        super();
        this.lastDiceValue=0;
        this.currentPlayerTurnIndex=0;

        this.mySynchronizedProperty = "Hello World";
        this.playerStates = new ArraySchema();
        this.industryDetails = new IndustryDetails();
        this.automobileDetails = new AutomobileDetails();
    }
    
}
schema.defineTypes(GameRoomState, {
    playerStates: [ PlayerState ],
    lastDiceValue: "number",
    currentPlayerTurnIndex:"number",
    industryDetails: IndustryDetails,
    automobileDetails: AutomobileDetails
});

module.exports = {
    GameRoomState,
    PlayerState,
    PieceState
}
