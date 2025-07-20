export default class GuideScene extends Phaser.Scene {
    constructor() {
        super('GuideScene');
        this.loadingTimer = 5;
    }

    preload() {
        this.load.image('player', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/images/FarDead%20(1).png');
        this.load.audio('soundtrack', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/Bbzld2.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0D0D0D');
        this.soundtrack = this.sound.add('soundtrack', { loop: true, volume: 0.2 });

        const scale = 0.7 + Math.sin(Date.now() / 1000) * 0.05;
        const player = this.add.sprite(180, 180, 'player').setScale(scale);
        const gradient = this.add.circle(180, 180, 150, 0x0000FF, 0.8);
        gradient.setBlendMode('ADD');

        this.add.text(180, 80, 'Labyrinth Of Luci', { font: '36px Arial', fill: '#FF0000' }).setOrigin(0.5);
        this.add.text(180, 280, 'Survive on the path! Avoid lava walls!', { font: '16px Arial', fill: '#800080' }).setOrigin(0.5);

        this.loadingBar = this.add.rectangle(140, 235, 100, 10, 0x800080).setOrigin(0);
        this.loadingBar.setVisible(this.loadingTimer > 0);

        this.startText = this.add.text(180, 320, 'Tap to Start', { font: '16px Arial', fill: '#FF0000' }).setOrigin(0.5);
        this.startText.setVisible(this.loadingTimer <= 0);

        this.input.on('pointerdown', () => {
            if (this.loadingTimer <= 0) {
                this.scene.start('CountdownScene', { wave: 1 });
                window.FarcadeSDK.singlePlayer.actions.ready();
            }
        });
    }

    update(time, delta) {
        delta /= 1000;
        this.loadingTimer = Math.max(0, this.loadingTimer - delta);
        if (this.loadingTimer > 0) {
            this.loadingBar.setScale((1 - this.loadingTimer / 5), 1);
        } else {
            this.loadingBar.setVisible(false);
            this.startText.setVisible(true);
            this.startText.setAlpha(0.5 + Math.sin(Date.now() / 500) * 0.5);
        }
    }
}