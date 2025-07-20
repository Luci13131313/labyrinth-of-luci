import Phaser from 'phaser';
import GuideScene from './scenes/GuideScene';
import GameScene from './scenes/GameScene';
import CountdownScene from './scenes/CountdownScene';
import GameOverScene from './scenes/GameOverScene';

const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 360,
    parent: 'gameDiv',
    scene: [GuideScene, GameScene, CountdownScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        max: { width: 360, height: 480 }
    }
};

const game = new Phaser.Game(config);