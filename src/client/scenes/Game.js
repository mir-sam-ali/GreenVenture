import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import StateMachine from '../statemachine/StateMachine';
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

export default class Game extends Phaser.Scene
{
    piecesForPlayer = {};
    

	constructor()
	{
        super('game')
        this.diceRollAnimationAccumulator=0;
        this.playerIndex=-1; // Client's Index

        
    }
    
    
    init()
    {
        this.client = new Colyseus.Client('ws://localhost:2567');
        this.stateMachine= new StateMachine(this,"game");
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

        const room = await this.client.joinOrCreate('GameRoom');
        this.room = room;
        // console.log("connected to room:", room.name,room.sessionId);

        room.onStateChange.once(state=>{
            console.log(state);
            this.handleInitialState(state, cx, cy);
            const text = this.add.text(cx-290, cy-350,`Current Turn: ${indexToColorMapping[state.currentPlayerTurnIndex]}`, {
                fontFamily: '"Paytone one", san-serif',
                fontSize:'28px',
                align: "center"
            });
            this.text = text;
        
            this.stateMachine.setState("wait-for-dice-roll");
        })
            
        this.room.state.playerStates.onAdd = (item) => {
            console.log("onAdd func", item);
            this.initializePlayerState(item, cx, cy);
        } 

        this.room.state.playerStates.onRemove = (item) => {
            console.log("onRemove func", item);
            const pieces = this.piecesForPlayer[item.id];
            if(!pieces) {
                return 
            }

            pieces.forEach(piece => piece.destroy());
        } 


        const dice=this.add.sprite(cx-dicePositionsOffset[0].x, cy-dicePositionsOffset[0].y, 'die-image-6').setInteractive();
        dice.setScale(0.8);
        this.dice=dice;

        dice.on('pointerdown', (pointer)=> {

            if(this.room.state.currentPlayerTurnIndex===this.playerIndex)
                this.stateMachine.setState('dice-roll');
    
        });

        

        this.room.onMessage('*',(type,message)=>{
            //console.log(type);
            if(type=="DiceRollResult")
                ServerEvents.emit("DiceRollResult",message);
            else if(type=="NewPlayerPosition")
                ServerEvents.emit("NewPlayerPosition",message);
        })
    }

    // @ts-ignore
    update(t,dt){
        this.stateMachine.update(dt);
    }

    handleDiceRollEnter(){
           
            console.log(this.room.state.currentPlayerTurnIndex,this.playerIndex)
            if(this.room.state.currentPlayerTurnIndex===this.playerIndex){
            this.room.send("DiceRoll");
            //console.log(this.room)

            const value=Phaser.Math.Between(1,6);
            this.dice.setTexture(`die-image-${value}`);
            this.diceRollAnimationAccumulator=0;

            

            ServerEvents.once("DiceRollResult",(message)=>{
                
                this.room.state.lastDiceValue=message;
                this.stateMachine.setState('player-movement')
                
            })
        }
        else{
            this.stateMachine.setState('wait-for-dice-roll');
        }

    }

    handleInitialState (state, cx, cy) {
        // console.log(state) 
        //console.log("Handle Initial State",this.room.state.playerStates)
        // @ts-ignore
        state.playerStates.forEach((playerState, idx) => {
            // console.log(playerState);
            this.initializePlayerState(playerState, cx, cy);
        });
    }

    initializePlayerState (playerState, cx, cy) {
        console.log("Initialize Player State ",playerState)
        
        if(! (playerState.id in  this.piecesForPlayer)) {
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

    handleDiceRollFinishEnter(){
        let prev_turn=this.room.state.currentPlayerTurnIndex;
        let next_turn=prev_turn+1;
        console.log(prev_turn);

        if(prev_turn==(this.room.state.playerStates.length-1)){
            next_turn=0;
        }

        this.text.setText(`Current Turn: ${indexToColorMapping[next_turn]}`);
        // this.text.setColor(colors[next_turn]);

        console.log(this.room.state.lastDiceValue);
        this.dice.setTexture(`die-image-${this.room.state.lastDiceValue}`);
        this.stateMachine.setState("wait-for-dice-roll");
        
    }

    handleWaitForDiceRoll(){
        ServerEvents.once("DiceRollResult",(message)=>{
            //console.log(message);
            this.room.state.lastDiceValue=message;
            this.stateMachine.setState('wait-for-player-movement')
        })
    }

    handlePlayerMovementEnter(){
        this.room.send("UpdatePosition",{index:this.playerIndex});

        ServerEvents.once("NewPlayerPosition",(message)=>{
                
            console.log(message);
            this.updatePlayerAutomobilePosition(message.index,message.id,message.newPosition)
            this.stateMachine.setState('dice-roll-finish');
            
        })

    }

    // handlePlayerMovementUpdate(dt){
        
    // }

    handleWaitForPlayerMovement(){
        ServerEvents.once("NewPlayerPosition",(message)=>{                
            console.log(message);
            this.updatePlayerAutomobilePosition(message.index,message.id,message.newPosition)
            this.stateMachine.setState('dice-roll-finish');            
        })
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
        console.log(BoardOffsetsX[x],BoardOffsetsY[y]);
        piece.setPosition(this.cx+BoardOffsetsX[x],this.cy+BoardOffsetsY[y]);

    }

}