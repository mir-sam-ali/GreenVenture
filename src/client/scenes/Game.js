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
    }

    async create()
    {
        
        const {width,height}=this.scale;
        const board=this.add.image(width,height,"board");
        board.setScale(0.35)
        board.setOrigin(1.3,1.02)
        // board.setDisplaySize(500,500);
       

        const room = await this.client.joinOrCreate('GameRoom');
        console.log("connected to room:", room.name);


        

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
