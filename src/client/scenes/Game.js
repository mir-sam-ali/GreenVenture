import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';

const dicePositionsOffset = [
    {x:400,y:200},
    {x:-400,y:200},
    {x:-400,y:-200},
    {x:400,y:-200},
]

export default class Game extends Phaser.Scene
{
    piecesForPlayer = {};

	constructor()
	{
		super('game')
    }
    
    
    init()
    {
        this.client = new Colyseus.Client('ws://localhost:2567');
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
        // console.log("connected to room:", room.name,room.sessionId);
        // console.log("room", room.state.playerStates);

        room.onStateChange(state => {
            console.log(state);
            this.handleInitialState(state, cx, cy);
        })


        room.state.playerStates.onAdd = (item) => {
            // console.log("onAdd func", item);
            this.initializePlayerState(item, cx, cy);
        } 

        room.state.playerStates.onRemove = (item) => {
            // console.log("onRemove func", item);
            const pieces = this.piecesForPlayer[item.id];
            if(!pieces) {
                return 
            }

            pieces.forEach(piece => piece.destroy());
        } 


        // Dice
        const dice=this.add.sprite(cx-dicePositionsOffset[3].x,cy-dicePositionsOffset[3].y,'die-image-6');


        // room.onMessage("keydown",(message)=>{
        //     console.log(message);
        // })

        // this.input.keyboard.on("keydown",(evt)=>{
        //     room.send('keyboard',evt.key);
        // })

        // this.add.image(400, 300, 'sky')

        // const particles = this.add.particles('red')

        // const emitter = particles.createEmitter({
        //     speed: 100,
        //     scale: { start: 1, end: 0 },
        //     blendMode: 'ADD'
        // })

        // const logo = this.physics.add.image(400, 100, 'logo')

        // logo.setVelocity(100, 200)
        // logo.setBounce(1, 1)
        // logo.setCollideWorldBounds(true)

        // emitter.startFollow(logo)

    }

    handleInitialState (state, cx, cy) {
        // console.log(state) 
        state.playerStates.forEach((playerState, idx) => {
            // console.log(playerState);
            this.initializePlayerState(playerState, cx, cy);
        });
    }

    initializePlayerState (playerState, cx, cy) {
        if(! (playerState.id in  this.piecesForPlayer)) {
            this.piecesForPlayer[playerState.id] = [];
        }

        const idx = playerState.index;
        const playerPiecesList = this.piecesForPlayer[playerState.id];

        const newPiece = this.createPiece(idx, cx, cy);
        if(!newPiece) {
            return
        }

        playerPiecesList.push(newPiece);

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