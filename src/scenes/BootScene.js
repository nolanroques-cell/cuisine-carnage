// The starting screen: the restaurant's front, the chef waiting, and one big
// button.

import { registerIcons } from '../icons.js';
import { registerSprites } from '../art/sprites.js';
import { sfx } from '../sfx.js';
import { haptic } from '../haptics.js';

const FONT = '-apple-system, system-ui, sans-serif';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1c1410);
    registerIcons(this, ['play']);
    registerSprites(this);

    this.bg = this.add.graphics().setDepth(0);
    this.chef = this.add.image(0, 0, 'chef').setScale(5).setDepth(5);
    this.cust1 = this.add.image(0, 0, 'cust-0').setScale(3.5).setDepth(4).setFlipX(true);
    this.cust2 = this.add.image(0, 0, 'cust-2').setScale(3.5).setDepth(4);

    this.title = this.add.text(0, 0, 'Cuisine Carnage', {
      fontFamily: FONT, fontSize: '40px', color: '#f7c948', fontStyle: '800',
    }).setOrigin(0.5).setDepth(6);
    this.subtitle = this.add.text(0, 0,
      'Sers les clients. Ou alors, régale-toi autrement.', {
        fontFamily: FONT, fontSize: '15px', color: '#e8d8c8',
        align: 'center', wordWrap: { width: 320 },
      }).setOrigin(0.5).setDepth(6);

    this.playCircle = this.add.circle(0, 0, 44, 0xe8483f)
      .setStrokeStyle(4, 0xffffff).setDepth(6).setInteractive();
    this.playIcon = this.add.image(0, 0, 'icon-play').setScale(0.55).setDepth(7);
    this.caption = this.add.text(0, 0, 'Tape pour jouer', {
      fontFamily: FONT, fontSize: '13px', color: '#b8a890',
    }).setOrigin(0.5).setDepth(6);

    this.tweens.add({
      targets: [this.chef, this.cust1, this.cust2],
      y: '+=8', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.playCircle.on('pointerdown', () => {
      sfx.click();
      haptic('tick');
      this.cameras.main.flash(120, 255, 255, 255);
      this.time.delayedCall(150, () => this.scene.start('Game'));
    });

    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout));
    this.layout();
  }

  layout() {
    const { width: W, height: H } = this.scale.gameSize;
    this.cameras.resize(W, H);
    const g = this.bg;
    g.clear();
    g.fillStyle(0x1c1410);
    g.fillRect(0, 0, W, H);

    const s = 26;
    const y0 = H * 0.62;
    g.fillStyle(0x2a221c);
    g.fillRect(0, y0, W, H - y0);
    for (let y = y0; y < H; y += s) {
      for (let x = 0; x < W; x += s) {
        if (((x / s | 0) + (y / s | 0)) % 2 === 0) {
          g.fillStyle(0x322a22);
          g.fillRect(x, y, Math.min(s, W - x), Math.min(s, H - y));
        }
      }
    }

    this.chef.setPosition(W / 2, H * 0.5);
    this.cust1.setPosition(W * 0.18, H * 0.56);
    this.cust2.setPosition(W * 0.82, H * 0.56);
    this.title.setPosition(W / 2, H * 0.14);
    this.title.setFontSize(Math.round(Phaser.Math.Clamp(W * 0.075, 24, 44)));
    this.subtitle.setPosition(W / 2, H * 0.26);
    this.subtitle.setWordWrapWidth(Math.min(360, W * 0.8));
    this.playCircle.setPosition(W / 2, H * 0.78);
    this.playIcon.setPosition(W / 2, H * 0.78);
    this.caption.setPosition(W / 2, H * 0.78 + 64);
  }
}