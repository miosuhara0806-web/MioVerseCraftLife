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
assert.equal(oldFourResidentSave.gathersLeft, 0);
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
assert.equal(oldFiveResidentSave.gathersLeft, 1);
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
assert.equal(oldSixResidentSave.gathersLeft, 1);
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
assert.equal(oldSevenResidentSave.gathersLeft, 1);
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
assert.equal(legacyAll.gathersLeft, 1);
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
assert.equal(oldEncyclopedia.gathersLeft, 1);
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
