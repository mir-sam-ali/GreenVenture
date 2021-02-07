const { Room } = require("colyseus");
const { randomInt } = require("../../shared/math/random");
//const  ClientMessage  = require("../../ClientMessage");
const  { GameRoomState, PlayerState }  = require('./schema/gameRoomState');
const { Dispatcher } = require('@colyseus/command');
const { OnJoinCommand } = require("../commands/onJoinCmd");
const { OnLeaveCommand } = require("../commands/onLeaveCmd");


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
            const value=randomInt(1,7);
            console.log("DiceRoll",value)
            this.state.lastDiceValue=value
            this.state.allowTurn=false;
            setTimeout(()=>{                
                this.broadcast("DiceRollResult",value);
            },1000);

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