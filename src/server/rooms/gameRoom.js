const { Room } = require("colyseus");
const { randomInt } = require("../../shared/math/random");
//const  ClientMessage  = require("../../ClientMessage");
const { GameRoomState }  = require('./schema/gameRoomState');
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

        // this.onMessage("UpdatePosition",(client, message) => {
        //     this.dispatcher.dispatch(new OnUpdatePositionCommand, {
        //         sessionId: client.sessionId
        //     })
        //     this.initializeNextTurn()
        // })

        this.onMessage("BuyIndustry", (client, message) => {
            console.log(message)
            this.dispatcher.dispatch(new OnBuyIndustryCommand, {
                sessionId: client.sessionId,
                type: message.type,
                name: message.name
            })
            this.initializeNextTurn(client)
        })

        this.onMessage("UpgradeIndustry", (client, message) => {
            this.dispatcher.dispatch(new OnUpgradeIndustryCommand, {
                sessionId: client.sessionId,
                level: message.level
            })
            this.initializeNextTurn(client)
        })

        this.onMessage("BuyFuel", (client, message) => {
            this.dispatcher.dispatch(new OnBuyFuelCommand, {
                sessionId: client.sessionId
            })
            this.initializeNextTurn(client)
        })

        this.onMessage("UpgradeAutomobile", (client, message) => {
            console.log("Upgrade Automobile",message.type);
            this.dispatcher.dispatch(new OnUpgradeAutomobileCommand, {
                sessionId: client.sessionId,
                type: message.type
            })
            this.initializeNextTurn(client)
        })

        this.onMessage("PayTax", (client, message) => {
            this.dispatcher.dispatch(new OnPayTaxCommand, {
                sessionId: client.sessionId
            })
            this.initializeNextTurn(client)
        })

        this.onMessage("PayEmployees", (client, message) => {
            this.dispatcher.dispatch(new OnPayEmployeesCommand, {
                sessionId: client.sessionId
            })
            this.initializeNextTurn(client)
        })

        this.onMessage("Event", (client, message) => {
            console.log("Event",message)
            this.dispatcher.dispatch(new OnEventCommand, {
                sessionId: client.sessionId,
                income: message.income,
                cc: message.cc
            })
            this.initializeNextTurn(client)
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
            this.broadcast("NewPlayerPosition",{index:playerIndex,id:playerState.id,newPosition});
        })


        this.onMessage("LegalBattle", (client, message) => {
            this.dispatcher.dispatch(new OnLegalBattleCommand, {
                sessionId: client.sessionId,
                status: message.status
            })
            this.initializeNextTurn(client);
        })

        this.onMessage("Casino", (client, message) => {
            const player=this.state.playerStates[message.index];
            this.dispatcher.dispatch(new OnCasinoCommand, {
                sessionId: client.sessionId,
                income: player.currentIncome,
                cc: player.currentCC
            })
            this.initializeNextTurn(client);
        })

        // this.onMessage("Update Currency",(client,message)=>{
        //     // Code For Updating Currency



        //     this.initializeNextTurn(client)
        // })

        // this.onMessage("AddIndustry",(client,message)=>{
        //     this.initializeNextTurn(client)
        // })

        // this.onMessage("UpgradeIndustry",(client,message)=>{
        //     this.initializeNextTurn(client)
        // })
        

        this.onMessage("RollAgain",(client,message)=>{
            this.incrementPlayerMove(client);
            this.state.allowTurn=true;
            
            this.broadcast("AllowForNextTurn",{});
        })

        this.onMessage("GoToJail",(client,message)=>{
            const playerIndex=message.index;
            let playerState=this.state.playerStates[playerIndex];
            const newPosition=27;
            playerState.piece.tilePosition=newPosition;

            this.broadcast("NewPlayerPosition",{index:playerIndex,id:playerState.id,newPosition,});
            this.initializeNextTurn(client)
        })

        this.onMessage("NextTurn",(client,message)=>{
            // Just Go To Next Turn
            this.initializeNextTurn(client)
        })

        this.onMessage("text-msg", (client, message) => {
            // console.log(message);
            this.broadcast("received-msg", message);
        })
       
    }

    onJoin (client, options) {
        // console.log(this.state.currentPlayerTurnIndex)
        // console.log(options);
        this.dispatcher.dispatch(new OnJoinCommand(), {
            sessionId: client.sessionId,
            username: options.name
        })
    }

    onLeave (client) {
        this.dispatcher.dispatch(new OnLeaveCommand(), {
            sessionId: client.sessionId
        })
    }

    onDispose () {
        
    }

    initializeNextTurn(client){
        this.incrementPlayerMove(client);

        this.state.currentPlayerTurnIndex+=1;
           
        if(this.state.currentPlayerTurnIndex===this.state.playerStates.length){
            this.state.currentPlayerTurnIndex=0;
        }
        this.state.allowTurn=true;
        this.broadcast("AllowForNextTurn",{});

    }

    incrementPlayerMove(client){
        const playerIndex = this.state.playerStates.findIndex(player => player.id === client.sessionId);
        this.state.playerStates[playerIndex].movesPlayed+=1;
        this.checkAndSendIncome(playerIndex);
    }

    checkAndSendIncome(index){
            const player=this.state.playerStates[index];
            if(player.movesPlayed!==0 && player.movesPlayed%3===0)
            {
                console.log("Sending Income")
                let incomeChange=0
                let CCchange=0;
            
                if(player.industriesOwned.length !== 0)
                    player.industriesOwned.forEach(industry=>{
                        incomeChange+=industry.income;
                        CCchange+=industry.cc;
                    })
                CCchange+=player.automobile.carbonCost;
                player.currentIncome+=incomeChange;
                player.currentCC+=CCchange;
            }
       
        //this.broadcast("NewIncomes",{playerStates:this.state.playerStates});
    }

}