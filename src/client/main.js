import 'regenerator-runtime/runtime';
import Phaser from 'phaser';

import Game from './scenes/Game'

const config = {
	type: Phaser.AUTO,
	width: 1000,
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 }
		}
	},
	//pixelArt: true,//here
	scale:{
		mode:Phaser.Scale.ScaleModes.FIT,
	},
	
	scene: [Game]
}

export default new Phaser.Game(config)
