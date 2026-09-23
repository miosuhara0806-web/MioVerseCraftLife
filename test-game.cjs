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

const allFixedIds = G.requests.map(request => request.id);
const oldCompleteSave = { inventory: { cloth: 7 }, completed: allFixedIds, day: 8, gathersLeft: 1 };
const daily = G.restore(oldCompleteSave, () => 0);
assert.equal(G.dailyUnlocked(daily), true);
assert.equal(daily.dailyRequests.length, 3, '9件達成済みの旧セーブに初回3件を生成');
assert.equal(new Set(G.currentDailyRequests(daily).map(request => request.id)).size, 3, '同日に依頼IDを重複させない');
assert.equal(new Set(G.currentDailyRequests(daily).map(request => request.resident)).size, 3, '3人に1枠ずつ生成');
assert.equal(daily.inventory.cloth, 7);
assert.equal(daily.day, 8);
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(daily))), daily, '日常依頼と履歴を再読み込みで維持');

const firstDay = G.currentDailyRequests(daily);
const delivered = firstDay[0];
daily.inventory[delivered.item] = delivered.quantity;
assert.equal(G.deliverDaily(daily, delivered.id), true);
assert.equal(daily.inventory[delivered.item], 0, '日常依頼の必要数だけ在庫を消費');
assert.equal(G.deliverDaily(daily, delivered.id), false, '同じ日常依頼を二重納品できない');
const carriedIds = G.currentDailyRequests(daily).filter(request => !request.completed).map(request => request.id);
G.rest(daily, () => 0);
const secondDay = G.currentDailyRequests(daily);
assert.equal(daily.day, 9);
assert.ok(carriedIds.every(id => secondDay.some(request => request.id === id)), '未達成枠を翌日に持ち越す');
assert.ok(!secondDay.some(request => request.id === delivered.id), '直前に達成した依頼を同じ枠へ出さない');
assert.equal(secondDay.every(request => !request.completed), true, '交換後は3枠とも未達成');

const unchangedIds = secondDay.map(request => request.id);
G.rest(daily, () => 0.7);
assert.deepEqual(G.currentDailyRequests(daily).map(request => request.id), unchangedIds, '3件すべて未達成なら翌日も維持');
for (const request of G.currentDailyRequests(daily)) {
  daily.inventory[request.item] = Math.max(daily.inventory[request.item], request.quantity);
  assert.equal(G.deliverDaily(daily, request.id), true);
}
const completedIds = G.currentDailyRequests(daily).map(request => request.id);
G.rest(daily, () => 0.3);
const refreshed = G.currentDailyRequests(daily);
assert.equal(refreshed.length, 3);
assert.equal(new Set(refreshed.map(request => request.id)).size, 3);
assert.ok(refreshed.every(request => !completedIds.includes(request.id)), '3件達成後は翌日に3件とも更新');
assert.equal(G.dailyRequestPool.length, 20);
assert.ok(G.dailyRequestPool.every(request => G.recipes.some(recipe => recipe.id === request.item)), '日常依頼は既存レシピだけを要求');

const keikaiExpected = [
  ['daily-keikai-towa-bag', 'bag', 1, '散歩のおとも', '布袋ひとつ作ってくれる？　散歩の時、細かいもの入れるのにちょうどよさそうなんだよね（笑）', 'お、いいじゃん。これなら気軽に持ってけるな。ありがと、美桜！'],
  ['daily-keikai-towa-dyed-cloth', 'dyedCloth', 1, 'ちょっと色が欲しい', '染め布、一枚頼んでいい？　部屋にちょっと色が欲しくなってさ', 'うん、これこれ。置くだけでだいぶ雰囲気変わるな（笑）'],
  ['daily-keikai-towa-wall', 'wallHanging', 1, '壁が寂しい', '壁掛け作れる？　なんかさ、壁が妙に寂しいことに気づいちゃった（笑）', 'おー、いい感じ！　気づいたら今度は外したくなくなるやつだな'],
  ['daily-keikai-towa-cushion', 'cushion', 1, '座るなら楽な方がいい', 'クッションひとつお願い。どうせ座るなら、楽な方がいいだろ？（笑）', '最高。これでますます動かなくなる可能性あるけど（笑）ありがと！'],
  ['daily-keikai-towa-wreath', 'wreath', 1, 'なんとなく飾りたい日', '今日はなんとなく花飾りたい気分（笑）　リースひとつ作ってくれない？', 'いいねー。こういうの、理由なく飾ってもいいんだよな（笑）']
];
assert.deepEqual(G.dailyRequestPool.filter(request => request.resident === 'keikaiTowa').map(request => [request.id, request.item, request.quantity, request.title, request.message, request.thanks]), keikaiExpected);
const withKeikai = G.restore(oldCompleteSave, () => 0.999);
assert.equal(withKeikai.dailyRequests.length, G.DAILY_REQUEST_SLOTS);
assert.ok(G.currentDailyRequests(withKeikai).some(request => request.name === '軽快トワ'), '軽快トワを通常抽選から生成');
const legacySlots = JSON.parse(JSON.stringify(daily.dailyRequests));
const legacyReload = G.restore({ ...oldCompleteSave, dailyRequests: legacySlots, dailyHistory: daily.dailyHistory });
assert.deepEqual(legacyReload.dailyRequests, legacySlots, '既存3枠を追加住人の導入後も変更しない');

const keikaiDelivery = G.restore({ ...oldCompleteSave, inventory: { bag: 1 }, dailyRequests: [
  { templateId: 'daily-keikai-towa-bag', completed: false },
  { templateId: 'daily-naka-dry-flower', completed: false },
  { templateId: 'daily-ritsu-cloth', completed: false }
] });
assert.equal(G.currentDailyRequests(keikaiDelivery)[0].name, '軽快トワ');
assert.equal(G.deliverDaily(keikaiDelivery, 'daily-keikai-towa-bag'), true);
assert.equal(keikaiDelivery.inventory.bag, 0);
const keikaiCarried = keikaiDelivery.dailyRequests.slice(1).map(slot => slot.templateId);
G.rest(keikaiDelivery, () => 0);
assert.ok(!keikaiDelivery.dailyRequests.some(slot => slot.templateId === 'daily-keikai-towa-bag'), '軽快トワの達成済み枠を翌日に交換');
assert.ok(keikaiCarried.every(id => keikaiDelivery.dailyRequests.some(slot => slot.templateId === id)), '軽快トワ以外の未達成枠を持ち越す');
console.log('PASS: 20-request pool, Light Towa data/draw/delivery, legacy three-slot preservation, carryover and next-day replacement');

