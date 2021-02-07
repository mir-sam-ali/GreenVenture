const { Room } = require("colyseus");
const { randomInt } = require("../../shared/math/random");
//const  ClientMessage  = require("../../ClientMessage");
const  { GameRoomState, PlayerState }  = require('./schema/gameRoomState');
const { Dispatcher } = require('@colyseus/command');
const { OnJoinCommand } = require("../commands/onJoinCmd");
const { OnLeaveCommand } = require("../commands/onLeaveCmd");
const { OnDiceRollCommand } = require("../commands/onDiceRollCmd");
const { OnUpdatePositionCommand } = require("../commands/onUpdatePositionCmd");
const { OnBuyIndustryCommand } = require("../commands/onBuyIndustryCmd");
const { OnUpgradeIndustryCommand } = require("../commands/onUpgradeIndustryCmd");
const { OnBuyFuelCommand } = require("../commands/onBuyFuelCmd");
const { OnUpgradeAutomobileCommand } = require("../commands/onUpgradeAutomobileCmd");
const { OnPayTaxCommand } = require("../commands/onPayTaxCmd");
const { OnPayEmployeesCommand } = require("../commands/onPayEmployeesCmd");
const { OnEventCommand } = require("../commands/onEventCmd");
const { OnLegalBattleCommand } = require("../commands/onLegalBattleCmd");
const { OnCasinoCommand } = require("../commands/onCasinoCmd");


module.exports.GameRoom = class GameRoom extends Room {
    // this room supports only 5 clients connected
  
    constructor(){
        super();
        this.dispatcher = new Dispatcher(this);
        
        this.maxClients = 5;
    
    }
   

    onCreate (client, options) {
        this.setState(new GameRoomState());

        this.onMessage("DiceRoll",(client)=>{
            this.dispatcher.dispatch(new OnDiceRollCommand, {
                sessionId: client.sessionId
            })
        })

        this.onMessage("UpdatePosition",(client, message) => {
            this.dispatcher.dispatch(new OnUpdatePositionCommand, {
                sessionId: client.sessionId
            })
        })

        this.onMessage("BuyIndustry", (client, message) => {
            this.dispatcher.dispatch(new OnBuyIndustryCommand, {
                sessionId: client.sessionId,
                type: message.industryType,
                name: message.industryName
            })
        })

        this.onMessage("UpgradeIndustry", (client, message) => {
            this.dispatcher.dispatch(new OnUpgradeIndustryCommand, {
                sessionId: client.sessionId,
                level: message.level
            })
        })

        this.onMessage("BuyFuel", (client, message) => {
            this.dispatcher.dispatch(new OnBuyFuelCommand, {
                sessionId: client.sessionId
            })
        })

        this.onMessage("UpgradeAutomobile", (client, message) => {
            this.dispatcher.dispatch(new OnUpgradeAutomobileCommand, {
                sessionId: client.sessionId,
                type: message.type
            })
        })

        this.onMessage("PayTax", (client, message) => {
            this.dispatcher.dispatch(new OnPayTaxCommand, {
                sessionId: client.sessionId
            })
        })

        this.onMessage("PayEmployees", (client, message) => {
            this.dispatcher.dispatch(new OnPayEmployeesCommand, {
                sessionId: client.sessionId
            })
        })

        this.onMessage("Event", (client, message) => {
            this.dispatcher.dispatch(new OnEventCommand, {
                sessionId: client.sessionId,
                income: message.income,
                cc: message.cc
            })
        })

        this.onMessage("UpdatePosition",(client,message)=>{
          

            const playerIndex=message.index;
            let playerState=this.state.playerStates[playerIndex];
            let offset=this.state.lastDiceValue;
            console.log(offset);

            let newPosition=playerState.piece.tilePosition+offset;
            if(newPosition>=36){
                newPosition=newPosition-36;
            }

            playerState.piece.tilePosition=newPosition;

            // this.state.currentPlayerTurnIndex+=1;
           
            // if(this.state.currentPlayerTurnIndex===this.state.playerStates.length){
            //     this.state.currentPlayerTurnIndex=0;
            // }
            this.broadcast("NewPlayerPosition",{index:playerIndex,id:playerState.id,newPosition,});
        })


        this.onMessage("LegalBattle", (client, message) => {
            this.dispatcher.dispatch(new OnLegalBattleCommand, {
                sessionId: client.sessionId,
                status: message.status
            })
        })

        this.onMessage("Casino", (client, message) => {
            this.dispatcher.dispatch(new OnCasinoCommand, {
                sessionId: client.sessionId,
                income: message.income,
                cc: message.cc
            })
        })

        this.onMessage("Update Currency",(client,message)=>{
            // Code For Updating Currency
            this.initializeNextTurn()
        })

        this.onMessage("AddIndustry",(client,message)=>{
            this.initializeNextTurn()
        })

        this.onMessage("UpgradeIndustry",(client,message)=>{
            this.initializeNextTurn()
        })

        this.onMessage("RollAgain",(client,message)=>{
            this.initializeNextTurn()
        })

        this.onMessage("GoToJail",(client,message)=>{
            this.initializeNextTurn()
        })

        this.onMessage("NextTurn",(client,message)=>{
            // Just Go To Next Turn
            this.initializeNextTurn()
        })
       
    }

    onJoin (client, options) {
        // console.log(this.state.currentPlayerTurnIndex)
        this.dispatcher.dispatch(new OnJoinCommand(), {
            sessionId: client.sessionId
        })
    }

    onLeave (client) {
        this.dispatcher.dispatch(new OnLeaveCommand(), {
            sessionId: client.sessionId
        })
    }

    onDispose () {
        
    }

    initializeNextTurn(){
        this.state.currentPlayerTurnIndex+=1;
           
        if(this.state.currentPlayerTurnIndex===this.state.playerStates.length){
            this.state.currentPlayerTurnIndex=0;
        }
        this.state.allowTurn=true;
        this.broadcast("AllowForNextTurn",{});

    }

}