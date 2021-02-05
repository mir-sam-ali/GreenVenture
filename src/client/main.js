import 'regenerator-runtime/runtime';
import Phaser from 'phaser';

import Game from './scenes/Game'

const config = {
	type: Phaser.AUTO,
	parent: 'game-canvas',
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 }
		}
	},
	backgroundColor: "#329C0D",
	// pixelArt: true,//here
	// antialias: false,
	// scale:{
	// 	mode:Phaser.Scale.ScaleModes.FIT,
	// },
	
	scene: [Game]
}

export default new Phaser.Game(config)
