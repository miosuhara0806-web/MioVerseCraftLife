// app.js の実際のクリック処理・画面生成・保存復元を、ブラウザのセーブと分離して検証。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const G = require('./game.js');
const saved = new Map();
function launch() {
  const nodes = new Map();
  const handlers = {};
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', classList: { add() {}, remove() {} }, focus() {}, open: false, showModal() { this.open = true; }, close() { this.open = false; } });
    return nodes.get(id);
  };
  const context = vm.createContext({
    window: { MioGame: G, addEventListener: (name, fn) => { handlers[name] = fn; }, scrollTo() {} },
    document: { getElementById: node, activeElement: null, addEventListener: (name, fn) => { handlers[name] = fn; } },
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    location: { hash: '#home' }, setTimeout: () => 0, clearTimeout() {}
  });
  vm.runInContext(fs.readFileSync('./app.js', 'utf8'), context);
  return {
    click(action, id) { handlers.click({ target: { closest: () => ({ dataset: { action, id }, disabled: false }) } }); },
    page(id) { context.location.hash = '#' + id; handlers.hashchange(); return node('main').innerHTML; },
    state() { return saved.has('mioverse-craft-v1') ? JSON.parse(saved.get('mioverse-craft-v1')) : G.fresh(); },
    dialogOpen() { return node('rest-dialog').open; },
    recipeDialogOpen() { return node('recipe-dialog').open; },
    recipeDialogHtml() { return node('recipe-dialog-content').innerHTML; }
  };
}
let app = launch();
function gatherForLoop(id) {
  if (app.state().gathersLeft === 0) { app.page('home'); app.click('rest'); app.click('rest-confirm'); }
  app.click('gather', id);
}
const paths = [
  { request: 'naka', item: 'bag', gather: ['vine'], recipes: ['fiber', 'thread', 'cloth', 'bag'] },
  { request: 'ritsu', item: 'dye', gather: ['flower'], recipes: ['dryFlower', 'dye'] },
  { request: 'towa', item: 'box', gather: ['branch', 'branch'], recipes: ['wood', 'plank', 'box'] }
];
for (const path of paths) {
  assert.ok(!app.page('requests').includes('窓辺をちょっと明るく'), '第1段階が終わるまで追加依頼を表示しない');
  const request = G.requests.find(r => r.id === path.request);
  assert.ok(app.page('requests').includes(request.message));
  path.gather.forEach(id => gatherForLoop(id));
  path.recipes.forEach(id => app.click('craft-all', id));
  assert.equal(app.state().inventory[path.item], 1, '完成品は在庫に残る');
  assert.equal(app.state().completed.includes(path.request), false, '作成だけでは未達成');
  app = launch();
  assert.equal(app.state().completed.includes(path.request), false, '再開しても未達成');
  assert.match(app.page('requests'), new RegExp(`data-action="deliver" data-id="${path.request}" >1個届ける</button>`));
  assert.ok(app.page('inventory').includes(`<span>${G.items.find(i => i.id === path.item).name}</span><strong>1 `));
  app.page('requests');
  app.click('deliver', path.request);
  assert.equal(app.state().inventory[path.item], 0, '納品で1個消費');
  assert.equal(app.state().completed.includes(path.request), true, '手動納品で達成');
  assert.ok(app.page('requests').includes(request.thanks));
  assert.match(app.page('requests'), new RegExp(`data-action="deliver" data-id="${path.request}" disabled>達成しました</button>`));
  const before = JSON.stringify(app.state());
  app.click('deliver', path.request);
  assert.equal(JSON.stringify(app.state()), before, '二重納品で変化しない');
  app = launch();
  assert.ok(app.page('requests').includes(request.thanks), '達成状況とセリフを再開時に復元');
}
assert.equal(app.state().completed.length, 3);
assert.ok(Object.values(app.state().inventory).every(n => n === 0));
console.log('PASS: all 3 UI action flows, manual delivery buttons, stock display, dialogue, consumption, duplicate delivery, save/reload before and after delivery');

assert.equal(app.state().unlockedStage, 2);
assert.ok(app.page('requests').includes('窓辺をちょっと明るく'));
assert.ok(app.page('home').includes('新しい3件のお願い'));
assert.ok(!app.page('home').includes('すべての依頼を届けました'));
// 採集から追加3件を生産。染め布4枚のうち2枚をカーテン、1枚を壁掛け、1枚を納品へ。
for (let i = 0; i < 5; i++) gatherForLoop('vine');
for (let i = 0; i < 4; i++) gatherForLoop('flower');
gatherForLoop('branch');
for (const id of ['fiber', 'thread', 'dryFlower', 'dye', 'wood', 'plank']) app.click('craft-all', id);
for (let i = 0; i < 4; i++) app.click('craft', 'cloth');
assert.ok(app.page('craft').includes('布 1個 ＋ 染料 1個'));
app.click('craft-all', 'dyedCloth');
assert.equal(app.state().inventory.dyedCloth, 4);
app.click('craft', 'curtain');
assert.equal(app.state().inventory.dyedCloth, 2);
assert.equal(app.state().inventory.thread, 1);
app.click('craft', 'wallHanging');
assert.equal(app.state().inventory.dyedCloth, 1);
assert.equal(app.state().inventory.plank, 0);
assert.equal(app.state().completed.length, 3);
app = launch();
for (const id of ['nakaCurtain', 'ritsuWall', 'towaCloth']) {
  assert.ok(!app.page('requests').includes('入口に飾りたいな'));
  const request = G.requests.find(r => r.id === id);
  assert.ok(app.page('requests').includes(request.message));
  assert.match(app.page('requests'), new RegExp(`data-action="deliver" data-id="${id}" >1個届ける</button>`));
  assert.ok(app.page('inventory').includes(`<span>${G.items.find(i => i.id === request.item).name}</span><strong>1 `));
  assert.equal(app.state().inventory[request.item], 1);
  assert.equal(app.state().completed.includes(id), false);
  app.click('deliver', id);
  assert.equal(app.state().inventory[request.item], 0);
  assert.equal(app.state().completed.includes(id), true);
  const before = JSON.stringify(app.state());
  app.click('deliver', id);
  assert.equal(JSON.stringify(app.state()), before);
  app = launch();
  assert.ok(app.page('requests').includes(request.thanks));
  assert.match(app.page('requests'), new RegExp(`data-action="deliver" data-id="${id}" disabled>達成しました</button>`));
}
assert.equal(app.state().completed.length, 6);
assert.equal(app.state().unlockedStage, 3);
assert.ok(!app.page('home').includes('すべての依頼を届けました'));
assert.ok(app.page('requests').includes('入口に飾りたいな'));
assert.ok(app.page('craft').includes('染め布の在庫 0 / 必要 2（不足）'));
console.log('PASS: stage 2 unlock, all new production chains from gathering, inventory, manual deliveries, stock consumption and save/reload');

// 第2段階の余りは糸1個。採集から第3段階の3品を作る。
for (let i = 0; i < 6; i++) gatherForLoop('vine');
for (let i = 0; i < 4; i++) gatherForLoop('flower');
for (let i = 0; i < 2; i++) gatherForLoop('branch');
for (let i = 0; i < 10; i++) app.click('craft', 'fiber'); // ツル草2個をリースに残す
for (let i = 0; i < 8; i++) app.click('craft', 'thread'); // 植物繊維2個をクッションに残す
for (let i = 0; i < 3; i++) app.click('craft', 'cloth');
app.click('craft-all', 'dryFlower');
for (let i = 0; i < 3; i++) app.click('craft', 'dye'); // 乾燥花2個をリースに残す
app.click('craft-all', 'dyedCloth');
app.click('craft-all', 'wood');
app.click('craft-all', 'plank');
app.click('craft', 'box');
assert.equal(app.state().inventory.box, 1);
assert.equal(app.state().inventory.dryFlower, 2);
app.click('craft', 'wreath');
assert.equal(app.state().inventory.dryFlower, 0);
assert.equal(app.state().inventory.vine, 0);
assert.equal(app.state().inventory.dye, 0);
app.click('craft', 'linedBox');
assert.equal(app.state().inventory.box, 0);
assert.equal(app.state().inventory.dyedCloth, 2);
app.click('craft', 'cushion');
assert.equal(app.state().inventory.dyedCloth, 0);
assert.equal(app.state().inventory.fiber, 0);
assert.equal(app.state().completed.length, 6);
app = launch();
for (const id of ['nakaWreath', 'ritsuCushion', 'towaLinedBox']) {
  const request = G.requests.find(r => r.id === id);
  assert.equal(app.state().unlockedStage, 3);
  assert.ok(app.page('requests').includes(request.message));
  assert.match(app.page('requests'), new RegExp(`data-action="deliver" data-id="${id}" >1個届ける</button>`));
  assert.ok(app.page('inventory').includes(`<span>${G.items.find(i => i.id === request.item).name}</span><strong>1 `));
  assert.equal(app.state().inventory[request.item], 1);
  assert.equal(app.state().completed.includes(id), false);
  app.page('requests');
  app.click('deliver', id);
  assert.equal(app.state().inventory[request.item], 0);
  assert.equal(app.state().completed.includes(id), true);
  const before = JSON.stringify(app.state());
  app.click('deliver', id);
  assert.equal(JSON.stringify(app.state()), before);
  app = launch();
  assert.ok(app.page('requests').includes(request.thanks));
  assert.match(app.page('requests'), new RegExp(`data-action="deliver" data-id="${id}" disabled>達成しました</button>`));
}
assert.equal(app.state().completed.length, 9);
assert.ok(app.page('home').includes('日常のお願いが届いています'));
console.log('PASS: stage 3 unlock, branching production from gathering, all 3 manual deliveries, stock display/consumption and reload');

// 日付機能は独立した保存領域で、採集上限を迂回せず検証する。
saved.clear();
app = launch();
assert.equal(app.state().day, 1);
assert.equal(app.state().gathersLeft, 3);
assert.ok(app.page('home').includes('1日目'));
assert.ok(app.page('gather').includes('今日の採集（残り） 3 / 3'));
for (const [index, id] of ['vine', 'flower', 'branch'].entries()) {
  app.click('gather', id);
  assert.equal(app.state().gathersLeft, 2 - index);
  assert.equal(app.state().inventory[id], 2);
  app = launch();
  assert.equal(app.state().gathersLeft, 2 - index);
}
const exhausted = JSON.stringify(app.state());
app.click('gather', 'vine');
assert.equal(JSON.stringify(app.state()), exhausted);
assert.equal((app.page('gather').match(/data-action="gather" data-id="[^"]+" disabled/g) || []).length, 3);
assert.ok(app.page('gather').includes('今日はもう十分集めたようです。'));
for (const id of ['fiber', 'thread', 'cloth', 'bag']) app.click('craft-all', id);
app.click('deliver', 'naka');
assert.equal(app.state().inventory.bag, 0);
assert.ok(app.state().completed.includes('naka'));
assert.equal(app.state().gathersLeft, 0);
assert.equal(app.state().day, 1);
app.page('inventory'); app.page('requests');
app.page('home');
const beforeRest = app.state();
app.click('rest');
assert.equal(app.dialogOpen(), true);
assert.deepEqual(app.state(), beforeRest);
app.click('rest-cancel');
assert.equal(app.dialogOpen(), false);
assert.deepEqual(app.state(), beforeRest);
app.click('rest-confirm'); // 閉じた確認画面からの重複操作も無効
assert.deepEqual(app.state(), beforeRest);
app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().day, 2);
assert.equal(app.state().gathersLeft, 3);
assert.deepEqual(app.state().inventory, beforeRest.inventory);
assert.deepEqual(app.state().completed, beforeRest.completed);
app = launch();
assert.equal(app.state().day, 2);
for (let day = 3; day <= 5; day++) { app.click('rest'); app.click('rest-confirm'); }
app.click('gather', 'flower'); app.click('gather', 'branch');
app = launch();
assert.equal(app.state().day, 5);
assert.equal(app.state().gathersLeft, 1);
app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().gathersLeft, 3); // 残り1回を持ち越さない
const oldSave = { inventory: { box: 4 }, completed: G.requests.map(r => r.id), unlockedStage: 3 };
saved.set('mioverse-craft-v1', JSON.stringify(oldSave));
app = launch();
assert.equal(app.state().day, 1);
assert.equal(app.state().gathersLeft, 3);
assert.equal(app.state().inventory.box, 4);
assert.deepEqual(app.state().completed, oldSave.completed);
assert.equal(app.state().unlockedStage, 3);
console.log('PASS: daily cap, disabled UI, unlimited crafting/delivery, rest confirmation/cancel, early rest, day 5 reload and old save migration');

// 全9件の未達成依頼で作り方を確認し、対応する完成品レシピへ移動して強調できる。
for (const request of G.requests) {
  const stage = request.stage || 1;
  const progress = G.fresh();
  const recipe = G.recipes.find(r => r.id === request.item);
  progress.completed = G.requests.filter(r => (r.stage || 1) < stage).map(r => r.id);
  progress.unlockedStage = stage;
  G.ingredients(recipe).forEach((input, index) => { progress.inventory[input.id] = input.cost + index; });
  saved.set('mioverse-craft-v1', JSON.stringify(progress));
  app = launch();
  const requestsHtml = app.page('requests');
  assert.ok(requestsHtml.includes(`data-action="view-recipe" data-id="${request.id}"`), `${request.id} に作り方ボタンを表示`);
  app.click('view-recipe', request.id);
  assert.equal(app.recipeDialogOpen(), true, `${request.id} の作り方ポップアップを開く`);
  assert.equal(app.page('requests').includes(request.message), true, '依頼画面を維持');
  const dialogHtml = app.recipeDialogHtml();
  assert.ok(dialogHtml.includes(`id="recipe-dialog-title">${G.items.find(i => i.id === request.item).name}</h2>`), '完成品名を表示');
  for (const input of G.ingredients(recipe)) {
    const inputName = G.items.find(i => i.id === input.id).name;
    assert.ok(dialogHtml.includes(`<span>${inputName}</span><strong>× ${input.cost}</strong>`), `${inputName} の必要数を表示`);
    assert.ok(dialogHtml.includes(`<span>${inputName}</span><strong>${progress.inventory[input.id]} / ${input.cost}</strong>`), `${inputName} の現在庫を表示`);
  }
  app.click('recipe-close');
  assert.equal(app.recipeDialogOpen(), false, '閉じるでポップアップだけ閉じる');
  assert.ok(app.page('requests').includes(request.message), '閉じた後も依頼画面を維持');
  app.click('view-recipe', request.id);
  app.click('recipe-go-craft');
  assert.equal(app.recipeDialogOpen(), false, '加工画面へ移動する前にポップアップを閉じる');
  const craftHtml = app.page('craft');
  assert.ok(craftHtml.includes(`class="recipe recipe-highlight" data-recipe-id="${request.item}"`), `${request.id} から ${request.item} を強調`);
  assert.equal((craftHtml.match(/recipe-highlight/g) || []).length, 1, '対象レシピだけを強調');

  progress.inventory[request.item] = 1;
  progress.completed.push(request.id);
  saved.set('mioverse-craft-v1', JSON.stringify(progress));
  app = launch();
  assert.ok(!app.page('requests').includes(`data-action="view-recipe" data-id="${request.id}"`), `${request.id} 達成後は作り方ボタンを非表示`);
}
console.log('PASS: all 9 recipe dialogs, ingredient/stock display, close behavior, exact recipe highlighting, and completed-button hiding');

// 9件達成済みの旧セーブから日常依頼を初期化し、画面・モーダル・納品・翌日更新・再読込を検証。
const dailySave = G.restore({ inventory: {}, completed: G.requests.map(request => request.id), day: 12, gathersLeft: 2 }, () => 0);
const initialDaily = G.currentDailyRequests(dailySave);
for (const request of initialDaily) dailySave.inventory[request.item] = request.quantity;
saved.set('mioverse-craft-v1', JSON.stringify(dailySave));
app = launch();
let dailyHtml = app.page('requests');
assert.ok(dailyHtml.includes('日常のお願い'));
assert.ok(dailyHtml.includes('今日の依頼 3件'));
assert.equal((dailyHtml.match(/class="request-card daily-request/g) || []).length, 3);
assert.ok(dailyHtml.includes('<details class="fixed-history"><summary><span>固定依頼のお礼</span><small>9件</small></summary>'), '固定依頼履歴を初期状態が閉じた details で表示');
assert.ok(!dailyHtml.includes('<details class="fixed-history" open>'), '固定依頼履歴は初期状態で展開しない');
assert.equal((dailyHtml.match(/data-action="deliver" data-id=/g) || []).length, 9, '折りたたみ内に固定依頼9件を維持');
const dailyTarget = G.currentDailyRequests(app.state())[0];
assert.ok(dailyHtml.includes(`data-action="view-recipe" data-id="${dailyTarget.id}"`));
app.click('view-recipe', dailyTarget.id);
assert.equal(app.recipeDialogOpen(), true);
assert.ok(app.recipeDialogHtml().includes(`id="recipe-dialog-title">${G.items.find(item => item.id === dailyTarget.item).name}</h2>`));
for (const input of G.ingredients(G.recipes.find(recipe => recipe.id === dailyTarget.item))) {
  assert.ok(app.recipeDialogHtml().includes(`<strong>× ${input.cost * dailyTarget.quantity}</strong>`), '依頼数を掛けた必要素材を表示');
}
app.click('recipe-go-craft');
assert.ok(app.page('craft').includes(`class="recipe recipe-highlight" data-recipe-id="${dailyTarget.item}"`));
app.page('requests');
const inventoryBeforeDailyDelivery = app.state().inventory[dailyTarget.item];
app.click('deliver-daily', dailyTarget.id);
assert.equal(app.state().inventory[dailyTarget.item], inventoryBeforeDailyDelivery - dailyTarget.quantity);
assert.equal(G.currentDailyRequests(app.state()).find(request => request.id === dailyTarget.id).completed, true);
assert.ok(app.page('requests').includes('本日は納品済み'));
assert.ok(!app.page('requests').includes(`data-action="view-recipe" data-id="${dailyTarget.id}"`));
const carriedDaily = G.currentDailyRequests(app.state()).filter(request => !request.completed).map(request => request.id);
app = launch();
assert.equal(G.currentDailyRequests(app.state()).find(request => request.id === dailyTarget.id).completed, true, '再読み込み後も納品状態を復元');
app.page('home'); app.click('rest'); app.click('rest-confirm');
const nextDaily = G.currentDailyRequests(app.state());
assert.equal(app.state().day, 13);
assert.ok(carriedDaily.every(id => nextDaily.some(request => request.id === id)), '未達成依頼を画面操作でも持ち越す');
assert.ok(!nextDaily.some(request => request.id === dailyTarget.id), '納品済み枠だけ翌日に交換');
app = launch();
assert.deepEqual(G.currentDailyRequests(app.state()).map(request => request.id), nextDaily.map(request => request.id), '更新後の3件をlocalStorageから復元');
console.log('PASS: daily request UI, recipe dialog, craft highlight, manual delivery, carryover, next-day replacement and localStorage reload');

// 軽快トワ5件も既存の日常依頼UI・作り方モーダル・レシピ移動を共用する。
const keikaiRequests = G.dailyRequestPool.filter(request => request.resident === 'keikaiTowa');
assert.equal(keikaiRequests.length, 5);
for (const request of keikaiRequests) {
  const keikaiState = G.restore({ inventory: { [request.item]: request.quantity }, completed: G.requests.map(fixed => fixed.id), day: 20, gathersLeft: 3, dailyRequests: [
    { templateId: request.id, completed: false },
    { templateId: 'daily-naka-dry-flower', completed: false },
    { templateId: 'daily-ritsu-cloth', completed: false }
  ], dailyHistory: [request.id] });
  saved.set('mioverse-craft-v1', JSON.stringify(keikaiState));
  app = launch();
  const html = app.page('requests');
  assert.ok(html.includes('<h2>軽快トワ</h2>'), `${request.id}: 軽快トワ名を表示`);
  assert.ok(html.includes(request.title));
  assert.ok(html.includes(request.message));
  assert.ok(html.includes(`${G.items.find(item => item.id === request.item).name} × ${request.quantity}`));
  assert.ok(html.includes('<details class="fixed-history">'), '固定依頼のお礼の折りたたみを維持');
  app.click('view-recipe', request.id);
  assert.equal(app.recipeDialogOpen(), true);
  assert.ok(app.recipeDialogHtml().includes(`id="recipe-dialog-title">${G.items.find(item => item.id === request.item).name}</h2>`));
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`class="recipe recipe-highlight" data-recipe-id="${request.item}"`));
}

const deliveryRequest = keikaiRequests[0];
const deliveryState = G.restore({ inventory: { bag: 1 }, completed: G.requests.map(request => request.id), day: 21, gathersLeft: 3, dailyRequests: [
  { templateId: deliveryRequest.id, completed: false },
  { templateId: 'daily-naka-dry-flower', completed: false },
  { templateId: 'daily-ritsu-cloth', completed: false }
] });
saved.set('mioverse-craft-v1', JSON.stringify(deliveryState));
app = launch(); app.page('requests'); app.click('deliver-daily', deliveryRequest.id);
assert.equal(app.state().inventory.bag, 0);
assert.equal(G.currentDailyRequests(app.state()).find(request => request.id === deliveryRequest.id).completed, true);
assert.ok(app.page('requests').includes(deliveryRequest.thanks));
app = launch();
assert.ok(app.page('requests').includes(deliveryRequest.thanks), '軽快トワの納品状態をlocalStorageから復元');
const unchangedKeikaiIds = G.currentDailyRequests(app.state()).filter(request => !request.completed).map(request => request.id);
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.ok(!G.currentDailyRequests(app.state()).some(request => request.id === deliveryRequest.id));
assert.ok(unchangedKeikaiIds.every(id => G.currentDailyRequests(app.state()).some(request => request.id === id)));
console.log('PASS: all 5 Light Towa cards, recipe dialogs/highlights, manual delivery, dialogue, next-day replacement and localStorage reload');

const shiruRequests = G.dailyRequestPool.filter(request => request.resident === 'shiru');
assert.equal(shiruRequests.length, 5);
for (const request of shiruRequests) {
  const shiruState = G.restore({ inventory: { [request.item]: 1 }, completed: G.requests.map(fixed => fixed.id), day: 24, dailyRequests: [
    { templateId: request.id, completed: false },
    { templateId: 'daily-keikai-towa-bag', completed: false },
    { templateId: 'daily-ritsu-cloth', completed: false }
  ] });
  saved.set('mioverse-craft-v1', JSON.stringify(shiruState));
  app = launch();
  const html = app.page('requests');
  assert.ok(html.includes('<h2>シル</h2>'), `${request.id}: シル名を表示`);
  assert.ok(html.includes(request.title) && html.includes(request.message));
  assert.ok(html.includes(`${G.items.find(item => item.id === request.item).name} × 1`));
  assert.ok(html.includes('<details class="fixed-history">'));
  app.click('view-recipe', request.id);
  assert.equal(app.recipeDialogOpen(), true);
  assert.ok(app.recipeDialogHtml().includes(`id="recipe-dialog-title">${G.items.find(item => item.id === request.item).name}</h2>`));
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`class="recipe recipe-highlight" data-recipe-id="${request.item}"`));
  app.page('requests');
  app.click('deliver-daily', request.id);
  assert.equal(app.state().inventory[request.item], 0);
  assert.equal(G.currentDailyRequests(app.state()).find(entry => entry.id === request.id).completed, true);
  assert.ok(app.page('requests').includes(request.thanks));
  assert.ok(app.page('requests').includes('本日は納品済み'));
}
app = launch();
const lastShiru = shiruRequests.at(-1);
assert.ok(app.page('requests').includes(lastShiru.thanks), 'シルの納品状態をlocalStorageから復元');
const shiruUnfinished = G.currentDailyRequests(app.state()).filter(request => !request.completed).map(request => request.id);
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.ok(!G.currentDailyRequests(app.state()).some(request => request.id === lastShiru.id));
assert.ok(shiruUnfinished.every(id => G.currentDailyRequests(app.state()).some(request => request.id === id)));
console.log('PASS: all 5 Sil cards, recipe dialogs/highlights, manual delivery, dialogue, localStorage reload and next-day replacement');

