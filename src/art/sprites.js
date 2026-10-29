// All the pixel art of the game: customers, the chef, ingredients, weapons and
// the splat. Each sprite is a list of strings; every character maps to a
// palette index, '.' being transparent.

import { PALETTE } from './palette.js';
import { renderPixelArt } from './PixelRenderer.js';

const px = (rows, map, scale = 4) => {
  // Toutes les lignes sont calées sur la largeur de la plus longue : un
  // compte de pixels approximatif ne peut plus déformer le sprite.
  const w = Math.max(...rows.map((r) => r.length));
  return {
    pixels: rows.map((r) => [...r.padEnd(w, '.')].map((ch) => map[ch] ?? 0)),
    scale,
  };
};

// ---------------------------------------------------------------- customers

const CUSTOMER_ROWS = [
  '....oooo....',
  '..oohhhhoo..',
  '.ohhhhhhhho.',
  '.ohhhhhhhho.',
  '.ohssssssho.',
  '.osskssksso.',
  '.osssssssso.',
  '..oobbbboo..',
  '.obbbbbbbbo.',
  'obbbbbbbbbbo',
  'osbbbbbbbbso',
  '..obbbbbbo..',
  '..oppppppo..',
  '..oppppppo..',
  '..opp..ppo..',
  '..opp..ppo..',
  '..ooo..ooo..',
];

const custMap = (hair, shirt) => ({ '.': 0, o: 1, h: hair, s: 5, k: 18, b: shirt, p: 19 });

const COMBOS = [
  [4, 13], [16, 3], [15, 7], [14, 13], [4, 7], [16, 13],
];

// Le critique gastronomique : costume sombre, chemise blanche, nœud papillon.
const CRITIC_ROWS = [
  '....oooo....',
  '..oohhhhoo..',
  '.ohhhhhhhho.',
  '.ohhhhhhhho.',
  '.ohssssssho.',
  '.osskssksso.',
  '.osssssssso.',
  '..oobttboo..',
  '.obbwwbbbbo.',
  'obbwwbbbbbbo',
  'osbbwwbbbbso',
  '..obbbbbbo..',
  '..oppppppo..',
  '..oppppppo..',
  '..opp..ppo..',
  '..opp..ppo..',
  '..ooo..ooo..',
];

// Le gros mangeur : un gabarit bien plus large que les autres clients.
const BIG_ROWS = [
  '.....oooooo.....',
  '....oohhhhoo....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohssssssho...',
  '...osskssksso...',
  '...osssssssso...',
  '....oobbbboo....',
  '...obbbbbbbbo...',
  '..obbbbbbbbbbo..',
  '.obbbbbbbbbbbbo.',
  'osbbbbbbbbbbbbso',
  '.obbbbbbbbbbbbo.',
  '..obbbbbbbbbbo..',
  '...oppppppppo...',
  '...oppppppppo...',
  '...opp....opp...',
  '...opp....opp...',
  '...ooo....ooo...',
];

// Le client pressé : casquette, torse penché, jambes en pleine enjambée.
const RUSHED_ROWS = [
  '....oooo....',
  '..ooyyyyoo..',
  '.oyyyyyyyyo.',
  '.ohssssssho.',
  '.osskssksso.',
  '.osssssssso.',
  '..oobbbboo..',
  '.obbbbbbbbo.',
  'obbbbbbbbbbo',
  'osbbbbbbbbso',
  '..obbbbbbo..',
  '..oppppppo..',
  '..oppppppo..',
  '..opp.pppo..',
  '..op...ppo..',
  '..o...ppo...',
  '..oo..ooo...',
];

// --------------------------------------------------------------------- chef

const CHEF_ROWS = [
  '..owwwwwwwwo..',
  '.owwwwwwwwwwo.',
  '..oooooooooo..',
  '..osssssssso..',
  '..osskssksso..',
  '..osssssssso..',
  '..osswwwwsso..',
  '..osssssssso..',
  '.owwwwwwwwwwo.',
  'owwwwkwwkwwwwwo',
  'owwwwkwwkwwwwwo',
  'owwwwwwwwwwwwo',
  '.owwwwwwwwwwo.',
];

// ------------------------------------------------------------- ingredients

const TOMATO_ROWS = [
  '....g....',
  '...ggg...',
  '.otttttto.',
  'ottwtttto',
  'ottttttto',
  'ottttttto',
  '.otttttto.',
  '..ottto..',
  '...ooo...',
];

const BREAD_ROWS = [
  '...oooo...',
  '.oobbbboo.',
  'obbbbbbbbo',
  'obdbbbbdbo',
  'obbbdbbbbo',
  'obbbbbbbbo',
  '.oooooooo.',
];

const CHEESE_ROWS = [
  '.oooooooo.',
  'oeeeeeeeeo',
  'oeedeeeeeo',
  'oeeeeeeeeo',
  'oeeeeddeeo',
  'oedeeeeeeo',
  'oeeeeeeeeo',
  '.oooooooo.',
];

const LETTUCE_ROWS = [
  '..l.ll.l..',
  '.llllllll.',
  'lLllLllLll',
  'llLlllLlll',
  '.llllllll.',
  '..llllll..',
  '....ll....',
];

const STEAK_ROWS = [
  '..oooooooo..',
  '.oddddddddo.',
  'oddkddddkddo',
  'oddddddddddo',
  'oddkddddkddo',
  'oddddddddddo',
  '.oddddddddo.',
  '..oooooooo..',
];

const RAWMEAT_ROWS = [
  '..oooooooo..',
  '.orrrrrrrro.',
  'orrrffffffro',
  'orrrrrrrrrro',
  'orffrrrrrrro',
  'orrrrrrrrrro',
  '.orrrrrrrro.',
  '..oooooooo..',
];

const FRIES_ROWS = [
  '...y..y...',
  '..yy..yy..',
  '..yy..yy..',
  '..yy..yy..',
  '.oooooooo.',
  '.ottttttto',
  '.ottttttto',
  '.ottttttto',
  '..ottttto.',
  '..ooooooo.',
];

const SAUCE_ROWS = [
  '..cccc..',
  '..cccc..',
  '..oooo..',
  '.owwwwo.',
  '.owwwwo.',
  '.orrrro.',
  '.orrrro.',
  '.owwwwo.',
  '.owwwwo.',
  '..oooo..',
];

const SODA_ROWS = [
  '..oooo..',
  '.orrrro.',
  'orrrrrro',
  'orwwwwro',
  'orwwwwro',
  'orrrrrro',
  'orrrrrro',
  '.orrrro.',
  '..oooo..',
];

const JUICE_ROWS = [
  '..oooo..',
  '.o....o.',
  '.o....o.',
  '.oeeeeo.',
  '.oeeeeo.',
  '.oeeeeo.',
  '.oeeeeo.',
  '.oeeeeo.',
  '..oooo..',
];

const NAPPE_ROWS = [
  '..oooooooo..',
  '.oNNNNNNNNo.',
  'oNNwwwwwwNNo',
  'oNNNNNNNNNNo',
  'oNNNNNNNNNNo',
  '.oNNNNNNNNo.',
  '..oooooooo..',
];

const PLANTE_ROWS = [
  '...l..l...',
  '..lLllLl..',
  '.l.lLlLl..',
  '..lLllLl..',
  '...lLLL...',
  '....lLL...',
  '....llo...',
  '..oooooo..',
  '.oddddddo.',
  '.oddddddo.',
  '.oddddddo.',
  '..oooooo..',
];

const PHOTO_ROWS = [
  'oooooooooo',
  'owwwwwwwwo',
  'owssssswo.',
  'owsksskwo.',
  'owssssswo.',
  'owkkkkkwo.',
  'owwwwwwwwo',
  'oooooooooo',
];

// ------------------------------------------------------------------ weapons

const CLEAVER_ROWS = [
  '...oooooooo...',
  '..ommmmmmmmo..',
  '..ommmoommmo..',
  '..ommmmmmmmo..',
  '...oooooooo...',
  '......oddo....',
  '......oddo....',
  '......oddo....',
  '......oooo....',
];

const BAT_ROWS = [
  '.........ooo..',
  '.ooddddbbbbo..',
  '.ooddddbbbbo..',
  '.ooooooooooo..',
  '.........ooo..',
];

const CHAINSAW_ROWS = [
  '.ooooooooo....',
  '.oRRRRRRRRo...',
  'ooRRRRRRRo....',
  '.ommmmmmmmmmm.',
  '.omkmkmkmkmkm.',
  '.ommmmmmmmmmm.',
  '..oRRRRRRo....',
  '..oooooooo....',
];

const BAZOOKA_ROWS = [
  '..............',
  '.ooooooooooo..',
  '.ommmmmmmmmRo.',
  '.ommmmmmmmmRo.',
  '.ooooooooooo..',
  '.....oRRo.....',
  '.....oRRo.....',
  '..............',
];

const PISTOL_ROWS = [
  '..oooo....',
  '.ommmmo...',
  '.ommmooooo',
  '.ommmmmmmo',
  '..oo.ooooo',
  '......oddo',
  '......oddo',
  '......ooo.',
];

const BULLET_ROWS = [
  'oywwwwyo',
];

const ROCKET_ROWS = [
  'ommmmmmRo',
  'ooooooooo',
];

const LANCEFLAMME_ROWS = [
  '......oyy.....',
  '.....oyyy.....',
  '..ooooooooo...',
  '.oRRRRRRRmo..',
  '.oRRRRRRmmo..',
  '.oRRRRRRmmo..',
  '.oRRRRRRmmo..',
  '..ooooooooo...',
  '.....ooo......',
];

// -------------------------------------------------------------------- splat

const SPLAT_ROWS = [
  '..o......o..',
  '.oRRo..oRRo.',
  'oRRRRoRRRRRo',
  'oRRRRRRRRRRo',
  'oRRRRRRRRRRo',
  'oRRRRRRRRRo.',
  '.oRRRRRRRo..',
  '..oRRo.oRo..',
  '.o......o...',
];

// ---------------------------------------------------------------- registry

export const SPRITES = {
  chef: px(CHEF_ROWS, { '.': 0, o: 1, w: 6, s: 5, k: 18 }),
  'ing-tomato': px(TOMATO_ROWS, { '.': 0, o: 1, t: 3, g: 7, w: 6 }),
  'ing-bread': px(BREAD_ROWS, { '.': 0, o: 1, b: 8, d: 11 }),
  'ing-cheese': px(CHEESE_ROWS, { '.': 0, o: 1, e: 9, d: 11 }),
  'ing-lettuce': px(LETTUCE_ROWS, { '.': 0, o: 1, l: 7, L: 20 }),
  'ing-steak': px(STEAK_ROWS, { '.': 0, o: 1, d: 11 }),
  'ing-rawmeat': px(RAWMEAT_ROWS, { '.': 0, o: 1, r: 10, f: 6 }),
  'ing-fries': px(FRIES_ROWS, { '.': 0, o: 1, y: 4, t: 3 }),
  'ing-sauce': px(SAUCE_ROWS, { '.': 0, o: 1, c: 12, w: 6, r: 3 }),
  'ing-soda': px(SODA_ROWS, { '.': 0, o: 1, r: 3, w: 6 }),
  'ing-juice': px(JUICE_ROWS, { '.': 0, o: 1, e: 9 }),
  'dec-nappe': px(NAPPE_ROWS, { '.': 0, o: 1, N: 12, w: 6 }),
  'dec-plante': px(PLANTE_ROWS, { '.': 0, o: 1, l: 7, L: 20, d: 11 }),
  'dec-photo': px(PHOTO_ROWS, { '.': 0, o: 1, w: 6, s: 5, k: 18 }),
  'wpn-cleaver': px(CLEAVER_ROWS, { '.': 0, o: 1, m: 17, d: 11 }),
  'wpn-bat': px(BAT_ROWS, { '.': 0, o: 1, b: 8, d: 11 }),
  'wpn-chainsaw': px(CHAINSAW_ROWS, { '.': 0, o: 1, R: 3, m: 17, k: 18 }),
  'wpn-bazooka': px(BAZOOKA_ROWS, { '.': 0, o: 1, m: 17, R: 3 }),
  'wpn-pistolet': px(PISTOL_ROWS, { '.': 0, o: 1, m: 17, d: 11 }),
  'wpn-lanceflamme': px(LANCEFLAMME_ROWS, { '.': 0, o: 1, y: 4, R: 3, m: 17 }),
  bullet: px(BULLET_ROWS, { '.': 0, o: 1, y: 4, w: 6 }),
  rocket: px(ROCKET_ROWS, { '.': 0, o: 1, m: 17, R: 3 }),
  splat: px(SPLAT_ROWS, { '.': 0, o: 1, R: 12 }),
};

COMBOS.forEach(([hair, shirt], i) => {
  SPRITES[`cust-${i}`] = px(CUSTOMER_ROWS, custMap(hair, shirt));
});
SPRITES['cust-critic'] = px(CRITIC_ROWS, {
  '.': 0, o: 1, h: 16, s: 5, k: 18, b: 13, t: 3, w: 6, p: 2,
});
SPRITES['cust-big'] = px(BIG_ROWS, {
  '.': 0, o: 1, h: 4, s: 5, k: 18, b: 3, p: 19,
});
SPRITES['cust-rushed'] = px(RUSHED_ROWS, {
  '.': 0, o: 1, y: 4, h: 16, s: 5, k: 18, b: 7, w: 6, p: 19,
});

export function registerSprites(scene) {
  for (const [key, def] of Object.entries(SPRITES)) {
    if (scene.textures.exists(key)) continue;
    renderPixelArt(scene, def.pixels, PALETTE, key, def.scale);
  }
}