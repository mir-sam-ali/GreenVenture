import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import StateMachine from '../statemachine/StateMachine';
//import ClientMessage from "../../ClientMessage"

const dicePositionsOffset = [
    {x:400,y:200},
    {x:-400,y:200},
    {x:-400,y:-200},
    {x:400,y:-200},
]

const indexToColorMapping=["Blue","Green","Purple","Orange","Yellow"]
const colors=["#6ED3F7","#5DEA53","#E5C8FF","#ED5F0D","#EDDE0C"]


const ServerEvents= new Phaser.Events.EventEmitter();


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
            //console.log(`die-image-${i}`,`Dice/dieRed_border${i}.png`)
            // console.log(`die-image-${i}`,`Dice/dieRed_border${i}.png`)
            this.load.image(`die-image-${i}`,`assets/Dice/dieRed_border${i}.png`)
        }
    }

    async create()
    {
        
        const {width,height} = this.scale;
        const cx = width*0.5;
        const cy = height*0.5;
        const board = this.add.image(width*0.5,height*0.5,"board");
        board.setScale(0.36, 0.36);

        const room = await this.client.joinOrCreate('GameRoom');
        this.room = room;
        console.log("connected to room:", room.name,room.sessionId);

        room.onStateChange.once(state=>{
            // console.dir(state);
            // console.log(state.playerStates);
            // state.playerStates.forEach((playerState,idx)=>{
            //     switch(idx){
            //         case 0:
            //             this.add.image(cx-253,cy-270,"blue");
            //             break;
            //         case 1:
            //             this.add.image(cx-258,cy-270,"green");
            //             break;
            //         case 2:
            //             this.add.image(cx-263,cy-270,"purple");
            //             break;
            //         case 3:
            //             this.add.image(cx-268,cy-270,"orange");
            //             break;
            //         case 4:
            //             this.add.image(cx-273,cy-270,"yellow");
            //             break;
            //     }
                
            // })
            //console.log(state);
            this.handleInitialState(state, cx, cy);
            const text = this.add.text(350, 40,`It's ${indexToColorMapping[state.currentPlayerTurnIndex]} Player's Turn`, {
                fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
                // @ts-ignore
                fontSize:'30px',
                color:colors[state.currentPlayerTurnIndex],
                // fill: "#ff0044",
                align: "center"
            });
            this.text = text;
        
            this.stateMachine.setState("wait-for-dice-roll");
        })
            

        // console.log("connected to room:", row`om.name,room.sessionId);
        // console.log("room", room.state.playerStates);

        // room.onStateChange(state => {
            
        // })


        this.room.state.playerStates.onAdd = (item) => {
            //console.log("onAdd func", item);
            this.initializePlayerState(item, cx, cy);
        } 

        this.room.state.playerStates.onRemove = (item) => {
            //console.log("onRemove func", item);
            const pieces = this.piecesForPlayer[item.id];
            if(!pieces) {
                return 
            }

            pieces.forEach(piece => piece.destroy());
        } 


        const dice=this.add.sprite(cx-dicePositionsOffset[3].x,cy-dicePositionsOffset[3].y,'die-image-6').setInteractive();
        this.dice=dice;

        
    

        // @ts-ignore
        dice.on('pointerdown', (pointer)=> {

            //console.log(this)
            if(this.room.state.currentPlayerTurnIndex===this.playerIndex)
                this.stateMachine.setState('dice-roll');
    
        });

        console.log("Here",this.room.state);

       
        // @ts-ignore
        //text.anchor.setTo(0.5, 0.5);
       
        // @ts-ignore
        this.room.onMessage('*',(type,message)=>{
            //console.log(type);
            ServerEvents.emit("DiceRollResult",message);
        })
        // this.room.state.onChange=(changes=>{
        //     ServerEvents.emit('onChange',changes);
        // })
        
        



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

                this.time.delayedCall(1000,()=>{
                    this.stateMachine.setState('dice-roll-finish')
                })
            })
            // this.room.state.onChange=(changes=>{
            //     console.log(changes);
            //     if(changes && changes.length!==0){
            //     changes.forEach(change=>{
            //         if(change.field!=="lastDiceValue"){
            //             return;
            //         }
                    
                    
            //     })}
            // })
        }else{
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
        //console.log("Initialize Player State")
        if(! (playerState.id in  this.piecesForPlayer)) {
            this.piecesForPlayer[playerState.id] = [];
        }

        const idx = playerState.index;
        const playerPiecesList = this.piecesForPlayer[playerState.id];
        if(playerState.id===this.room.sessionId){
            console.log(idx,playerState.id);
            this.playerIndex=idx;
        }
        const newPiece = this.createPiece(idx, cx, cy);
        if(!newPiece) {
            return
        }

        playerPiecesList.push(newPiece);
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
        
        this.dice.setTexture(`die-image-${this.room.state.lastDiceValue}`);
        this.stateMachine.setState("wait-for-dice-roll");
        this.room.state.currentPlayerTurnIndex+=1;
        if(this.room.state.currentPlayerTurnIndex==this.room.state.playerStates.length){
            this.room.state.currentPlayerTurnIndex=0;
        }
        this.text.setText(`It's ${indexToColorMapping[this.room.state.currentPlayerTurnIndex]} Player's Turn`);
        this.text.setColor(colors[this.room.state.currentPlayerTurnIndex]);
    }

    handleWaitForDiceRoll(){
        ServerEvents.once("DiceRollResult",(message)=>{
            //console.log(message);
            this.room.state.lastDiceValue=message;

            this.time.delayedCall(1000,()=>{
                this.stateMachine.setState('dice-roll-finish')
            })
        })
    }

    createPiece (idx, cx, cy) {
        switch(idx){
            case 0:
                return this.add.image(cx-253,cy-270, "blue");
                
            case 1:
                return this.add.image(cx-258,cy-270, "green");
                
            case 2:
                return this.add.image(cx-263,cy-270, "purple");
                
            case 3:
                return this.add.image(cx-268,cy-270, "orange");
                
            case 4:
                return this.add.image(cx-273,cy-270, "yellow");
                
        };
    }

}
