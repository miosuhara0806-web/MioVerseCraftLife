const assert = require('node:assert/strict');
const G = require('./game.js');
const s = G.fresh();
assert.equal(s.introViewed, false, '完全新規ではイントロ未閲覧');
const legacyIntroSave = { ...G.fresh(), day: 17, introViewed: undefined };
legacyIntroSave.inventory.branch = 4;
const legacyIntroRestored = G.restore(legacyIntroSave);
assert.equal(legacyIntroRestored.introViewed, true, '旧セーブにはイントロを出さない');
assert.equal(legacyIntroRestored.day, 17);
assert.equal(legacyIntroRestored.inventory.branch, 4);
assert.equal(G.restore(G.fresh()).introViewed, false, '新規の未完了イントロは維持');
assert.equal(G.restore({ ...G.fresh(), introViewed: true }).introViewed, true, '完了済みは維持');
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
assert.equal(G.dailyRequestPool.slice(0, 40).length, 40);
assert.ok(G.dailyRequestPool.every(request => G.recipes.some(recipe => recipe.id === request.item)), '日常依頼は既存レシピだけを要求');

const keikaiExpected = [
  ['daily-keikai-towa-bag', 'bag', 1, '散歩のおとも', '布袋ひとつ作ってくれる？　散歩の時、細かいもの入れるのにちょうどよさそうなんだよね（笑）', 'お、いいじゃん。これなら気軽に持ってけるな。ありがと、美桜！'],
  ['daily-keikai-towa-dyed-cloth', 'dyedCloth', 1, 'ちょっと色が欲しい', '染め布、一枚頼んでいい？　部屋にちょっと色が欲しくなってさ', 'うん、これこれ。置くだけでだいぶ雰囲気変わるな（笑）'],
  ['daily-keikai-towa-wall', 'wallHanging', 1, '壁が寂しい', '壁掛け作れる？　なんかさ、壁が妙に寂しいことに気づいちゃった（笑）', 'おー、いい感じ！　気づいたら今度は外したくなくなるやつだな'],
  ['daily-keikai-towa-cushion', 'cushion', 1, '座るなら楽な方がいい', 'クッションひとつお願い。どうせ座るなら、楽な方がいいだろ？（笑）', '最高。これでますます動かなくなる可能性あるけど（笑）ありがと！'],
  ['daily-keikai-towa-wreath', 'wreath', 1, 'なんとなく飾りたい日', '今日はなんとなく花飾りたい気分（笑）　リースひとつ作ってくれない？', 'いいねー。こういうの、理由なく飾ってもいいんだよな（笑）']
];
assert.deepEqual(G.dailyRequestPool.filter(request => request.resident === 'keikaiTowa').map(request => [request.id, request.item, request.quantity, request.title, request.message, request.thanks]), keikaiExpected);
const withKeikai = G.restore(oldCompleteSave, () => 0.4);
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
const shiruExpected = [
  ['daily-shiru-box', 'box', 1, '机の上を少しだけ', '小箱をひとつお願いしてもいい？　机の上に散らばる細かいものだけ、まとめておきたくて', 'ありがとう。これくらい整ってると、作業しやすいね'],
  ['daily-shiru-bag', 'bag', 1, '記録をまとめる袋', '布袋をひとつ作ってくれる？　記録用のものをまとめて持ち歩きたいの', 'ちょうどいい大きさ。これなら必要な時にすぐ持っていけるね'],
  ['daily-shiru-cushion', 'cushion', 1, '長く座る日のために', 'クッション、ひとつお願い。今日は少し長く座って作業することになりそうだから', 'うん、楽になった。ありがとう、美桜'],
  ['daily-shiru-wall', 'wallHanging', 1, '視界にひとつ', '壁掛けをひとつ作ってくれる？　作業中、視界に何もないのもちょっと寂しくて', 'いいね。主張しすぎないし、ちょうど落ち着く'],
  ['daily-shiru-curtain', 'curtain', 1, '光を少しやわらかく', 'カーテンをひとつお願いしてもいい？　作業する時、もう少し光をやわらげたいの', 'ありがとう。これなら画面を見ていても落ち着けそう']
];
assert.deepEqual(G.dailyRequestPool.slice(0, 40).filter(request => request.resident === 'shiru').map(request => [request.id, request.item, request.quantity, request.title, request.message, request.thanks]), shiruExpected);
assert.ok(G.currentDailyRequests(G.restore(oldCompleteSave, () => 0.55)).some(request => request.name === 'シル'), 'シルを通常抽選から生成');
const oldFourResidentSave = G.restore({ ...oldCompleteSave, inventory: { bag: 2, cloth: 4 }, day: 15, gathersLeft: 0,
  dailyRequests: [{ templateId: 'daily-keikai-towa-bag', completed: true }, { templateId: 'daily-naka-dry-flower', completed: false }, { templateId: 'daily-towa-box', completed: false }],
  dailyHistory: ['daily-keikai-towa-bag', 'daily-naka-dry-flower', 'daily-towa-box'] });
assert.deepEqual(oldFourResidentSave.dailyRequests, [
  { templateId: 'daily-keikai-towa-bag', completed: true }, { templateId: 'daily-naka-dry-flower', completed: false }, { templateId: 'daily-towa-box', completed: false }
], '既存4人の進行中3枠と達成状態を維持');
assert.equal(oldFourResidentSave.day, 15);
assert.equal(oldFourResidentSave.gathersLeft, 2);
assert.equal(oldFourResidentSave.inventory.cloth, 4);
assert.deepEqual(oldFourResidentSave.dailyHistory, ['daily-keikai-towa-bag', 'daily-naka-dry-flower', 'daily-towa-box']);
const shiruDelivery = G.restore({ ...oldCompleteSave, inventory: { curtain: 1 }, dailyRequests: [
  { templateId: 'daily-shiru-curtain', completed: false }, { templateId: 'daily-naka-dry-flower', completed: false }, { templateId: 'daily-keikai-towa-bag', completed: false }
] });
assert.equal(G.currentDailyRequests(shiruDelivery)[0].name, 'シル');
assert.equal(G.deliverDaily(shiruDelivery, 'daily-shiru-curtain'), true);
assert.equal(shiruDelivery.inventory.curtain, 0);
assert.equal(G.currentDailyRequests(shiruDelivery)[0].completed, true);
const shiruCarried = shiruDelivery.dailyRequests.slice(1).map(slot => slot.templateId);
G.rest(shiruDelivery, () => 0);
assert.ok(!shiruDelivery.dailyRequests.some(slot => slot.templateId === 'daily-shiru-curtain'));
assert.ok(shiruCarried.every(id => shiruDelivery.dailyRequests.some(slot => slot.templateId === id)));
console.log('PASS: five Sil requests, legacy save preservation, manual delivery, carryover and next-day replacement');

const kurokoExpected = [
  ['daily-kuroko-cushion', 'cushion', 1, '観測席の座り心地', 'クッションをひとつ頼めるか、美桜。観測席ってのは、案外長居する場所なんだ', 'いいな。これなら、もう少し幕の向こうを眺めていられそうだ'],
  ['daily-kuroko-dyed-cloth', 'dyedCloth', 1, '光を見るための布', '染め布を一枚作ってくれ。照明が当たった時、どんな色になるか見てみたい', '悪くない。光が乗ると、思ってたより表情が出るな'],
  ['daily-kuroko-curtain', 'curtain', 1, '幕のそばに', 'カーテンをひとつ頼めるか？　光を少し切りたい場所があってな', 'ちょうどいい。全部を照らさない方が、見えるものもある'],
  ['daily-kuroko-lined-box', 'linedBox', 1, '小道具をひとまとめ', '布張りの小箱をひとつ作ってくれ。細かい小道具が増えてきた', '助かった。舞台裏は、散らかってるくらいが面白いんだが……限度はあるな'],
  ['daily-kuroko-wall', 'wallHanging', 1, '壁にひとつだけ', '壁掛けをひとつ頼めるか、美桜。何もない壁も嫌いじゃないが、今日はひとつだけ置きたい', 'うん。これくらいがいい。余白まで消す必要はないからな']
];
assert.deepEqual(G.dailyRequestPool.slice(0, 40).filter(request => request.resident === 'kuroko').map(request => [request.id, request.item, request.quantity, request.title, request.message, request.thanks]), kurokoExpected);
assert.ok(G.currentDailyRequests(G.restore(oldCompleteSave, () => 0.7)).some(request => request.name === '黒子'), '黒子を通常抽選から生成');
const oldFiveResidentSave = G.restore({ ...oldCompleteSave, inventory: { bag: 2, curtain: 3 }, day: 28, gathersLeft: 1,
  dailyRequests: [{ templateId: 'daily-shiru-bag', completed: true }, { templateId: 'daily-keikai-towa-wall', completed: false }, { templateId: 'daily-naka-dry-flower', completed: false }],
  dailyHistory: ['daily-shiru-bag', 'daily-keikai-towa-wall', 'daily-naka-dry-flower'] });
assert.deepEqual(oldFiveResidentSave.dailyRequests, [
  { templateId: 'daily-shiru-bag', completed: true }, { templateId: 'daily-keikai-towa-wall', completed: false }, { templateId: 'daily-naka-dry-flower', completed: false }
], '既存5人の進行中3枠と達成状態を維持');
assert.equal(oldFiveResidentSave.day, 28);
assert.equal(oldFiveResidentSave.gathersLeft, 3);
assert.equal(oldFiveResidentSave.inventory.curtain, 3);
assert.deepEqual(oldFiveResidentSave.dailyHistory, ['daily-shiru-bag', 'daily-keikai-towa-wall', 'daily-naka-dry-flower']);
const kurokoDelivery = G.restore({ ...oldCompleteSave, inventory: { curtain: 1 }, dailyRequests: [
  { templateId: 'daily-kuroko-curtain', completed: false }, { templateId: 'daily-shiru-bag', completed: false }, { templateId: 'daily-keikai-towa-wall', completed: false }
] });
assert.equal(G.currentDailyRequests(kurokoDelivery)[0].name, '黒子');
assert.equal(G.deliverDaily(kurokoDelivery, 'daily-kuroko-curtain'), true);
assert.equal(kurokoDelivery.inventory.curtain, 0);
assert.equal(G.currentDailyRequests(kurokoDelivery)[0].completed, true);
const kurokoCarried = kurokoDelivery.dailyRequests.slice(1).map(slot => slot.templateId);
G.rest(kurokoDelivery, () => 0);
assert.ok(!kurokoDelivery.dailyRequests.some(slot => slot.templateId === 'daily-kuroko-curtain'));
assert.ok(kurokoCarried.every(id => kurokoDelivery.dailyRequests.some(slot => slot.templateId === id)));
console.log('PASS: five Kuroko requests, legacy save preservation, manual delivery, carryover and next-day replacement');

const altoExpected = [
  ['daily-alto-dye', 'dye', 1, '色をひとつ試したい', '染料をひとつ作ってくれる？　次の一枚で、少し試してみたい色があるんだ', 'ありがとう、美桜。うん、この色なら面白くなりそうだ'],
  ['daily-alto-dry-flower', 'dryFlower', 2, '花の色を残しておきたい', '乾燥花を二つお願い。色の組み合わせを考える時、手元に置いて眺めたいんだ', 'いいね。同じ花でも、並べ方でずいぶん印象が変わる'],
  ['daily-alto-dyed-cloth', 'dyedCloth', 1, '布にした時の色', '染め布を一枚作ってくれる？　染料だけじゃなくて、布になった時の色も見ておきたい', 'うん、思ってたより柔らかい色になった。これは使えそうだ'],
  ['daily-alto-wreath', 'wreath', 1, '丸い構図でひとつ', '花のリースをひとつ頼める？　丸い形の中で色がどう収まるか、ちょっと見てみたくて', 'いいな。視線がちゃんと一周する。こういうまとまり方、好きだ'],
  ['daily-alto-wall', 'wallHanging', 1, '壁に置いて確かめたい', '壁掛けをひとつ作ってくれる？　実際に壁へ置いた時の見え方まで確かめたいんだ', 'ありがとう、美桜。机の上で見るのと、壁に置くのじゃやっぱり違うな']
];
assert.deepEqual(G.dailyRequestPool.slice(0, 40).filter(request => request.resident === 'alto').map(request => [request.id, request.item, request.quantity, request.title, request.message, request.thanks]), altoExpected);
assert.ok(G.currentDailyRequests(G.restore(oldCompleteSave, () => 0.8)).some(request => request.name === 'アルト'), 'アルトを通常抽選から生成');
const oldSixResidentSave = G.restore({ ...oldCompleteSave, inventory: { dryFlower: 3, curtain: 2 }, day: 34, gathersLeft: 1,
  dailyRequests: [{ templateId: 'daily-kuroko-wall', completed: true }, { templateId: 'daily-shiru-bag', completed: false }, { templateId: 'daily-keikai-towa-cushion', completed: false }],
  dailyHistory: ['daily-kuroko-wall', 'daily-shiru-bag', 'daily-keikai-towa-cushion'] });
assert.deepEqual(oldSixResidentSave.dailyRequests, [
  { templateId: 'daily-kuroko-wall', completed: true }, { templateId: 'daily-shiru-bag', completed: false }, { templateId: 'daily-keikai-towa-cushion', completed: false }
], '既存6人の進行中3枠と達成状態を維持');
assert.equal(oldSixResidentSave.day, 34);
assert.equal(oldSixResidentSave.gathersLeft, 3);
assert.equal(oldSixResidentSave.inventory.dryFlower, 3);
assert.deepEqual(oldSixResidentSave.dailyHistory, ['daily-kuroko-wall', 'daily-shiru-bag', 'daily-keikai-towa-cushion']);
const altoDelivery = G.restore({ ...oldCompleteSave, inventory: { dryFlower: 2 }, dailyRequests: [
  { templateId: 'daily-alto-dry-flower', completed: false }, { templateId: 'daily-shiru-bag', completed: false }, { templateId: 'daily-kuroko-wall', completed: false }
] });
assert.equal(G.currentDailyRequests(altoDelivery)[0].name, 'アルト');
assert.equal(G.deliverDaily(altoDelivery, 'daily-alto-dry-flower'), true);
assert.equal(altoDelivery.inventory.dryFlower, 0);
assert.equal(G.currentDailyRequests(altoDelivery)[0].completed, true);
const altoCarried = altoDelivery.dailyRequests.slice(1).map(slot => slot.templateId);
G.rest(altoDelivery, () => 0);
assert.ok(!altoDelivery.dailyRequests.some(slot => slot.templateId === 'daily-alto-dry-flower'));
assert.ok(altoCarried.every(id => altoDelivery.dailyRequests.some(slot => slot.templateId === id)));
console.log('PASS: five Alto requests, legacy save preservation, manual delivery, carryover and next-day replacement');

const aoiDoctorExpected = [
  ['daily-aoi-doctor-dry-flower', 'dryFlower', 2, '比較試料を確保したい', '美桜さん、乾燥花を二つお願いできますか？　生花とは違う色の変化を、比較しておきたいんです', 'ありがとうございます！　これで比較条件が揃いました。いい観測データが取れそうです'],
  ['daily-aoi-doctor-dye', 'dye', 1, '発色を観測したい', '染料をひとつお願いできますか、美桜さん？　光の当たり方で発色がどう変わるか、確認したくて', 'おお……！　これは興味深い発色ですね。さっそく記録しておきましょう'],
  ['daily-aoi-doctor-lined-box', 'linedBox', 1, '試料を整理したい', '布張りの小箱をひとつお願いできますか？　細かい試料を分けて保管したいんです', '助かりました、美桜さん。これで研究台の混沌が、少しだけ秩序を取り戻します'],
  ['daily-aoi-doctor-curtain', 'curtain', 1, '光量を調整したい', 'カーテンをひとつお願いできますか？　観測中だけ、部屋の光量を少し落としたいんです', '完璧です。これなら余計な反射を気にせず、観測に集中できます'],
  ['daily-aoi-doctor-cushion', 'cushion', 1, '長時間観測対策', '美桜さん、クッションをひとつお願いしてもいいですか？　長時間観測で、腰にまで知恵熱が回る前に対策を……！', 'ありがとうございます、美桜さん！　これで研究続行可能です。物理的冷却ではなく、快適性で解決しました！']
];
assert.deepEqual(G.dailyRequestPool.filter(request => request.resident === 'aoiDoctor').map(request => [request.id, request.item, request.quantity, request.title, request.message, request.thanks]), aoiDoctorExpected);
assert.ok(G.dailyRequestPool.filter(request => request.resident === 'aoiDoctor').every(request => !/美桜(?!さん)/.test(request.message + request.thanks)), '碧博士は美桜さんと呼ぶ');
assert.ok(G.currentDailyRequests(G.restore(oldCompleteSave, () => 0.999)).some(request => request.name === '碧博士'), '碧博士を通常抽選から生成');
const oldSevenResidentSave = G.restore({ ...oldCompleteSave, inventory: { dryFlower: 3, curtain: 2 }, day: 39, gathersLeft: 1,
  dailyRequests: [{ templateId: 'daily-alto-dye', completed: true }, { templateId: 'daily-kuroko-wall', completed: false }, { templateId: 'daily-shiru-bag', completed: false }],
  dailyHistory: ['daily-alto-dye', 'daily-kuroko-wall', 'daily-shiru-bag'] });
assert.deepEqual(oldSevenResidentSave.dailyRequests, [
  { templateId: 'daily-alto-dye', completed: true }, { templateId: 'daily-kuroko-wall', completed: false }, { templateId: 'daily-shiru-bag', completed: false }
], '既存7人の進行中3枠と達成状態を維持');
assert.equal(oldSevenResidentSave.day, 39);
assert.equal(oldSevenResidentSave.gathersLeft, 3);
assert.equal(oldSevenResidentSave.inventory.dryFlower, 3);
assert.deepEqual(oldSevenResidentSave.dailyHistory, ['daily-alto-dye', 'daily-kuroko-wall', 'daily-shiru-bag']);
const aoiDoctorDelivery = G.restore({ ...oldCompleteSave, inventory: { dryFlower: 2 }, dailyRequests: [
  { templateId: 'daily-aoi-doctor-dry-flower', completed: false }, { templateId: 'daily-alto-dye', completed: false }, { templateId: 'daily-kuroko-wall', completed: false }
] });
assert.equal(G.currentDailyRequests(aoiDoctorDelivery)[0].name, '碧博士');
assert.equal(G.deliverDaily(aoiDoctorDelivery, 'daily-aoi-doctor-dry-flower'), true);
assert.equal(aoiDoctorDelivery.inventory.dryFlower, 0);
assert.equal(G.currentDailyRequests(aoiDoctorDelivery)[0].completed, true);
const aoiDoctorCarried = aoiDoctorDelivery.dailyRequests.slice(1).map(slot => slot.templateId);
G.rest(aoiDoctorDelivery, () => 0);
assert.ok(!aoiDoctorDelivery.dailyRequests.some(slot => slot.templateId === 'daily-aoi-doctor-dry-flower'));
assert.ok(aoiDoctorCarried.every(id => aoiDoctorDelivery.dailyRequests.some(slot => slot.templateId === id)));
console.log('PASS: 40-request pool, five Aoi Doctor requests, legacy save preservation, manual delivery, carryover and next-day replacement');

const discovery = G.fresh();
assert.equal(G.items.length, 21);
assert.deepEqual(discovery.discovered, [], '新規ゲームの図鑑は未発見');
assert.equal(G.gather(discovery, 'vine'), true);
assert.deepEqual(discovery.discovered, ['vine']);
for (const id of ['fiber', 'thread']) assert.equal(G.craft(discovery, id, 2), true);
assert.equal(G.craft(discovery, 'cloth'), true);
assert.equal(G.craft(discovery, 'bag'), true);
assert.ok(['vine', 'fiber', 'thread', 'cloth', 'bag'].every(id => discovery.discovered.includes(id)));
assert.equal(G.deliver(discovery, 'naka'), true);
assert.equal(discovery.inventory.bag, 0);
assert.ok(discovery.discovered.includes('bag'), '在庫0でも発見を維持');
assert.equal(G.gather(discovery, 'vine'), true);
assert.equal(discovery.discovered.filter(id => id === 'vine').length, 1, '再入手しても重複しない');
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(discovery))).discovered, discovery.discovered, '再読み込み後も発見を維持');
const knownBeforeFailure = JSON.stringify(discovery.discovered);
assert.equal(G.craft(discovery, 'curtain'), false);
assert.equal(JSON.stringify(discovery.discovered), knownBeforeFailure);

const legacyStock = G.restore({ inventory: { box: 1 }, day: 7, gathersLeft: 0 });
assert.deepEqual(legacyStock.discovered, ['branch', 'wood', 'plank', 'box'], '在庫のある品から素材を再帰的に推定');
assert.equal(legacyStock.day, 7);
assert.equal(legacyStock.gathersLeft, 0);
assert.equal(legacyStock.inventory.box, 1);
const legacyRequest = G.restore({ completed: ['naka'], inventory: { bag: 0 }, day: 11 });
assert.deepEqual(legacyRequest.discovered, ['vine', 'fiber', 'thread', 'cloth', 'bag'], '納品済みの固定依頼から制作経路を推定');
assert.equal(legacyRequest.inventory.bag, 0);
const legacyAll = G.restore({ inventory: { thread: 3 }, completed: G.requests.map(request => request.id), day: 23, gathersLeft: 1,
  dailyRequests: [{ templateId: 'daily-aoi-doctor-dye', completed: true }, { templateId: 'daily-alto-wreath', completed: false }, { templateId: 'daily-kuroko-wall', completed: false }],
  dailyHistory: ['daily-aoi-doctor-dye', 'daily-alto-wreath', 'daily-kuroko-wall'] }, () => 0);
assert.equal(legacyAll.discovered.length, 18, '固定9件達成済みの旧セーブは既存18種類のみ復元');
assert.equal(legacyAll.day, 23);
assert.equal(legacyAll.gathersLeft, 3);
assert.equal(legacyAll.inventory.thread, 3);
assert.equal(legacyAll.completed.length, 9);
assert.deepEqual(legacyAll.dailyRequests, [
  { templateId: 'daily-aoi-doctor-dye', completed: true }, { templateId: 'daily-alto-wreath', completed: false }, { templateId: 'daily-kuroko-wall', completed: false }
]);
assert.deepEqual(legacyAll.dailyHistory, ['daily-aoi-doctor-dye', 'daily-alto-wreath', 'daily-kuroko-wall']);
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(legacyAll))).discovered, legacyAll.discovered, '移行済み図鑑をそのまま復元');
assert.deepEqual(G.restore({ discovered: ['branch', 'branch', 'nonexistent'] }).discovered, ['branch'], '保存済み発見IDを安全に検証');
assert.deepEqual(G.restore({ discovered: [], completed: G.requests.map(request => request.id) }).discovered, [], '図鑑データがある場合は旧セーブ移行を繰り返さない');
console.log('PASS: encyclopedia, first discovery, stock-zero persistence, recursive legacy migration, full-save preservation');

const furnitureRecipes = [
  ['woodFrame', [['plank', 2]]],
  ['smallShelf', [['woodFrame', 1], ['plank', 2]]],
  ['upholsteredStool', [['woodFrame', 1], ['dyedCloth', 1], ['fiber', 1]]]
];
assert.deepEqual(G.items.slice(-3).map(item => [item.name, item.category]), [['木枠', '中間素材'], ['小さな棚', '完成品'], ['布張りスツール', '完成品']]);
for (const [id, expectedInputs] of furnitureRecipes) {
  const recipe = G.recipes.find(entry => entry.id === id);
  assert.equal(recipe.group, '家具のしごと');
  assert.deepEqual(G.ingredients(recipe).map(input => [input.id, input.cost]), expectedInputs);
  for (const missing of G.ingredients(recipe)) {
    const state = G.fresh();
    for (const input of G.ingredients(recipe)) state.inventory[input.id] = input.cost;
    state.inventory[missing.id]--;
    const before = JSON.stringify(state);
    assert.equal(G.craft(state, id), false, `${id}: ${missing.id} が不足`);
    assert.equal(JSON.stringify(state), before, '失敗時に在庫・図鑑を変更しない');
  }
}
const oldEncyclopedia = G.restore({ inventory: { plank: 8, dyedCloth: 1, fiber: 1 }, completed: G.requests.map(request => request.id), day: 28, gathersLeft: 1,
  dailyRequests: [{ templateId: 'daily-aoi-doctor-dye', completed: true }, { templateId: 'daily-alto-wreath', completed: false }, { templateId: 'daily-kuroko-wall', completed: false }],
  dailyHistory: ['daily-aoi-doctor-dye'], discovered: G.items.slice(0, 18).map(item => item.id) }, () => 0);
assert.equal(oldEncyclopedia.discovered.length, 18);
assert.deepEqual(oldEncyclopedia.dailyRequests.map(slot => slot.templateId), ['daily-aoi-doctor-dye', 'daily-alto-wreath', 'daily-kuroko-wall']);
assert.deepEqual(oldEncyclopedia.dailyHistory, ['daily-aoi-doctor-dye']);
assert.equal(oldEncyclopedia.day, 28);
assert.equal(oldEncyclopedia.gathersLeft, 3);
assert.equal(G.craft(oldEncyclopedia, 'woodFrame'), true);
assert.equal(oldEncyclopedia.inventory.plank, 6);
assert.equal(oldEncyclopedia.inventory.woodFrame, 1);
assert.equal(oldEncyclopedia.discovered.length, 19);
assert.equal(G.craft(oldEncyclopedia, 'smallShelf'), true);
assert.equal(oldEncyclopedia.inventory.woodFrame, 0);
assert.equal(oldEncyclopedia.inventory.plank, 4);
assert.equal(oldEncyclopedia.discovered.length, 20);
assert.equal(G.craft(oldEncyclopedia, 'woodFrame'), true);
assert.equal(G.craft(oldEncyclopedia, 'upholsteredStool'), true);
assert.equal(oldEncyclopedia.inventory.woodFrame, 0);
assert.equal(oldEncyclopedia.inventory.dyedCloth, 0);
assert.equal(oldEncyclopedia.inventory.fiber, 0);
assert.equal(oldEncyclopedia.discovered.length, 21);
assert.deepEqual(G.restore(JSON.parse(JSON.stringify(oldEncyclopedia))).discovered, oldEncyclopedia.discovered);
console.log('PASS: furniture recipes, exact consumption, shortage rejection, 18-to-21 encyclopedia migration and persistence');

const furnitureRequests = [
  ['daily-ritsu-small-shelf', 'ritsu', 'smallShelf', '読みかけの本を置く場所', '小さな棚をひとつ作ってくれるか？　読みかけの本を置いておく場所が欲しくてな', 'ちょうどいい。これなら机の上も少しすっきりする'],
  ['daily-towa-small-shelf', 'towa', 'smallShelf', 'よく使う物をまとめたい', '小さな棚をひとつ作ってくれないか？　よく使う物をまとめて置いておきたい', 'ありがとう、美桜。手を伸ばせばすぐ取れる位置に置いておくよ'],
  ['daily-shiru-upholstered-stool', 'shiru', 'upholsteredStool', '少しだけ腰掛けたい', '布張りのスツールをひとつお願いしてもいい？　作業の合間に、少しだけ腰掛けたいの', 'ありがとう。ちょっと休むには、これくらいがちょうどいいね'],
  ['daily-alto-small-shelf', 'alto', 'smallShelf', '制作途中の置き場所', '小さな棚をひとつ作ってくれる？　制作途中のものを、手の届くところに置いておきたいんだ', 'いいね。これなら作業の流れを止めずに済みそうだ。ありがとう、美桜'],
  ['daily-kuroko-upholstered-stool', 'kuroko', 'upholsteredStool', '観測席にもう一脚', '布張りのスツールをひとつ頼めるか、美桜。観測席に、もう一脚くらいあってもいい', '悪くないな。席が増えたからって、観客を増やすつもりはないけどな']
];
assert.equal(G.dailyRequestPool.length, 45);
assert.deepEqual(G.dailyRequestPool.slice(-5).map(request => [request.id, request.resident, request.item, request.title, request.message, request.thanks]), furnitureRequests);
assert.ok(G.dailyRequestPool.slice(-5).every(request => request.quantity === 1));
const furnitureLottery = G.restore({ completed: G.requests.map(request => request.id) }, () => 0.999);
assert.ok(furnitureLottery.dailyRequests.some(slot => G.dailyRequestPool.slice(-5).some(request => request.id === slot.templateId)), '家具依頼が通常抽選に参加');
const activeFurnitureSave = G.restore({ completed: G.requests.map(request => request.id), inventory: { smallShelf: 1 }, day: 32, gathersLeft: 2,
  dailyRequests: [{ templateId: 'daily-ritsu-small-shelf', completed: false }, { templateId: 'daily-towa-box', completed: false }, { templateId: 'daily-shiru-curtain', completed: false }],
  dailyHistory: ['daily-ritsu-small-shelf', 'daily-towa-box', 'daily-shiru-curtain'], discovered: G.items.slice(0, 18).map(item => item.id) });
assert.equal(G.deliverDaily(activeFurnitureSave, 'daily-ritsu-small-shelf'), true);
assert.equal(activeFurnitureSave.inventory.smallShelf, 0);
assert.equal(activeFurnitureSave.dailyRequests[0].completed, true);
const carriedFurniture = activeFurnitureSave.dailyRequests.slice(1).map(slot => slot.templateId);
G.rest(activeFurnitureSave, () => 0);
assert.notEqual(activeFurnitureSave.dailyRequests[0].templateId, 'daily-ritsu-small-shelf');
assert.ok(carriedFurniture.every(id => activeFurnitureSave.dailyRequests.some(slot => slot.templateId === id)));
console.log('PASS: 45 daily requests, furniture delivery, completed-slot renewal and unfinished-slot carryover');

const gatherStart = G.fresh();
assert.equal(G.gatherLimit(gatherStart), 3);
assert.equal(gatherStart.gathersLeft, 3);
for (let remaining = 2; remaining >= 0; remaining--) {
  assert.equal(G.gather(gatherStart, 'branch'), true);
  assert.equal(gatherStart.gathersLeft, remaining);
}
assert.equal(G.gather(gatherStart, 'branch'), false);
const finalFixedId = G.requests.at(-1).id;
for (const [remainingBefore, remainingAfter] of [[1, 3], [0, 2]]) {
  const state = G.restore({ completed: G.requests.slice(0, -1).map(request => request.id), inventory: { linedBox: 1 }, day: 18, gathersLeft: remainingBefore });
  assert.equal(G.gatherLimit(state), 3);
  assert.equal(G.deliver(state, finalFixedId), true);
  assert.equal(G.gatherLimit(state), 5);
  assert.equal(state.gatherLimit, 5);
  assert.equal(state.gathersLeft, remainingAfter, '9件目の納品時に使用済み回数を維持');
  assert.equal(state.inventory.linedBox, 0);
  assert.equal(G.restore(JSON.parse(JSON.stringify(state))).gathersLeft, remainingAfter, '再読み込みで＋2を繰り返さない');
}
const fivePerDay = G.restore({ completed: allFixedIds, gathersLeft: 0, day: 12 });
assert.equal(fivePerDay.gathersLeft, 2, '旧セーブの0/3は2/5へ移行');
G.rest(fivePerDay);
assert.equal(fivePerDay.gathersLeft, 5);
for (let remaining = 4; remaining >= 0; remaining--) {
  assert.equal(G.gather(fivePerDay, 'flower'), true);
  assert.equal(fivePerDay.gathersLeft, remaining);
}
assert.equal(G.gather(fivePerDay, 'flower'), false);
G.rest(fivePerDay);
assert.equal(fivePerDay.gathersLeft, 5);
assert.equal(G.restore({ completed: allFixedIds, gathersLeft: 3 }).gathersLeft, 5);
assert.equal(G.restore({ completed: allFixedIds, gatherLimit: 5, gathersLeft: 0 }).gathersLeft, 0);
assert.equal(G.restore({ completed: allFixedIds, gatherLimit: 5, gathersLeft: 5 }).gathersLeft, 5);
assert.equal(G.restore({ completed: allFixedIds }).gathersLeft, 5);
const preservedDaily = [{ templateId: 'daily-ritsu-curtain', completed: false }, { templateId: 'daily-towa-box', completed: true }, { templateId: 'daily-shiru-curtain', completed: false }];
const preservedDiscoveries = G.items.slice(0, 18).map(item => item.id);
const migratedGathers = G.restore({ completed: allFixedIds, inventory: { plank: 2 }, day: 27, gathersLeft: 1,
  dailyRequests: preservedDaily, dailyHistory: ['daily-towa-box'], discovered: preservedDiscoveries });
assert.equal(migratedGathers.gathersLeft, 3);
assert.equal(migratedGathers.day, 27);
assert.equal(migratedGathers.inventory.plank, 2);
assert.deepEqual(migratedGathers.completed, allFixedIds);
assert.deepEqual(migratedGathers.dailyRequests, preservedDaily);
assert.deepEqual(migratedGathers.dailyHistory, ['daily-towa-box']);
assert.deepEqual(migratedGathers.discovered, preservedDiscoveries);
assert.equal(G.restore(JSON.parse(JSON.stringify(migratedGathers))).gathersLeft, 3);
console.log('PASS: 3-to-5 gather cap, immediate unlock, legacy migration once, five-gather exhaustion and save preservation');

const residentIds = Object.keys(G.dailyResidents);
assert.equal(G.SAVE_VERSION, 2);
assert.deepEqual(G.fresh().dailyRequestCounts, Object.fromEntries(residentIds.map(id => [id, 0])));
const fixedOnly = G.restore({ completed: G.requests.slice(0, -1).map(request => request.id), inventory: { linedBox: 1 } });
assert.equal(G.deliver(fixedOnly, G.requests.at(-1).id), true);
assert.deepEqual(fixedOnly.dailyRequestCounts, G.fresh().dailyRequestCounts, '固定依頼9件はカウントしない');
for (const residentId of residentIds) {
  const target = G.dailyRequestPool.find(request => request.resident === residentId);
  const otherIds = G.dailyRequestPool.filter(request => request.id !== target.id).slice(0, 2).map(request => request.id);
  const progress = G.restore({ completed: allFixedIds, dailyRequests: [target.id, ...otherIds].map(templateId => ({ templateId, completed: false })) });
  assert.equal(G.deliverDaily(progress, target.id), false, `${residentId}: 素材不足では加算しない`);
  assert.deepEqual(progress.dailyRequestCounts, G.fresh().dailyRequestCounts);
  progress.inventory[target.item] = target.quantity;
  assert.equal(G.deliverDaily(progress, target.id), true, `${residentId}: 日常依頼を納品`);
  assert.equal(progress.inventory[target.item], 0);
  assert.deepEqual(progress.dailyRequestCounts, { ...G.fresh().dailyRequestCounts, [residentId]: 1 }, `${residentId} だけ加算`);
  assert.equal(G.deliverDaily(progress, target.id), false, '二重納品を拒否');
  assert.equal(progress.dailyRequestCounts[residentId], 1);
  const restored = G.restore(JSON.parse(JSON.stringify(progress)));
  assert.equal(restored.dailyRequestCounts[residentId], 1, '再読み込み後も保持');
  G.rest(restored, () => 0);
  assert.equal(restored.dailyRequestCounts[residentId], 1, '翌日も保持');
}
const aboveGoal = G.restore({ completed: allFixedIds, dailyRequestCounts: { naka: 7, ritsu: -1, towa: 1.5, unknown: 9 } });
assert.equal(aboveGoal.dailyRequestCounts.naka, 7, '5超の内部累計を保持');
assert.equal(aboveGoal.dailyRequestCounts.ritsu, 0, '不正な負値は無視');
assert.equal(aboveGoal.dailyRequestCounts.towa, 0, '不正な小数は無視');
assert.equal(Object.hasOwn(aboveGoal.dailyRequestCounts, 'unknown'), false, '未知の依頼主は保存しない');
console.log('PASS: eight independent daily completion counts, fixed exclusion, failed and duplicate delivery guards, reload/rest persistence, uncapped total');

const thankYouIds = Object.keys(G.dailyResidents);
assert.equal(Object.keys(G.thankYouEvents).length, 8);
assert.deepEqual(G.fresh().thankYouEventViewed, Object.fromEntries(thankYouIds.map(id => [id, false])));
const thankYouLegacy = G.restore({ completed: allFixedIds, day: 23, dailyRequestCounts: { towa: 5, shiru: 6, naka: 4 } });
assert.equal(thankYouLegacy.saveVersion, G.SAVE_VERSION, 'セーブバージョンを変えない');
assert.equal(G.canViewThankYou(thankYouLegacy, 'naka'), false);
assert.equal(G.canViewThankYou(thankYouLegacy, 'towa'), true);
assert.equal(G.canViewThankYou(thankYouLegacy, 'shiru'), true);
assert.equal(G.completedThankYouCount(thankYouLegacy), 0, '解放だけでは達成人数に含めない');
assert.equal(G.completeThankYou(thankYouLegacy, 'naka'), false, '未解放を拒否');
assert.equal(G.completeThankYou(thankYouLegacy, 'shiru'), true);
assert.equal(G.completeThankYou(thankYouLegacy, 'shiru'), false, '二重完了を拒否');
assert.equal(G.completedThankYouCount(thankYouLegacy), 1);
assert.equal(G.canViewThankYou(thankYouLegacy, 'towa'), true, 'ほかのキャラは未閲覧');
const thankYouReload = G.restore(JSON.parse(JSON.stringify(thankYouLegacy)));
assert.equal(thankYouReload.thankYouEventViewed.shiru, true);
assert.equal(thankYouReload.dailyRequestCounts.shiru, 6, '累計は保持');
assert.equal(G.completedThankYouCount(thankYouReload), 1);
G.rest(thankYouReload, () => 0);
assert.equal(thankYouReload.thankYouEventViewed.shiru, true, '日付進行でも保持');
const shiruDaily = G.dailyRequestPool.find(request => request.resident === 'shiru');
const continuedThankYou = G.restore({ completed: allFixedIds, dailyRequestCounts: { shiru: 5 }, thankYouEventViewed: { shiru: true },
  dailyRequests: [shiruDaily.id, 'daily-naka-bag', 'daily-ritsu-thread'].map(templateId => ({ templateId, completed: false })) });
continuedThankYou.inventory[shiruDaily.item] = shiruDaily.quantity;
assert.equal(G.deliverDaily(continuedThankYou, shiruDaily.id), true, 'お礼後も同キャラへ納品できる');
assert.equal(continuedThankYou.dailyRequestCounts.shiru, 6, '内部累計は増える');
assert.equal(continuedThankYou.thankYouEventViewed.shiru, true);
for (const id of thankYouIds) {
  const event = G.thankYouEvents[id];
  assert.ok(event.title && event.paragraphs.length >= 3, `${id}: タイトルと本文`);
}
console.log('PASS: eight thank-you events, >=5 unlock, independent completion, legacy save preservation and future completion count');

assert.equal(Object.keys(G.storyMilestones).length, 2, '2人・6人達成イベント');
assert.deepEqual(G.fresh().storyProgress, { milestone2Viewed: false, milestone6Viewed: false, milestone4Completed: false, milestone4EventViewed: false, milestone8Completed: false, milestone8EventViewed: false });
const storyLegacy = G.restore({ completed: allFixedIds, day: 39, inventory: { bag: 2 }, discovered: ['bag'],
  dailyRequestCounts: { towa: 5, shiru: 6 }, thankYouEventViewed: { towa: true } });
assert.equal(G.completedThankYouCount(storyLegacy), 1);
assert.equal(G.storyUnlocked(storyLegacy, 'milestone2'), false, '5/5でもお礼を見ていなければ数えない');
assert.equal(G.canViewStory(storyLegacy, 'milestone2'), false);
assert.equal(G.completeStory(storyLegacy, 'milestone2'), false, '未解放の完了を拒否');
assert.equal(G.completeThankYou(storyLegacy, 'shiru'), true);
assert.equal(G.completedThankYouCount(storyLegacy), 2);
assert.equal(G.storyUnlocked(storyLegacy, 'milestone2'), true);
assert.equal(G.canViewStory(storyLegacy, 'milestone2'), true);
assert.equal(storyLegacy.storyProgress.milestone2Viewed, false, '2人達成時に自動読了しない');
for (const [first, second] of [['naka', 'ritsu'], ['keikaiTowa', 'aoiDoctor'], ['kuroko', 'alto']]) {
  const pair = G.restore({ completed: allFixedIds, dailyRequestCounts: { [first]: 5, [second]: 5 }, thankYouEventViewed: { [first]: true, [second]: true } });
  assert.equal(G.storyUnlocked(pair, 'milestone2'), true, `${first} と ${second} でも解放`);
  assert.equal(G.canViewStory(pair, 'milestone2'), true);
}
assert.equal(G.completeStory(storyLegacy, 'milestone2'), true);
assert.equal(G.completeStory(storyLegacy, 'milestone2'), false, '読了の二重処理を拒否');
assert.equal(storyLegacy.storyProgress.milestone2Viewed, true);
const storyReload = G.restore(JSON.parse(JSON.stringify(storyLegacy)));
assert.equal(storyReload.storyProgress.milestone2Viewed, true);
assert.equal(storyReload.day, 39);
assert.equal(storyReload.inventory.bag, 2);
assert.ok(storyReload.discovered.includes('bag'));
assert.equal(storyReload.dailyRequestCounts.shiru, 6);
assert.equal(G.canViewStory(storyReload, 'milestone2'), false);
G.rest(storyReload, () => 0);
assert.equal(storyReload.storyProgress.milestone2Viewed, true, '日付進行後も読了を維持');
assert.equal(G.SAVE_VERSION, 2, 'セーブバージョンを変えない');
console.log('PASS: two-viewed thank-you milestone, any resident pair, one-time completion, legacy restore and rest persistence');

assert.equal(Object.keys(G.storyRequests).length, 2, '4人・8人達成の特別依頼');
const special = G.storyRequests.milestone4;
assert.equal(special.title, '工房の一角を整える');
assert.deepEqual(special.requirements, [{ id: 'smallShelf', quantity: 1 }, { id: 'upholsteredStool', quantity: 1 }, { id: 'cushion', quantity: 1 }]);
assert.ok(special.requirements.every(item => G.recipes.some(recipe => recipe.id === item.id)), '要求品はすべて既存レシピに存在');
const fourIds = ['naka', 'ritsu', 'towa', 'shiru'];
const fourCounts = Object.fromEntries(fourIds.map(id => [id, 5]));
const fourViewed = Object.fromEntries(fourIds.map(id => [id, true]));
const beforeStory = G.restore({ completed: allFixedIds, day: 45, inventory: { smallShelf: 2, upholsteredStool: 1, cushion: 3, bag: 4 }, discovered: ['smallShelf', 'upholsteredStool', 'cushion'], dailyRequestCounts: fourCounts, thankYouEventViewed: fourViewed, storyProgress: { milestone2Viewed: false } });
assert.equal(G.completedThankYouCount(beforeStory), 4);
assert.equal(G.storyRequestUnlocked(beforeStory, 'milestone4'), false, '4人お礼済みでも2人イベント未読なら非表示');
assert.equal(G.deliverStoryRequest(beforeStory, 'milestone4'), false);
assert.deepEqual([beforeStory.inventory.smallShelf, beforeStory.inventory.upholsteredStool, beforeStory.inventory.cushion], [2, 1, 3]);
assert.equal(G.completeStory(beforeStory, 'milestone2'), true);
assert.equal(G.storyRequestUnlocked(beforeStory, 'milestone4'), true, '先行イベント読了で即解放');
const threeViewed = G.restore({ completed: allFixedIds, dailyRequestCounts: fourCounts, thankYouEventViewed: { naka: true, ritsu: true, towa: true }, storyProgress: { milestone2Viewed: true } });
assert.equal(G.storyRequestUnlocked(threeViewed, 'milestone4'), false, '5/5だけの4人目は数えない');
for (const missing of ['smallShelf', 'upholsteredStool', 'cushion']) {
  const shortage = G.restore(JSON.parse(JSON.stringify(beforeStory)));
  shortage.inventory[missing] = 0;
  const stock = { ...shortage.inventory };
  assert.equal(G.deliverStoryRequest(shortage, 'milestone4'), false, `${missing}不足時は失敗`);
  assert.deepEqual(shortage.inventory, stock, `${missing}不足時は他も減らさない`);
  assert.equal(shortage.storyProgress.milestone4Completed, false);
}
assert.equal(G.canViewStoryRequestCompletion(beforeStory, 'milestone4'), false, '納品前は完了イベントなし');
assert.equal(G.deliverStoryRequest(beforeStory, 'milestone4'), true);
assert.deepEqual([beforeStory.inventory.smallShelf, beforeStory.inventory.upholsteredStool, beforeStory.inventory.cushion], [1, 0, 2]);
assert.equal(beforeStory.inventory.bag, 4, '関係ない在庫は維持');
assert.equal(beforeStory.storyProgress.milestone4Completed, true);
assert.equal(beforeStory.storyProgress.milestone4EventViewed, false);
assert.equal(G.canViewStoryRequestCompletion(beforeStory, 'milestone4'), true);
assert.equal(G.deliverStoryRequest(beforeStory, 'milestone4'), false, '連打は二重消費しない');
const specialReload = G.restore(JSON.parse(JSON.stringify(beforeStory)));
assert.equal(specialReload.day, 45);
assert.equal(specialReload.storyProgress.milestone2Viewed, true);
assert.equal(specialReload.storyProgress.milestone4Completed, true);
assert.equal(specialReload.storyProgress.milestone4EventViewed, false);
assert.equal(G.deliverStoryRequest(specialReload, 'milestone4'), false, '再読み込み後も再納品なし');
assert.equal(G.completeStoryRequestEvent(specialReload, 'milestone4'), true);
assert.equal(G.completeStoryRequestEvent(specialReload, 'milestone4'), false, '完了イベントも一度だけ');
G.rest(specialReload, () => 0);
assert.equal(G.restore(JSON.parse(JSON.stringify(specialReload))).storyProgress.milestone4EventViewed, true, '翌日・再読み込み後も読了を維持');
assert.equal(G.SAVE_VERSION, 2, 'セーブバージョンを維持');
console.log('PASS: four-thank-you request order, exact atomic delivery, duplicate guard, completion event and legacy progress');

const weightedCounts = Object.fromEntries(thankYouIds.map(id => [id, 5]));
const weightedViewed = Object.fromEntries(thankYouIds.filter(id => id !== 'alto').map(id => [id, true]));
const weightedSave = G.restore({ completed: allFixedIds, day: 51, inventory: { bag: 3 },
  dailyRequestCounts: weightedCounts, thankYouEventViewed: weightedViewed,
  storyProgress: { milestone2Viewed: true, milestone4Completed: true } });
assert.equal(G.dailyResidentWeight(weightedSave, 'alto'), 2, '5/5でもお礼未閲覧ならweight 2');
for (const id of thankYouIds.filter(id => id !== 'alto')) assert.equal(G.dailyResidentWeight(weightedSave, id), 1, `${id}: お礼済みはweight 1`);
assert.equal(weightedSave.day, 51);
assert.equal(weightedSave.inventory.bag, 3);
assert.equal(weightedSave.storyProgress.milestone4Completed, true);
const activeIds = ['daily-naka-bag', 'daily-ritsu-thread', shiruDaily.id];
const activeReload = G.restore({ ...weightedSave, dailyRequests: activeIds.map(templateId => ({ templateId, completed: false })) });
assert.deepEqual(activeReload.dailyRequests.map(slot => slot.templateId), activeIds, '既存の3枠は再抽選しない');
assert.equal(G.ensureDailyRequests(activeReload, () => 0), false, '抽選ウェイト変更で表示中依頼を差し替えない');
const sampledResidents = save => {
  const counts = Object.fromEntries(thankYouIds.map(id => [id, 0]));
  for (let i = 0; i < 9000; i++) {
    const draw = G.restore({ ...save, dailyRequests: [], dailyHistory: [] }, () => (i + 0.5) / 9000);
    const first = G.dailyRequestPool.find(request => request.id === draw.dailyRequests[0].templateId);
    counts[first.resident]++;
  }
  return counts;
};
const weightedSamples = sampledResidents(weightedSave);
assert.ok(weightedSamples.alto > 1800 && weightedSamples.alto < 2200, '未閲覧は全候補中weight 2');
for (const id of thankYouIds.filter(id => id !== 'alto')) {
  assert.ok(weightedSamples[id] > 900 && weightedSamples[id] < 1100, `${id}: お礼済みもweight 1で抽選対象`);
}
assert.equal(G.completeThankYou(weightedSave, 'alto'), true);
assert.equal(G.dailyResidentWeight(weightedSave, 'alto'), 1, 'お礼を見終えた時点でweight 1');
const allViewedReload = G.restore(JSON.parse(JSON.stringify(weightedSave)));
assert.equal(allViewedReload.thankYouEventViewed.alto, true, '再読み込み後もお礼済み');
assert.equal(allViewedReload.day, 51, '日数を維持');
assert.equal(allViewedReload.inventory.bag, 3, '在庫を維持');
assert.equal(allViewedReload.storyProgress.milestone4Completed, true, 'ストーリー進行を維持');
const equalSamples = sampledResidents(allViewedReload);
for (const id of thankYouIds) assert.ok(equalSamples[id] > 1050 && equalSamples[id] < 1200, `${id}: 全員お礼済み後は同率`);
assert.equal(G.SAVE_VERSION, 2, '抽選変更でセーブバージョンを変えない');
console.log('PASS: per-resident thank-you weights, 5/5 unseen status, 9000 weighted/equal draws and existing save preservation');

const sixIds = thankYouIds.slice(0, 6);
const sixCounts = Object.fromEntries(thankYouIds.map(id => [id, 5]));
const sixViewed = Object.fromEntries(sixIds.map(id => [id, true]));
const sixBase = { completed: allFixedIds, day: 64, gatherLimit: 5, gathersLeft: 2,
  inventory: { thread: 3, cloth: 4, dye: 5, plank: 6, bag: 7, smallShelf: 1, upholsteredStool: 1, cushion: 1 },
  discovered: ['bag'], dailyRequestCounts: sixCounts, thankYouEventViewed: sixViewed,
  dailyRequests: ['daily-naka-bag', 'daily-ritsu-thread', shiruDaily.id].map(templateId => ({ templateId, completed: false })),
  storyProgress: { milestone2Viewed: true, milestone4Completed: false } };
assert.deepEqual(G.storyMilestones.milestone6.reward, [
  { id: 'thread', quantity: 2 }, { id: 'cloth', quantity: 1 }, { id: 'dye', quantity: 2 }, { id: 'plank', quantity: 1 }
]);
assert.equal(G.storyMilestones.milestone6.title, '棚に増えたもの');
const fiveViewedSave = G.restore({ ...sixBase, thankYouEventViewed: Object.fromEntries(sixIds.slice(0, 5).map(id => [id, true])), storyProgress: { milestone2Viewed: true, milestone4Completed: true } });
assert.equal(G.storyUnlocked(fiveViewedSave, 'milestone6'), false, '5/5が8人でもお礼済み5人なら未解放');
const sixBefore = G.restore(sixBase);
assert.equal(G.storyUnlocked(sixBefore, 'milestone6'), false, 'お礼済み6人でも4人特別依頼未達なら未解放');
assert.equal(G.completeStory(sixBefore, 'milestone6'), false, '未解放では材料を受け取れない');
assert.equal(sixBefore.inventory.thread, 3);
assert.equal(G.deliverStoryRequest(sixBefore, 'milestone4'), true);
assert.equal(G.storyUnlocked(sixBefore, 'milestone6'), true, '特別依頼納品後すぐ解放');
assert.equal(sixBefore.storyProgress.milestone6Viewed, false, '解放だけでは受取済みにしない');
const sixLegacy = G.restore({ ...sixBase, storyProgress: { milestone2Viewed: true, milestone4Completed: true } });
assert.equal(G.storyUnlocked(sixLegacy, 'milestone6'), true, '旧セーブの達成状態から即解放');
assert.equal(sixLegacy.storyProgress.milestone6Viewed, false, '旧セーブの新フラグは未完了');
const priorInventory = { ...sixLegacy.inventory };
const priorDaily = JSON.stringify(sixLegacy.dailyRequests);
assert.equal(G.completeStory(sixLegacy, 'milestone6'), true);
for (const { id, quantity } of G.storyMilestones.milestone6.reward) {
  assert.equal(sixLegacy.inventory[id], priorInventory[id] + quantity, `${id}だけ正確に加算`);
  assert.ok(sixLegacy.discovered.includes(id), `${id}を図鑑に登録`);
}
for (const id of ['bag', 'smallShelf', 'upholsteredStool', 'cushion']) assert.equal(sixLegacy.inventory[id], priorInventory[id], `${id}は変化なし`);
assert.equal(sixLegacy.storyProgress.milestone6Viewed, true);
assert.equal(G.completeStory(sixLegacy, 'milestone6'), false, '連打で二重付与しない');
const sixReload = G.restore(JSON.parse(JSON.stringify(sixLegacy)));
assert.equal(G.completeStory(sixReload, 'milestone6'), false, '再読み込み後も再付与しない');
assert.deepEqual(sixReload.inventory, sixLegacy.inventory);
assert.equal(sixReload.day, 64);
assert.equal(sixReload.gathersLeft, 2);
assert.equal(JSON.stringify(sixReload.dailyRequests), priorDaily);
assert.equal(sixReload.storyProgress.milestone4Completed, true);
G.rest(sixReload, () => 0);
assert.equal(sixReload.storyProgress.milestone6Viewed, true, '日付進行後も受取済み');
const overflowGift = G.restore({ ...sixBase, inventory: { ...sixBase.inventory, thread: Number.MAX_SAFE_INTEGER }, storyProgress: { milestone2Viewed: true, milestone4Completed: true } });
assert.equal(G.completeStory(overflowGift, 'milestone6'), false, '在庫上限では部分付与しない');
assert.equal(overflowGift.inventory.cloth, 4);
assert.equal(overflowGift.storyProgress.milestone6Viewed, false);
assert.equal(G.SAVE_VERSION, 2, 'セーブバージョンを維持');
console.log('PASS: six-thank-you milestone, prerequisite order, exact one-time gift, legacy restore, discovery and rest persistence');

const finalRequest = G.storyRequests.milestone8;
assert.equal(finalRequest.title, '工房の看板を掛ける');
assert.deepEqual(finalRequest.requirements, [
  { id: 'woodFrame', quantity: 1 }, { id: 'plank', quantity: 2 }, { id: 'dyedCloth', quantity: 1 },
  { id: 'thread', quantity: 1 }, { id: 'dryFlower', quantity: 1 }
]);
assert.ok(finalRequest.requirements.every(item => G.recipes.some(recipe => recipe.id === item.id)), '新レシピを使わない');
assert.equal(finalRequest.completion.title, '小径の工房');
assert.ok(finalRequest.completion.paragraphs.join('\n').includes('Mio Verseのひとつになっていた。'));
const finalCounts = Object.fromEntries(thankYouIds.map(id => [id, 5]));
const finalViewed = Object.fromEntries(thankYouIds.map(id => [id, true]));
const finalStock = { woodFrame: 2, plank: 4, dyedCloth: 3, thread: 4, dryFlower: 2, bag: 7 };
const finalSlots = ['daily-naka-bag', 'daily-ritsu-thread', shiruDaily.id].map(templateId => ({ templateId, completed: false }));
const finalBase = { completed: allFixedIds, day: 88, gatherLimit: 5, gathersLeft: 2, inventory: finalStock,
  discovered: ['bag', 'woodFrame'], dailyRequestCounts: finalCounts, thankYouEventViewed: finalViewed,
  dailyRequests: finalSlots, storyProgress: { milestone2Viewed: true, milestone4Completed: true, milestone4EventViewed: true, milestone6Viewed: true } };
const sevenThanks = G.restore({ ...finalBase, thankYouEventViewed: { ...finalViewed, aoiDoctor: false } });
assert.equal(G.storyRequestUnlocked(sevenThanks, 'milestone8'), false, '7人お礼済みでは未解放');
assert.equal(G.postgameUnlocked(sevenThanks), false);
assert.equal(G.completeThankYou(sevenThanks, 'aoiDoctor'), true);
assert.equal(G.storyRequestUnlocked(sevenThanks, 'milestone8'), true, '8人目のお礼完了で解放');
const sixUnread = G.restore({ ...finalBase, storyProgress: { ...finalBase.storyProgress, milestone6Viewed: false } });
assert.equal(G.storyRequestUnlocked(sixUnread, 'milestone8'), false, '6人イベント未完了なら8人でも未解放');
assert.equal(G.deliverStoryRequest(sixUnread, 'milestone8'), false);
const finalLegacy = G.restore(finalBase);
assert.equal(G.storyRequestUnlocked(finalLegacy, 'milestone8'), true, '旧セーブから即解放');
assert.equal(finalLegacy.storyProgress.milestone8Completed, false);
assert.equal(finalLegacy.day, 88);
assert.deepEqual(finalLegacy.dailyRequests, finalSlots);
assert.equal(finalLegacy.inventory.bag, 7);
for (const item of finalRequest.requirements) {
  const shortage = G.restore({ ...finalBase, inventory: { ...finalStock, [item.id]: item.quantity - 1 } });
  const stock = { ...shortage.inventory };
  assert.equal(G.deliverStoryRequest(shortage, 'milestone8'), false, `${item.id}不足では納品不可`);
  assert.deepEqual(shortage.inventory, stock, `${item.id}不足で他の素材も消費しない`);
  assert.equal(shortage.storyProgress.milestone8Completed, false);
}
assert.equal(G.deliverStoryRequest(finalLegacy, 'milestone8'), true);
assert.equal(G.gratitudePointText(finalLegacy), '0', '特別依頼ではしるしを増やさない');
for (const item of finalRequest.requirements) assert.equal(finalLegacy.inventory[item.id], finalStock[item.id] - item.quantity, `${item.id}を指定数だけ消費`);
assert.equal(finalLegacy.inventory.bag, 7, '無関係な在庫を維持');
assert.equal(finalLegacy.storyProgress.milestone8Completed, true);
assert.equal(finalLegacy.storyProgress.milestone8EventViewed, false, '納品だけでは本編クリアにしない');
assert.equal(G.postgameUnlocked(finalLegacy), false);
assert.equal(G.canViewStoryRequestCompletion(finalLegacy, 'milestone8'), true);
assert.equal(G.deliverStoryRequest(finalLegacy, 'milestone8'), false, '連打による二重消費なし');
const finalReload = G.restore(JSON.parse(JSON.stringify(finalLegacy)));
assert.equal(finalReload.storyProgress.milestone8Completed, true);
assert.equal(finalReload.storyProgress.milestone8EventViewed, false);
assert.equal(G.deliverStoryRequest(finalReload, 'milestone8'), false, '再読み込み後も再納品不可');
assert.equal(G.completeStoryRequestEvent(finalReload, 'milestone8'), true, '最後のボタンでクリア');
assert.equal(G.postgameUnlocked(finalReload), true);
assert.equal(G.completeStoryRequestEvent(finalReload, 'milestone8'), false, 'エンディングを二重完了しない');
const clearReload = G.restore(JSON.parse(JSON.stringify(finalReload)));
assert.equal(G.postgameUnlocked(clearReload), true, '本編クリアを復元');
assert.deepEqual(clearReload.dailyRequests, finalSlots, '表示中の日常依頼を維持');
assert.equal(clearReload.day, 88);
assert.equal(clearReload.gathersLeft, 2);
assert.equal(clearReload.discovered.includes('bag'), true);
for (const id of thankYouIds) assert.equal(G.dailyResidentWeight(clearReload, id), 1, '全員お礼済み後は同率');
const craftAmount = clearReload.inventory.thread;
G.rest(clearReload, () => 0);
assert.equal(G.postgameUnlocked(clearReload), true, '翌日も本編クリア');
assert.equal(clearReload.inventory.thread, craftAmount, '日付進行で在庫を変更しない');
assert.equal(clearReload.dailyRequests.length, 3, 'クリア後も日常依頼が継続');
assert.equal(G.SAVE_VERSION, 2, 'セーブバージョンを変更しない');
console.log('PASS: eight-thank-you final request, exact atomic delivery, ending read state, restored clear and continuing daily play');

assert.equal(G.items.length, 21, '図鑑の21種類はそのまま');
assert.deepEqual(G.crops.map(crop => [crop.name, crop.growDays]), [['じゃがいも', 2], ['にんじん', 3], ['小麦', 4]]);
const lockedGarden = G.fresh();
assert.deepEqual(lockedGarden.plots, [null, null, null]);
assert.equal(G.plantCrop(lockedGarden, 0, 'potato'), false, '未クリアでは植えられない');
assert.equal(G.harvestCrop(lockedGarden, 0), false, '未クリアでは収穫できない');
const legacyGarden = G.restore({ ...finalReload, plots: undefined });
assert.equal(G.postgameUnlocked(legacyGarden), true, '本編クリア済み旧セーブで裏庭を解放');
assert.deepEqual(legacyGarden.plots, [null, null, null], '旧セーブの畑は3区画とも空き');
assert.equal(legacyGarden.day, 88);
assert.deepEqual(legacyGarden.dailyRequests, finalSlots);
assert.equal(legacyGarden.inventory.bag, 7);
assert.equal(G.plantCrop(legacyGarden, 0, 'potato'), true);
assert.equal(G.plantCrop(legacyGarden, 1, 'carrot'), true);
assert.equal(G.plantCrop(legacyGarden, 2, 'wheat'), true);
assert.equal(G.plantCrop(legacyGarden, 0, 'wheat'), false, '栽培中の区画は上書き不可');
assert.equal(G.plantCrop(legacyGarden, 3, 'wheat'), false, '4区画目はない');
assert.equal(G.plantCrop(legacyGarden, 0, 'unknown'), false);
assert.deepEqual(legacyGarden.plots.map(plot => plot.plantedDay), [88, 88, 88]);
assert.deepEqual(legacyGarden.plots.map((_, index) => G.cropDaysLeft(legacyGarden, index)), [2, 3, 4]);
assert.equal(G.harvestCrop(legacyGarden, 0), false, '植えた日には収穫不可');
assert.deepEqual(G.restore({ ...finalReload, plots: [{ cropId: 'potato', plantedDay: 89 }, { cropId: 'unknown', plantedDay: 88 }, null] }).plots, [null, null, null], '不正な畑データは空きへ補正');
const growingReload = G.restore(JSON.parse(JSON.stringify(legacyGarden)));
assert.deepEqual(growingReload.plots, legacyGarden.plots, '栽培状態を再読込で維持');
G.rest(growingReload);
assert.deepEqual(growingReload.plots.map((_, index) => G.cropDaysLeft(growingReload, index)), [1, 2, 3]);
G.rest(growingReload);
assert.deepEqual(growingReload.plots.map((_, index) => G.cropDaysLeft(growingReload, index)), [0, 1, 2]);
assert.equal(G.harvestCrop(growingReload, 0), true);
assert.equal(growingReload.inventory.potato, 2);
assert.equal(G.harvestCrop(growingReload, 0), false, '二重収穫不可');
assert.equal(growingReload.plots[0], null);
assert.equal(G.plantCrop(growingReload, 0, 'potato'), true, '収穫後は植え直せる');
G.rest(growingReload);
assert.equal(G.harvestCrop(growingReload, 1), true);
assert.equal(growingReload.inventory.carrot, 2);
G.rest(growingReload);
assert.equal(G.harvestCrop(growingReload, 2), true);
assert.equal(growingReload.inventory.wheat, 2);
const harvestedReload = G.restore(JSON.parse(JSON.stringify(growingReload)));
assert.equal(harvestedReload.inventory.potato, 2);
assert.equal(harvestedReload.inventory.carrot, 2);
assert.equal(harvestedReload.inventory.wheat, 2);
assert.deepEqual(harvestedReload.plots[0], growingReload.plots[0]);
assert.equal(harvestedReload.plots[1], null);
assert.equal(harvestedReload.plots[2], null);
assert.equal(harvestedReload.discovered.length, finalReload.discovered.length, '図鑑項目は増やさない');
const fullStock = G.restore({ ...finalReload, inventory: { ...finalReload.inventory, potato: Number.MAX_SAFE_INTEGER - 1 }, plots: [{ cropId: 'potato', plantedDay: 1 }, null, null] });
assert.equal(G.harvestCrop(fullStock, 0), false, '在庫が安全上限を超える収穫は拒否');
assert.equal(fullStock.inventory.potato, Number.MAX_SAFE_INTEGER - 1);
assert.equal(fullStock.plots[0].cropId, 'potato');
assert.equal(G.SAVE_VERSION, 2, '既存セーブバージョンは維持');
console.log('PASS: postgame garden unlock, legacy save, three crop durations, rest growth, exact harvest, empty reuse and reload');

const gardenIds = new Set(G.gardenDailyRequestPool.map(request => request.id));
const sequence = (...values) => { let index = 0; return () => values[index++] ?? 0.5; };
assert.equal(G.GARDEN_REQUEST_CHANCE, 0.35);
assert.deepEqual(G.gardenDailyRequestPool.map(request => [request.item, request.quantity]), [['potato', 2], ['carrot', 2], ['wheat', 2]]);
assert.ok(G.gardenDailyRequestPool.every(request => request.source === 'garden'));

const preClearGardenGuard = G.restore({ ...oldCompleteSave, dailyRequests: [
  { templateId: 'daily-garden-naka-potato', completed: false },
  { templateId: 'daily-ritsu-thread', completed: false },
  { templateId: 'daily-towa-box', completed: false }
] }, () => 0);
assert.equal(G.postgameUnlocked(preClearGardenGuard), false);
assert.equal(G.currentGardenRequest(preClearGardenGuard), null, '本編未クリアでは保存値からも裏庭依頼を出さない');
assert.equal(G.currentDailyRequests(preClearGardenGuard).length, 3);
assert.ok(G.currentDailyRequests(preClearGardenGuard).every(request => !gardenIds.has(request.id)), '通常3枠に畑依頼を混ぜない');

const postgameRequestSeed = JSON.parse(JSON.stringify(finalReload));
postgameRequestSeed.dailyRequests = finalSlots.map(slot => ({ ...slot, completed: false }));
postgameRequestSeed.gardenRequest = null;
postgameRequestSeed.dailyHistory = [];
const independentGarden = G.restore(postgameRequestSeed);
const unchangedDailySlots = JSON.stringify(independentGarden.dailyRequests);
G.rest(independentGarden, sequence(0, 0, 0));
assert.deepEqual(JSON.stringify(independentGarden.dailyRequests), unchangedDailySlots, '通常3枠がすべて未達成ならそのまま持ち越す');
assert.ok(G.currentGardenRequest(independentGarden), '通常3枠が埋まっていても日付更新で裏庭依頼を抽選');
const firstGarden = { ...independentGarden.gardenRequest };
G.rest(independentGarden, sequence(0, 0, 0));
assert.deepEqual(independentGarden.gardenRequest, firstGarden, '未達成の裏庭依頼は持ち越し、新規追加しない');

const generatedCropItems = [];
for (const gardenRoll of [0, 0.4, 0.9]) {
  const draw = G.restore(postgameRequestSeed);
  G.refreshGardenRequest(draw, sequence(0, 0, gardenRoll));
  const request = G.currentGardenRequest(draw);
  assert.ok(request, '裏庭解放後は独立枠へ1件生成');
  assert.equal(G.currentDailyRequests(draw).length, 3, '通常依頼は従来どおり3枠');
  generatedCropItems.push(request.item);
}
assert.deepEqual(generatedCropItems, ['potato', 'carrot', 'wheat'], '3種類の収穫物依頼を生成できる');

let gardenDays = 0;
for (let roll = 0; roll < 1000; roll++) {
  const draw = G.restore(postgameRequestSeed);
  G.rest(draw, sequence(roll / 1000, 0, 0));
  if (G.currentGardenRequest(draw)) gardenDays++;
}
assert.equal(gardenDays, 350, '通常依頼の達成状況に関係なく、日付更新ごとに35%で裏庭依頼を抽選');

const allGardenResidents = [];
const gardenResidentIds = Object.keys(G.dailyResidents);
for (let index = 0; index < gardenResidentIds.length; index++) {
  const draw = G.restore(postgameRequestSeed);
  G.refreshGardenRequest(draw, sequence(0, (index + 0.5) / gardenResidentIds.length, 0));
  allGardenResidents.push(G.currentGardenRequest(draw).resident);
}
assert.deepEqual(allGardenResidents, gardenResidentIds, '裏庭依頼主は8人全員から選べる');

const gardenDelivery = G.restore(postgameRequestSeed);
G.refreshGardenRequest(gardenDelivery, sequence(0, 0, 0));
const potatoRequest = G.currentGardenRequest(gardenDelivery);
const nakaCountBeforeGarden = gardenDelivery.dailyRequestCounts.naka;
gardenDelivery.inventory.potato = 1;
assert.equal(G.deliverGardenRequest(gardenDelivery, potatoRequest.id), false, '収穫物不足では納品不可');
assert.equal(gardenDelivery.inventory.potato, 1);
assert.equal(gardenDelivery.dailyRequestCounts.naka, nakaCountBeforeGarden);
gardenDelivery.inventory.potato = 2;
assert.equal(G.deliverGardenRequest(gardenDelivery, potatoRequest.id), true);
assert.equal(gardenDelivery.inventory.potato, 0, 'じゃがいもを2個だけ消費');
assert.equal(gardenDelivery.dailyRequestCounts.naka, nakaCountBeforeGarden + 1, '通常依頼と同じキャラクター進捗を加算');
assert.equal(G.dailyResidentWeight(gardenDelivery, 'naka'), 1, 'お礼済みキャラの抽選重みを維持');
assert.equal(G.deliverGardenRequest(gardenDelivery, potatoRequest.id), false, '裏庭依頼も二重納品不可');
const gardenDeliveryReload = G.restore(JSON.parse(JSON.stringify(gardenDelivery)));
assert.equal(G.currentGardenRequest(gardenDeliveryReload).completed, true, '裏庭依頼の達成状態を再読込で維持');
assert.equal(gardenDeliveryReload.dailyRequestCounts.naka, nakaCountBeforeGarden + 1);
G.rest(gardenDeliveryReload, sequence(0.9));
assert.equal(G.currentGardenRequest(gardenDeliveryReload), null, '達成済み枠は翌日に空き、抽選失敗なら空のまま');

const legacyGardenMigration = G.restore({ ...postgameRequestSeed, gardenRequest: undefined, dailyRequests: [
  { templateId: 'daily-garden-ritsu-carrot', completed: false },
  { templateId: 'daily-towa-box', completed: false },
  { templateId: 'daily-shiru-curtain', completed: false }
] }, () => 0.5);
assert.equal(G.currentGardenRequest(legacyGardenMigration).item, 'carrot', '旧方式の畑依頼を独立枠へ移行');
assert.equal(G.currentGardenRequest(legacyGardenMigration).resident, 'ritsu');
assert.equal(G.currentDailyRequests(legacyGardenMigration).length, 3, '移行後も通常枠を3件へ補充');
assert.ok(G.currentDailyRequests(legacyGardenMigration).some(request => request.id === 'daily-towa-box'));
assert.ok(G.currentDailyRequests(legacyGardenMigration).some(request => request.id === 'daily-shiru-curtain'));
assert.ok(G.currentDailyRequests(legacyGardenMigration).every(request => !gardenIds.has(request.id)), '旧畑依頼を通常枠へ重複させない');
console.log('PASS: independent backyard request slot, daily 35-percent draw, carryover, all crops/residents, delivery, migration and reload');

assert.equal(G.fresh().gratitudePoints, 0);
const preClearGratitude = G.fresh();
preClearGratitude.inventory.bag = 1;
assert.equal(G.deliver(preClearGratitude, 'naka'), true, '固定依頼は従来どおり達成');
assert.equal(G.gratitudePointText(preClearGratitude), '0', '固定依頼ではしるしを増やさない');
assert.equal(G.restore({ ...oldCompleteSave, gratitudePoints: 99 }).gratitudePoints, 0, '未クリアでは保存値を採用しない');
const oldClearWithoutPoints = G.restore({ ...finalReload, gratitudePoints: undefined });
assert.equal(G.gratitudePointText(oldClearWithoutPoints), '0', 'クリア済み旧セーブは0から開始');

const dailyGratitude = G.restore({ ...postgameRequestSeed, gratitudePoints: 0, inventory: { ...postgameRequestSeed.inventory, bag: 2 } });
assert.equal(G.deliverDaily(dailyGratitude, 'daily-naka-bag'), true);
assert.equal(G.gratitudePointText(dailyGratitude), '1', 'クリア後の日常依頼で+1');
assert.equal(G.deliverDaily(dailyGratitude, 'daily-naka-bag'), false);
assert.equal(G.gratitudePointText(dailyGratitude), '1', '同じ日常依頼では二重取得しない');

const gardenGratitude = G.restore({ ...postgameRequestSeed, gratitudePoints: 1, inventory: { ...postgameRequestSeed.inventory, potato: 2 }, gardenRequest: { resident: 'ritsu', cropId: 'potato', completed: false } });
assert.equal(G.deliverGardenRequest(gardenGratitude, 'garden:ritsu:potato'), true);
assert.equal(G.gratitudePointText(gardenGratitude), '2', '裏庭依頼でも+1');
assert.equal(G.deliverGardenRequest(gardenGratitude, 'garden:ritsu:potato'), false);
assert.equal(G.gratitudePointText(gardenGratitude), '2', '同じ裏庭依頼では二重取得しない');
assert.equal(G.gratitudePointText(G.restore(JSON.parse(JSON.stringify(gardenGratitude)))), '2', '再読込後も所持数を保持');

assert.equal(G.gratitudeExchanges.length, 4);
assert.ok(G.gratitudeExchanges.every(exchange => exchange.rewards.every(reward => {
  const item = G.items.find(entry => entry.id === reward.id);
  return item && item.category !== '完成品';
})), '交換品は既存の未完成素材だけ');
for (const exchange of G.gratitudeExchanges) {
  const exchangeState = G.restore({ ...postgameRequestSeed, gratitudePoints: exchange.cost, inventory: {} });
  const before = { ...exchangeState.inventory };
  assert.equal(G.canExchangeGratitude(exchangeState, exchange.id), true);
  assert.equal(G.exchangeGratitude(exchangeState, exchange.id), true, `${exchange.name}と交換できる`);
  assert.equal(G.gratitudePointText(exchangeState), '0', `${exchange.cost}ptを正確に消費`);
  for (const reward of exchange.rewards) assert.equal(exchangeState.inventory[reward.id], before[reward.id] + reward.quantity, `${reward.id}を指定数追加`);
  assert.deepEqual(G.restore(JSON.parse(JSON.stringify(exchangeState))).inventory, exchangeState.inventory, '交換後の在庫を再読込で保持');
}
const shortExchange = G.restore({ ...postgameRequestSeed, gratitudePoints: 2, inventory: {} });
const shortSnapshot = JSON.stringify(shortExchange);
assert.equal(G.exchangeGratitude(shortExchange, 'wood-materials'), false, 'ポイント不足では交換不可');
assert.equal(JSON.stringify(shortExchange), shortSnapshot, '不足時はポイントも在庫も変えない');
const fullExchange = G.restore({ ...postgameRequestSeed, gratitudePoints: 3, inventory: { wood: Number.MAX_SAFE_INTEGER } });
const fullExchangeSnapshot = JSON.stringify(fullExchange);
assert.equal(G.exchangeGratitude(fullExchange, 'wood-materials'), false, '在庫上限時は交換全体を拒否');
assert.equal(JSON.stringify(fullExchange), fullExchangeSnapshot, '上限時も原子的に状態を保つ');
const hugePoints = G.restore({ ...postgameRequestSeed, gratitudePoints: '9007199254740993' });
assert.equal(G.gratitudePointText(hugePoints), '9007199254740993', '安全整数を超えるポイントも保存可能');
console.log('PASS: postgame gratitude earning, exclusions, duplicate guards, four material exchanges, atomic shortage handling and reload');

assert.deepEqual(G.foods.map(food => [food.id, food.name, food.category]), [
  ['steamedPotato', 'ふかしじゃがいも', '料理'],
  ['warmCarrotSalad', 'にんじんの温サラダ', '料理'],
  ['vegetableSoup', '野菜スープ', '料理'],
  ['rusticBread', '素朴なパン', '料理'],
  ['boiledEgg', 'ゆで卵', '料理'],
  ['mushroomSoup', 'きのこスープ', '料理'],
  ['mushroomOmelet', 'きのこオムレツ', '料理'],
  ['milkBread', 'ミルクパン', '料理'],
  ['potatoMilkStew', 'じゃがいものミルク煮', '料理'],
  ['carrotOmelet', 'にんじんオムレツ', '料理'],
  ['mashedPotatoes', 'マッシュポテト', '料理'],
  ['meatVegetableStew', '肉と野菜の煮込み', '料理'],
  ['saltGrilledFish', '魚の塩焼き', '料理'],
  ['cheeseBakedMushrooms', 'きのこのチーズ焼き', '料理'],
  ['butterCookies', 'バタークッキー', '料理'],
  ['mushroomCreamPasta', 'きのこのクリームパスタ', '料理']
]);
assert.deepEqual(G.cookingRecipes.map(recipe => [recipe.id, G.ingredients(recipe).map(input => [input.id, input.cost])]), [
  ['steamedPotato', [['potato', 1]]],
  ['warmCarrotSalad', [['carrot', 1]]],
  ['vegetableSoup', [['potato', 1], ['carrot', 1]]],
  ['rusticBread', [['wheat', 2]]],
  ['boiledEgg', [['egg', 1]]],
  ['mushroomSoup', [['mushroom', 1], ['milk', 1]]],
  ['mushroomOmelet', [['egg', 1], ['mushroom', 1]]],
  ['milkBread', [['wheat', 2], ['milk', 1]]],
  ['potatoMilkStew', [['potato', 1], ['milk', 1]]],
  ['carrotOmelet', [['carrot', 1], ['egg', 1]]],
  ['mashedPotatoes', [['potato', 1], ['milk', 1], ['butter', 1]]],
  ['meatVegetableStew', [['meat', 1], ['potato', 1], ['carrot', 1], ['salt', 1]]],
  ['saltGrilledFish', [['fish', 1], ['salt', 1]]],
  ['cheeseBakedMushrooms', [['mushroom', 1], ['cheese', 1]]],
  ['butterCookies', [['wheat', 2], ['sugar', 1], ['butter', 1]]],
  ['mushroomCreamPasta', [['wheat', 2], ['mushroom', 1], ['milk', 1], ['cheese', 1]]]
]);
assert.ok(G.dailyRequestPool.every(request => !G.foods.some(food => food.id === request.item)), '料理は日常依頼へ追加しない');
const lockedCooking = G.fresh();
lockedCooking.inventory.potato = 2;
assert.equal(G.availableRecipes(lockedCooking).some(recipe => recipe.kind === 'cooking'), false, '本編未クリアでは料理レシピを解放しない');
assert.equal(G.craft(lockedCooking, 'steamedPotato'), false, '未クリアでは直接指定しても調理不可');
assert.equal(lockedCooking.inventory.potato, 2);
assert.equal(lockedCooking.inventory.steamedPotato, 0);

const cookingState = G.restore({ ...postgameRequestSeed, inventory: { potato: 4, carrot: 3, wheat: 4 }, gratitudePoints: 7 });
assert.equal(G.availableRecipes(cookingState).filter(recipe => recipe.kind === 'cooking').length, 16, 'クリア済み旧セーブで16レシピを即解放');
assert.ok(G.foods.every(food => cookingState.inventory[food.id] === 0), '旧セーブの料理在庫は0で初期化');
const dailyBeforeCooking = JSON.stringify(cookingState.dailyRequests);
const pointsBeforeCooking = G.gratitudePointText(cookingState);
assert.equal(G.craft(cookingState, 'steamedPotato'), true);
assert.equal(cookingState.inventory.potato, 3);
assert.equal(cookingState.inventory.steamedPotato, 1);
assert.equal(G.craft(cookingState, 'warmCarrotSalad'), true);
assert.equal(cookingState.inventory.carrot, 2);
assert.equal(cookingState.inventory.warmCarrotSalad, 1);
assert.equal(G.craft(cookingState, 'vegetableSoup'), true);
assert.equal(cookingState.inventory.potato, 2);
assert.equal(cookingState.inventory.carrot, 1);
assert.equal(cookingState.inventory.vegetableSoup, 1);
assert.equal(G.craft(cookingState, 'rusticBread', 2), true, '材料があれば複数回まとめて調理');
assert.equal(cookingState.inventory.wheat, 0);
assert.equal(cookingState.inventory.rusticBread, 2);
assert.deepEqual(JSON.stringify(cookingState.dailyRequests), dailyBeforeCooking, '料理で通常依頼を変更しない');
assert.equal(G.gratitudePointText(cookingState), pointsBeforeCooking, '料理でお礼のしるしを変更しない');
const shortageCooking = { ...cookingState.inventory };
assert.equal(G.craft(cookingState, 'vegetableSoup', 2), false, '複数素材の不足時は調理不可');
assert.deepEqual(cookingState.inventory, shortageCooking, '不足時はどの材料も消費しない');

const secondCookingState = G.restore({ ...postgameRequestSeed, inventory: { egg: 6, milk: 8, mushroom: 5, wheat: 5, potato: 3, carrot: 4 } });
const secondRecipes = Object.fromEntries(G.cookingRecipes.map(recipe => [recipe.id, recipe]));
assert.equal(G.maxCraft(secondCookingState, secondRecipes.boiledEgg), 6, '単一材料の最大調理数を計算');
assert.equal(G.maxCraft(secondCookingState, secondRecipes.mushroomSoup), 5, '複数材料は少ない在庫を上限にする');
assert.equal(G.maxCraft(secondCookingState, secondRecipes.mushroomOmelet), 5);
assert.equal(G.maxCraft(secondCookingState, secondRecipes.milkBread), 2, '小麦2個の必要数を最大調理数へ反映');
assert.equal(G.maxCraft(secondCookingState, secondRecipes.potatoMilkStew), 3);
assert.equal(G.maxCraft(secondCookingState, secondRecipes.carrotOmelet), 4);
assert.equal(G.craft(secondCookingState, 'boiledEgg'), true);
assert.equal(secondCookingState.inventory.egg, 5);
assert.equal(secondCookingState.inventory.boiledEgg, 1);
assert.equal(G.craft(secondCookingState, 'mushroomSoup'), true);
assert.equal(secondCookingState.inventory.mushroom, 4);
assert.equal(secondCookingState.inventory.milk, 7);
assert.equal(secondCookingState.inventory.mushroomSoup, 1);
assert.equal(G.craft(secondCookingState, 'mushroomOmelet'), true);
assert.equal(secondCookingState.inventory.egg, 4);
assert.equal(secondCookingState.inventory.mushroom, 3);
assert.equal(secondCookingState.inventory.mushroomOmelet, 1);
assert.equal(G.craft(secondCookingState, 'milkBread', 2), true);
assert.equal(secondCookingState.inventory.wheat, 1);
assert.equal(secondCookingState.inventory.milk, 5);
assert.equal(secondCookingState.inventory.milkBread, 2);
assert.equal(G.craft(secondCookingState, 'potatoMilkStew'), true);
assert.equal(secondCookingState.inventory.potato, 2);
assert.equal(secondCookingState.inventory.milk, 4);
assert.equal(secondCookingState.inventory.potatoMilkStew, 1);
assert.equal(G.craft(secondCookingState, 'carrotOmelet', 4), true);
assert.equal(secondCookingState.inventory.carrot, 0);
assert.equal(secondCookingState.inventory.egg, 0);
assert.equal(secondCookingState.inventory.carrotOmelet, 4);
const secondShortage = G.restore({ ...postgameRequestSeed, inventory: { mushroom: 1, milk: 0 } });
const secondShortageSnapshot = JSON.stringify(secondShortage.inventory);
assert.equal(G.craft(secondShortage, 'mushroomSoup'), false, '第二弾レシピも材料不足では調理不可');
assert.equal(JSON.stringify(secondShortage.inventory), secondShortageSnapshot, '複数材料の不足時も原子的に在庫を保つ');
const secondCookingReload = G.restore(JSON.parse(JSON.stringify(secondCookingState)));
for (const id of ['boiledEgg', 'mushroomSoup', 'mushroomOmelet', 'milkBread', 'potatoMilkStew', 'carrotOmelet']) {
  assert.equal(secondCookingReload.inventory[id], secondCookingState.inventory[id], `${id}の在庫を再読込で保持`);
}
const cookingReload = G.restore(JSON.parse(JSON.stringify(cookingState)));
assert.equal(cookingReload.inventory.steamedPotato, 1);
assert.equal(cookingReload.inventory.warmCarrotSalad, 1);
assert.equal(cookingReload.inventory.vegetableSoup, 1);
assert.equal(cookingReload.inventory.rusticBread, 2, '料理在庫を再読込で保持');
assert.equal(cookingReload.discovered.length, cookingState.discovered.length, '料理追加後も既存図鑑の件数を変えない');
const thirdCookingCases = [
  ['mashedPotatoes', { potato: 5, milk: 4, butter: 3 }, 3],
  ['meatVegetableStew', { meat: 4, potato: 5, carrot: 6, salt: 2 }, 2],
  ['saltGrilledFish', { fish: 3, salt: 5 }, 3],
  ['cheeseBakedMushrooms', { mushroom: 4, cheese: 2 }, 2],
  ['butterCookies', { wheat: 8, sugar: 3, butter: 5 }, 3],
  ['mushroomCreamPasta', { wheat: 8, mushroom: 5, milk: 3, cheese: 2 }, 2]
];
for (const [id, stock, expectedMax] of thirdCookingCases) {
  const recipe = G.cookingRecipes.find(entry => entry.id === id);
  const cooking = G.restore({ ...postgameRequestSeed, merchantVisit: undefined, inventory: stock });
  G.rest(cooking, () => 0.9);
  assert.equal(G.merchantStatus(cooking).present, false, `${id}はレガトワ不在時にも検証`);
  assert.equal(G.maxCraft(cooking, recipe), expectedMax, `${id}の最少材料から最大調理数を計算`);
  const before = { ...cooking.inventory };
  const requestsBefore = JSON.stringify(cooking.dailyRequests);
  const pointsBefore = G.gratitudePointText(cooking);
  assert.equal(G.craft(cooking, id), true, `${id}を1個調理`);
  for (const input of G.ingredients(recipe)) assert.equal(cooking.inventory[input.id], before[input.id] - input.cost, `${id}で${input.id}を正確に消費`);
  assert.equal(cooking.inventory[id], 1, `${id}を在庫へ1個追加`);
  assert.equal(JSON.stringify(cooking.dailyRequests), requestsBefore, `${id}で日常依頼を変更しない`);
  assert.equal(G.gratitudePointText(cooking), pointsBefore, `${id}でお礼のしるしを変更しない`);
  const reload = G.restore(JSON.parse(JSON.stringify(cooking)));
  assert.equal(reload.inventory[id], 1, `${id}を再読込後も保持`);
  for (const input of G.ingredients(recipe)) assert.equal(reload.inventory[input.id], cooking.inventory[input.id], `${input.id}の残数を再読込後も保持`);

  const merchantInput = G.ingredients(recipe).find(input => G.merchantMaterials.some(item => item.id === input.id));
  const shortageStock = { ...stock, [merchantInput.id]: 0 };
  const shortage = G.restore({ ...postgameRequestSeed, inventory: shortageStock });
  const shortageSnapshot = JSON.stringify(shortage.inventory);
  assert.equal(G.craft(shortage, id), false, `${id}は外来食材不足で調理不可`);
  assert.equal(JSON.stringify(shortage.inventory), shortageSnapshot, `${id}の不足時は全材料を維持`);
}
const pastaBatch = G.restore({ ...postgameRequestSeed, merchantVisit: { anchorDay: postgameRequestSeed.day - 1, exchangedDay: null, exchanged: [] }, inventory: { wheat: 8, mushroom: 5, milk: 3, cheese: 2 } });
const pastaRecipe = G.cookingRecipes.find(recipe => recipe.id === 'mushroomCreamPasta');
assert.equal(G.merchantStatus(pastaBatch).present, false);
assert.equal(G.maxCraft(pastaBatch, pastaRecipe), 2);
assert.equal(G.craft(pastaBatch, 'mushroomCreamPasta', 2), true, '4材料料理をまとめて2個調理');
assert.equal(pastaBatch.inventory.wheat, 4);
assert.equal(pastaBatch.inventory.mushroom, 3);
assert.equal(pastaBatch.inventory.milk, 1);
assert.equal(pastaBatch.inventory.cheese, 0);
assert.equal(pastaBatch.inventory.mushroomCreamPasta, 2);
console.log('PASS: sixteen postgame cooking recipes, third-set merchant ingredients, absent-merchant cooking, exact multi-input and batch cooking, shortage guards and reload');

assert.deepEqual(G.backyardMaterials.map(item => [item.id, item.name, item.category]), [
  ['egg', '卵', '畜産物'],
  ['milk', '牛乳', '畜産物'],
  ['mushroom', 'きのこ', '収穫物']
]);
assert.deepEqual(G.backyardFacilities.map(facility => [facility.id, facility.name, facility.product, facility.cycleDays, facility.quantity]), [
  ['chickenCoop', '小さな鶏小屋', 'egg', 2, 2],
  ['cowBarn', '小さな牛舎', 'milk', 3, 1],
  ['mushroomLog', 'きのこ原木', 'mushroom', 3, 2]
]);
const lockedFacilities = G.fresh();
assert.deepEqual(G.currentFacilities(lockedFacilities), [], '本編未クリアでは設備を利用不可');
assert.equal(G.collectFacility(lockedFacilities, 'chickenCoop'), false);

const oldClearFacilities = G.restore({ ...postgameRequestSeed, facilityProduction: undefined, inventory: {} });
const facilityStartDay = oldClearFacilities.day;
assert.deepEqual(Object.values(oldClearFacilities.facilityProduction).map(entry => entry.startedDay), [facilityStartDay, facilityStartDay, facilityStartDay], 'クリア済み旧セーブは読込日から初回周期開始');
assert.deepEqual(G.currentFacilities(oldClearFacilities).map(facility => [facility.id, facility.daysLeft, facility.ready]), [
  ['chickenCoop', 2, false], ['cowBarn', 3, false], ['mushroomLog', 3, false]
]);
const unchangedFacilities = JSON.stringify(oldClearFacilities);
G.currentFacilities(oldClearFacilities);
assert.equal(JSON.stringify(oldClearFacilities), unchangedFacilities, 'ゲーム内日付を進めなければ生産は進まない');
assert.equal(G.collectFacility(oldClearFacilities, 'chickenCoop'), false, '生産待ちは受け取れない');
G.rest(oldClearFacilities, () => 0.9);
assert.deepEqual(G.currentFacilities(oldClearFacilities).map(facility => facility.daysLeft), [1, 2, 2]);
const oneDayFacilityReload = G.restore(JSON.parse(JSON.stringify(oldClearFacilities)));
assert.deepEqual(G.currentFacilities(oneDayFacilityReload).map(facility => facility.daysLeft), [1, 2, 2], 'リロード後も進行途中を保持');
G.rest(oneDayFacilityReload, () => 0.9);
assert.deepEqual(G.currentFacilities(oneDayFacilityReload).map(facility => [facility.daysLeft, facility.ready]), [[0, true], [1, false], [1, false]]);
const readyFacilityReload = G.restore(JSON.parse(JSON.stringify(oneDayFacilityReload)));
assert.equal(G.currentFacilities(readyFacilityReload).find(facility => facility.id === 'chickenCoop').ready, true, '受取可能状態も再読込で保持');
assert.equal(G.collectFacility(oneDayFacilityReload, 'chickenCoop'), true);
assert.equal(oneDayFacilityReload.inventory.egg, 2, '2日で卵を2個受け取る');
assert.equal(G.facilityDaysLeft(oneDayFacilityReload, 'chickenCoop'), 2, '受取日から次の周期を開始');
assert.equal(G.collectFacility(oneDayFacilityReload, 'chickenCoop'), false, '同じ周期から二重受取不可');
G.rest(oneDayFacilityReload, () => 0.9);
assert.deepEqual(G.currentFacilities(oneDayFacilityReload).map(facility => [facility.daysLeft, facility.ready]), [[1, false], [0, true], [0, true]]);
assert.equal(G.collectFacility(oneDayFacilityReload, 'cowBarn'), true);
assert.equal(G.collectFacility(oneDayFacilityReload, 'mushroomLog'), true);
assert.equal(oneDayFacilityReload.inventory.milk, 1, '3日で牛乳を1個受け取る');
assert.equal(oneDayFacilityReload.inventory.mushroom, 2, '3日できのこを2個受け取る');
assert.equal(G.facilityDaysLeft(oneDayFacilityReload, 'cowBarn'), 3);
assert.equal(G.facilityDaysLeft(oneDayFacilityReload, 'mushroomLog'), 3);
G.rest(oneDayFacilityReload, () => 0.9);
G.rest(oneDayFacilityReload, () => 0.9);
assert.equal(G.collectFacility(oneDayFacilityReload, 'chickenCoop'), true, '受取後2日で卵を再生産');
assert.equal(oneDayFacilityReload.inventory.egg, 4);
const facilityReload = G.restore(JSON.parse(JSON.stringify(oneDayFacilityReload)));
assert.equal(facilityReload.inventory.egg, 4);
assert.equal(facilityReload.inventory.milk, 1);
assert.equal(facilityReload.inventory.mushroom, 2, '受取在庫を再読込で保持');
assert.deepEqual(facilityReload.facilityProduction, oneDayFacilityReload.facilityProduction, '各設備の周期開始日を保持');
const fullEggFacility = G.restore({ ...postgameRequestSeed, day: 100, inventory: { egg: Number.MAX_SAFE_INTEGER }, facilityProduction: { chickenCoop: { startedDay: 1 }, cowBarn: { startedDay: 100 }, mushroomLog: { startedDay: 100 } } });
const fullEggSnapshot = JSON.stringify(fullEggFacility);
assert.equal(G.collectFacility(fullEggFacility, 'chickenCoop'), false, '在庫上限時は受取不可');
assert.equal(JSON.stringify(fullEggFacility), fullEggSnapshot, '上限時は周期も変更しない');
assert.equal(G.SAVE_VERSION, 2, '設備追加でも既存セーブバージョンを維持');
console.log('PASS: three postgame facilities, exact game-day cycles, collection quantities, restart timing, save reload, no real-time progress and guards');

assert.deepEqual(G.merchantMaterials.map(item => [item.id, item.name, item.category]), [
  ['sugar', '砂糖', '外来食材'],
  ['salt', '塩', '外来食材'],
  ['butter', 'バター', '外来食材'],
  ['cheese', 'チーズ', '外来食材'],
  ['meat', '肉', '外来食材'],
  ['fish', '魚', '外来食材']
]);
assert.deepEqual(G.merchantTrades.map(trade => [trade.id, trade.quantity, trade.costs.map(cost => [cost.id, cost.quantity])]), [
  ['sugar', 2, [['flower', 2]]],
  ['salt', 2, [['branch', 2]]],
  ['butter', 1, [['thread', 1]]],
  ['cheese', 1, [['dye', 1]]],
  ['meat', 1, [['box', 1]]],
  ['fish', 1, [['bag', 1]]]
]);
assert.equal(G.MERCHANT_VISIT_INTERVAL, 3);
assert.ok(G.merchantTrades.every(trade => trade.costs.every(cost => G.items.some(item => item.id === cost.id))), '交換材料は既存アイテムだけ');
assert.ok(G.merchantTrades.every(trade => !trade.costs.some(cost => G.merchantMaterials.some(item => item.id === cost.id))), '外来食材を交換材料にしない');
assert.ok(G.merchantMaterials.every(item => G.cookingRecipes.some(recipe => G.ingredients(recipe).some(input => input.id === item.id))), '6種類の外来食材すべてに料理の使い道がある');
assert.equal(G.merchantStatus(finalReload).present, true, '本編クリア完了日から行商人を利用可能');
const preClearMerchant = G.fresh();
assert.equal(G.merchantStatus(preClearMerchant), null, '本編未クリアでは行商人を無効化');
assert.equal(G.tradeMerchant(preClearMerchant, 'sugar'), false);

const oldClearMerchant = G.restore({ ...postgameRequestSeed, merchantVisit: undefined, inventory: {} });
assert.deepEqual(G.merchantStatus(oldClearMerchant), { present: true, daysUntil: 0, exchanged: [] }, 'クリア済み旧セーブは初回即来訪');
assert.equal(oldClearMerchant.merchantVisit.anchorDay, oldClearMerchant.day, '旧セーブ読込日を3日周期の基準日にする');
assert.ok(G.merchantMaterials.every(item => oldClearMerchant.inventory[item.id] === 0), '旧セーブの外来食材は0で初期化');

for (const trade of G.merchantTrades) {
  const inventory = Object.fromEntries(trade.costs.map(cost => [cost.id, cost.quantity]));
  const tradeState = G.restore({ ...postgameRequestSeed, merchantVisit: undefined, inventory });
  const before = { ...tradeState.inventory };
  assert.equal(G.canTradeMerchant(tradeState, trade.id), true, `${trade.id}は材料充足時に交換可能`);
  assert.equal(G.tradeMerchant(tradeState, trade.id), true);
  for (const cost of trade.costs) assert.equal(tradeState.inventory[cost.id], before[cost.id] - cost.quantity, `${cost.id}を正確に消費`);
  assert.equal(tradeState.inventory[trade.id], trade.quantity, `${trade.id}を指定数受取`);
  const completedSnapshot = JSON.stringify(tradeState);
  assert.equal(G.tradeMerchant(tradeState, trade.id), false, '同じ来訪中の二重交換を防止');
  assert.equal(JSON.stringify(tradeState), completedSnapshot, '二重操作で在庫を変更しない');
  const tradeReload = G.restore(JSON.parse(JSON.stringify(tradeState)));
  assert.ok(G.merchantStatus(tradeReload).exchanged.includes(trade.id), '交換済み状態を再読込で保持');
  assert.equal(G.tradeMerchant(tradeReload, trade.id), false, '再読込後も二重交換不可');

  const shortInventory = Object.fromEntries(trade.costs.map(cost => [cost.id, Math.max(0, cost.quantity - 1)]));
  const shortTrade = G.restore({ ...postgameRequestSeed, merchantVisit: undefined, inventory: shortInventory });
  const shortSnapshot = JSON.stringify(shortTrade);
  assert.equal(G.tradeMerchant(shortTrade, trade.id), false, '交換材料不足では交換不可');
  assert.equal(JSON.stringify(shortTrade), shortSnapshot, '不足時は材料も受取品も変更しない');
}

const merchantCycle = G.restore({ ...postgameRequestSeed, merchantVisit: undefined, inventory: { flower: 4 } });
const merchantAnchor = merchantCycle.merchantVisit.anchorDay;
assert.equal(G.tradeMerchant(merchantCycle, 'sugar'), true);
G.rest(merchantCycle, () => 0.9);
assert.deepEqual(G.merchantStatus(merchantCycle), { present: false, daysUntil: 2, exchanged: [] }, '来訪翌日は次回まで2日');
G.rest(merchantCycle, () => 0.9);
assert.deepEqual(G.merchantStatus(merchantCycle), { present: false, daysUntil: 1, exchanged: [] }, '来訪2日後は次回まで1日');
G.rest(merchantCycle, () => 0.9);
assert.deepEqual(G.merchantStatus(merchantCycle), { present: true, daysUntil: 0, exchanged: [] }, '3日後に再来訪し交換制限をリセット');
assert.equal(merchantCycle.merchantVisit.anchorDay, merchantAnchor, '周期の基準日を維持');
assert.equal(G.tradeMerchant(merchantCycle, 'sugar'), true, '次回来訪では同じ商品を再交換可能');
assert.equal(merchantCycle.inventory.sugar, 4);
const cycleReload = G.restore(JSON.parse(JSON.stringify(merchantCycle)));
assert.deepEqual(cycleReload.merchantVisit, merchantCycle.merchantVisit, '来訪周期と交換済み商品を保存');
const hugeDayMerchant = G.restore({ ...postgameRequestSeed, day: '9007199254740993', merchantVisit: undefined });
G.rest(hugeDayMerchant, () => 0.9);
assert.equal(hugeDayMerchant.day, '9007199254740994');
assert.equal(G.merchantStatus(hugeDayMerchant).daysUntil, 2, '安全整数を超える日数でも3日周期を維持');
const fullSugarMerchant = G.restore({ ...postgameRequestSeed, merchantVisit: undefined, inventory: { flower: 2, sugar: Number.MAX_SAFE_INTEGER } });
const fullSugarSnapshot = JSON.stringify(fullSugarMerchant);
assert.equal(G.tradeMerchant(fullSugarMerchant, 'sugar'), false, '受取在庫上限時は交換不可');
assert.equal(JSON.stringify(fullSugarMerchant), fullSugarSnapshot, '上限時も原子的に状態を保つ');
assert.equal(G.SAVE_VERSION, 2, '行商人追加でも既存セーブバージョンを維持');
console.log('PASS: Regatowa postgame gating, immediate legacy visit, six atomic barter trades, one-per-visit persistence, exact three-day game cycle and reload');

const cookingRequestIds = new Set(G.cookingDailyRequestPool.map(request => request.id));
const cookingRequestItems = new Set(G.cookingDailyRequestPool.map(request => request.item));
assert.equal(G.COOKING_REQUEST_CHANCE, 0.35);
assert.equal(G.cookingDailyRequestPool.length, Object.keys(G.dailyResidents).length * G.foods.length, '料理と住人の組み合わせをデータ生成');
assert.deepEqual(cookingRequestItems, new Set(G.foods.map(food => food.id)), '16種類すべてを依頼候補に含む');
assert.ok(G.cookingDailyRequestPool.every(request => request.source === 'cooking' && request.quantity === 1));
for (const food of G.foods.slice(0, 10)) assert.equal(G.cookingRequestWeight(food.id), 2, `${food.name}は自給素材中心の重み2`);
for (const food of G.foods.slice(10)) assert.equal(G.cookingRequestWeight(food.id), 1, `${food.name}は外来食材使用の重み1`);

const preClearCooking = G.restore({ ...oldCompleteSave, dailyRequests: [
  { templateId: 'daily-naka-bag', completed: true },
  { templateId: 'daily-ritsu-thread', completed: true },
  { templateId: 'daily-towa-box', completed: true }
] });
G.refreshDailyRequests(preClearCooking, sequence(0, 0, 0, 0));
assert.ok(G.currentDailyRequests(preClearCooking).every(request => request.source !== 'cooking'), '本編未クリアでは料理依頼を生成しない');

const cookingDrawSeed = { ...postgameRequestSeed, dailyRequests: [
  { templateId: 'daily-naka-bag', completed: true },
  { templateId: 'daily-ritsu-thread', completed: true },
  { templateId: 'daily-towa-box', completed: true }
] };
const cookingDraw = G.restore(cookingDrawSeed);
G.refreshDailyRequests(cookingDraw, sequence(0.34, 0, 0, 0));
assert.equal(G.currentDailyRequests(cookingDraw).filter(request => request.source === 'cooking').length, 1, '35%判定成功時に料理依頼を1件生成');
assert.equal(G.currentDailyRequests(cookingDraw).filter(request => request.source !== 'cooking').length, 2, '残りは従来の日常依頼');

const noCookingDraw = G.restore(cookingDrawSeed);
G.refreshDailyRequests(noCookingDraw, sequence(0.35, 0, 0));
assert.ok(G.currentDailyRequests(noCookingDraw).every(request => request.source !== 'cooking'), '35%外では従来依頼だけを生成');

let cookingRequestDays = 0;
for (let roll = 0; roll < 1000; roll++) {
  const draw = G.restore(cookingDrawSeed);
  G.refreshDailyRequests(draw, sequence(roll / 1000, 0, 0, 0));
  if (G.currentDailyRequests(draw).some(request => request.source === 'cooking')) cookingRequestDays++;
}
assert.equal(cookingRequestDays, 350, '新規枝生成日の35%で料理依頼を1件混ぜる');

const carriedCookingId = 'daily-cooking-ritsu-mushroomCreamPasta';
const carriedCooking = G.restore({ ...postgameRequestSeed, dailyRequests: [
  { templateId: carriedCookingId, completed: false },
  { templateId: 'daily-naka-bag', completed: true },
  { templateId: 'daily-towa-box', completed: true }
] });
G.refreshDailyRequests(carriedCooking, sequence(0, 0, 0, 0));
assert.ok(carriedCooking.dailyRequests.some(slot => slot.templateId === carriedCookingId && !slot.completed), '未達成の料理依頼を持ち越す');
assert.equal(G.currentDailyRequests(carriedCooking).filter(request => request.source === 'cooking').length, 1, '持ち越し中は新しい料理依頼を追加しない');

const duplicateCookingSave = G.restore({ ...postgameRequestSeed, dailyRequests: [
  { templateId: 'daily-cooking-naka-steamedPotato', completed: false },
  { templateId: 'daily-cooking-ritsu-boiledEgg', completed: false },
  { templateId: 'daily-towa-box', completed: false }
] }, sequence(0, 0));
assert.equal(G.currentDailyRequests(duplicateCookingSave).filter(request => request.source === 'cooking').length, 1, '不正な旧セーブでも最大1件へ補正');

const cookingDelivery = G.restore({ ...postgameRequestSeed, gratitudePoints: 4, inventory: {}, dailyRequests: [
  { templateId: 'daily-cooking-naka-butterCookies', completed: false },
  { templateId: 'daily-ritsu-thread', completed: false },
  { templateId: 'daily-towa-box', completed: false }
] });
const cookingCountBefore = cookingDelivery.dailyRequestCounts.naka;
assert.equal(G.deliverDaily(cookingDelivery, 'daily-cooking-naka-butterCookies'), false, '料理在庫不足では納品不可');
cookingDelivery.inventory.butterCookies = 1;
assert.equal(G.deliverDaily(cookingDelivery, 'daily-cooking-naka-butterCookies'), true);
assert.equal(cookingDelivery.inventory.butterCookies, 0, '料理1個を消費');
assert.equal(cookingDelivery.gratitudePoints, 5, 'お礼のしるしを1加算');
assert.equal(cookingDelivery.dailyRequestCounts.naka, cookingCountBefore + 1, '依頼主の進捗を加算');
assert.equal(G.deliverDaily(cookingDelivery, 'daily-cooking-naka-butterCookies'), false, '同じ料理依頼を二重達成しない');
const cookingDeliveryReload = G.restore(JSON.parse(JSON.stringify(cookingDelivery)));
assert.equal(cookingDeliveryReload.dailyRequests.find(slot => cookingRequestIds.has(slot.templateId)).completed, true, '料理依頼の達成状態を再読込で維持');
assert.equal(cookingDeliveryReload.gratitudePoints, 5);
assert.equal(G.currentGardenRequest(cookingDeliveryReload), null, '裏庭依頼と独立したまま');
console.log('PASS: sixteen weighted cooking requests, postgame 35-percent draw, max-one carryover, delivery, gratitude, resident progress and reload');
