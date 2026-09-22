const assert = require('node:assert/strict');
const G = require('./game.js');
const s = G.fresh();
assert.equal(G.craft(s, 'box'), false);
assert.equal(G.deliver(s, 'naka'), false);
G.gather(s, 'vine');
G.craft(s, 'fiber', 2);
G.craft(s, 'thread', 2);
G.craft(s, 'cloth');
G.craft(s, 'bag');
assert.equal(s.inventory.bag, 1);
assert.equal(G.deliver(s, 'naka'), true);
assert.equal(s.inventory.bag, 0);
assert.equal(G.deliver(s, 'naka'), false);
G.gather(s, 'branch'); G.gather(s, 'branch');
G.craft(s, 'wood', 2); G.craft(s, 'plank', 2); G.craft(s, 'box');
assert.equal(G.deliver(s, 'towa'), true);
G.rest(s); G.gather(s, 'flower'); G.craft(s, 'dryFlower', 2); G.craft(s, 'dye');
assert.equal(G.deliver(s, 'ritsu'), true);
assert.equal(s.completed.length, 3);
assert.equal(Object.values(s.inventory).every(n => n === 0), true);
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(s))), s);
assert.equal(G.gather(s, 'flower'), true);
const before = JSON.stringify(s);
assert.equal(G.craft(s, 'dryFlower', 3), false);
assert.equal(G.craft(s, 'dryFlower', -1), false);
assert.equal(G.gather(s, 'box'), false);
assert.equal(JSON.stringify(s), before);
assert.equal(G.restore({ inventory: { branch: -2, vine: 1.5, flower: 4 }, completed: ['naka', 'naka', 'fake'] }).inventory.flower, 4);
assert.deepEqual(G.restore({ completed: ['naka', 'naka', 'fake'] }).completed, ['naka']);
console.log('PASS: all three loops, consumption, duplicate delivery, save round trip, invalid actions, continuing after completion');

const locked = G.fresh();
locked.inventory.curtain = 1;
assert.equal(G.deliver(locked, 'nakaCurtain'), false);
assert.equal(locked.inventory.curtain, 1);
assert.equal(G.visibleRequests(locked).length, 3);
assert.equal(G.restore({ completed: ['naka', 'ritsu', 'towa'], inventory: { cloth: 3 } }).unlockedStage, 2);
assert.equal(G.restore({ completed: ['naka'], inventory: { cloth: 3 } }).inventory.dyedCloth, 0);
assert.equal(G.restore({ completed: ['nakaCurtain'], unlockedStage: 2 }).unlockedStage, 1);

for (const id of ['dyedCloth', 'curtain', 'wallHanging', 'wreath', 'linedBox', 'cushion']) {
  const recipe = G.recipes.find(r => r.id === id);
  const inputs = G.ingredients(recipe);
  for (const missing of inputs) {
    const state = G.fresh();
    for (const input of inputs) state.inventory[input.id] = input === missing ? input.cost - 1 : 10;
    const before = JSON.stringify(state);
    assert.equal(G.craft(state, id), false);
    assert.equal(JSON.stringify(state), before, `${id}: one missing ingredient must not consume others`);
  }
  const state = G.fresh();
  for (const [index, input] of inputs.entries()) state.inventory[input.id] = input.cost * (index + 2);
  assert.equal(G.maxCraft(state, recipe), 2);
  assert.equal(G.craft(state, id, 2), true);
  assert.equal(state.inventory[id], 2);
  inputs.forEach((input, index) => assert.equal(state.inventory[input.id], input.cost * index));
  assert.deepEqual(state.completed, []);
}
console.log('PASS: unlock gating, old save migration, atomic multi-input consumption, limiting ingredient for batch crafting');

const oldSix = { inventory: { box: 2, dyedCloth: 4 }, completed: G.requests.filter(r => (r.stage || 1) <= 2).map(r => r.id), unlockedStage: 2 };
const migrated = G.restore(oldSix);
assert.equal(migrated.unlockedStage, 3);
assert.equal(migrated.inventory.box, 2);
assert.equal(migrated.inventory.dyedCloth, 4);
assert.equal(migrated.inventory.wreath, 0);
assert.equal(G.visibleRequests(migrated).length, 9);
for (const request of G.requests.filter(r => r.stage === 3)) {
  const locked = G.restore({ ...oldSix, completed: oldSix.completed.slice(0, 5) });
  locked.inventory[request.item] = 1;
  const before = JSON.stringify(locked);
  assert.equal(G.deliver(locked, request.id), false);
  assert.equal(JSON.stringify(locked), before);
  assert.equal(G.visibleRequests(locked).length, 6);
}
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(migrated))), migrated);
console.log('PASS: old six-request save migration and locked stage 3 delivery guards');

const days = G.restore(oldSix);
const progress = JSON.stringify({ inventory: days.inventory, completed: days.completed, unlockedStage: days.unlockedStage });
for (let i = 0; i < 100; i++) G.rest(days);
assert.equal(days.day, 101);
assert.equal(days.gathersLeft, 3);
assert.equal(JSON.stringify({ inventory: days.inventory, completed: days.completed, unlockedStage: days.unlockedStage }), progress);
days.day = Number.MAX_SAFE_INTEGER;
G.rest(days);
assert.equal(days.day, '9007199254740992');
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(days))), days);
assert.equal(G.restore({ day: -1, gathersLeft: 4 }).gathersLeft, 3);
assert.equal(G.restore({ day: 5, gathersLeft: 0 }).gathersLeft, 0);
console.log('PASS: no day penalty or day cap, validation and zero gathers restoration');

