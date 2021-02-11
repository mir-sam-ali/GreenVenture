import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import StateMachine from '../statemachine/StateMachine';
import { randomInt } from '../../shared/math/random';
//import ClientMessage from "../../ClientMessage"

const dicePositionsOffset = [
    {x:-270,y:335},
    {x:-400,y:200},
    {x:-400,y:-200},
    {x:400,y:-200},
]

const indexToColorMapping=["Blue","Green","Purple","Orange","Yellow"]
const colors=["#6ED3F7","#5DEA53","#E5C8FF","#ED5F0D","#EDDE0C"]


const ServerEvents= new Phaser.Events.EventEmitter();

const BoardOffsetsX=[-265,-205,-145,-85,-25,30,90,150,210,270];

const BoardOffsetsY=[-270,-210,-150,-90,-30,30,90,150,210,270];

const regionToIndustryIndexMapping={
    "urban":[0,1],
    "mines":[2,3],
    "farms":[4,5],
    "river":[6,7],
    "forest":[8,9],
    "hills":[10,11]
}

export default class Game extends Phaser.Scene
{
    piecesForPlayer = {};
    

	constructor()
	{
        super('game')
        this.diceRollAnimationAccumulator=0;
        this.playerIndex=-1; // Client's Index
        this.currentPosition=0;
    }
    
    
    init()
    {
        this.client = new Colyseus.Client();
        this.stateMachine= new StateMachine(this, "game");
        this.stateMachine.addState('idle')
            .addState('wait-for-dice-roll',{
                onEnter:this.handleWaitForDiceRoll,
            })
            .addState('dice-roll',{
                onEnter: this.handleDiceRollEnter,
                onUpdate: this.handleDiceRollUpdate 
            })
            .addState('player-movement',{
                onEnter: this.handlePlayerMovementEnter,
                //onUpdate: this.handlePlayerMovementUpdate,
            })
            .addState('wait-for-player-movement',{
                onEnter: this.handleWaitForPlayerMovement,
            })
            .addState('player-action',{
                onEnter: this.handlePlayerActionEnter,
                onUpdate: this.handlePlayerActionUpdate,
            })
            .addState('wait-for-player-action',{
                onEnter:this.handleWaitForPlayerActionEnter,
            })
            .addState('dice-roll-finish',{
                onEnter: this.handleDiceRollFinishEnter,
            })
            .setState('idle');
    }

	preload()
    {
        this.load.image("board","assets/board.svg");
        this.load.image("blue","assets/sprites/player1/automobile.png")
        this.load.image("green","assets/sprites/player2/automobile.png")
        this.load.image("purple","assets/sprites/player3/automobile.png")
        this.load.image("orange","assets/sprites/player4/automobile.png")
        this.load.image("yellow","assets/sprites/player5/automobile.png")
        this.load.image("build_button","assets/build.png")
        this.load.image("cancel_button","assets/cancel.png")
        this.load.image("upgrade_button","assets/upgrade.png")
        this.load.image("gold_coin","assets/goldCoin.png");
        this.load.image("green_coin","assets/greenCoin.png");
        this.load.image("silver_coin","assets/silverCoin.png");

        for(let i = 1;i<=6;i++){
            this.load.image(`die-image-${i}`,`assets/Dice/dieRed_border${i}.png`)
        }
    }

    async create()
    {
        
        const {width,height} = this.scale;
        const cx = width*0.5;
        const cy = height*0.5;
        this.cx=cx;
        this.cy=cy;
        const board = this.add.image(width*0.5,height*0.5,"board");
        board.setScale(0.36, 0.36);

        const roomId = document.getElementById("gameroomcode").innerText;
        const username = document.getElementById("username").innerText;

        const room = await this.client.joinOrCreate(roomId, {
            name: username
        });
        this.room = room;

        document.getElementById("msg-input").addEventListener("keypress", (e) => {
            if(e.keyCode === 13 || e.which === 13){
                this.room.send("text-msg", {
                    username: username,
                    msg: e.target.value
                });

                e.target.value = "";
            }
        });

        room.onMessage("received-msg", data => {
            // console.log("msg", data);
            this.addToMsgScreen(data);
        })

        room.onStateChange.once(state=>{
            // console.log("[initialstate]", state);
            console.log("[initial players state]", state.playerStates);
            // state.playerStates.forEach(player => {
            //     console.log("[automobile]", player.automobile);
            //     console.log("[piece]", player.piece);
            //     console.log("[industries]", player.industriesOwned);
            // })

            this.handleInitialState(state, cx, cy);
            const text = this.add.text(cx-290, cy-350,`Current Turn: ${indexToColorMapping[state.currentPlayerTurnIndex]}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'28px',
                align: "center"
            });
            this.text = text;

            this.add.text(cx-500,cy-100,"Your Automobile:",{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'20px',
                align: "center"
            })
            console.log(this.playerIndex)
            this.add.image(cx-420,cy-50,`${indexToColorMapping[this.playerIndex].toLowerCase()}`)

            this.add.text(cx-500,cy,"Type:",{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            })
            const player=this.room.state.playerStates[this.playerIndex];
            const automobile=this.room.state.playerStates[this.playerIndex].automobile;
            this.automobileTypeText=this.add.text(cx-370,cy,`${automobile.type}`,{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center",
                color:'black'

            })

            this.add.text(cx-500,cy+50,"Fuel Cost:",{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            })

            this.automobileFuelText=this.add.text(cx-370,cy+50,`${automobile.fuelCost}`,{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center",
                color:'black'
            })


            this.add.text(cx-500,cy+100,"Carbon Cost:",{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            })

            this.automobileCarbonText=this.add.text(cx-370,cy+100,`${automobile.carbonCost}`,{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center",
                color:'black'
            })

            this.coinText=this.add.text(cx-430,cy-280,`$${player.currentIncome}`,{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'19px',
                align: "center",
                color:'black'
            });

            this.carbonText=this.add.text(cx-430,cy-210,`${player.currentCC}`,{
                fontFamily: '"Paytone one", san-serif',
                fontSize:'19px',
                align: "center",
                color:'black'
            });

            
        
            this.stateMachine.setState("wait-for-dice-roll");
        })
            
        this.room.state.playerStates.onAdd = (item) => {
            console.log("onAdd func", item);
            this.initializePlayerState(item, cx, cy);
            this.updateLeaderBoard(this.room.state.playerStates);
        } 

        this.room.state.playerStates.onRemove = (item) => {
            // console.log("onRemove func", item);
            const piece = this.piecesForPlayer[item.id];
            if(!piece) {
                return 
            }
            this.updateLeaderBoard(this.room.state.playerStates);
            piece.destroy();
        } 


        const dice=this.add.sprite(cx-dicePositionsOffset[0].x, cy-dicePositionsOffset[0].y, 'die-image-6').setInteractive();
        dice.setScale(0.8);
        this.dice=dice;


        const goldCoinImage=this.add.image(cx-480,cy-270,'gold_coin');
        goldCoinImage.setScale(0.03)

        const silverCoinImage=this.add.image(cx-480,cy-200,'silver_coin');
        silverCoinImage.setScale(0.06)

        dice.on('pointerdown', (pointer)=> {
            console.log(this.room.state.currentPlayerTurnIndex,this.room.state.allowTurn);
            // if(this.room.state.currentPlayerTurnIndex===this.playerIndex)
            if(this.room.state.allowTurn && this.room.state.currentPlayerTurnIndex===this.playerIndex)
                this.stateMachine.setState('dice-roll');
    
        });

        

        this.room.onMessage('*',(type,message)=>{
            //console.log(type);
            if(type=="DiceRollResult")
                ServerEvents.emit("DiceRollResult",message);
            else if(type=="NewPlayerPosition")
                ServerEvents.emit("NewPlayerPosition",message);
            else if(type=="AllowForNextTurn"){
                
                ServerEvents.emit("AllowForNextTurn",message);
            }else if(type=="NewIncomes"){
                ServerEvents.emit("NewIncomes",message);
            }
        })

        // this.showDecisionForm("build",{
        //     region:"Forest",
        //     industry_1:{
        //         name:"IT Industry",
        //         baseCost:"200",
        //         baseIncome:"200",
        //         baseCC:"200",
        //     },
        //     industry_2:{
        //         name:"Shipping Industry",
        //         baseCost:"200",
        //         baseIncome:"200",
        //         baseCC:"200",
        //     }
        // });

        // this.showDecisionForm("automobile_upgrade",{
        //     currentLevel:{
        //         type:1,
        //         carbonCost:"200",
        //         fuelCost:"200",
        //     },
        //     nextLevel:{
        //         type:2,
        //         carbonCost:"200",
        //         fuelCost:"200",
        //         upgradeCost:"200",
        //     }
        // })

       // this.displayMessage(["The season is in your favour."," Timely rainfall has irrigated the farmlands","your industry owns, throwing away the", "need to manually irrigate them using machines."])
    }

    // @ts-ignore
    update(t,dt){
        this.stateMachine.update(dt);
    }

    handleDiceRollEnter(){
           
            // console.log(this.room.state.currentPlayerTurnIndex,this.playerIndex)
            if(this.room.state.currentPlayerTurnIndex===this.playerIndex){
            this.room.send("DiceRoll");
            //console.log(this.room)

            const value=Phaser.Math.Between(1,6);
            this.dice.setTexture(`die-image-${value}`);
            this.diceRollAnimationAccumulator=0;

            

            ServerEvents.once("DiceRollResult",(message)=>{
                
                this.room.state.lastDiceValue=message;
                if(this.room.state.lastDiceValue>0)
                this.dice.setTexture(`die-image-${this.room.state.lastDiceValue}`);
                this.stateMachine.setState('player-movement')
                
            })
        }
        else{
            this.stateMachine.setState('wait-for-dice-roll');
        }

    }

    handleInitialState (state, cx, cy) {
        // console.log(state) 
        console.log("Handle Initial State",this.room.state.playerStates)
        // @ts-ignore
        state.playerStates.forEach((playerState, idx) => {
            // console.log(playerState);
            this.initializePlayerState(playerState, cx, cy);
        });
    }

    initializePlayerState (playerState, cx, cy) {
        console.log("Initialize Player State ",playerState)
        
        if(! (playerState.id in this.piecesForPlayer)) {
            this.piecesForPlayer[playerState.id] = null;
        }
        if(this.piecesForPlayer[playerState.id] !==null){
            // Piece already in Board
            return;
        }

        const idx = playerState.index;
        
        if(playerState.id===this.room.sessionId){
            console.log(idx,playerState.id);
            this.playerIndex=idx;
        }
        const newPiece = this.createPiece(idx, cx, cy);
        console.log("Piece",newPiece);
        if(!newPiece) {
            return
        }
        
        this.piecesForPlayer[playerState.id] = newPiece;
        
        this.updatePlayerAutomobilePosition(idx,playerState.id,playerState.piece.tilePosition)
    }

    handleDiceRollUpdate(dt){
        this.diceRollAnimationAccumulator+=dt;
        if(this.diceRollAnimationAccumulator>=100){
            const value=Phaser.Math.Between(1,6);
            this.dice.setTexture(`die-image-${value}`);
            this.diceRollAnimationAccumulator=0;
        }
            
    }

   

    handleWaitForDiceRoll(){
        console.log(this.room.state.playerStates[this.playerIndex].automobile);
        this.time.delayedCall(1000,()=>{
            this.syncMyGame();
        })
        ServerEvents.once("DiceRollResult",(message)=>{
            //console.log(message);
            if(this.room.state.lastDiceValue>0)
            this.dice.setTexture(`die-image-${this.room.state.lastDiceValue}`);
            this.room.state.lastDiceValue=message;
            this.stateMachine.setState('wait-for-player-movement')
        })
    }

    handlePlayerMovementEnter(){
        this.room.send("UpdatePosition",{index:this.playerIndex});

        ServerEvents.once("NewPlayerPosition",(message)=>{
                
            console.log(message);
            this.currentPosition=message.newPosition;
            this.updatePlayerAutomobilePosition(message.index,message.id,message.newPosition)
            this.stateMachine.setState('player-action');
            
        })

    }



    handleWaitForPlayerMovement(){
        ServerEvents.once("NewPlayerPosition",(message)=>{                
            console.log(message);
            this.updatePlayerAutomobilePosition(message.index,message.id,message.newPosition)
            this.stateMachine.setState('wait-for-player-action');            
        })
    }

    handlePlayerActionEnter(){
        // const newPosition=this.room.state.playerStates[this.playerIndex].piece.tilePosition;
        this.executeAction();
        this.showDecisionForm();
        ServerEvents.once("AllowForNextTurn",(message)=>{                
            //console.log(message);
            console.log("Here");
            
            this.stateMachine.setState('dice-roll-finish');            
        })
    }

    handlePlayerActionUpdate(dt){
        
    }

    handleWaitForPlayerActionEnter(){
        ServerEvents.once("AllowForNextTurn",(message)=>{                
            console.log("Here");
            
            this.stateMachine.setState('dice-roll-finish');            
        })
    }

    executeAction(){
        if(this.currentPosition===0){
            this.room.send("NextTurn")
        }
        if(this.currentPosition===1 || this.currentPosition===33 || this.currentPosition===34){
            // Forest Action
            console.log("Forest");
            this.buildUpgradeIndustry("Forest",this.currentPosition);
        }
        else if(this.currentPosition===5 || this.currentPosition===6 || this.currentPosition===8){
            // City Action
            console.log("City");
            this.buildUpgradeIndustry("Urban",this.currentPosition);
        }
        else if(this.currentPosition===12 || this.currentPosition===14 || this.currentPosition===15){
            // Hills Action
            console.log("Hills");
            this.buildUpgradeIndustry("Hills",this.currentPosition);
        }
        else if(this.currentPosition===19 || this.currentPosition===20 || this.currentPosition===22){
            // River Action
            console.log("River");
            this.buildUpgradeIndustry("River",this.currentPosition);
        }
        else if(this.currentPosition===26 || this.currentPosition===25){
            // Mines Action
            console.log("Mines");
            this.buildUpgradeIndustry("Mines",this.currentPosition);
        }
        else if(this.currentPosition===28 || this.currentPosition===29 || this.currentPosition===31){
            // Farms Action
            console.log("Farms");
            this.buildUpgradeIndustry("Farms",this.currentPosition);
        }
        else if(this.currentPosition===35){
            // Forest Event
            console.log("Forest Event");
            if(this.room.state.lastDiceValue%2===0){
                //Even is Fortune
                this.displayMessage(["You caught wood smugglers in your forest.","You receive $20."])
                this.room.send("Event",{
                    income: 20,
                    cc: 0,
                })
            }
            else{
                //Odd is Mis-Fortune
                this.displayMessage(["There has been a Wildfire in the forest.","You gain 500 Carbon Currency ."])
                this.room.send("Event",{
                    income: 0,
                    cc: 500,
                })
            }
        }
        else if(this.currentPosition===7){
            // City Event
            console.log("City Event");
            if(this.room.state.lastDiceValue%2===0){
                //Even is Fortune
                
                this.displayMessage(["You have constructed a waste management sector.","You lose 300 amounts of carbon currency","and receive $10 money."])
                this.room.send("Event",{
                    income: 10,
                    cc: -300,
                })
            }
            else{
                //Odd is Mis-Fortune
                const amount=this.room.state.playerStates[this.playerIndex].industriesOwned.length===0?0:20;  
                this.displayMessage(["One of your industries has been"," damaged by a natural disaster."," Repair your industry before it is late.","(Doesn’t apply if you don’t own any industry)",`${amount} deducted from your money`])
                this.room.send("Event",{
                    income: -(amount),
                    cc: 0,
                })
            }
        }
        else if(this.currentPosition===13){
            // Hills Event
            console.log("Hills Event");
            if(this.room.state.lastDiceValue%2===0){
                //Even is Fortune
                
                this.displayMessage(["Government has awarded all plantation owners $20 money."])
                this.room.send("Event",{
                    income: 20,
                    cc: 0,
                })
            }
            else{
                //Odd is Mis-Fortune
                
                this.displayMessage(["There has been a landslide in your hills.","You lose $20 money and gain 200 carbon footprint."])
                this.room.send("Event",{
                    income: -20,
                    cc: 200,
                })
            }
        }
        else if(this.currentPosition===21){
            // River Event
            console.log("River Event");
            if(this.room.state.lastDiceValue%2===0){
                //Even is Fortune
                
                this.displayMessage(["You installed an electric precipitator filter in your ships’ chimney."," By doing this you lose 400 Carbon FootPrint"])
                this.room.send("Event",{
                    income: 0,
                    cc: -200,
                })
            }
            else{
                //Odd is Mis-Fortune
                
                this.displayMessage(["One of Your ships has stopped working.","Pay $30 for repair."])
                this.room.send("Event",{
                    income: -30,
                    cc: 0,
                })
            }
        }
        else if(this.currentPosition===24){
            // Mines Event
            console.log("Mines Event");
            if(this.room.state.lastDiceValue%2===0){
                //Even is Fortune
                
                this.displayMessage(["You have found diamonds in your coal industry!!!"," You gain $100 amount of money."])
                this.room.send("Event",{
                    income: 100,
                    cc: 0,
                })
            }
            else{
                //Odd is Mis-Fortune
                
                this.displayMessage(["Oil Spill","You gain 500 amounts of carbon currency."])
                this.room.send("Event",{
                    income: 0,
                    cc: 500,
                })
            }
        }
        else if(this.currentPosition===30){
            // Farms Event
            console.log("Farms Event");
            if(this.room.state.lastDiceValue%2===0){
                //Even is Fortune
                
                this.displayMessage(["The season is in your favour.","Timely rainfall has irrigated the farmlands your industry owns,"," throwing away the need to manually irrigate them using machines.","​Get rid of 500 amounts of carbon currency."]);
                this.room.send("Event",{
                    income: 0,
                    cc: -500,
                })
            }
            else{
                //Odd is Mis-Fortune
                
                this.displayMessage(["There was a flood in one of your farms,"," and you have lost all your grown crops.","You lose $20 amount of money"])
                this.room.send("Event",{
                    income: -20,
                    cc: 0,
                })
            }
        }
        else if(this.currentPosition===2 || this.currentPosition===23){
            //Pay Employees
            console.log("Pay Employees");
            const amount=this.room.state.playerStates[this.playerIndex].industriesOwned.length*20;            
            this.displayMessage(["You have to pay your employees.","Pay $20 for each Industry",` $${amount} is deducted from your money.`])
            
            this.room.send("Event",{
                income:(-amount),
                cc:0,
            })
        }
        else if(this.currentPosition===3){
            //Automobile Upgrade
            console.log("Automobile Upgrade");
            const player=this.room.state.playerStates[this.playerIndex];
            if(player.automobile.type=="bs6"){
                this.displayMessage(["You Cannot Upgrade Further"]);
                this.room.send("NextTurn")
            }else{

                let currentLevel=null;
                let nextLevel=null;

                currentLevel=player.automobile;
                if(currentLevel.type=="bs3"){
                    nextLevel=this.room.state.automobileDetails.automobile.get("bs4");
                }
                else if(currentLevel.type=="bs4"){
                    nextLevel=this.room.state.automobileDetails.automobile.get("bs6");
                }

                this.showDecisionForm("automobile_upgrade",{
                                    currentLevel,
                                    nextLevel,
                                })
                ServerEvents.once("player-decision-response",(res)=>{
                    if(res){
                        console.log(res);
                        this.room.send("UpgradeAutomobile",{
                            type:nextLevel.type
                        })
                    }else{
                        this.room.send("NextTurn")
                    }
                })
                               
            }
            
            //this.room.send("NextTurn");

        }
        else if(this.currentPosition===16 || this.currentPosition===32){
            //Fuel Point
            console.log("Fuel Point");
            this.room.send("BuyFuel");
        }
        else if(this.currentPosition===4 || this.currentPosition===11){
            //Pay Tax
            console.log("Pay Tax");
            
            const amount=this.room.state.playerStates[this.playerIndex].industriesOwned.length*10;            
            this.displayMessage(["You have to pay your Tax.","Pay $10 for each Industry",` $${amount} is deducted from your money.`])
            
            this.room.send("Event",{
                income:(-amount),
                cc:0,
            })
        }
        else if(this.currentPosition===9){
            //Go To Jail
            console.log("Go To Jail");
            this.room.send("GoToJail",{index:this.playerIndex});
        }
        else if(this.currentPosition===10){
            //Roll Again
            console.log("Roll Again");
            this.room.send("RollAgain");

        }
        else if(this.currentPosition===17){
            //Legal Battles
            console.log("Legal Battles");

            const rantInt = randomInt(1, 3);
           
            if(rantInt === 1){
                this.displayMessage(["You have won a legal battle against other players"])
                
                this.room.send("LegalBattle",{
                    status: true
                })
            }
            else {
                this.displayMessage(["You have lost a legal battle against other players"])
                
                this.room.send("LegalBattle",{
                    status: false
                })
            }
                      
        }
        else if(this.currentPosition===18){
            //Casino
            console.log("Casino");
            this.room.send("Casino",{index:this.playerIndex})
        }
        else if(this.currentPosition===27){
            //Jail Visitors
            console.log("Jail Visitors");
            this.room.send("NextTurn")
        }
        
       
    }





    buildUpgradeIndustry(region, tilePosition) {
        const {tileOwner,industry}=this.checkStatusOfRegion(region,this.currentPosition);
        if(tileOwner===null){
            // No one has yet built an industry here!
            // Build Option
            //console.log(this.room.state.industryDetails.industries[regionToIndustryIndexMapping[region.toLowerCase()][0]],this.room.state.industryDetails.industries[regionToIndustryIndexMapping[region.toLowerCase()][1]])
            this.showDecisionForm("build",
            {
                region,
                industry_1:this.room.state.industryDetails.industries[regionToIndustryIndexMapping[region.toLowerCase()][0]],
                industry_2:this.room.state.industryDetails.industries[regionToIndustryIndexMapping[region.toLowerCase()][1]]
            })
            

            ServerEvents.once("player-decision-response",(res)=>{
                if(res && res.status){
                    
                    console.log(res);
                    this.room.send("BuyIndustry",{
                        name: res.industry.name,
                        type: res.industry.type,
                    })


                }else{
                    // Doesn't Want to Build Industry
                    this.room.send("NextTurn")
                }
            })
            
            
            
        }else if(tileOwner.index===this.playerIndex){
            // Current Player Owns the Tile
            // Upgrade Option

            if(industry.level===3){
                //Already at highest level
                this.displayMessage(["You Cannot Upgrade Further"]);
                this.room.send("NextTurn")
            }else{
                this.showDecisionForm("upgrade",{
                    region,
                    industry,
                })
                ServerEvents.once("player-decision-response",(res)=>{
                    if(res){
                        console.log(res);
                        this.room.send("UpgradeIndustry",{
                            level: industry.level + 1,
                        })
                    }else{
                        this.room.send("NextTurn")
                    }
                })
               
                
        }
        }else{
            this.displayMessage(["You cannot build an industry here!",`$${indexToColorMapping[tileOwner.index]} has already built an industry here!`])
            this.room.send("NextTurn");
            // SomeoneElse Owns it
            // Current Player sends rent to the owner
            
        }
    }
    displayMessage(messages) {
        //message will be array of strings
        const allTextObjects=[]
        messages.forEach((message,index)=>{
            const text1=this.add.text(this.cx-200, this.cy-200+index*20,`${message}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center",
                color:'black'
            });
            allTextObjects.push(text1);
    
        })
        
        
        this.time.delayedCall(5000,()=>{
            allTextObjects.forEach((text)=>{
                text.destroy();
            })
        })
    }

    

    handleDiceRollFinishEnter(){
        // let prev_turn=this.room.state.currentPlayerTurnIndex;
        // let next_turn=prev_turn+1;
        // console.log(prev_turn);

        // if(prev_turn==(this.room.state.playerStates.length-1)){
        //     next_turn=0;
        // }

        // this.text.setText(`Current Turn: ${indexToColorMapping[next_turn]}`);
        // this.text.setColor(colors[next_turn]);

        //console.log(this.room.state.lastDiceValue);
        this.dice.setTexture(`die-image-${this.room.state.lastDiceValue}`);
        this.stateMachine.setState("wait-for-dice-roll");
        
    }

    checkStatusOfRegion(region,tilePosition){
        let found=false;
        let industry=null;
        let player=null;
        this.room.state.playerStates.forEach((player_)=>{
            player_.industriesOwned.forEach((industry_)=>{
                console.log(industry_.tile,tilePosition)
                if(industry_.tile==tilePosition){
                    found=true;
                    player=player_;
                    industry=industry_;
                }
            })
        })
        if(found)
            return {tileOwner:player,industry,};

        return {tileOwner:null,industry:null};
    }


    syncMyGame(){

        this.room.state.playerStates.forEach((playerState, idx) => {                        
            this.updatePlayerAutomobilePosition(idx,playerState.id,playerState.piece.tilePosition)
        });

        this.updateLeaderBoard(this.room.state.playerStates);
        
        
        this.text.setText(`Current Turn: ${indexToColorMapping[this.room.state.currentPlayerTurnIndex]}`);
       

        // console.log("Dice",this.room.state.lastDiceValue);
        if(this.room.state.lastDiceValue>0)
            this.dice.setTexture(`die-image-${this.room.state.lastDiceValue}`);

        const player=this.room.state.playerStates[this.playerIndex];
        this.coinText.setText(`$${player.currentIncome}`)
        this.carbonText.setText(`${player.currentCC}`)

        this.automobileTypeText.setText(`${player.automobile.type}`)
        this.automobileFuelText.setText(`${player.automobile.fuelCost}`)
        this.automobileCarbonText.setText(`${player.automobile.carbonCost}`)
        
    }

    createPiece (idx, cx, cy) {
        let p;
        switch(idx){
            case 0:
                p = this.add.image(cx-265,cy-270, "blue");
                break;
            case 1:
                p = this.add.image(cx-258,cy-270, "green");
                break;
            case 2:
                p = this.add.image(cx-263,cy-270, "purple");
                break;
            case 3:
                p = this.add.image(cx-268,cy-270, "orange");
                break;
            case 4:
                p = this.add.image(cx-273,cy-270, "yellow");
                break;
        };
        p.setScale(0.6);
        return p;
    }



    updatePlayerAutomobilePosition(index,id,tilePosition){
        console.log("Updating POsition",tilePosition)
        let x=0,y=0;
        if(tilePosition >=0 && tilePosition<=9){
            x=tilePosition;
            y=0;
        }
        else if(tilePosition >9 && tilePosition<=18){
            x=9;
            y=tilePosition-9;
        }
        else if(tilePosition >18 && tilePosition<=27){
            y=9;
            x=27-tilePosition;
        }
        else {
            x=0;
            y=36-tilePosition;
        }

        const piece=this.piecesForPlayer[id];
        console.log(this.piecesForPlayer);
        console.log(BoardOffsetsX[x],BoardOffsetsY[y],piece);

        if(!piece){
            return;
        }

        piece.setPosition(this.cx+BoardOffsetsX[x],this.cy+BoardOffsetsY[y]+index*3);

    }



    showDecisionForm(type,details){
        //type can either be upgrade or build


        if(type==="upgrade"){
            const text1 = this.add.text(this.cx-200, this.cy-200,`Do you want to upgrade your ${details.industry.name}?`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'18px',
                align: "center",
                color:'black'
            });
           




            const text2=this.add.text(this.cx-200, this.cy-140,`Current Level: ${details.industry.level}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'17px',
                color:'#140d4f',
                align: "center"
            });


            const text3=this.add.text(this.cx-200, this.cy-100,`Income: ${details.industry.income}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text4=this.add.text(this.cx-200, this.cy-80,`Carbon FootPrint: ${details.industry.cc}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });


            const nextLevel=details.industry.level+1;
            console.log(details.industry);
            const nextLevelCost=details.industry.industryBuyUpgradeCost[`level${nextLevel}Cost`]
            const nextLevelIncome=details.industry.industryBuyUpgradeCost[`level${nextLevel}Income`]
            const nextLevelCC=details.industry.industryBuyUpgradeCost[`level${nextLevel}CC`]

            const text5=this.add.text(this.cx-200, this.cy-20,`Next Level: ${nextLevel}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'17px',
                color:'#140d4f',
                align: "center"
            });

            const text6=this.add.text(this.cx-200, this.cy+20,`Upgrade Cost: ${nextLevelCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text7=this.add.text(this.cx-200, this.cy+40,`Income: ${nextLevelIncome}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });


            const text8=this.add.text(this.cx-200, this.cy+60,`Carbon FootPrint: ${nextLevelCC}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });


            





            
    
            const upgradeButton = this.add.image(this.cx-80,this.cy+200,"upgrade_button").setInteractive();
            upgradeButton.setScale(0.2);
            upgradeButton.on('pointerover',()=>{
                upgradeButton.setScale(0.21);
                document.getElementById("game-canvas").style.cursor = "pointer";
            })
            upgradeButton.on('pointerout',()=>{
                upgradeButton.setScale(0.2);
                document.getElementById("game-canvas").style.cursor = "default";
            })
    
            upgradeButton.on('pointerdown',()=>{
                //console.log(true)
                
                document.getElementById("game-canvas").style.cursor = "default";
                text1.destroy();
                text2.destroy();
                text3.destroy();
                text4.destroy();
                text5.destroy();
                text6.destroy();
                
             
                text7.destroy();
                text8.destroy();
                upgradeButton.destroy();
                cancelButton.destroy();
                ServerEvents.emit("player-decision-response",true)
               
            })


            const cancelButton = this.add.image(this.cx+80,this.cy+200,"cancel_button").setInteractive();
            cancelButton.setScale(0.2);
            cancelButton.on('pointerover',()=>{
                cancelButton.setScale(0.21);
                document.getElementById("game-canvas").style.cursor = "pointer";
            })
            cancelButton.on('pointerout',()=>{
                cancelButton.setScale(0.2);
                document.getElementById("game-canvas").style.cursor = "default";
            })
            cancelButton.on('pointerdown',()=>{
                //console.log(false)
                document.getElementById("game-canvas").style.cursor = "default";
                text1.destroy();
                text2.destroy();
                text3.destroy();
                text4.destroy();
                text5.destroy();
                text6.destroy();
                
             
                text7.destroy();
                text8.destroy();
                upgradeButton.destroy();
                cancelButton.destroy();
                
                ServerEvents.emit("player-decision-response",false)
            })
        }
        else if(type==="build"){
            const text1=this.add.text(this.cx-200, this.cy-200,`You have arrived at ${details.region}!`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'18px',
                align: "center",
                color:'black'
            });
            const text2=this.add.text(this.cx-200, this.cy-160,`You can build one of the below industries here!`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'18px',
                align: "center",
                color:'black'
            });
           




            const text3=this.add.text(this.cx-200, this.cy-120,`${details.industry_1.name}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'17px',
                color:'#140d4f',
                align: "center"
            });


            const text4=this.add.text(this.cx-200, this.cy-80,`Build Cost: ${details.industry_1.baseCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text5=this.add.text(this.cx-200, this.cy-60,`Carbon FootPrint: ${details.industry_1.baseCC}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text6=this.add.text(this.cx-200, this.cy-40,`Income: ${details.industry_1.baseIncome}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const buildButton_1 = this.add.image(this.cx+100,this.cy-60,"build_button").setInteractive();
            buildButton_1.setScale(0.15);
            buildButton_1.on('pointerover',()=>{
                buildButton_1.setScale(0.16);
                document.getElementById("game-canvas").style.cursor = "pointer";
            })
            buildButton_1.on('pointerout',()=>{
                buildButton_1.setScale(0.15);
                document.getElementById("game-canvas").style.cursor = "default";
            })
    
            buildButton_1.on('pointerdown',()=>{
                console.log({status:true,industry:details.industry_1})
                document.getElementById("game-canvas").style.cursor = "default";
                text1.destroy();
                text2.destroy();
                text3.destroy();
                text4.destroy();
                text5.destroy();
                text6.destroy();
                buildButton_1.destroy();
            
                text7.destroy();
                text8.destroy();
                text9.destroy();
                text10.destroy();
                buildButton_2.destroy();
                cancelButton.destroy();
                ServerEvents.emit("player-decision-response", {status:true,industry:details.industry_1});
            })





            const text7=this.add.text(this.cx-200, this.cy,`${details.industry_2.name}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'17px',
                color:'#140d4f',
                align: "center"
            });


            const text8=this.add.text(this.cx-200, this.cy+40,`Build Cost: ${details.industry_2.baseCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text9=this.add.text(this.cx-200, this.cy+60,`Carbon FootPrint: ${details.industry_2.baseCC}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text10=this.add.text(this.cx-200, this.cy+80,`Income: ${details.industry_2.baseIncome}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const buildButton_2 = this.add.image(this.cx+100,this.cy+60,"build_button").setInteractive();
            buildButton_2.setScale(0.15);
            buildButton_2.on('pointerover',()=>{
                buildButton_2.setScale(0.16);
                document.getElementById("game-canvas").style.cursor = "pointer";
            })
            buildButton_2.on('pointerout',()=>{
                buildButton_2.setScale(0.15);
                document.getElementById("game-canvas").style.cursor = "default";
            })
    
            buildButton_2.on('pointerdown',()=>{
                console.log({status:true,industry:details.industry_2})
                document.getElementById("game-canvas").style.cursor = "default";

                text1.destroy();
                text2.destroy();
                text3.destroy();
                text4.destroy();
                text5.destroy();
                text6.destroy();
                buildButton_1.destroy();
                text7.destroy();
                text8.destroy();
                text9.destroy();
                text10.destroy();
                buildButton_2.destroy();
                cancelButton.destroy();
                ServerEvents.emit("player-decision-response", {status:true,industry:details.industry_2});
            })




            const cancelButton = this.add.image(this.cx,this.cy+200,"cancel_button").setInteractive();
            cancelButton.setScale(0.2);
            cancelButton.on('pointerover',()=>{
                cancelButton.setScale(0.21);
                document.getElementById("game-canvas").style.cursor = "pointer";
            })
            cancelButton.on('pointerout',()=>{
                cancelButton.setScale(0.2);
                document.getElementById("game-canvas").style.cursor = "default";
            })
            cancelButton.on('pointerdown',()=>{
                document.getElementById("game-canvas").style.cursor = "default";
                text1.destroy();
                text2.destroy();
                text3.destroy();
                text4.destroy();
                text5.destroy();
                text6.destroy();
              
                buildButton_1.destroy();
                text7.destroy();
                text8.destroy();
                text9.destroy();
                text10.destroy();
                buildButton_2.destroy();
                cancelButton.destroy();
                ServerEvents.emit("player-decision-response", {status:false}); 
            })
        }

        else if(type==="automobile_upgrade"){
            const text1 = this.add.text(this.cx-200, this.cy-200,`Do you want to upgrade your Automobile?`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'18px',
                align: "center",
                color:'black'
            });
           




            const text2=this.add.text(this.cx-200, this.cy-140,`Current Level: ${details.currentLevel.type}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'17px',
                color:'#140d4f',
                align: "center"
            });


            const text3=this.add.text(this.cx-200, this.cy-100,`Fuel Cost: ${details.currentLevel.fuelCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text4=this.add.text(this.cx-200, this.cy-80,`Carbon Cost: ${details.currentLevel.carbonCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });




            const text5=this.add.text(this.cx-200, this.cy-20,`Next Level: ${details.nextLevel.type}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'17px',
                color:'#140d4f',
                align: "center"
            });

            const text6=this.add.text(this.cx-200, this.cy+20,`Upgrade Cost: ${details.nextLevel.upgradeCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });

            const text7=this.add.text(this.cx-200, this.cy+40,`Fuel Cost: ${details.nextLevel.fuelCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });


            const text8=this.add.text(this.cx-200, this.cy+60,`Carbon Cost: ${details.nextLevel.carbonCost}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'15px',
                align: "center"
            });


            





            
    
            const upgradeButton = this.add.image(this.cx-80,this.cy+200,"upgrade_button").setInteractive();
            upgradeButton.setScale(0.2);
            upgradeButton.on('pointerover',()=>{
                upgradeButton.setScale(0.21);
                document.getElementById("game-canvas").style.cursor = "pointer";
            })
            upgradeButton.on('pointerout',()=>{
                upgradeButton.setScale(0.2);
                document.getElementById("game-canvas").style.cursor = "default";
            })
    
            upgradeButton.on('pointerdown',()=>{
                //console.log(true)
                document.getElementById("game-canvas").style.cursor = "default";
                text1.destroy();
                text2.destroy();
                text3.destroy();
                text4.destroy();
                text5.destroy();
                text6.destroy();
                
             
                text7.destroy();
                text8.destroy();
                upgradeButton.destroy();
                cancelButton.destroy();
                ServerEvents.emit("player-decision-response",true)
            })


            const cancelButton = this.add.image(this.cx+80,this.cy+200,"cancel_button").setInteractive();
            cancelButton.setScale(0.2);
            cancelButton.on('pointerover',()=>{
                cancelButton.setScale(0.21);
                document.getElementById("game-canvas").style.cursor = "pointer";
            })
            cancelButton.on('pointerout',()=>{
                cancelButton.setScale(0.2);
                document.getElementById("game-canvas").style.cursor = "default";
            })
            cancelButton.on('pointerdown',()=>{
                //console.log(false)
                document.getElementById("game-canvas").style.cursor = "default";
                text1.destroy();
                text2.destroy();
                text3.destroy();
                text4.destroy();
                text5.destroy();
                text6.destroy();
                
             
                text7.destroy();
                text8.destroy();
                upgradeButton.destroy();
                cancelButton.destroy();
                
                ServerEvents.emit("player-decision-response",false)
            })
        }
        
    }

    updateLeaderBoard(players) {

        console.log("Updating LeaderBoard",players);

        const leaderboardPlayers = players.map(player => {
            return {
                username: player.username,
                currentIncome: player.currentIncome,
                currentCC: player.currentCC
            }
        });

        leaderboardPlayers.sort((a, b) => {
            if(a.currentCC < b.currentCC) return -1;
            else return 1;
            //a.currentCC > b.currentCC
        });

        console.log("leader board players");
        console.log(leaderboardPlayers);

        const ul = document.getElementById("leaderboard");
        ul.innerHTML = "";

        leaderboardPlayers.forEach((player, idx) => {
            let li = document.createElement("li");
            li.innerHTML = `<div class="name">${idx+1}. ${player.username}</div>
                                <div class="currency">
                                    $ ${player.currentIncome} k
                                    CC ${player.currentCC}
                                </div>`

            ul.appendChild(li);
        });
    }

    addToMsgScreen(data) {
        const ul = document.getElementById("msg-display");

        let li = document.createElement("li");
        li.innerHTML = `<div class="name">${data.username}:</div>
                        <div class="msg">${data.msg}</div>`

        ul.appendChild(li);
    }

}