import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';

export default class HelloWorldScene extends Phaser.Scene
{
	constructor()
	{
		super('Game')
    }
    
    init()
    {
        this.client = new Colyseus.Client('ws://localhost:2567');
    }

	preload()
    {
        
    }

    async create()
    {
        const room = await this.client.joinOrCreate('GameRoom');
        console.log("connected to room:", room.name);

        
    }
}