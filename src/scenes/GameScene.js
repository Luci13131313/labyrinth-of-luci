export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null;
        this.pathGraphics = null;
        this.pathPoints = [];
        this.visiblePathSegments = [];
        this.startZone = null;
        this.endZone = null;
        this.wave = 1;
        this.waveTimer = 15;
        this.waveTimeLimit = 15;
        this.score = 0;
        this.drops = [];
        this.particles = [];
        this.statusMessages = [];
        this.isControlReversed = false;
        this.damageCooldown = 0;
        this.isMuted = false;
        this.potionSpawnTimer = 0;
    }

    preload() {
        this.load.image('player', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/images/FarDead%20(1).png');
        this.load.image('heart', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/images/PotYellow.png');
        this.load.image('muscle', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/images/PotBlue.png');
        this.load.image('potion', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/images/PotPurple.png');
        this.load.image('random', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/images/PotRed.png');
        this.load.image('dead', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/images/FarDead%20(1).png');
        this.load.audio('soundtrack', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/Bbzld2.mp3');
        this.load.audio('health', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/%2B10.mp3');
        this.load.audio('rampage', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/Rampage.mp3');
        this.load.audio('bamboozled', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/Bamboozled!.mp3');
        this.load.audio('thatsOK', 'https://raw.githubusercontent.com/Luci13131313/Ktana/main/assets/ThatsOK.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0D0D0D');
        this.player = this.physics.add.sprite(20, 20, 'player').setOrigin(0.5);
        this.player.setCollideWorldBounds(true);
        this.player.health = 999;
        this.player.maxHealth = 999;
        this.player.blinkTimer = 0;
        this.player.moveCooldown = 0;

        this.pathGraphics = this.add.graphics();
        this.spawnWave();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {};
        this.input.keyboard.on('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        this.input.keyboard.on('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.joystick = null;
        this.input.on('pointerdown', (pointer) => {
            this.joystick = { active: true, startX: pointer.x, startY: pointer.y, dx: 0, dy: 0 };
            window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
        });
        this.input.on('pointermove', (pointer) => {
            if (this.joystick && this.joystick.active) {
                const dist = Phaser.Math.Distance.Between(this.joystick.startX, this.joystick.startY, pointer.x, pointer.y);
                if (dist > 30) {
                    const angle = Phaser.Math.Angle.Between(this.joystick.startX, this.joystick.startY, pointer.x, pointer.y);
                    this.joystick.dx = Math.cos(angle) * 30;
                    this.joystick.dy = Math.sin(angle) * 30;
                } else {
                    this.joystick.dx = pointer.x - this.joystick.startX;
                    this.joystick.dy = pointer.y - this.joystick.startY;
                }
            }
        });
        this.input.on('pointerup', () => {
            this.joystick = null;
            window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
        });

        this.soundtrack = this.sound.add('soundtrack', { loop: true, volume: 0.2 });
        if (!this.isMuted) this.soundtrack.play();

        window.FarcadeSDK.on('toggle_mute', (data) => {
            this.isMuted = data.isMuted;
            if (this.isMuted) {
                this.sound.pauseAll();
            } else {
                this.sound.resumeAll();
            }
        });
        window.FarcadeSDK.on('play_again', () => this.resetGame());
    }

    spawnWave() {
        const GRID_SIZE = 20;
        const GRID_WIDTH = 18;
        const GRID_HEIGHT = 18;
        const maze = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(1));
        const segments = [];
        let startX, startY, endX, endY;
        let maxDist = -1;

        for (let i = 0; i < 10; i++) {
            const sx = Math.floor(Math.random() * GRID_WIDTH);
            const sy = Math.floor(Math.random() * GRID_HEIGHT);
            const ex = Math.floor(Math.random() * GRID_WIDTH);
            const ey = Math.floor(Math.random() * GRID_HEIGHT);
            const dist = Math.abs(sx - ex) + Math.abs(sy - ey);
            if (dist > maxDist) {
                maxDist = dist;
                startX = sx;
                startY = sy;
                endX = ex;
                endY = ey;
            }
        }

        maze[startY][startX] = 0;
        maze[endY][endX] = 0;

        function carve(x, y) {
            maze[y][x] = 0;
            const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]].sort(() => Math.random() - 0.5);
            for (const [dx, dy] of directions) {
                const nx = x + dx * 2;
                const ny = y + dy * 2;
                if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT && maze[ny][nx] === 1) {
                    maze[y + dy][x + dx] = 0;
                    segments.push([x, y, nx, ny]);
                    carve(nx, ny);
                }
            }
        }

        carve(startX, startY);

        const path = new Phaser.Curves.Path(startX * GRID_SIZE + GRID_SIZE / 2, startY * GRID_SIZE + GRID_SIZE / 2);
        this.pathPoints = [{ x: startX * GRID_SIZE + GRID_SIZE / 2, y: startY * GRID_SIZE + GRID_SIZE / 2 }];
        let x = startX, y = startY;
        const visited = new Set();
        visited.add(`${x},${y}`);

        while (x !== endX || y !== endY) {
            const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => {
                const nx = x + dx;
                const ny = y + dy;
                return nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT && maze[ny][nx] === 0 && !visited.has(`${nx},${ny}`);
            });

            if (directions.length === 0) break;
            const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
            x += dx;
            y += dy;
            visited.add(`${x},${y}`);
            const currentX = x * GRID_SIZE + GRID_SIZE / 2;
            const currentY = y * GRID_SIZE + GRID_SIZE / 2;
            path.lineTo(currentX, currentY);
            this.pathPoints.push({ x: currentX, y: currentY });
        }

        path.lineTo(endX * GRID_SIZE + GRID_SIZE / 2, endY * GRID_SIZE + GRID_SIZE / 2);
        this.pathPoints.push({ x: endX * GRID_SIZE + GRID_SIZE / 2, y: endY * GRID_SIZE + GRID_SIZE / 2 });

        this.startZone = { x: startX * GRID_SIZE + GRID_SIZE / 2, y: startY * GRID_SIZE + GRID_SIZE / 2 };
        this.endZone = { x: endX * GRID_SIZE + GRID_SIZE / 2, y: endY * GRID_SIZE + GRID_SIZE / 2 };
        this.player.setPosition(this.startZone.x, this.startZone.y);
        this.waveTimeLimit = this.wave <= 5 ? 15 : 30;
        this.waveTimer = this.waveTimeLimit;
        this.visiblePathSegments = [];
        this.pathGraphics.clear();
        this.pathGraphics.lineStyle(this.wave <= 5 ? 48 : 36, 0xaaaaaa);
        path.draw(this.pathGraphics);

        if (Math.random() < 0.5) {
            this.potionSpawnTimer = 2 + Math.random() * 8;
        } else {
            this.potionSpawnTimer = -1;
        }
    }

    isOnPath(x, y) {
        const size = 10;
        const edges = [
            [-size, -size], [size - 1, -size], [-size, size - 1], [size - 1, size - 1]
        ];
        for (const [dx, dy] of edges) {
            const pixelX = Math.floor(x + dx);
            const pixelY = Math.floor(y + dy);
            let onPath = false;
            for (const point of this.pathPoints) {
                if (Phaser.Math.Distance.Between(pixelX, pixelY, point.x, point.y) < 24) {
                    onPath = true;
                    break;
                }
            }
            if (!onPath) return false;
        }
        return true;
    }

    resetGame() {
        this.wave = 1;
        this.player.health = 999;
        this.player.maxHealth = 999;
        this.player.moveCooldown = 0;
        this.player.blinkTimer = 0;
        this.score = 0;
        this.drops.forEach(drop => drop.destroy());
        this.drops = [];
        this.isControlReversed = false;
        this.particles = [];
        this.statusMessages.forEach(msg => msg.destroy());
        this.statusMessages = [];
        this.visiblePathSegments = [];
        this.potionSpawnTimer = 0;
        this.waveTimer = 0;
        this.waveTimeLimit = 0;
        this.spawnWave();
        window.FarcadeSDK.singlePlayer.actions.ready();
    }

    update(time, delta) {
        delta /= 1000;
        if (this.waveTimer > 0) {
            this.waveTimer -= delta;
            this.add.text(180, 50, `Time Left: ${Math.ceil(this.waveTimer)}`, { font: '16px Arial', fill: '#FF0000' }).setOrigin(0.5);
            if (this.waveTimer <= 0) {
                this.wave++;
                this.score += 50;
                this.spawnWave();
                this.scene.start('CountdownScene', { wave: this.wave });
            }
        }

        if (this.potionSpawnTimer > 0) {
            this.potionSpawnTimer -= delta;
            if (this.potionSpawnTimer <= 0) {
                const types = ['heart', 'muscle', 'potion', 'random'];
                const type = types[Math.floor(Math.random() * types.length)];
                const pointIndex = Math.floor(Math.random() * this.pathPoints.length);
                const point = this.pathPoints[pointIndex];
                const drop = this.physics.add.sprite(point.x, point.y, type).setOrigin(0.5);
                drop.type = type;
                this.drops.push(drop);
            }
        }

        if (this.damageCooldown > 0) this.damageCooldown -= delta;
        if (this.player.moveCooldown > 0) this.player.moveCooldown -= delta;

        if (this.player.moveCooldown <= 0) {
            let moveX = 0, moveY = 0;
            if (this.keys) {
                moveX = (this.keys['d'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['a'] || this.keys['ArrowLeft'] ? 1 : 0);
                moveY = (this.keys['s'] || this.keys['ArrowDown'] ? 1 : 0) - (this.keys['w'] || this.keys['ArrowUp'] ? 1 : 0);
            }
            if (this.joystick && this.joystick.active) {
                const dist = Phaser.Math.Distance.Between(0, 0, this.joystick.dx, this.joystick.dy);
                if (dist > 10) {
                    moveX = this.joystick.dx / dist * 0.5;
                    moveY = this.joystick.dy / dist * 0.5;
                }
            }

            const moveSpeed = 5;
            const dx = (this.isControlReversed ? -moveX : moveX) * moveSpeed;
            const dy = (this.isControlReversed ? -moveY : moveY) * moveSpeed;
            const newX = this.player.x + dx;
            const newY = this.player.y + dy;

            if (this.isOnPath(newX, newY)) {
                this.player.setPosition(newX, newY);
                this.player.moveCooldown = 0.083;
                if (this.endZone && Phaser.Math.Distance.Between(newX, newY, this.endZone.x, this.endZone.y) < 10) {
                    this.wave++;
                    this.score += 50;
                    this.spawnWave();
                    this.scene.start('CountdownScene', { wave: this.wave });
                }
            } else if (this.damageCooldown <= 0) {
                this.player.health -= 10;
                this.damageCooldown = 0.5;
                this.player.blinkTimer = 30;
                const damageText = this.add.text(newX, newY - 10, '-10', { font: '16px Arial', fill: '#FF0000' });
                this.statusMessages.push(damageText);
                window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
                if (this.player.health <= 0) {
                    window.FarcadeSDK.singlePlayer.actions.gameOver({ score: this.score });
                    this.scene.start('GameOverScene', { score: this.score });
                }
            }
        }

        this.drops = this.drops.filter(drop => {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, drop.x, drop.y) < 20) {
                this.applyDropEffect(drop);
                drop.destroy();
                return false;
            }
            return true;
        });

        this.pathGraphics.clear();
        this.pathGraphics.lineStyle(this.wave <= 5 ? 48 : 36, 0xaaaaaa);
        for (const [x1, y1, x2, y2] of this.visiblePathSegments) {
            this.pathGraphics.lineBetween(x1, y1, x2, y2);
        }
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, p1.x, p1.y);
            if (dist <= 40 && !this.visiblePathSegments.some(s => s[0] === p1.x && s[1] === p1.y && s[2] === p2.x && s[3] === p2.y)) {
                this.visiblePathSegments.push([p1.x, p1.y, p2.x, p2.y]);
            }
        }

        this.add.circle(this.startZone.x, this.startZone.y, 30, 0x00FF00, 0.8);
        this.add.circle(this.endZone.x, this.endZone.y, 30, 0x0000FF, 0.8);

        if (this.joystick && this.joystick.active) {
            this.add.circle(this.joystick.startX, this.joystick.startY, 30, 0x808080, 0.5);
            this.add.circle(this.joystick.startX + this.joystick.dx, this.joystick.startY + this.joystick.dy, 15, 0xFFFFFF, 0.5);
        }

        this.statusMessages = this.drops.filter(msg => {
            msg.y -= delta * 50;
            msg.alpha -= delta;
            if (msg.alpha <= 0) {
                msg.destroy();
                return false;
            }
            return true;
        });

        if (this.player.blinkTimer > 0) {
            this.player.blinkTimer--;
            this.player.setAlpha(Math.sin(this.player.blinkTimer * 0.2) * 0.5 + 0.5);
        } else {
            this.player.setAlpha(1);
        }
    }

    applyDropEffect(drop) {
        if (drop.type === 'heart') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 10);
            const text = this.add.text(this.player.x, this.player.y - 10, '+10', { font: '16px Arial', fill: '#00FF00' });
            this.statusMessages.push(text);
            if (!this.isMuted) this.sound.play('health', { volume: 0.3 });
        } else if (drop.type === 'muscle') {
            this.visiblePathSegments = this.pathPoints.slice(0, -1).map((p, i) => [p.x, p.y, this.pathPoints[i + 1].x, this.pathPoints[i + 1].y]);
            const text = this.add.text(180, 180, 'Map Revealed!', { font: '16px Arial', fill: '#0000FF' });
            this.statusMessages.push(text);
            if (!this.isMuted) this.sound.play('rampage', { volume: 0.3 });
        } else if (drop.type === 'potion') {
            this.isControlReversed = !this.isControlReversed;
            const text = this.add.text(180, 180, this.isControlReversed ? 'Bamboozled!' : 'That\'s OK', { font: '16px Arial', fill: this.isControlReversed ? '#FF00FF' : '#00FF00' });
            this.statusMessages.push(text);
            if (!this.isMuted) this.sound.play(this.isControlReversed ? 'bamboozled' : 'thatsOK', { volume: 0.3 });
        } else if (drop.type === 'random') {
            const types = ['heart', 'muscle', 'potion'];
            const selectedType = types[Math.floor(Math.random() * types.length)];
            this.applyDropEffect({ type: selectedType });
        }
        window.FarcadeSDK.singlePlayer.actions.hapticFeedback();
    }
}