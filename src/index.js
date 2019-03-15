import Phaser from "phaser";
import downflapImg from "./assets/bluebird-downflap.png";
import midflapImg from "./assets/bluebird-midflap.png";
import upflapImg from "./assets/bluebird-upflap.png";
import pipeGreenImg from "./assets/pipe-green.png";
import bgImg from "./assets/background-day.png";
import baseImg from "./assets/base.png";
import gameOverImg from "./assets/gameover.png";
import wingSound from "./assets/wing.ogg";
import hitSound from "./assets/hit.ogg";
import dieSound from "./assets/die.ogg";
import pointSound from "./assets/point.ogg";

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  logic: {
    speedX: -200,
    pipeGap: 460,
    gravity: 1000,
    jump: -350
  },
  audio: {
    disableWebAudio: true
  }
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image('downflap', downflapImg);
  this.load.image('midflap', midflapImg);
  this.load.image('upflap', upflapImg);
  this.load.image('pipeGreen', pipeGreenImg);
  this.load.image('base', baseImg);
  this.load.image('gameOver', gameOverImg);
  this.load.image('bg', bgImg);
  this.load.audio('wing', [wingSound]);
  this.load.audio('hit', [hitSound]);
  this.load.audio('die', [dieSound]);
  this.load.audio('point', [pointSound]);
}

function create() {

  this.anims.create({
    key: 'flap',
    frames: [
      { key: 'downflap' },
      { key: 'midflap' },
      { key: 'upflap' }
    ],
    frameRate: 8,
    repeat: -1
  });

  this.bird = this.physics.add.sprite(100, 50, 'downflap').play('flap');
  this.bird.originX = -0.2
  this.bird.originY = 0.5;
  this.bird.body.gravity.y = config.logic.gravity;
  this.bird.setDepth(100);
  this.bird.die = false;

  this.input.on('pointerup', jump, this);

  this.time.addEvent({
    delay: 1500,
    callback: addPipe,
    callbackScope: this,
    repeat: -1,
    startAt: 0,
  });

  this.pipes = this.physics.add.group();
  this.physics.add.overlap(this.bird, this.pipes, touchPipe, null, this);

  this.floor = this.physics.add.group();
  this.physics.add.overlap(this.bird, this.floor, touchPipe, null, this);

  let posX = 0;
  for (let index = 0; index < 4; index++) {
    let base = this.floor.create(posX, config.height - 50, 'base');
    base.setVelocity(config.logic.speedX, 0);
    base.setDepth(99);
    posX += base.width;
  }

  this.backGround = this.physics.add.group();

  posX = 0;
  for (let index = 0; index < 5; index++) {
    let bg = this.backGround.create(posX, 250, 'bg');
    bg.setVelocity(config.logic.speedX / 2, 0);
    posX += bg.width;
  }

  this.wing = this.sound.add("wing");
  this.hit = this.sound.add("hit");
  this.die = this.sound.add("die");
  this.point = this.sound.add("point");

  this.score = this.add.text(0, 0, 'Points: 0', { fontFamily: 'Arial', fontSize: 32, color: '#ffffff' });
  this.score.setDepth(110);
  this.points = 0;
}

function touchPipe() {
  this.physics.pause();
  this.bird.setTint(0xff0000);
  this.bird.anims.stop();
  this.bird.die = true;

  this.add.tween({
    targets: this.bird,
    y: { value: "+=300", duration: 1500 },
  });

  this.add.sprite(config.width / 2, config.height / 2, 'gameOver');

  this.time.delayedCall(2500, reset, null, this);
  this.hit.stop();
  this.hit.play();
  this.die.stop();
  this.die.play();
}

function reset() {
  this.scene.restart();
}

function addPipe() {
  if (!this.bird.die) {
    const posX = 1000;

    var rndValue = Phaser.Math.Between(0, 250);

    let pipeUp = this.pipes.create(posX, 160 - rndValue, 'pipeGreen');
    pipeUp.angle = 180;
    let pipeDown = this.pipes.create(posX, pipeUp.y + config.logic.pipeGap, 'pipeGreen');

    pipeUp.setVelocity(config.logic.speedX, 0);
    pipeDown.setVelocity(config.logic.speedX, 0);
    this.points++;
    let realPoints = this.points - 3;
    if (realPoints <= 0) {
      realPoints = 0;
    } else {
      this.score.setText("Points: " + realPoints)
      this.point.play();
    }
  }

}

function jump(pointer) {
  if (!this.bird.die) {
    this.add.tween({
      targets: this.bird,
      angle: { value: -20, duration: 100 },
    });

    this.bird.setVelocity(0, config.logic.jump);
    this.wing.stop();
    this.wing.play();
  }
}

function loopBg(group) {
  let firstBase = group[0];
  if (firstBase.x < (-firstBase.width)) {
    let posX = 0;
    group.forEach(element => {
      element.x = posX;
      posX += firstBase.width;
    });
  }
}

function update() {
  if (this.bird.angle < 20) {
    this.bird.angle += 1;
  }

  loopBg(this.floor.getChildren());
  loopBg(this.backGround.getChildren());
}
