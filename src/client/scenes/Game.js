import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';

export default class Game extends Phaser.Scene
{
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
        this.load.image("background","assets/background/green-building.jpg")
        this.load.image("board","assets/board.svg");
        this.load.image("blue","assets/sprites/player1/automobile.png")
        this.load.image("green","assets/sprites/player2/automobile.png")
        this.load.image("purple","assets/sprites/player3/automobile.png")
        this.load.image("orange","assets/sprites/player4/automobile.png")
        this.load.image("yellow","assets/sprites/player5/automobile.png")
    }

    async create()
    {
        
        const {width,height}=this.scale;
        const cx=width*0.5;
        const cy=height*0.5;
        const background=this.add.image(window.innerWidth,window.innerHeight,"background");
        const board=this.add.image(width*0.5,height*0.5,"board");
        board.setScale(0.35)
        //board.setOrigin(1.3,1.02)
        background.setOrigin(1.4,1.3)

        //background.setDisplaySize(window.innerWidth,window.innerHeight);
        // board.setDisplaySize(500,500);
       

        const room = await this.client.joinOrCreate('GameRoom');
        console.log("connected to room:", room.name,room.sessionId);
        room.onStateChange(state=>{
            console.dir(state);
            console.log(state.playerStates);
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
}
