import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import StateMachine from '../statemachine/StateMachine';
//import ClientMessage from "../../ClientMessage"

const dicePositionsOffset=[
    {x:400,y:200},
    {x:-400,y:200},
    {x:-400,y:-200},
    {x:400,y:-200},
]



export default class Game extends Phaser.Scene
{
	constructor()
	{
        super('game')
        this.diceRollAnimationAccumulator=0;
        
    }
    
    
    init()
    {
        this.client = new Colyseus.Client('ws://localhost:2567');
        this.stateMachine= new StateMachine(this,"game");
        this.stateMachine.addState('idle')
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
            this.load.image(`die-image-${i}`,`assets/Dice/dieRed_border${i}.png`)
        }
    }

    async create()
    {
        
        const {width,height} = this.scale;
        const cx=width*0.5;
        const cy=height*0.5;
        const board=this.add.image(width*0.5,height*0.5,"board");
        board.setScale(0.36, 0.36);

        const room = await this.client.joinOrCreate('GameRoom');
        this.room = room;
        console.log("connected to room:", room.name,room.sessionId);

        room.onStateChange.once(state=>{
            // console.dir(state);
            // console.log(state.playerStates);
            state.playerStates.forEach((playerState,idx)=>{
                switch(idx){
                    case 0:
                        this.add.image(cx-253,cy-270,"blue");
                        break;
                    case 1:
                        this.add.image(cx-258,cy-270,"green");
                        break;
                    case 2:
                        this.add.image(cx-263,cy-270,"purple");
                        break;
                    case 3:
                        this.add.image(cx-268,cy-270,"orange");
                        break;
                    case 4:
                        this.add.image(cx-273,cy-270,"yellow");
                        break;
                }
            })
        })


        // Dice

        const dice=this.add.sprite(cx-dicePositionsOffset[3].x,cy-dicePositionsOffset[3].y,'die-image-6').setInteractive();
        this.dice=dice;
        dice.on('pointerdown', (pointer)=> {

            //console.log(this)
            this.stateMachine.setState('dice-roll');
    
        });
       
        



    }

    update(t,dt){
        this.stateMachine.update(dt);
    }

    handleDiceRollEnter(){
           

            this.room.send("DiceRoll");
            //console.log(this.room)

            const value=Phaser.Math.Between(1,6);
            this.dice.setTexture(`die-image-${value}`);
            this.diceRollAnimationAccumulator=0;

            


            this.room.state.onChange=(changes=>{
                console.log(changes);
                if(changes && changes.length!==0){
                changes.forEach(change=>{
                    if(change.field!=="lastDiceValue"){
                        return;
                    }
                    this.room.state.onChange=undefined;

                    this.time.delayedCall(1000,()=>{
                        this.stateMachine.setState('dice-roll-finish')
                    })
                    
                })}
            })

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
    }
}
