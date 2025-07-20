export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.score = data.score;
    }

    create() {
        this.cameras.main.setBackgroundColor('#0D0D0D');
        this.add.text(180, 180, `Game Over\nScore: ${this.score}`, { font: '24px Arial', fill: '#FF0000', align: 'center' }).setOrigin(0.5);
        this.add.text(180, 240, 'Tap to Play Again', { font: '16px Arial', fill: '#FFFFFF' }).setOrigin(0.5);

        this.input.on('pointerdown', () => {
            this.scene.start('GuideScene');
            window.FarcadeSDK.singlePlayer.actions.ready();
        });
    }
}