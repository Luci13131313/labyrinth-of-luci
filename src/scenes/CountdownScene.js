export default class CountdownScene extends Phaser.Scene {
    constructor() {
        super('CountdownScene');
        this.countdownTimer = 3;
        this.countdownText = '';
        this.countdownAlpha = 1;
        this.countdownScale = 0.5;
    }

    init(data) {
        this.wave = data.wave;
    }

    create() {
        this.cameras.main.setBackgroundColor('#0D0D0D');
        this.countdownText = this.add.text(180, 180, `Wave ${this.wave} in 3`, { font: '20px Arial', fill: '#FF0000' }).setOrigin(0.5);
    }

    update(time, delta) {
        delta /= 1000;
        this.countdownTimer -= delta;
        this.countdownAlpha -= delta / 3;
        this.countdownScale += delta / 1.5;

        if (this.countdownTimer <= 2.25) this.countdownText.setText('2');
        if (this.countdownTimer <= 1.5) this.countdownText.setText('1');
        if (this.countdownTimer <= 0.75) this.countdownText.setText('GO!');
        this.countdownText.setScale(this.countdownScale);
        this.countdownText.setAlpha(this.countdownAlpha);

        if (this.countdownTimer <= 0) {
            this.scene.start('GameScene');
        }
    }
}