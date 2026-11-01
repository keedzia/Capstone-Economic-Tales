// Materials
const MATERIALS = {
  straw: { gather: 1, build: 1, strength: 20 },
  stick: { gather: 2, build: 2, strength: 50 },
  brick: { gather: 4, build: 3, strength: 90 },
};

// The pigs
// gatherHours = hours this pig needs to gather one load (null = can't/doesn't).
class Pig {
  constructor(name, specialty, gatherHours, tokens = 10) {
    this.name = name;
    this.specialty = specialty;
    this.gatherHours = gatherHours;
    this.tokens = tokens;
    this.inventory = { straw: 0, stick: 0, brick: 0 };
    this.layers = []; // built layers, e.g. ['brick', 'stick']
  }
}

const wiggy  = new Pig('Wiggy',  'straw', { straw: 1,   stick: 2,    brick: 4 });
const iggy   = new Pig('Iggy',   'brick', { straw: 2.5, stick: null, brick: 2 }, Infinity);
const melvin = new Pig('Melvin', 'stick', { straw: 2.5, stick: 1,    brick: null }, Infinity);

// Player actions (each costs hour tokens)
function gather(pig, material) {
  const cost = MATERIALS[material].gather;
  if (pig.tokens < cost) return false;
  pig.tokens -= cost;
  pig.inventory[material]++;
  return true;
}

// Skipping rest adds 1 hour to the build cost.
function build(pig, material, rested) {
  const cost = MATERIALS[material].build + (rested ? 0 : 1);
  if (pig.inventory[material] < 1 || pig.tokens < cost) return false;
  pig.tokens -= cost;
  pig.inventory[material]--;
  pig.layers.push(material);
  return true;
}

function rest(pig) {
  if (pig.tokens < 1) return false;
  pig.tokens -= 1;
  return true;
}

// Opportunity cost: what the same hours could have built
function opportunityCost(hours) {
  const out = {};
  for (const [m, v] of Object.entries(MATERIALS)) out[m] = hours / (v.gather + v.build);
  return out; // e.g. 7 hours -> { straw: 3.5, stick: 1.75, brick: 1 }
}

// House strength
// Day 1: strongest single layer. Day 2: strongest layer + half the second strongest.
function houseStrength(pig, day) {
  if (!pig.layers.length) return 0;
  const v = pig.layers.map(m => MATERIALS[m].strength).sort((a, b) => b - a);
  return day === 1 ? v[0] : v[0] + (v[1] || 0) / 2;
}

// Wolf
const WOLF = { 1: 60, 2: 100 };
function night(pig, day) {
  const s = houseStrength(pig, day);
  return { strength: s, survives: s > WOLF[day] }; // a tie is a loss
}

// Day 2 trading: the player must pick ONE offer
const OFFERS = [
  { id: 'A', from: iggy,   give: 'brick', costHours: 2 }, // 1 brick-load for 2 hrs of straw-work
  { id: 'B', from: melvin, give: 'stick', costHours: 1 }, // 1 stick bundle for 1 hr of straw-work
];

function trade(pig, offerId, qty = 1) {
  const o = OFFERS.find(x => x.id === offerId);
  if (!o) return false;
  const cost = o.costHours * qty;
  if (pig.tokens < cost) return false;
  pig.tokens -= cost;
  pig.inventory[o.give] += qty;
  return true;
}

// Demo: play Day 1 and Day 2
if (require.main === module) {
  // Day 1: gather 1 brick-load (4h), rest (1h), build (3h) = 8 hrs
  gather(wiggy, 'brick'); rest(wiggy); build(wiggy, 'brick', true);
  console.log('Night 1:', night(wiggy, 1)); // 90 vs 60 -> survives

  // Day 2: fresh tokens, trade 1 hr for a stick bundle, rest 1h, build sticks (2h)
  wiggy.tokens = 10;
  trade(wiggy, 'B', 1); rest(wiggy); build(wiggy, 'stick', true);
  console.log('Night 2:', night(wiggy, 2)); // 90 + 25 = 115 vs 100 -> survives
  console.log('7 hours could have built:', opportunityCost(7));
}