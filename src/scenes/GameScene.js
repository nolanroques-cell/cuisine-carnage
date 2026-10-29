// The restaurant itself. Top band: the dining room where customers queue with
// their order in a speech bubble. Middle: the counter with the plate and the
// service bell. Bottom: the kitchen (stations, stove) and the "arsenal" — the
// weapon shop and the carnage toggle, for when the meat stock runs low and the
// customers look suspiciously nourishing.

import { registerIcons } from '../icons.js';
import { registerSprites } from '../art/sprites.js';
import { sfx } from '../sfx.js';
import { haptic } from '../haptics.js';

const FONT = '-apple-system, system-ui, sans-serif';

const INGREDIENTS = {
  bread: { texture: 'ing-bread', value: 5 },
  tomato: { texture: 'ing-tomato', value: 5 },
  lettuce: { texture: 'ing-lettuce', value: 5 },
  cheese: { texture: 'ing-cheese', value: 7 },
  steak: { texture: 'ing-steak', value: 12 },
  fries: { texture: 'ing-fries', value: 6 },
  sauce: { texture: 'ing-sauce', value: 3 },
  soda: { texture: 'ing-soda', value: 4 },
  juice: { texture: 'ing-juice', value: 4 },
};

const STATION_KEYS = ['tomato', 'lettuce', 'bread', 'cheese', 'stove', 'fries', 'sauce', 'soda', 'juice'];

// Les clients spéciaux : chacun sa silhouette, son badge d'humeur, son charme.
const SPECIALS = {
  critic: {
    id: 'critic', texture: 'cust-critic', icon: 'star', tint: 0xf7c948,
    payMul: 3, patienceMul: 0.4, run: false,
  },
  big: {
    id: 'big', texture: 'cust-big', icon: 'utensils', tint: 0xe8483f,
    payMul: 1, patienceMul: 0.8, run: false,
  },
  rushed: {
    id: 'rushed', texture: 'cust-rushed', icon: 'alarm-clock', tint: 0x6fbf4e,
    payMul: 1, patienceMul: 0.55, run: true,
  },
};

const WEAPONS = [
  { id: 'cleaver', texture: 'wpn-cleaver', name: 'Couteau à viande', price: 0, meat: 1, aoe: false, anim: 'swing', animMs: 180 },
  { id: 'pistolet', texture: 'wpn-pistolet', name: 'Pistolet', price: 50, meat: 1, aoe: false, anim: 'shoot', animMs: 220 },
  { id: 'bat', texture: 'wpn-bat', name: 'Batte', price: 120, meat: 1, aoe: false, anim: 'smash', animMs: 320 },
  { id: 'chainsaw', texture: 'wpn-chainsaw', name: 'Tronçonneuse', price: 350, meat: 2, aoe: false, anim: 'rev', animMs: 420 },
  { id: 'bazooka', texture: 'wpn-bazooka', name: 'Canon à viande', price: 700, meat: 1, aoe: true, anim: 'rocket', animMs: 380 },
  // Exclusif au loto, jamais en vente.
  { id: 'lanceflamme', texture: 'wpn-lanceflamme', name: 'Lance-flamme', price: 0, meat: 1, aoe: false, anim: 'flame', animMs: 450, loto: true },
];

const SLOTS = 3;
const PLATE_MAX = 5;
const COOK_MS = 2200;
const FAST_COOK_MS = 1100;
const FRY_MS = 1600;
const PANIC_MS = 6000;

// Les améliorations de cuisine, vendues à côté des armes.
const UPGRADES = [
  { id: 'burner2', icon: 'plus', name: 'Deuxième plaque', price: 250 },
  { id: 'fastStove', icon: 'flame', name: 'Plaque rapide', price: 300 },
  { id: 'bigPlate', icon: 'utensils', name: 'Grand plateau', price: 200 },
];
const BIG_PLATE = 7;

// Les événements du jour, annoncés à l'ouverture par un bandeau.
const EVENTS = {
  happy: {
    id: 'happy', name: 'Happy hour', desc: 'Pourboires doublés !',
    icon: 'coins', tint: 0xf7c948, duration: 45000,
  },
  panne: {
    id: 'panne', name: 'Panne de plaque', desc: 'Cuisson deux fois plus lente !',
    icon: 'flame', tint: 0xe8483f, duration: 45000,
  },
  vip: {
    id: 'vip', name: 'VIP en visite', desc: 'Le critique est déjà là !',
    icon: 'star', tint: 0x6fbf4e, duration: 0,
  },
};

// Les décorations de la salle, vendues dans la boutique.
const DECOR = [
  { id: 'nappe', icon: 'dec-nappe', name: 'Nappe rouge', price: 80, bonus: 1 },
  { id: 'plante', icon: 'dec-plante', name: 'Plante verte', price: 60, bonus: 1 },
  { id: 'photo', icon: 'dec-photo', name: 'Photos des précédents', price: 120, bonus: 1 },
];

// Le loto du chef : un ticket, un tirage, et le lance-flamme en gros lot.
const LOTO = [
  { w: 40, label: 'Perdu !', action: null },
  { w: 25, label: '+50 €', action: function () { this.money += 50; } },
  { w: 15, label: '+150 €', action: function () { this.money += 150; } },
  { w: 10, label: '+300 €', action: function () { this.money += 300; } },
  { w: 8, label: '+3 viandes !', action: function () { this.meatStock += 3; this.updateMeat(); } },
  { w: 2, label: 'LANCE-FLAMME !', jackpot: true, action: function () { this.winFlamethrower(); } },
];

// Les plats du livre de menu, avec leur composition et leur prix de base.
const RECIPES = [
  { name: 'Frites', items: ['fries'], price: 6 },
  { name: 'Soda', items: ['soda'], price: 4 },
  { name: 'Jus de fruits', items: ['juice'], price: 4 },
  { name: 'Assiette simple', items: ['bread'], price: 5 },
  { name: 'Burger complet', items: ['bread', 'steak', 'tomato'], price: 22 },
  { name: 'Sauce (supplément)', items: ['sauce'], price: 3 },
];

// L'état qui survit à un redémarrage de scène : rejouer ou avancer d'une
// journée redémarre la scène, et ce sont les livres du restaurant.
const SAVE = {
  day: 1,
  dayQuota: 6, // 4 + jour × 2
  money: 30,
  score: 0,
  owned: ['cleaver'],
  weaponIdx: 0,
  meatStock: 2,
  dayStartMoney: 30,
  dayStartScore: 0,
  dayStartOwned: ['cleaver'],
  dayStartWeaponIdx: 0,
  dayStartMeat: 2,
  upg: { burner2: false, fastStove: false, bigPlate: false },
  dayStartUpg: { burner2: false, fastStove: false, bigPlate: false },
  decor: { nappe: false, plante: false, photo: false },
  dayStartDecor: { nappe: false, plante: false, photo: false },
  eventDay: 0,
  eventId: null,
  advance: false,
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    registerIcons(this, [
      'heart', 'coins', 'star', 'smile', 'frown', 'bell-ring',
      'trash-2', 'flame', 'x', 'beef', 'rotate-ccw', 'axe', 'play',
      'arrow-right', 'utensils', 'alarm-clock', 'plus', 'book-open', 'gift',
    ]);
  }

  create() {
    this.paused = false;
    this.gameOver = false;
    this.carnage = false;
    // Journées : on avance d'un jour si le précédent vient de se terminer,
    // sinon on reprend (ou on rejoue) la journée en cours avec ses valeurs.
    if (SAVE.advance) {
      SAVE.advance = false;
      SAVE.day++;
      SAVE.dayQuota = 4 + SAVE.day * 2;
    }
    this.day = SAVE.day;
    this.dayQuota = SAVE.dayQuota;
    this.money = SAVE.money;
    this.score = SAVE.score;
    this.owned = [...SAVE.owned];
    this.weaponIdx = SAVE.weaponIdx;
    this.meatStock = SAVE.meatStock;
    this.upg = { ...SAVE.upg };
    this.decor = { ...SAVE.decor };
    this.hearts = 3;
    this.dayServed = 0;
    this.dayKilled = 0;
    this.dayRevenue = 0;
    this.dayEnded = false;
    SAVE.dayStartMoney = this.money;
    SAVE.dayStartScore = this.score;
    SAVE.dayStartOwned = [...this.owned];
    SAVE.dayStartWeaponIdx = this.weaponIdx;
    SAVE.dayStartMeat = this.meatStock;
    SAVE.dayStartUpg = { ...this.upg };
    SAVE.dayStartDecor = { ...this.decor };
    this.plate = [];
    this.customers = [];
    this.panicUntil = 0;
    this.cooking = false;
    this.readySteak = false;
    this.frying = false;
    this.readyFries = false;
    this.streak = 0;
    this.comboMul = 1;
    this.event = null;
    this.eventBanner = null;
    this.eventTxt = null;
    this.vipUsed = false;
    this.spawnElapsed = 0;
    this.nextSpawn = 2200;
    this.shopLayer = null;
    this.hintTxt = null;
    this.gameOverOverlay = null;

    registerSprites(this);

    this.buildStatic();
    this.buildKitchen();
    this.applyUpgrades();
    this.buildDecor();
    this.layoutAll();

    // Événement du jour : tiré à l'ouverture de la journée, stable en cas de
    // rejeu de la même journée.
    if (SAVE.day !== SAVE.eventDay) {
      SAVE.eventDay = SAVE.day;
      SAVE.eventId = (SAVE.day > 1 && Phaser.Math.Between(0, 9) < 6)
        ? Phaser.Utils.Array.GetRandom(Object.keys(EVENTS))
        : null;
    }
    if (SAVE.eventId) {
      const e = EVENTS[SAVE.eventId];
      this.event = { ...e, endAt: e.duration > 0 ? this.time.now + e.duration : 0 };
      this.showEventBanner();
      sfx.buy();
      haptic('unlock');
    }
    this.updateHud();
    this.updateMeat();
    this.updateWpnButton();

    const onResize = (gs) => {
      this.cameras.resize(gs.width, gs.height);
      this.layoutAll();
    };
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));

    this.input.on('pointermove', (p) => {
      if (this.cursor.visible) {
        this.cursor.x = p.x;
        this.cursor.y = p.y + 6;
      }
    });

    this.time.delayedCall(800, () => {
      if (!this.gameOver) {
        this.spawnCustomer();
        this.showHint('Reçois les clients, cuisine, sers !');
      }
    });
    this.time.delayedCall(11000, () => {
      if (!this.gameOver) {
        this.showHint('Pas de viande ? Le bouton rouge règle beaucoup de problèmes…');
      }
    });
  }

  // ------------------------------------------------------------- construction

  buildStatic() {
    this.bgGfx = this.add.graphics().setDepth(0);

    this.counterRect = this.add.rectangle(0, 0, 10, 10, 0x8a5a33).setDepth(10);
    this.counterLip = this.add.rectangle(0, 0, 10, 6, 0xa87242).setDepth(10);

    this.chef = this.add.image(0, 0, 'chef').setDepth(12);

    this.plateBase = this.add.circle(0, 0, 30, 0xf5f0e6)
      .setStrokeStyle(4, 0x3a2a24).setDepth(14);
    this.plateItems = this.add.container(0, 0).setDepth(15);

    this.bellCircle = this.add.circle(0, 0, 24, 0xe8483f)
      .setStrokeStyle(4, 0x3a2a24).setDepth(16).setInteractive();
    this.bellIcon = this.add.image(0, 0, 'icon-bell-ring').setDepth(17);
    this.bellCircle.on('pointerdown', () => this.serve());

    // Le combo de service, en gros près du compteur.
    this.comboTxt = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '20px', color: '#f7c948', fontStyle: '800',
    }).setOrigin(0.5).setDepth(18).setVisible(false);

    // HUD
    this.heartImgs = [];
    for (let i = 0; i < 3; i++) {
      this.heartImgs.push(this.add.image(0, 0, 'icon-heart').setTint(0xe8483f).setDepth(21));
    }
    this.moneyIcon = this.add.image(0, 0, 'icon-coins').setTint(0xf7c948).setDepth(21);
    this.moneyTxt = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '16px', color: '#f7c948', fontStyle: '700',
    }).setOrigin(0, 0.5).setDepth(21);
    this.scoreTxt = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '16px', color: '#f6c9a0', fontStyle: '700',
    }).setOrigin(1, 0.5).setDepth(21);
    this.starIcon = this.add.image(0, 0, 'icon-star').setTint(0xf7c948).setDepth(21);
    this.dayTxt = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '14px', color: '#e8d8c8', fontStyle: '700',
    }).setOrigin(0, 0.5).setDepth(21);

    // Arsenal buttons
    this.axeCircle = this.add.circle(0, 0, 40, 0x3a2a24)
      .setStrokeStyle(4, 0xb3202e).setDepth(25).setInteractive();
    this.axeIcon = this.add.image(0, 0, 'icon-axe').setTint(0xe8483f).setDepth(26);
    // Halo qui signale le bouton rouge quand il n'y a plus de viande.
    this.axeRing = this.add.circle(0, 0, 40, 0, 0)
      .setStrokeStyle(4, 0xffd700, 0.85).setDepth(24).setVisible(false);
    this.axeCircle.on('pointerdown', () => this.toggleCarnage());

    this.wpnCircle = this.add.circle(0, 0, 40, 0x241d18)
      .setStrokeStyle(4, 0xf7c948).setDepth(25).setInteractive();
    this.wpnIcon = this.add.image(0, 0, 'wpn-cleaver').setDepth(26);
    this.wpnCircle.on('pointerdown', () => this.openShop());

    // Meat stock chip
    this.meatChip = this.add.container(0, 0).setDepth(25);
    const meatIcon = this.add.image(-20, 0, 'icon-beef').setTint(0xf6c9a0).setScale(0.4);
    this.meatTxt = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '16px', color: '#f6c9a0', fontStyle: '700',
    }).setOrigin(0, 0.5);
    this.meatChip.add([meatIcon, this.meatTxt]);

    // La poubelle, sortie de la rangée des stations pour libérer de la place.
    this.trashBtn = this.add.circle(0, 0, 28, 0x3a2a24)
      .setStrokeStyle(4, 0x9a90a0).setDepth(25).setInteractive();
    this.trashIcon = this.add.image(0, 0, 'icon-trash-2').setTint(0xf6c9a0).setDepth(26);
    this.trashBtn.on('pointerdown', () => this.tapTrash());

    // Le livre de menu, consultable depuis le HUD.
    this.bookBtn = this.add.circle(0, 0, 16, 0x3a2a24)
      .setStrokeStyle(3, 0xf7c948).setDepth(21).setInteractive();
    this.bookIcon = this.add.image(0, 0, 'icon-book-open').setTint(0xf6c9a0).setDepth(22);
    this.bookBtn.on('pointerdown', () => this.openBook());

    // Carnage frame
    const mk = () => this.add.rectangle(0, 0, 10, 10, 0xb3202e, 0.16).setDepth(40).setVisible(false);
    this.carnageBorder = { top: mk(), bottom: mk(), left: mk(), right: mk() };

    // Weapon cursor in carnage mode
    this.cursor = this.add.image(0, 0, 'wpn-cleaver').setDepth(60).setVisible(false).setScale(1.8);
  }

  buildKitchen() {
    this.stations = {};
    const defs = {
      tomato: 'ing-tomato',
      lettuce: 'ing-lettuce',
      bread: 'ing-bread',
      cheese: 'ing-cheese',
      stove: 'icon-flame',
      fries: 'ing-fries',
      sauce: 'ing-sauce',
      soda: 'ing-soda',
      juice: 'ing-juice',
    };
    const tints = { stove: 0xe8483f };
    STATION_KEYS.forEach((key) => {
      const rect = this.add.rectangle(0, 0, 10, 10, 0x9aa0a6, 0.9)
        .setStrokeStyle(3, 0x3a2a24).setDepth(11).setInteractive();
      const icon = this.add.image(0, 0, defs[key]).setDepth(12);
      if (tints[key]) icon.setTint(tints[key]);
      rect.on('pointerdown', () => {
        if (key === 'stove') this.tapStove();
        else if (key === 'fries') this.tapFries();
        else this.tapIngredient(key);
      });
      this.stations[key] = { rect, icon };
    });

    this.stoveProg = this.add.rectangle(0, 0, 10, 8, 0x241d18, 0.8)
      .setDepth(13).setVisible(false);
    this.stoveFill = this.add.rectangle(0, 0, 10, 6, 0xe8483f)
      .setOrigin(0, 0.5).setDepth(14).setVisible(false);
    this.stoveSteak = this.add.image(0, 0, 'ing-steak').setDepth(12).setVisible(false);

    // La friteuse fonctionne comme la plaque, mais sans viande.
    this.fryProg = this.add.rectangle(0, 0, 10, 8, 0x241d18, 0.8)
      .setDepth(13).setVisible(false);
    this.fryFill = this.add.rectangle(0, 0, 10, 6, 0xf7c948)
      .setOrigin(0, 0.5).setDepth(14).setVisible(false);
    this.friesImg = this.add.image(0, 0, 'ing-fries').setDepth(12).setVisible(false);

    // La deuxième plaque : invisible tant qu'elle n'est pas achetée.
    this.flame2 = this.add.image(0, 0, 'icon-flame')
      .setTint(0xe8483f).setDepth(12).setVisible(false);
    this.stoveProg2 = this.add.rectangle(0, 0, 10, 8, 0x241d18, 0.8)
      .setDepth(13).setVisible(false);
    this.stoveFill2 = this.add.rectangle(0, 0, 10, 6, 0xe8483f)
      .setOrigin(0, 0.5).setDepth(14).setVisible(false);
    this.stoveSteak2 = this.add.image(0, 0, 'ing-steak').setDepth(12).setVisible(false);
  }

  // Les décorations de la salle : créées une fois, visibles une fois achetées.
  buildDecor() {
    this.decorSprites = {};
    ['nappe', 'plante', 'photo'].forEach((id) => {
      this.decorSprites[id] = this.add.image(0, 0, `dec-${id}`)
        .setDepth(3).setVisible(false);
    });
  }

  applyDecor() {
    ['nappe', 'plante', 'photo'].forEach((id) => {
      this.decorSprites[id].setVisible(!!this.decor[id]);
    });
    this.layoutAll();
  }

  layoutAll() {
    const W = this.scale.gameSize.width;
    const H = this.scale.gameSize.height;
    const hudH = Phaser.Math.Clamp(H * 0.075, 44, 64);
    const counterY = Math.round(H * 0.45);
    const counterH = Phaser.Math.Clamp(H * 0.09, 44, 60);
    const counterTop = counterY - counterH / 2;

    this.m = { W, H, hudH, counterY, counterH, counterTop, counterBottom: counterTop + counterH };

    this.drawBg();

    this.counterRect.setPosition(W / 2, counterY);
    this.counterRect.width = W;
    this.counterRect.height = counterH;
    this.counterLip.setPosition(W / 2, counterTop + 3);
    this.counterLip.width = W;

    const chefY = Math.min(counterTop + counterH + 46, H - 150);
    this.chef.setPosition(W / 2, chefY);

    const n = STATION_KEYS.length;
    const stSize = Math.min(72, (W - 24 - (n - 1) * 6) / n);
    const stY = Math.min(chefY + 40 + stSize / 2, H - stSize / 2 - 84);
    const startX = (W - (n * stSize + 6 * (n - 1))) / 2 + stSize / 2;
    STATION_KEYS.forEach((key, i) => {
      const st = this.stations[key];
      const x = startX + i * (stSize + 8);
      st.rect.setPosition(x, stY);
      st.rect.setSize(stSize, stSize);
      // Recapture la zone de tap après redimensionnement.
      st.rect.setInteractive();
      st.icon.setPosition(x, stY - 2);
      st.icon.setScale(stSize * 0.52 / Math.max(st.icon.width, st.icon.height));
      st.x = x;
      st.y = stY;
      st.size = stSize;
    });

    const stove = this.stations.stove;
    this.stoveProg.setPosition(stove.x, stY + stSize / 2 - 8);
    this.stoveProg.width = stSize * 0.7;
    this.stoveFill.setPosition(stove.x - stSize * 0.35, stY + stSize / 2 - 8);
    this.stoveFill.width = stSize * 0.7;
    this.stoveSteak.setPosition(stove.x, stY - 2);
    this.stoveSteak.setScale(0.6);

    // Deuxième plaque et plaque rapide : la cuisine le montre.
    const burner2 = !!this.upg.burner2;
    const fast = !!this.upg.fastStove;
    const bx1 = burner2 ? stove.x - stSize * 0.22 : stove.x;
    const bx2 = stove.x + stSize * 0.22;
    const stoveIcon = this.stations.stove.icon;
    stoveIcon.setPosition(bx1, stY - 2);
    stoveIcon.setScale(stSize * (burner2 ? 0.4 : fast ? 0.6 : 0.52) / stoveIcon.height);
    stoveIcon.setTint(fast ? 0xffb627 : 0xe8483f);

    this.flame2.setVisible(burner2);
    this.flame2.setPosition(bx2, stY - 2);
    this.flame2.setScale(stSize * 0.4 / this.flame2.height);
    this.stoveProg2.setVisible(burner2 && this.cooking2);
    this.stoveProg2.setPosition(bx2, stY + stSize / 2 - 8);
    this.stoveProg2.width = stSize * 0.5;
    this.stoveFill2.setPosition(bx2 - stSize * 0.25, stY + stSize / 2 - 8);
    this.stoveFill2.width = stSize * 0.5;
    this.stoveSteak2.setVisible(burner2 && this.readySteak2);
    this.stoveSteak2.setPosition(bx2, stY - 2);
    this.stoveSteak2.setScale(0.6);

    this.stoveProg.setPosition(bx1, stY + stSize / 2 - 8);
    this.stoveProg.width = stSize * 0.5;
    this.stoveFill.setPosition(bx1 - stSize * 0.25, stY + stSize / 2 - 8);
    this.stoveFill.width = stSize * 0.5;

    const fries = this.stations.fries;
    this.fryProg.setPosition(fries.x, stY + stSize / 2 - 8);
    this.fryProg.width = stSize * 0.7;
    this.fryFill.setPosition(fries.x - stSize * 0.35, stY + stSize / 2 - 8);
    this.fryFill.width = stSize * 0.7;
    this.friesImg.setPosition(fries.x, stY - 2);
    this.friesImg.setScale(0.6);

    this.plateBase.setPosition(W / 2, counterY);
    this.plateBase.radius = this.upg.bigPlate
      ? Math.min(38, counterH * 0.46)
      : Math.min(30, counterH * 0.38);
    this.plateItems.setPosition(W / 2, counterY);

    this.bellCircle.setPosition(W * 0.82, counterY);
    this.bellCircle.radius = Math.min(26, counterH * 0.4);
    this.bellIcon.setPosition(W * 0.82, counterY);
    if (this.comboTxt) this.comboTxt.setPosition(W * 0.15, counterY);

    this.heartImgs.forEach((h, i) => {
      h.setPosition(22 + i * (hudH * 0.5 + 10), hudH / 2);
      h.setScale(hudH * 0.42 / h.height);
    });
    const moneyX = 22 + 3 * (hudH * 0.5 + 10) + 14;
    this.moneyIcon.setPosition(moneyX, hudH / 2);
    this.moneyIcon.setScale(hudH * 0.42 / this.moneyIcon.height);
    this.moneyTxt.setPosition(moneyX + 18, hudH / 2);
    this.scoreTxt.setPosition(W - 56, hudH / 2);
    this.starIcon.setPosition(W - 56 - this.scoreTxt.width - 26, hudH / 2);
    this.starIcon.setScale(hudH * 0.4 / this.starIcon.height);
    const bR = Math.max(12, Math.min(16, hudH * 0.32));
    this.bookBtn.setPosition(W - 26, hudH / 2);
    this.bookBtn.radius = bR;
    this.bookIcon.setPosition(W - 26, hudH / 2);
    this.bookIcon.setScale(bR * 1.2 / this.bookIcon.height);

    const R = Math.max(26, Math.min(40, (H - (stY + stSize / 2)) / 2 - 8));
    this.btnR = R;
    const axeX = W - 20 - R;
    const axeY = H - 20 - R;
    this.axeCircle.setPosition(axeX, axeY);
    this.axeCircle.radius = R;
    this.axeCircle.setInteractive();
    this.axeIcon.setPosition(axeX, axeY);
    this.axeIcon.setScale(R * 1.1 / this.axeIcon.height);
    this.axeRing.setPosition(axeX, axeY);
    this.axeRing.radius = R + 8;
    const wpnX = axeX - 2 * R - 14;
    this.wpnCircle.setPosition(wpnX, axeY);
    this.wpnCircle.radius = R;
    this.wpnIcon.setPosition(wpnX, axeY);
    this.wpnIcon.setScale(R * 1.15 / this.wpnIcon.height);

    this.meatChip.setPosition(56, axeY);

    const tR = Math.max(20, R * 0.7);
    this.trashBtn.setPosition(Math.min(wpnX - tR - 10, 140), axeY);
    this.trashBtn.radius = tR;
    this.trashIcon.setPosition(this.trashBtn.x, axeY);
    this.trashIcon.setScale(tR * 1.1 / this.trashIcon.height);

    const b = this.carnageBorder;
    b.top.setPosition(W / 2, 6); b.top.width = W; b.top.height = 12;
    b.bottom.setPosition(W / 2, H - 6); b.bottom.width = W; b.bottom.height = 12;
    b.left.setPosition(6, H / 2); b.left.width = 12; b.left.height = H;
    b.right.setPosition(W - 6, H / 2); b.right.width = 12; b.right.height = H;

    this.updateEventBanner();
    this.customers.forEach((c) => { c.sprite.x = this.slotX(c.slot); });

    // Décorations de la salle, visibles une fois achetées.
    if (this.decorSprites) {
      const { hudH, counterTop } = this.m;
      const nappe = this.decorSprites.nappe;
      nappe.setPosition(W * 0.09, counterTop - 16);
      nappe.setScale(Math.min(4, W * 0.16 / nappe.width));
      const plante = this.decorSprites.plante;
      plante.setPosition(W * 0.93, counterTop - 22);
      plante.setScale(Math.min(3.4, W * 0.09 / plante.width));
      const photo = this.decorSprites.photo;
      photo.setPosition(W * 0.5, hudH + 30);
      photo.setScale(Math.min(2.6, W * 0.07 / photo.width));
    }

    this.hintY = Math.min(H - 150, stY + stSize / 2 + 60);
    if (this.hintTxt) {
      this.hintTxt.setPosition(W / 2, this.hintY);
      this.hintTxt.setWordWrapWidth(Math.min(420, W * 0.85));
    }

    this.updateHud();
  }

  drawBg() {
    const g = this.bgGfx;
    g.clear();
    const { W, H, hudH, counterTop, counterBottom, counterH } = this.m;
    g.fillStyle(0x1c1410);
    g.fillRect(0, 0, W, H);

    // Dining room floor
    g.fillStyle(0xd9c49a);
    g.fillRect(0, hudH, W, counterTop - hudH);
    const s = 28;
    for (let y = hudH; y < counterTop; y += s) {
      const hh = Math.min(s, counterTop - y);
      for (let x = 0; x < W; x += s) {
        const ww = Math.min(s, W - x);
        if (((x / s | 0) + (y / s | 0)) % 2 === 0) {
          g.fillStyle(0xcdb98c);
          g.fillRect(x, y, ww, hh);
        }
      }
    }

    // Kitchen floor
    g.fillStyle(0x8f8880);
    g.fillRect(0, counterBottom, W, H - counterBottom);
    for (let y = counterBottom; y < H; y += s) {
      const hh = Math.min(s, H - y);
      for (let x = 0; x < W; x += s) {
        const ww = Math.min(s, W - x);
        if (((x / s | 0) + (y / s | 0)) % 2 === 0) {
          g.fillStyle(0x837c74);
          g.fillRect(x, y, ww, hh);
        }
      }
    }

    // Counter
    g.fillStyle(0x8a5a33);
    g.fillRect(0, counterTop, W, counterH);
    g.fillStyle(0xa87242);
    g.fillRect(0, counterTop, W, 6);

    // HUD bar
    g.fillStyle(0x241d18, 0.95);
    g.fillRect(0, 0, W, hudH);
    g.fillStyle(0x3a2a24);
    g.fillRect(0, hudH - 3, W, 3);
  }

  // ---------------------------------------------------------------- customers

  slotX(slot) {
    return this.m.W * [0.22, 0.5, 0.78][slot];
  }

  slotY() {
    return this.m.counterTop - 36;
  }

  freeSlot() {
    for (let i = 0; i < SLOTS; i++) {
      if (!this.customers.some((c) => c.slot === i && c.state !== 'leaving')) return i;
    }
    return -1;
  }

  makeOrder() {
    // Le menu : assiettes, burger complet, frites ou boisson seules, sauce et
    // boisson en supplément payant. Le prix suit la complexité via les valeurs.
    const veg = ['tomato', 'lettuce', 'cheese'];
    const drinks = ['soda', 'juice'];
    const items = [];
    const roll = Phaser.Math.Between(0, 9);
    if (roll < 2) {
      items.push('fries');
    } else if (roll < 4) {
      // Une boisson seule : servie instantanément.
      items.push(Phaser.Utils.Array.GetRandom(drinks));
    } else if (roll < 7) {
      items.push('bread');
      if (Phaser.Math.Between(0, 9) < 7) items.push('steak');
      if (Phaser.Math.Between(0, 9) < 5) items.push(Phaser.Utils.Array.GetRandom(veg));
    } else {
      // Le burger complet : pain, steak et un légume.
      items.push('bread', 'steak', Phaser.Utils.Array.GetRandom(veg));
    }
    if (Phaser.Math.Between(0, 9) < 3) items.push('sauce');
    if (Phaser.Math.Between(0, 9) < 2) {
      const d = Phaser.Utils.Array.GetRandom(drinks);
      if (!items.includes(d) && items.length < this.plateMax) items.push(d);
    }
    return items;
  }

  makeSpecialOrder(type) {
    if (type === 'critic') return this.makeOrder();
    if (type === 'rushed') {
      // Il n'a pas le temps : un truc rapide, éventuellement avec sauce.
      const items = [Phaser.Utils.Array.GetRandom(['fries', 'bread', 'tomato', 'soda', 'juice'])];
      if (Phaser.Math.Between(0, 9) < 4) items.push('sauce');
      return items;
    }
    // Le gros mangeur : deux plats, dans la limite du plateau.
    const items = [...this.makeOrder()];
    const extras = ['fries', 'tomato', 'lettuce', 'cheese', 'bread', 'soda', 'juice'];
    while (items.length < this.plateMax) {
      const extra = extras[Phaser.Math.Between(0, extras.length - 1)];
      if (items.includes(extra)) continue;
      items.push(extra);
      if (Phaser.Math.Between(0, 9) < 6) break;
    }
    return items;
  }

  spawnCustomer() {
    const slot = this.freeSlot();
    if (slot < 0) return;
    // Environ un client sur six est un client spécial.
    let special = Phaser.Math.Between(0, 9) < 2
      ? Phaser.Utils.Array.GetRandom(Object.values(SPECIALS))
      : null;
    // VIP en visite : le critique est déjà là au premier client de la journée.
    if (this.event && this.event.id === 'vip' && !this.vipUsed) {
      special = SPECIALS.critic;
      this.vipUsed = true;
    }
    const order = special
      ? this.makeSpecialOrder(special.id)
      : this.makeOrder();
    const texture = special ? special.texture : `cust-${Phaser.Math.Between(0, 5)}`;
    const sprite = this.add.image(this.slotX(slot), this.m.hudH - 60, texture)
      .setDepth(5).setInteractive();
    // Les journées avancées écourtent la patience des clients.
    const dayFactor = Math.max(0.55, 1 - 0.09 * (this.day - 1));
    const patienceMul = special ? special.patienceMul : 1;
    const patience = Math.max(2500,
      (Math.max(4500, (12000 - this.score * 8) * dayFactor) + order.length * 2500) * patienceMul);
    const c = {
      slot, sprite, order, patience, maxPatience: patience,
      state: 'entering', bubble: null, patFill: null,
      special, payMul: special ? special.payMul : 1, badge: null,
    };
    sprite.on('pointerdown', () => {
      if (this.paused || this.gameOver) return;
      if (this.carnage && c.state === 'waiting') this.killOne(c);
    });
    this.customers.push(c);

    if (special) {
      // Son badge d'humeur, au-dessus de la bulle de commande.
      c.badge = this.add.image(sprite.x, sprite.y - 102, `icon-${special.icon}`)
        .setTint(special.tint).setDepth(50).setScale(0.3);
    }

    this.tweens.add({
      targets: sprite,
      y: this.slotY(),
      duration: special && special.run ? 350 : 900,
      ease: special && special.run ? 'Cubic.easeOut' : 'Sine.easeOut',
      onComplete: () => {
        if (!sprite.active) return;
        c.state = 'waiting';
        this.attachBubble(c);
        sfx.pop();
      },
    });
    if (special && special.run) {
      sfx.pop();
      haptic('tick');
    }
  }

  attachBubble(c) {
    const n = c.order.length;
    const bw = Math.max(52, n * 26 + 10);
    const container = this.add.container(c.sprite.x, c.sprite.y - 62).setDepth(6);
    const bg = this.add.rectangle(0, 0, bw, 34, 0xffffff, 0.95).setStrokeStyle(3, 0x3a2a24);
    const tail = this.add.triangle(0, 21, -6, 0, 6, 0, 0, 10, 0xffffff);
    const items = c.order.map((k, i) => {
      const img = this.add.image((i - (n - 1) / 2) * 26, 0, INGREDIENTS[k].texture);
      img.setScale(20 / Math.max(img.width, img.height));
      return img;
    });
    const patBg = this.add.rectangle(0, 26, 40, 6, 0x3a2a24, 0.9);
    const patFill = this.add.rectangle(-20, 26, 40, 4, 0x6fbf4e).setOrigin(0, 0.5);
    container.add([bg, tail, ...items, patBg, patFill]);
    c.bubble = container;
    c.patFill = patFill;
  }

  removeCustomer(c) {
    if (c.badge) {
      c.badge.destroy();
      c.badge = null;
    }
    if (c.bubble) {
      c.bubble.destroy();
      c.bubble = null;
    }
    c.state = 'leaving';
    const idx = this.customers.indexOf(c);
    if (idx >= 0) this.customers.splice(idx, 1);
  }

  walkOut(sprite) {
    this.tweens.add({
      targets: sprite,
      y: this.m.hudH - 80,
      duration: 700,
      ease: 'Sine.easeIn',
      onComplete: () => sprite.destroy(),
    });
  }

  leaveMood(c, icon, tint) {
    const x = c.sprite.x;
    const y = c.sprite.y;
    this.removeCustomer(c);
    const mood = this.add.image(x, y - 48, icon).setTint(tint).setDepth(50);
    this.tweens.add({
      targets: mood, y: y - 78, alpha: 0, duration: 800,
      onComplete: () => mood.destroy(),
    });
    this.walkOut(c.sprite);
  }

  leaveAngry(c) {
    this.leaveMood(c, 'icon-frown', 0xe8483f);
  }

  leaveHappy(c) {
    this.leaveMood(c, 'icon-smile', 0x6fbf4e);
  }

  // ------------------------------------------------------------------ kitchen

  tapIngredient(key) {
    if (this.paused || this.gameOver) return;
    if (this.plate.length >= this.plateMax) {
      this.denyPlate();
      return;
    }
    this.plate.push(key);
    this.updatePlate();
    sfx.pop();
    haptic('tick');
  }

  tapTrash() {
    if (this.paused || this.gameOver) return;
    this.plate = [];
    this.updatePlate();
    sfx.click();
    haptic('tick');
  }

  tapStove() {
    if (this.paused || this.gameOver) return;
    if (this.meatStock <= 0) {
      sfx.fail();
      haptic('serve-bad');
      this.tweens.add({ targets: this.meatChip, x: '+=6', duration: 50, yoyo: true, repeat: 3 });
      this.showHint('Plus de viande crue ! Tape le bouton rouge, puis tape un client : il deviendra ton stock de viande.');
      return;
    }
    if (this.plate.length >= this.plateMax) {
      this.denyPlate();
      return;
    }
    // Les deux plaques peuvent cuire en même temps une fois achetées.
    const useSecond = this.cooking && this.upg.burner2 && !this.cooking2;
    if (this.cooking && !useSecond) {
      sfx.click();
      return;
    }
    this.meatStock--;
    this.updateMeat();
    const dur = (this.upg.fastStove ? FAST_COOK_MS : COOK_MS)
      * (this.event && this.event.id === 'panne' ? 2 : 1);
    if (useSecond) {
      this.cooking2 = true;
      this.cook2Start = this.time.now;
      this.cook2Dur = dur;
      this.stoveProg2.setVisible(true);
      this.stoveFill2.setVisible(true);
      this.stoveFill2.scaleX = 0.02;
    } else {
      this.cooking = true;
      this.cookStart = this.time.now;
      this.cookDur = dur;
      this.stoveProg.setVisible(true);
      this.stoveFill.setVisible(true);
      this.stoveFill.scaleX = 0.02;
    }
    sfx.cook();
    haptic('cook');

    this.time.delayedCall(dur, () => {
      if (this.gameOver) return;
      if (useSecond) {
        this.cooking2 = false;
        this.stoveProg2.setVisible(false);
        this.stoveFill2.setVisible(false);
      } else {
        this.cooking = false;
        this.stoveProg.setVisible(false);
        this.stoveFill.setVisible(false);
      }
      if (this.plate.length < this.plateMax) {
        this.addToPlate('steak');
        sfx.ding();
        haptic('cook-done');
      } else {
        // Plateau plein : le steak retourne au frigo, jamais de blocage.
        this.meatStock++;
        this.updateMeat();
        sfx.pop();
        haptic('cook-done');
        this.showHint('Plateau plein ! Le steak retourne au frigo. Vide-le avec la corbeille avant de recuire.');
      }
    });
  }

  tapFries() {
    if (this.paused || this.gameOver) return;
    if (this.frying) {
      sfx.click();
      return;
    }
    if (this.plate.length >= this.plateMax) {
      this.denyPlate();
      return;
    }
    this.frying = true;
    this.fryStart = this.time.now;
    sfx.cook();
    haptic('cook');
    this.fryProg.setVisible(true);
    this.fryFill.setVisible(true);
    this.fryFill.scaleX = 0.02;

    this.time.delayedCall(FRY_MS, () => {
      if (this.gameOver) return;
      this.frying = false;
      this.fryProg.setVisible(false);
      this.fryFill.setVisible(false);
      if (this.plate.length < this.plateMax) {
        this.addToPlate('fries');
        sfx.ding();
        haptic('cook-done');
      } else {
        sfx.pop();
        this.showHint('Plateau plein ! Vide-le avec la corbeille avant de recuire des frites.');
      }
    });
  }

  addToPlate(key) {
    this.plate.push(key);
    this.updatePlate();
    sfx.pop();
    haptic('tick');
  }

  denyPlate() {
    sfx.click();
    this.tweens.add({ targets: this.plateBase, x: '+=6', duration: 50, yoyo: true, repeat: 3 });
  }

  updatePlate() {
    this.plateItems.removeAll(true);
    const n = this.plate.length;
    this.plate.forEach((k, i) => {
      const img = this.add.image(0, 0, INGREDIENTS[k].texture);
      img.setScale(22 / Math.max(img.width, img.height));
      img.x = (i - (n - 1) / 2) * 20;
      img.y = -8 - (i % 2) * 6;
      this.plateItems.add(img);
    });
  }

  // ------------------------------------------------------------------ service

  frontCustomer() {
    return this.customers
      .filter((c) => c.state === 'waiting')
      .sort((a, b) => a.slot - b.slot)[0];
  }

  serve() {
    if (this.paused || this.gameOver) return;
    const c = this.frontCustomer();
    if (!c) {
      sfx.click();
      this.tweens.add({ targets: this.bellCircle, scale: 0.85, duration: 70, yoyo: true });
      return;
    }
    const plate = [...this.plate].sort().join('|');
    const order = [...c.order].sort().join('|');
    if (plate === order && this.plate.length > 0) {
      // Combo : chaque service d'affilée grossit le pourboire.
      this.streak++;
      const prevMul = this.comboMul;
      this.comboMul = this.comboMulFor();
      this.updateCombo(prevMul);
      const happy = this.event && this.event.id === 'happy' ? 2 : 1;
      const tip = Math.round(10 * (c.patience / c.maxPatience)) * this.comboMul * happy;
      const base = c.order.reduce((s, k) => s + INGREDIENTS[k].value, 0) + tip;
      const pay = Math.round(base * (c.payMul || 1));
      this.money += pay;
      this.score += pay;
      this.dayServed++;
      this.dayRevenue += pay;
      this.updateHud();
      this.floatText(c.sprite.x, c.sprite.y - 70, `+${pay}`, '#f7c948');
      if (this.dayServed >= this.dayQuota) {
        this.time.delayedCall(700, () => this.endDay());
      }
      sfx.ding();
      haptic('serve-good');
      this.plate = [];
      this.updatePlate();
      this.leaveHappy(c);
    } else {
      sfx.fail();
      haptic('serve-bad');
      this.hearts--;
      this.resetCombo();
      this.updateHud();
      this.leaveAngry(c);
      if (this.hearts <= 0) this.time.delayedCall(500, () => this.gameOverNow());
    }
  }

  // ------------------------------------------------------------------ carnage

  // ------------------------------------------------------------ combo de service

  comboMulFor() {
    const s = this.streak;
    if (s >= 12) return 3;
    if (s >= 8) return 2.5;
    if (s >= 5) return 2;
    if (s >= 3) return 1.5;
    return 1;
  }

  updateCombo(prevMul) {
    const mul = this.comboMul;
    if (mul > 1) {
      this.comboTxt
        .setText(`COMBO x${mul.toString().replace('.', ',')}`)
        .setVisible(true);
    } else {
      this.comboTxt.setVisible(false);
    }
    if (mul > prevMul) {
      // Palier franchi : le compteur pulse.
      this.tweens.add({
        targets: this.comboTxt, scale: 1.4, duration: 120, yoyo: true, ease: 'Quart.easeOut',
      });
      sfx.coin();
      haptic('cook-done');
    }
  }

  resetCombo() {
    this.streak = 0;
    this.comboMul = 1;
    if (this.comboTxt) this.comboTxt.setVisible(false);
  }

  toggleCarnage() {
    if (this.gameOver) return;
    this.carnage = !this.carnage;
    sfx.chop();
    haptic('tick');
    const on = this.carnage;
    Object.values(this.carnageBorder).forEach((r) => r.setVisible(on));
    this.cursor.setVisible(on);
    if (on) {
      this.cursor.setPosition(this.input.activePointer.x, this.input.activePointer.y + 6);
      this.cameras.main.flash(150, 120, 20, 20);
    }
    this.axeCircle.setStrokeStyle(4, on ? 0xe8483f : 0xb3202e);
  }

  killOne(c) {
    const wpn = WEAPONS[this.weaponIdx];
    const x = c.sprite.x;
    const y = c.sprite.y;
    this.removeCustomer(c);
    this.dayKilled++;
    c.sprite.setDepth(8);
    // Chaque arme a sa propre animation d'attaque avant l'impact.
    const delay = this.playWeaponAttack(wpn, x, y);
    this.time.delayedCall(delay, () => this.applyKill(c, wpn, x, y));
  }

  // Animation d'attaque de l'arme équipée, renvoie le délai avant l'impact.
  playWeaponAttack(wpn, x, y) {
    switch (wpn.anim) {
      case 'swing': {
        // Le couteau s'abat d'un grand coup sur la victime.
        const blade = this.add.image(Math.max(10, x - 50), y + 20, wpn.texture)
          .setOrigin(0, 0.5).setDepth(52).setScale(2).setAngle(-55);
        this.tweens.add({ targets: blade, angle: 25, duration: wpn.animMs, ease: 'Quad.easeIn' });
        this.tweens.add({ targets: blade, x: x - 10, duration: wpn.animMs, ease: 'Quad.easeIn' });
        this.time.delayedCall(wpn.animMs + 60, () => blade.destroy());
        break;
      }
      case 'smash': {
        // La batte fauche la victime de côté.
        const bat = this.add.image(Math.max(10, x - 70), y, wpn.texture)
          .setOrigin(0, 0.5).setDepth(52).setScale(2.5).setAngle(-70);
        this.tweens.add({ targets: bat, angle: 30, x: x + 12, duration: wpn.animMs, ease: 'Quad.easeIn' });
        this.time.delayedCall(wpn.animMs + 60, () => bat.destroy());
        break;
      }
      case 'shoot': {
        // On voit la balle partir du chef et frapper le client.
        const muzzle = { x: this.chef.x, y: this.chef.y - 20 };
        this.muzzleFlash(muzzle.x, muzzle.y);
        sfx.pew();
        const b = this.add.image(muzzle.x, muzzle.y, 'bullet').setDepth(55).setScale(3);
        const dx = x - muzzle.x;
        const dy = y - muzzle.y;
        b.setAngle(Phaser.Math.RadToDeg(Math.atan2(dy, dx)));
        const flight = Math.max(130, Math.hypot(dx, dy) * 0.55);
        this.tweens.add({
          targets: b, x, y, duration: flight, ease: 'Linear',
          onComplete: () => {
            b.destroy();
            this.impactFlash(x, y);
          },
        });
        return Math.max(flight, wpn.animMs);
      }
      case 'rocket': {
        const muzzle = { x: this.chef.x, y: this.chef.y - 20 };
        this.muzzleFlash(muzzle.x, muzzle.y);
        sfx.pew();
        const r = this.add.image(muzzle.x, muzzle.y, 'rocket').setDepth(55).setScale(2.5);
        const dx = x - muzzle.x;
        const dy = y - muzzle.y;
        r.setAngle(Phaser.Math.RadToDeg(Math.atan2(dy, dx)));
        const flight = Math.max(240, Math.hypot(dx, dy) * 0.6);
        this.tweens.add({
          targets: r, x, y, duration: flight, ease: 'Sine.easeIn',
          onComplete: () => {
            r.destroy();
            this.cameras.main.shake(250, 0.008);
            this.impactFlash(x, y);
          },
        });
        return Math.max(flight, wpn.animMs);
      }
      case 'flame': {
        // Un jet de flammes brûle la victime.
        const muzzle = { x: this.chef.x, y: this.chef.y - 20 };
        const fdx = x - muzzle.x;
        const fdy = y - muzzle.y;
        sfx.flame();
        for (let i = 0; i < 10; i++) {
          const t = i / 9;
          const fx = muzzle.x + fdx * t + Phaser.Math.Between(-12, 12);
          const fy = muzzle.y + fdy * t + Phaser.Math.Between(-10, 10);
          const fl = this.add.circle(fx, fy, 5 + i * 0.8, i % 2 ? 0xf7c948 : 0xe8483f)
            .setDepth(54);
          this.tweens.add({
            targets: fl, scale: 1.6, alpha: 0, duration: 300, delay: i * 30,
            onComplete: () => fl.destroy(),
          });
        }
        this.impactFlash(x, y);
        break;
      }
      case 'rev': {
        // La tronçonneuse vibre et grésille sur la victime.
        const saw = this.add.image(x, y + 24, wpn.texture).setDepth(52).setScale(1.5);
        this.tweens.add({ targets: saw, x: '+=5', duration: 40, yoyo: true, repeat: 8, ease: 'Linear' });
        this.tweens.add({ targets: saw, angle: { from: -8, to: 8 }, duration: 60, yoyo: true, repeat: 6 });
        for (let i = 0; i < 5; i++) {
          const speck = this.add.rectangle(
            x + Phaser.Math.Between(-24, 24), y - 12, 4, 4, 0xf7c948).setDepth(53);
          this.tweens.add({
            targets: speck, y: '-=44', x: '+=34', alpha: 0,
            duration: 420, delay: i * 45, onComplete: () => speck.destroy(),
          });
        }
        this.time.delayedCall(wpn.animMs + 60, () => saw.destroy());
        break;
      }
    }
    return wpn.animMs;
  }

  muzzleFlash(x, y) {
    const f = this.add.circle(x, y, 10, 0xffd700).setDepth(55);
    this.tweens.add({
      targets: f, scale: 1.8, alpha: 0, duration: 110,
      onComplete: () => f.destroy(),
    });
  }

  impactFlash(x, y) {
    const f = this.add.circle(x, y, 8, 0xffffff).setDepth(56);
    this.tweens.add({
      targets: f, scale: 2.2, alpha: 0, duration: 130,
      onComplete: () => f.destroy(),
    });
  }

  applyKill(c, wpn, x, y) {
    if (!c.sprite.active) return;
    sfx.chop();
    sfx.splat();
    haptic('chop');

    this.tweens.add({
      targets: c.sprite, scaleX: 1.7, scaleY: 0.15, duration: 160,
      onComplete: () => {
        if (wpn.id === 'bat' && c.sprite.active) {
          // La batte délogue la victime hors de l'écran.
          const dir = c.sprite.x < this.m.W / 2 ? -1 : 1;
          this.tweens.add({
            targets: c.sprite, x: c.sprite.x + dir * 320, alpha: 0, duration: 350,
            onComplete: () => c.sprite.destroy(),
          });
        } else {
          c.sprite.destroy();
        }
      },
    });

    const spl = this.add.image(x, y, 'splat').setDepth(9).setScale(0.3).setAlpha(0.95);
    this.tweens.add({
      targets: spl, scale: 1.4, alpha: 0, duration: 750, ease: 'Cubic.easeOut',
      onComplete: () => spl.destroy(),
    });

    // La prime : chaque victime rapporte 200 € en caisse.
    this.money += 200;
    this.score += 200;
    this.dayRevenue += 200;
    this.updateHud();
    this.floatText(x, y - 70, '+200 €', '#f7c948');
    sfx.coin();
    haptic('coin');

    for (let i = 0; i < wpn.meat; i++) {
      const m = this.add.image(x + Phaser.Math.Between(-12, 12), y, 'ing-rawmeat')
        .setDepth(50).setScale(0.6);
      this.tweens.add({
        targets: m, x: this.meatChip.x, y: this.meatChip.y, scale: 0.3,
        duration: 520, delay: i * 120, ease: 'Cubic.easeIn',
        onComplete: () => {
          m.destroy();
          this.meatStock++;
          this.updateMeat();
          sfx.pop();
          haptic('coin');
        },
      });
    }

    this.panicUntil = this.time.now + PANIC_MS;
    this.customers.forEach((o) => {
      if (o.state === 'waiting') {
        this.tweens.add({ targets: o.sprite, x: o.sprite.x - 4, duration: 60, yoyo: true, repeat: 5 });
      }
    });
  }

  carnageBlast() {
    sfx.boom();
    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(200, 255, 120, 60);
    const targets = this.customers.filter((c) => c.state === 'waiting');
    targets.forEach((c) => this.killOne(c));
  }

  // -------------------------------------------------------------------- shop

  openShop() {
    if (this.gameOver || this.shopLayer) return;
    this.paused = true;
    sfx.click();

    const { W, H } = this.m;
    const L = this.add.layer().setDepth(100);
    this.shopLayer = L;
    const pw = Math.min(430, W - 36);
    // Version compacte : tout doit tenir à l'écran.
    const buyable = WEAPONS.filter((w) => !w.loto).length;
    const ph = 90 + buyable * 64 + UPGRADES.length * 56 + DECOR.length * 56 + 64;
    const shade = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    const panel = this.add.rectangle(W / 2, H / 2, pw, ph, 0x241d18, 0.98)
      .setStrokeStyle(4, 0xf7c948);
    const title = this.add.text(W / 2, H / 2 - ph / 2 + 34, 'Boutique du chef', {
      fontFamily: FONT, fontSize: '20px', color: '#f7c948', fontStyle: '800',
    }).setOrigin(0.5);
    L.add([shade, panel, title]);

    this.shopRows = [];
    this.upgRows = [];
    this.decorRows = [];
    const topY = H / 2 - ph / 2 + 56;
    WEAPONS.forEach((w, i) => {
      if (w.loto) return; // Le lance-flamme ne se vend pas : il se gagne.
      const y = topY + this.shopRows.length * 64;
      const img = this.add.image(W / 2 - pw / 2 + 44, y, w.texture).setScale(1.2);
      const name = this.add.text(W / 2 - pw / 2 + 86, y - 12, w.name, {
        fontFamily: FONT, fontSize: '15px', color: '#f6c9a0', fontStyle: '700',
      }).setOrigin(0, 0.5);
      const priceTxt = this.add.text(W / 2 - pw / 2 + 86, y + 12, '', {
        fontFamily: FONT, fontSize: '13px', color: '#9a90a0',
      }).setOrigin(0, 0.5);
      const btn = this.add.rectangle(W / 2 + pw / 2 - 74, y, 108, 40, 0x3a2a24)
        .setStrokeStyle(2, 0xf7c948).setInteractive();
      const btnTxt = this.add.text(W / 2 + pw / 2 - 74, y, '', {
        fontFamily: FONT, fontSize: '13px', color: '#f7c948', fontStyle: '700',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => this.shopAction(i));
      L.add([img, name, priceTxt, btn, btnTxt]);
      this.shopRows.push({ w, priceTxt, btn, btnTxt });
    });

    // Les améliorations de cuisine, juste sous les armes.
    const upTop = topY + buyable * 64 + 4;
    UPGRADES.forEach((u, j) => {
      const y = upTop + j * 56;
      const img = this.add.image(W / 2 - pw / 2 + 40, y, `icon-${u.icon}`)
        .setTint(0xf7c948).setScale(0.32);
      const name = this.add.text(W / 2 - pw / 2 + 70, y, u.name, {
        fontFamily: FONT, fontSize: '14px', color: '#f6c9a0', fontStyle: '700',
      }).setOrigin(0, 0.5);
      const priceTxt = this.add.text(W / 2 - pw / 2 + 70, y + 13, '', {
        fontFamily: FONT, fontSize: '11px', color: '#9a90a0',
      }).setOrigin(0, 0.5);
      const btn = this.add.rectangle(W / 2 + pw / 2 - 70, y, 92, 34, 0x3a2a24)
        .setStrokeStyle(2, 0xf7c948).setInteractive();
      const btnTxt = this.add.text(W / 2 + pw / 2 - 70, y, '', {
        fontFamily: FONT, fontSize: '12px', color: '#f7c948', fontStyle: '700',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => this.upgradeAction(j));
      L.add([img, name, priceTxt, btn, btnTxt]);
      this.upgRows.push({ u, priceTxt, btn, btnTxt });
    });

    // Les décorations de la salle, juste sous les améliorations.
    const decTop = upTop + UPGRADES.length * 56 + 4;
    DECOR.forEach((d, j) => {
      const y = decTop + j * 56;
      const tex = this.textures.get(d.icon).getSourceImage();
      const img = this.add.image(W / 2 - pw / 2 + 40, y, d.icon)
        .setScale(22 / Math.max(tex.width, tex.height));
      const name = this.add.text(W / 2 - pw / 2 + 70, y, d.name, {
        fontFamily: FONT, fontSize: '14px', color: '#f6c9a0', fontStyle: '700',
      }).setOrigin(0, 0.5);
      const priceTxt = this.add.text(W / 2 - pw / 2 + 70, y + 13, '', {
        fontFamily: FONT, fontSize: '11px', color: '#9a90a0',
      }).setOrigin(0, 0.5);
      const btn = this.add.rectangle(W / 2 + pw / 2 - 70, y, 92, 34, 0x3a2a24)
        .setStrokeStyle(2, 0xf7c948).setInteractive();
      const btnTxt = this.add.text(W / 2 + pw / 2 - 70, y, '', {
        fontFamily: FONT, fontSize: '12px', color: '#f7c948', fontStyle: '700',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => this.decorAction(j));
      L.add([img, name, priceTxt, btn, btnTxt]);
      this.decorRows.push({ d, priceTxt, btn, btnTxt });
    });

    // Le loto du chef : ticket à 100 €, jackpot = lance-flamme.
    const lotoTop = decTop + DECOR.length * 56 + 6;
    const lotoDivider = this.add.rectangle(W / 2, lotoTop, pw - 20, 2, 0xf7c948, 0.5);
    const lotoGift = this.add.image(W / 2 - pw / 2 + 36, lotoTop + 18, 'icon-gift')
      .setTint(0xe8483f).setScale(0.35);
    const lotoTitle = this.add.text(W / 2 - pw / 2 + 62, lotoTop + 11, 'Loto du chef', {
      fontFamily: FONT, fontSize: '13px', color: '#f7c948', fontStyle: '800',
    }).setOrigin(0, 0.5);
    const lotoInfo = this.add.text(W / 2 - pw / 2 + 62, lotoTop + 25,
      'Jackpot : lance-flamme ! Ticket : 100 €', {
        fontFamily: FONT, fontSize: '10px', color: '#9a90a0',
      }).setOrigin(0, 0.5);
    this.lotoResult = this.add.text(W / 2, lotoTop + 44, '', {
      fontFamily: FONT, fontSize: '12px', color: '#f7c948', fontStyle: '700',
    }).setOrigin(0.5);
    const lotoBtn = this.add.rectangle(W / 2 + pw / 2 - 66, lotoTop + 18, 86, 30, 0xe8483f)
      .setStrokeStyle(2, 0xffffff).setInteractive();
    const lotoBtnTxt = this.add.text(W / 2 + pw / 2 - 66, lotoTop + 18, 'Jouer (100 €)', {
      fontFamily: FONT, fontSize: '11px', color: '#ffffff', fontStyle: '700',
    }).setOrigin(0.5);
    lotoBtn.on('pointerdown', () => this.lotoPlay(this.lotoResult));
    L.add([lotoDivider, lotoGift, lotoTitle, lotoInfo, this.lotoResult, lotoBtn, lotoBtnTxt]);

    const close = this.add.image(W / 2 + pw / 2 - 26, H / 2 - ph / 2 + 26, 'icon-x')
      .setTint(0xf6c9a0).setScale(0.35).setInteractive();
    close.on('pointerdown', () => this.closeShop());
    L.add(close);

    this.refreshShop();
  }

  shopAction(i) {
    const w = WEAPONS[i];
    if (this.owned.includes(w.id)) {
      this.weaponIdx = i;
      sfx.click();
      haptic('tick');
      // Équiper une arme déjà possédée met aussi son affichage à jour.
      this.updateWpnButton();
    } else if (this.money >= w.price) {
      this.money -= w.price;
      this.owned.push(w.id);
      this.weaponIdx = i;
      sfx.buy();
      haptic('unlock');
      this.floatText(this.m.W / 2, this.m.H / 2 + 40, `${w.name} !`, '#f7c948');
    } else {
      sfx.fail();
      haptic('serve-bad');
      const row = this.shopRows[i];
      this.tweens.add({ targets: row.priceTxt, x: row.priceTxt.x + 6, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.updateWpnButton();
    this.updateHud();
    this.refreshShop();
  }

  decorAction(j) {
    const d = DECOR[j];
    if (this.decor[d.id]) {
      sfx.click();
      return;
    }
    if (this.money >= d.price) {
      this.money -= d.price;
      this.decor[d.id] = true;
      this.applyDecor();
      sfx.buy();
      haptic('unlock');
      this.floatText(this.m.W / 2, this.m.H / 2 + 40, `${d.name} !`, '#f7c948');
    } else {
      sfx.fail();
      haptic('serve-bad');
      const row = this.decorRows[j];
      this.tweens.add({ targets: row.priceTxt, x: row.priceTxt.x + 6, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.updateHud();
    this.refreshShop();
  }

  lotoPlay(resultTxt) {
    const TICKET = 100;
    if (this.money < TICKET) {
      sfx.fail();
      haptic('serve-bad');
      this.tweens.add({ targets: resultTxt, x: resultTxt.x + 6, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.money -= TICKET;
    this.updateHud();
    sfx.click();
    haptic('tick');

    // Tirage au sort.
    const total = LOTO.reduce((s, p) => s + p.w, 0);
    let roll = Phaser.Math.Between(1, total);
    let prize = LOTO[0];
    for (const p of LOTO) {
      if (roll <= p.w) {
        prize = p;
        break;
      }
      roll -= p.w;
    }

    // La roue tourne, puis la révélation.
    this.lotoSpinIdx = (this.lotoSpinIdx ?? 0) + 1;
    const spin = this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        if (!resultTxt.active) {
          spin.remove();
          return;
        }
        resultTxt.setText(LOTO[this.lotoSpinIdx % LOTO.length].label);
        this.lotoSpinIdx++;
        sfx.click();
        haptic('tick');
      },
    });
    this.time.delayedCall(800, () => {
      spin.remove();
      if (!resultTxt.active) return;
      resultTxt.setText(prize.label);
      if (prize.jackpot) {
        if (this.owned.includes('lanceflamme')) {
          // Déjà gagnée : la maison rembourse en espèces.
          this.money += 500;
          resultTxt.setText('+500 € (déjà gagnée !)');
          sfx.coin();
          haptic('coin');
        } else {
          prize.action.call(this);
          this.cameras.main.flash(200, 255, 180, 60);
          sfx.buy();
          haptic('unlock');
          this.floatText(this.m.W / 2, this.m.H / 2, 'LANCE-FLAMME GAGNÉE !', '#f7c948');
        }
      } else if (prize.action) {
        prize.action.call(this);
        sfx.coin();
        haptic('coin');
      } else {
        sfx.fail();
        haptic('serve-bad');
      }
      this.updateHud();
      this.refreshShop();
    });
  }

  winFlamethrower() {
    if (!this.owned.includes('lanceflamme')) this.owned.push('lanceflamme');
    this.weaponIdx = WEAPONS.findIndex((w) => w.id === 'lanceflamme');
    this.updateWpnButton();
  }

  upgradeAction(j) {
    const u = UPGRADES[j];
    if (this.upg[u.id]) {
      sfx.click();
      return;
    }
    if (this.money >= u.price) {
      this.money -= u.price;
      this.upg[u.id] = true;
      this.applyUpgrades();
      sfx.buy();
      haptic('unlock');
      this.floatText(this.m.W / 2, this.m.H / 2 + 40, `${u.name} !`, '#f7c948');
    } else {
      sfx.fail();
      haptic('serve-bad');
      const row = this.upgRows[j];
      this.tweens.add({ targets: row.priceTxt, x: row.priceTxt.x + 6, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.updateHud();
    this.refreshShop();
  }

  refreshShop() {
    if (!this.shopRows) return;
    this.shopRows.forEach((row, i) => {
      const w = row.w;
      const owned = this.owned.includes(w.id);
      const equipped = this.weaponIdx === i;
      if (owned) {
        row.priceTxt.setText('Possédée');
        row.btnTxt.setText(equipped ? 'Équipée' : 'Équiper');
        row.btn.setFillStyle(equipped ? 0x6b4f3f : 0x3a2a24);
      } else {
        const canAfford = this.money >= w.price;
        row.priceTxt.setText(`${w.price} pièces`).setColor(canAfford ? '#9a90a0' : '#e8483f');
        row.btnTxt.setText('Acheter');
        row.btn.setFillStyle(0x3a2a24);
      }
    });
    this.upgRows.forEach((row) => {
      const owned = !!this.upg[row.u.id];
      if (owned) {
        row.priceTxt.setText('');
        row.btnTxt.setText('Possédée');
        row.btn.setFillStyle(0x6b4f3f);
      } else {
        const can = this.money >= row.u.price;
        row.priceTxt.setText(`${row.u.price} pièces`).setColor(can ? '#9a90a0' : '#e8483f');
        row.btnTxt.setText('Acheter');
        row.btn.setFillStyle(0x3a2a24);
      }
    });
    this.decorRows.forEach((row) => {
      const owned = !!this.decor[row.d.id];
      if (owned) {
        row.priceTxt.setText('');
        row.btnTxt.setText('Installée');
        row.btn.setFillStyle(0x6b4f3f);
      } else {
        const can = this.money >= row.d.price;
        row.priceTxt.setText(`${row.d.price} pièces`).setColor(can ? '#9a90a0' : '#e8483f');
        row.btnTxt.setText('Acheter');
        row.btn.setFillStyle(0x3a2a24);
      }
    });
  }

  closeShop() {
    if (!this.shopLayer) return;
    this.shopLayer.destroy(true);
    this.shopLayer = null;
    this.paused = false;
    sfx.click();
  }

  openBook() {
    if (this.gameOver || this.shopLayer || this.bookLayer) return;
    this.paused = true;
    sfx.click();
    haptic('tick');

    const { W, H } = this.m;
    const L = this.add.layer().setDepth(100);
    this.bookLayer = L;
    // Plein écran, aux couleurs de la cuisine.
    L.add(this.add.rectangle(W / 2, H / 2, W, H, 0x241d18, 0.98).setInteractive());
    L.add(this.add.text(W / 2, 26, 'Menu du jour', {
      fontFamily: FONT, fontSize: '22px', color: '#f7c948', fontStyle: '800',
    }).setOrigin(0.5));

    // Grille de cartes de plats, deux par ligne.
    const cw = Math.min(170, (W - 40) / 2 - 6);
    const ch = 96;
    const rowH = ch + 10;
    const gridH = Math.ceil(RECIPES.length / 2) * rowH - 10;
    const top = Math.max(52, H / 2 - gridH / 2);
    RECIPES.forEach((r, i) => {
      const x = W / 2 + ((i % 2) - 0.5) * (cw + 12);
      const y = top + Math.floor(i / 2) * rowH + ch / 2;
      const card = this.add.rectangle(x, y, cw, ch, 0x3a2a24)
        .setStrokeStyle(2, 0xf7c948, 0.8);
      const name = this.add.text(x, y - ch / 2 + 12, r.name, {
        fontFamily: FONT, fontSize: '12px', color: '#f6c9a0', fontStyle: '700',
      }).setOrigin(0.5);
      const icons = r.items.map((k, j) => {
        const img = this.add.image(
          x + (j - (r.items.length - 1) / 2) * 22, y + 4, INGREDIENTS[k].texture);
        img.setScale(20 / Math.max(img.width, img.height));
        return img;
      });
      const price = this.add.text(x, y + ch / 2 - 13, `${r.price} pièces`, {
        fontFamily: FONT, fontSize: '11px', color: '#f7c948', fontStyle: '700',
      }).setOrigin(0.5);
      L.add([card, name, ...icons, price]);
    });

    L.add(this.add.text(W / 2, H - 42,
      'Les suppléments (sauce, boisson) s’ajoutent au prix du plat.', {
        fontFamily: FONT, fontSize: '11px', color: '#9a90a0',
        align: 'center', wordWrap: { width: Math.min(320, W - 40) },
      }).setOrigin(0.5));

    const close = this.add.circle(W - 26, 26, 16, 0xe8483f)
      .setStrokeStyle(3, 0xffffff).setInteractive();
    const closeIcon = this.add.image(W - 26, 26, 'icon-x').setScale(0.3);
    close.on('pointerdown', () => this.closeBook());
    L.add([close, closeIcon]);
  }

  closeBook() {
    if (!this.bookLayer) return;
    this.bookLayer.destroy(true);
    this.bookLayer = null;
    this.paused = false;
    sfx.click();
  }

  // Applique les améliorations de cuisine : capacité du plateau, plaque
  // supplémentaire et sa vitesse — tout est visible dans la cuisine.
  applyUpgrades() {
    this.plateMax = this.upg.bigPlate ? BIG_PLATE : PLATE_MAX;
    const b2 = !!this.upg.burner2;
    this.flame2.setVisible(b2);
    if (!b2) {
      this.cooking2 = false;
      this.readySteak2 = false;
      this.stoveProg2.setVisible(false);
      this.stoveFill2.setVisible(false);
      this.stoveSteak2.setVisible(false);
    }
    this.layoutAll();
  }

  // ------------------------------------------------------------------ helpers

  updateWpnButton() {
    const w = WEAPONS[this.weaponIdx];
    this.wpnIcon.setTexture(w.texture);
    // La hauteur varie selon l'arme : on recalibre l'icône du bouton.
    this.wpnIcon.setScale((this.btnR ?? 40) * 1.15 / this.wpnIcon.height);
    // Le curseur du mode carnage porte lui aussi l'arme équipée.
    this.cursor.setTexture(w.texture);
    this.cursor.setScale(1.8);
  }

  updateMeat() {
    this.meatTxt.setText(`× ${this.meatStock}`);
  }

  updateHud() {
    this.moneyTxt.setText(`${this.money}`);
    this.scoreTxt.setText(`${this.score}`);
    this.dayTxt
      .setText(`Journée ${this.day} · ${this.dayServed}/${this.dayQuota}`)
      .setPosition(this.moneyTxt.x + this.moneyTxt.width + 16, this.m.hudH / 2);
    this.starIcon.setPosition(this.m.W - 56 - this.scoreTxt.width - 26, this.m.hudH / 2);
    this.heartImgs.forEach((h, i) => {
      const alive = i < this.hearts;
      h.setTint(alive ? 0xe8483f : 0x5a4632);
      h.setAlpha(alive ? 1 : 0.35);
    });
  }

  floatText(x, y, str, color) {
    const t = this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: '18px', color, fontStyle: '800',
    }).setOrigin(0.5).setDepth(70);
    this.tweens.add({
      targets: t, y: y - 46, alpha: 0, duration: 900, ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  showEventBanner() {
    if (!this.event) return;
    const e = this.event;
    const W = this.m.W;
    const bw = Math.min(W - 40, 320);
    this.eventBanner = this.add.container(W / 2, this.m.hudH + 18).setDepth(30);
    const rect = this.add.rectangle(0, 0, bw, 30, 0x241d18, 0.92)
      .setStrokeStyle(3, e.tint);
    const icon = this.add.image(-bw / 2 + 18, 0, `icon-${e.icon}`)
      .setTint(e.tint).setScale(0.24);
    this.eventTxt = this.add.text(-bw / 2 + 34, 0, '', {
      fontFamily: FONT, fontSize: '11px', color: '#f6c9a0',
    }).setOrigin(0, 0.5);
    this.eventBanner.add([rect, icon, this.eventTxt]);
    this.updateEventBanner();
  }

  updateEventBanner() {
    if (!this.event || !this.eventTxt) return;
    const e = this.event;
    if (e.endAt > 0) {
      const remaining = Math.max(0, Math.ceil((e.endAt - this.time.now) / 1000));
      this.eventTxt.setText(`${e.name} — ${e.desc} · ${remaining}s`);
      if (remaining <= 0) {
        const b = this.eventBanner;
        this.event = null;
        this.eventBanner = null;
        this.eventTxt = null;
        this.tweens.add({
          targets: b, alpha: 0, duration: 400,
          onComplete: () => b.destroy(),
        });
      }
    } else {
      this.eventTxt.setText(`${e.name} — ${e.desc} · toute la journée`);
    }
  }

  clearEventBanner() {
    if (this.eventBanner) {
      this.eventBanner.destroy();
      this.eventBanner = null;
      this.eventTxt = null;
    }
    this.event = null;
  }

  showHint(msg) {
    if (this.hintTxt) {
      this.tweens.killTweensOf(this.hintTxt);
      this.hintTxt.destroy();
      this.hintTxt = null;
    }
    const { W } = this.m;
    this.hintTxt = this.add.text(W / 2, this.hintY ?? this.m.H - 150, msg, {
      fontFamily: FONT, fontSize: '14px', color: '#f6c9a0',
      align: 'center', wordWrap: { width: Math.min(420, W * 0.85) },
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({ targets: this.hintTxt, alpha: 1, duration: 300 });
    this.tweens.add({
      targets: this.hintTxt, alpha: 0, delay: 5200, duration: 500,
      onComplete: () => {
        if (this.hintTxt) {
          this.hintTxt.destroy();
          this.hintTxt = null;
        }
      },
    });
  }

  gameOverNow() {
    if (this.gameOverOverlay) return;
    this.gameOver = true;
    this.paused = true;
    if (this.shopLayer) {
      this.shopLayer.destroy(true);
      this.shopLayer = null;
    }
    this.cursor.setVisible(false);
    this.clearEventBanner();
    sfx.fail();
    haptic('gameover');

    const { W, H } = this.m;
    const L = this.add.layer().setDepth(110);
    this.gameOverOverlay = L;
    L.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
    L.add(this.add.rectangle(W / 2, H / 2, Math.min(360, W - 36), 300, 0x241d18)
      .setStrokeStyle(4, 0xb3202e));
    L.add(this.add.text(W / 2, H / 2 - 90, 'Service terminé !', {
      fontFamily: FONT, fontSize: '24px', color: '#e8483f', fontStyle: '800',
    }).setOrigin(0.5));
    L.add(this.add.text(W / 2, H / 2 - 40, `Recette totale : ${this.score}`, {
      fontFamily: FONT, fontSize: '17px', color: '#f6c9a0',
    }).setOrigin(0.5));
    L.add(this.add.text(W / 2, H / 2 - 8, `Caisse : ${this.money} pièces`, {
      fontFamily: FONT, fontSize: '15px', color: '#9a90a0',
    }).setOrigin(0.5));
    const btn = this.add.circle(W / 2, H / 2 + 70, 40, 0xe8483f)
      .setStrokeStyle(4, 0xffffff).setInteractive();
    const btnIcon = this.add.image(W / 2, H / 2 + 70, 'icon-rotate-ccw').setScale(0.4);
    btn.on('pointerdown', () => {
      sfx.click();
      haptic('tick');
      // On ne rejoue que la journée en cours : retour à l'état du matin.
      SAVE.money = SAVE.dayStartMoney;
      SAVE.score = SAVE.dayStartScore;
      SAVE.owned = [...SAVE.dayStartOwned];
      SAVE.weaponIdx = SAVE.dayStartWeaponIdx;
      SAVE.meatStock = SAVE.dayStartMeat;
      SAVE.upg = { ...SAVE.dayStartUpg };
      SAVE.decor = { ...SAVE.dayStartDecor };
      this.scene.restart();
    });
    L.add([btn, btnIcon]);
    L.add(this.add.text(W / 2, H / 2 + 128, 'Rejouer la journée', {
      fontFamily: FONT, fontSize: '13px', color: '#b8a890',
    }).setOrigin(0.5));
  }

  // ------------------------------------------------------------ fin de journée

  endDay() {
    if (this.dayEnded || this.gameOver) return;
    this.dayEnded = true;
    this.paused = true;
    if (this.shopLayer) {
      this.shopLayer.destroy(true);
      this.shopLayer = null;
    }
    this.cursor.setVisible(false);
    this.clearEventBanner();
    this.customers.forEach((c) => {
      if (c.bubble) c.bubble.destroy();
      c.sprite.destroy();
    });
    this.customers = [];
    sfx.buy();
    haptic('unlock');

    const { W, H } = this.m;
    const L = this.add.layer().setDepth(120);
    const pw = Math.min(360, W - 36);
    L.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
    L.add(this.add.rectangle(W / 2, H / 2, pw, 330, 0x241d18, 0.98)
      .setStrokeStyle(4, 0xf7c948));
    L.add(this.add.text(W / 2, H / 2 - 110, `Journée ${this.day} terminée !`, {
      fontFamily: FONT, fontSize: '22px', color: '#f7c948', fontStyle: '800',
    }).setOrigin(0.5));
    L.add(this.add.text(W / 2, H / 2 - 62, `Recette du jour : ${this.dayRevenue} pièces`, {
      fontFamily: FONT, fontSize: '16px', color: '#f6c9a0',
    }).setOrigin(0.5));
    L.add(this.add.text(W / 2, H / 2 - 32, `Clients tués : ${this.dayKilled}`, {
      fontFamily: FONT, fontSize: '15px', color: '#e88bb0',
    }).setOrigin(0.5));
    L.add(this.add.text(W / 2, H / 2 + 6, 'Note du service', {
      fontFamily: FONT, fontSize: '13px', color: '#9a90a0',
    }).setOrigin(0.5));
    // Une note sur 5 : cœurs restants et décor de la salle.
    const decorBonus = DECOR.reduce((s, d) => s + (this.decor[d.id] ? d.bonus : 0), 0);
    const note = Phaser.Math.Clamp(this.hearts + 2 + decorBonus, 1, 5);
    const starY = H / 2 + 36;
    for (let i = 0; i < 5; i++) {
      const star = this.add.image(W / 2 + (i - 2) * 34, starY, 'icon-star')
        .setScale(0.28)
        .setTint(i < note ? 0xf7c948 : 0x5a4632);
      L.add(star);
    }
    const btn = this.add.circle(W / 2, H / 2 + 96, 40, 0xe8483f)
      .setStrokeStyle(4, 0xffffff).setInteractive();
    const btnIcon = this.add.image(W / 2, H / 2 + 96, 'icon-arrow-right').setScale(0.42);
    btn.on('pointerdown', () => {
      sfx.click();
      haptic('tick');
      SAVE.advance = true;
      SAVE.money = this.money;
      SAVE.score = this.score;
      SAVE.owned = this.owned;
      SAVE.weaponIdx = this.weaponIdx;
      SAVE.meatStock = this.meatStock;
      this.scene.restart();
    });
    L.add([btn, btnIcon]);
    L.add(this.add.text(W / 2, H / 2 + 154, 'Journée suivante — ils seront plus pressés', {
      fontFamily: FONT, fontSize: '13px', color: '#b8a890',
    }).setOrigin(0.5));
  }

  // -------------------------------------------------------------------- frame

  update(time, delta) {
    if (this.paused || this.gameOver) return;

    // Bandeau de l'événement du jour.
    this.updateEventBanner();

    // Sans viande, le halo pointe le joueur vers le bouton rouge.
    const needMeatHelp = this.meatStock <= 0 && !this.carnage;
    if (needMeatHelp) {
      if (!this.axeRing.visible) {
        this.axeRing.setVisible(true);
        this.axeRingTween = this.tweens.add({
          targets: this.axeRing, scale: 1.18, duration: 450,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
    } else if (this.axeRing.visible) {
      this.axeRing.setVisible(false);
      if (this.axeRingTween) {
        this.axeRingTween.stop();
        this.axeRingTween = null;
      }
      this.axeRing.setScale(1);
    }

    // Spawning
    this.spawnElapsed += delta;
    if (this.spawnElapsed >= this.nextSpawn) {
      this.spawnElapsed = 0;
      // Chaque journée, les clients arrivent plus vite.
      this.nextSpawn = Phaser.Math.Clamp(9000 - 900 * (this.day - 1) - this.score * 6, 3200, 9000)
        + Phaser.Math.Between(0, 2000);
      if (this.freeSlot() >= 0) this.spawnCustomer();
    }

    // Patience
    const panic = this.time.now < this.panicUntil;
    for (const c of [...this.customers]) {
      if (c.state !== 'waiting') continue;
      c.patience -= delta * (panic ? 2 : 1);
      if (c.bubble) {
        c.bubble.setPosition(c.sprite.x, c.sprite.y - 62);
        if (c.badge) c.badge.setPosition(c.sprite.x, c.sprite.y - 102);
        const ratio = Math.max(0, c.patience / c.maxPatience);
        c.patFill.scaleX = ratio;
        c.patFill.setFillStyle(ratio > 0.5 ? 0x6fbf4e : ratio > 0.25 ? 0xf7c948 : 0xe8483f);
      }
      if (c.patience <= 0) {
        sfx.angry();
        haptic('serve-bad');
        this.hearts--;
        this.resetCombo();
        this.updateHud();
        this.leaveAngry(c);
        if (this.hearts <= 0) this.time.delayedCall(500, () => this.gameOverNow());
      }
    }

    // Progression des deux plaques
    if (this.cooking) {
      const p = Phaser.Math.Clamp((this.time.now - this.cookStart) / this.cookDur, 0, 1);
      this.stoveFill.scaleX = Math.max(0.02, p);
    }
    if (this.cooking2) {
      const p = Phaser.Math.Clamp((this.time.now - this.cook2Start) / this.cook2Dur, 0, 1);
      this.stoveFill2.scaleX = Math.max(0.02, p);
    }

    // Fryer progress
    if (this.frying) {
      const p = Phaser.Math.Clamp((this.time.now - this.fryStart) / FRY_MS, 0, 1);
      this.fryFill.scaleX = Math.max(0.02, p);
    }

    // Les livres du restaurant suivent la partie en cours.
    SAVE.money = this.money;
    SAVE.score = this.score;
    SAVE.owned = this.owned;
    SAVE.weaponIdx = this.weaponIdx;
    SAVE.meatStock = this.meatStock;
    SAVE.upg = { ...this.upg };
    SAVE.decor = { ...this.decor };
  }
}