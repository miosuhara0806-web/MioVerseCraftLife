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
    navigation() { return node('navigation').innerHTML; },
    gatherLimitNote() { return node('gather-limit-note').textContent; },
    restDescription() { return node('rest-description').textContent; },
    state() { return saved.has('mioverse-craft-v1') ? JSON.parse(saved.get('mioverse-craft-v1')) : G.fresh(); },
    dialogOpen() { return node('rest-dialog').open; },
    recipeDialogOpen() { return node('recipe-dialog').open; },
    recipeDialogHtml() { return node('recipe-dialog-content').innerHTML; },
    thankYouDialogOpen() { return node('thank-you-dialog').open; },
    thankYouDialogHtml() { return node('thank-you-dialog-content').innerHTML; },
    storyDialogOpen() { return node('story-dialog').open; },
    storyDialogHtml() { return node('story-dialog-content').innerHTML; },
    storyCloseHidden() { return node('story-close-button').hidden; },
    storyCompleteLabel() { return node('story-complete-button').textContent; }
  };
}
let app = launch();
assert.equal(app.storyDialogOpen(), true, '完全新規ではイントロを開く');
assert.ok(app.storyDialogHtml().includes('小径の工房'));
assert.ok(app.storyDialogHtml().includes('この場所で過ごす時間が始まる。'));
assert.equal(app.storyCompleteLabel(), '工房へ入る');
assert.equal(app.storyCloseHidden(), true, 'イントロは開始ボタンから進む');
assert.equal(app.state().introViewed, false, '開いただけでは未閲覧');
app.click('story-complete');
assert.equal(app.storyDialogOpen(), false);
assert.equal(app.state().introViewed, true);
assert.equal(app.state().day, 1);
app = launch();
assert.equal(app.storyDialogOpen(), false, '再読み込みでイントロを再表示しない');
const legacyBeforeIntro = { ...G.fresh(), day: 23, introViewed: undefined };
legacyBeforeIntro.inventory.branch = 7;
saved.set('mioverse-craft-v1', JSON.stringify(legacyBeforeIntro));
app = launch();
assert.equal(app.storyDialogOpen(), false, '旧セーブはイントロなしで再開');
assert.equal(app.state().introViewed, true);
assert.equal(app.state().day, 23);
assert.equal(app.state().inventory.branch, 7);
saved.clear();
app = launch();
app.click('story-complete');
assert.ok(!app.navigation().includes('裏庭'), '未クリアでは裏庭ナビを表示しない');
assert.ok(!app.page('backyard').includes('工房の裏庭'), 'URLからの未クリア直接表示も防ぐ');
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
assert.equal(app.state().inventory.box, 0);
assert.deepEqual(app.state().completed, []);
assert.equal(app.state().unlockedStage, 1);
assert.equal(app.state().saveVersion, G.SAVE_VERSION);
assert.ok(!app.page('requests').includes('みんなとの記録'));
app.click('gather', 'branch');
app = launch();
assert.equal(app.state().inventory.branch, 2, '新形式のセーブは再読み込みで維持');
assert.equal(app.state().gathersLeft, 2, '旧セーブの初期化は一度のみ');
console.log('PASS: daily cap, disabled UI, rest, and one-time old-save reset');

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

const shiruRequests = G.dailyRequestPool.slice(0, 40).filter(request => request.resident === 'shiru');
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

const kurokoRequests = G.dailyRequestPool.slice(0, 40).filter(request => request.resident === 'kuroko');
assert.equal(kurokoRequests.length, 5);
for (const request of kurokoRequests) {
  const kurokoState = G.restore({ inventory: { [request.item]: 1 }, completed: G.requests.map(fixed => fixed.id), day: 29, dailyRequests: [
    { templateId: request.id, completed: false },
    { templateId: 'daily-shiru-bag', completed: false },
    { templateId: 'daily-ritsu-cloth', completed: false }
  ] });
  saved.set('mioverse-craft-v1', JSON.stringify(kurokoState));
  app = launch();
  const html = app.page('requests');
  assert.ok(html.includes('<h2>黒子</h2>'), `${request.id}: 黒子名を表示`);
  assert.ok(html.includes(request.title) && html.includes(request.message));
  assert.ok(html.includes(`${G.items.find(item => item.id === request.item).name} × 1`));
  assert.ok(html.includes('<details class="fixed-history">'));
  app.click('view-recipe', request.id);
  assert.equal(app.recipeDialogOpen(), true);
  assert.ok(app.recipeDialogHtml().includes(`id="recipe-dialog-title">${G.items.find(item => item.id === request.item).name}</h2>`));
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`class="recipe recipe-highlight" data-recipe-id="${request.item}"`));
  app.page('requests');
  assert.equal(G.currentDailyRequests(app.state()).find(entry => entry.id === request.id).completed, false, '加工前後も自動達成しない');
  app.click('deliver-daily', request.id);
  assert.equal(app.state().inventory[request.item], 0);
  assert.equal(G.currentDailyRequests(app.state()).find(entry => entry.id === request.id).completed, true);
  assert.ok(app.page('requests').includes(request.thanks));
  assert.ok(app.page('requests').includes('本日は納品済み'));
}
app = launch();
const lastKuroko = kurokoRequests.at(-1);
assert.ok(app.page('requests').includes(lastKuroko.thanks), '黒子の納品状態をlocalStorageから復元');
const kurokoUnfinished = G.currentDailyRequests(app.state()).filter(request => !request.completed).map(request => request.id);
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.ok(!G.currentDailyRequests(app.state()).some(request => request.id === lastKuroko.id));
assert.ok(kurokoUnfinished.every(id => G.currentDailyRequests(app.state()).some(request => request.id === id)));
console.log('PASS: all 5 Kuroko cards, recipe dialogs/highlights, manual delivery, dialogue, localStorage reload and next-day replacement');

const altoRequests = G.dailyRequestPool.slice(0, 40).filter(request => request.resident === 'alto');
assert.equal(altoRequests.length, 5);
for (const request of altoRequests) {
  const altoState = G.restore({ inventory: { [request.item]: request.quantity }, completed: G.requests.map(fixed => fixed.id), day: 35, dailyRequests: [
    { templateId: request.id, completed: false },
    { templateId: 'daily-kuroko-cushion', completed: false },
    { templateId: 'daily-shiru-bag', completed: false }
  ] });
  saved.set('mioverse-craft-v1', JSON.stringify(altoState));
  app = launch();
  const html = app.page('requests');
  assert.ok(html.includes('<h2>アルト</h2>'), `${request.id}: アルト名を表示`);
  assert.ok(html.includes(request.title) && html.includes(request.message));
  assert.ok(html.includes(`${G.items.find(item => item.id === request.item).name} × ${request.quantity}`));
  assert.ok(html.includes('<details class="fixed-history">'));
  app.click('view-recipe', request.id);
  assert.equal(app.recipeDialogOpen(), true);
  assert.ok(app.recipeDialogHtml().includes(`id="recipe-dialog-title">${G.items.find(item => item.id === request.item).name}</h2>`));
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`class="recipe recipe-highlight" data-recipe-id="${request.item}"`));
  app.page('requests');
  assert.equal(G.currentDailyRequests(app.state()).find(entry => entry.id === request.id).completed, false, '加工前後も自動達成しない');
  app.click('deliver-daily', request.id);
  assert.equal(app.state().inventory[request.item], 0);
  assert.equal(G.currentDailyRequests(app.state()).find(entry => entry.id === request.id).completed, true);
  assert.ok(app.page('requests').includes(request.thanks));
  assert.ok(app.page('requests').includes('本日は納品済み'));
}
app = launch();
const lastAlto = altoRequests.at(-1);
assert.ok(app.page('requests').includes(lastAlto.thanks), 'アルトの納品状態をlocalStorageから復元');
const altoUnfinished = G.currentDailyRequests(app.state()).filter(request => !request.completed).map(request => request.id);
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.ok(!G.currentDailyRequests(app.state()).some(request => request.id === lastAlto.id));
assert.ok(altoUnfinished.every(id => G.currentDailyRequests(app.state()).some(request => request.id === id)));
console.log('PASS: all 5 Alto cards, recipe dialogs/highlights, manual delivery, dialogue, localStorage reload and next-day replacement');

const aoiDoctorRequests = G.dailyRequestPool.filter(request => request.resident === 'aoiDoctor');
assert.equal(aoiDoctorRequests.length, 5);
for (const request of aoiDoctorRequests) {
  const aoiDoctorState = G.restore({ inventory: { [request.item]: request.quantity }, completed: G.requests.map(fixed => fixed.id), day: 40, dailyRequests: [
    { templateId: request.id, completed: false },
    { templateId: 'daily-alto-wreath', completed: false },
    { templateId: 'daily-kuroko-wall', completed: false }
  ] });
  saved.set('mioverse-craft-v1', JSON.stringify(aoiDoctorState));
  app = launch();
  const html = app.page('requests');
  assert.ok(html.includes('<h2>碧博士</h2>'), `${request.id}: 碧博士名を表示`);
  assert.ok(html.includes(request.title) && html.includes(request.message));
  assert.ok(html.includes(`${G.items.find(item => item.id === request.item).name} × ${request.quantity}`));
  assert.ok(html.includes('<details class="fixed-history">'));
  app.click('view-recipe', request.id);
  assert.equal(app.recipeDialogOpen(), true);
  assert.ok(app.recipeDialogHtml().includes(`id="recipe-dialog-title">${G.items.find(item => item.id === request.item).name}</h2>`));
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`class="recipe recipe-highlight" data-recipe-id="${request.item}"`));
  app.page('requests');
  assert.equal(G.currentDailyRequests(app.state()).find(entry => entry.id === request.id).completed, false, '加工前後も自動達成しない');
  app.click('deliver-daily', request.id);
  assert.equal(app.state().inventory[request.item], 0);
  assert.equal(G.currentDailyRequests(app.state()).find(entry => entry.id === request.id).completed, true);
  assert.ok(app.page('requests').includes(request.thanks));
  assert.ok(app.page('requests').includes('本日は納品済み'));
}
app = launch();
const lastAoiDoctor = aoiDoctorRequests.at(-1);
assert.ok(app.page('requests').includes(lastAoiDoctor.thanks), '碧博士の納品状態をlocalStorageから復元');
const aoiDoctorUnfinished = G.currentDailyRequests(app.state()).filter(request => !request.completed).map(request => request.id);
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.ok(!G.currentDailyRequests(app.state()).some(request => request.id === lastAoiDoctor.id));
assert.ok(aoiDoctorUnfinished.every(id => G.currentDailyRequests(app.state()).some(request => request.id === id)));
console.log('PASS: all 5 Aoi Doctor cards, recipe dialogs/highlights, manual delivery, dialogue, localStorage reload and next-day replacement');

saved.set('mioverse-craft-v1', JSON.stringify(G.fresh()));
app = launch();
assert.ok(app.navigation().includes('href="#encyclopedia"'));
let encyclopedia = app.page('encyclopedia');
assert.ok(encyclopedia.includes('0 / 21'));
assert.equal((encyclopedia.match(/class="encyclopedia-card undiscovered"/g) || []).length, 21);
assert.ok(['採集素材', '加工素材', '完成品'].every(category => encyclopedia.includes(`<h2>${category}</h2>`)));
assert.ok(!encyclopedia.includes('<h3>枝</h3>') && !encyclopedia.includes('森の小径で採集'), '未発見の名前と詳細は表示しない');
app.click('gather', 'branch');
encyclopedia = app.page('encyclopedia');
assert.ok(encyclopedia.includes('1 / 21') && encyclopedia.includes('<h3>枝</h3>'));
assert.ok(encyclopedia.includes('森の小径で採集'));
assert.ok(encyclopedia.includes('現在の在庫：<strong>2 個</strong>'));
app.click('craft', 'wood');
encyclopedia = app.page('encyclopedia');
assert.ok(encyclopedia.includes('2 / 21') && encyclopedia.includes('<h3>木材</h3>'));
assert.ok(encyclopedia.includes('<li>枝 × 2</li>'));
assert.ok(encyclopedia.includes('現在の在庫：<strong>0 個</strong>'), '在庫0でも枝を表示');
app = launch();
assert.ok(app.page('encyclopedia').includes('2 / 21'), '図鑑の発見状態を再読み込み後も維持');
const migratedEncyclopedia = G.restore({ completed: G.requests.map(request => request.id), day: 27, inventory: { dye: 1 } }, () => 0);
saved.set('mioverse-craft-v1', JSON.stringify(migratedEncyclopedia));
app = launch();
encyclopedia = app.page('encyclopedia');
assert.ok(encyclopedia.includes('18 / 21'));
assert.equal((encyclopedia.match(/class="encyclopedia-card undiscovered"/g) || []).length, 3);
assert.ok(encyclopedia.split('<h2>加工素材</h2>')[1].split('<h2>完成品</h2>')[0].includes('<h3>染料</h3>'), '染料を図鑑では加工素材に分類');
assert.ok(encyclopedia.includes('<li>布 × 1</li>') && encyclopedia.includes('<li>染料 × 1</li>'), '複数素材レシピを表示');
assert.ok(app.page('requests').includes('<details class="fixed-history">'), '固定依頼の折りたたみを維持');
console.log('PASS: encyclopedia navigation, hidden entries, categories, stock and recipe display, reload, full legacy migration');

assert.ok(app.page('craft').includes('<h2>家具のしごと</h2>'));
assert.ok(app.page('craft').includes('板材 2個 <span class="arrow">→</span> 木枠 1個'));
assert.ok(app.page('inventory').includes('<span>小さな棚</span>'));
assert.ok(app.page('inventory').includes('<span>布張りスツール</span>'));
const oldFurnitureSave = G.restore({ inventory: { plank: 8, dyedCloth: 1, fiber: 1 }, completed: G.requests.map(request => request.id), day: 29, gathersLeft: 1,
  dailyRequests: [{ templateId: 'daily-ritsu-curtain', completed: true }, { templateId: 'daily-towa-box', completed: false }, { templateId: 'daily-shiru-curtain', completed: false }],
  dailyHistory: ['daily-ritsu-curtain', 'daily-towa-box', 'daily-shiru-curtain'], discovered: G.items.slice(0, 18).map(item => item.id) });
saved.set('mioverse-craft-v1', JSON.stringify(oldFurnitureSave));
app = launch();
assert.equal(app.state().day, 29);
assert.equal(app.state().gathersLeft, 3);
assert.equal(app.state().inventory.plank, 8);
assert.deepEqual(app.state().dailyRequests.map(slot => slot.templateId), oldFurnitureSave.dailyRequests.map(slot => slot.templateId));
assert.deepEqual(app.state().dailyHistory, oldFurnitureSave.dailyHistory);
assert.ok(app.page('encyclopedia').includes('18 / 21'));
assert.equal((app.page('encyclopedia').match(/class="encyclopedia-card undiscovered"/g) || []).length, 3);
app.click('craft', 'woodFrame');
assert.ok(app.page('encyclopedia').includes('19 / 21'));
assert.ok(app.page('encyclopedia').includes('<h3>木枠</h3>'));
app.click('craft', 'smallShelf');
assert.ok(app.page('encyclopedia').includes('20 / 21'));
app.click('craft', 'woodFrame');
app.click('craft', 'upholsteredStool');
assert.ok(app.page('encyclopedia').includes('21 / 21'));
assert.ok(app.page('encyclopedia').includes('<h3>布張りスツール</h3>'));
assert.ok(app.page('encyclopedia').includes('<li>植物繊維 × 1</li>'));
assert.equal(app.state().inventory.woodFrame, 0);
app = launch();
assert.ok(app.page('encyclopedia').includes('21 / 21'));
console.log('PASS: furniture section, inventory, 18-to-21 discovery progression and reload');

for (const request of G.dailyRequestPool.slice(-5)) {
  const furnitureState = G.restore({ inventory: { [request.item]: 1 }, completed: G.requests.map(fixed => fixed.id), day: 30,
    dailyRequests: [{ templateId: request.id, completed: false }, { templateId: 'daily-towa-box', completed: false }, { templateId: 'daily-shiru-curtain', completed: false }],
    discovered: G.items.slice(0, 18).map(item => item.id) });
  saved.set('mioverse-craft-v1', JSON.stringify(furnitureState));
  app = launch();
  assert.ok(app.page('requests').includes(request.title));
  assert.ok(app.page('requests').includes(request.message));
  app.click('view-recipe', request.id);
  assert.equal(app.recipeDialogOpen(), true);
  const recipe = G.recipes.find(entry => entry.id === request.item);
  assert.ok(app.recipeDialogHtml().includes(`id="recipe-dialog-title">${G.items.find(item => item.id === request.item).name}</h2>`));
  for (const input of G.ingredients(recipe)) {
    assert.ok(app.recipeDialogHtml().includes(`<span>${G.items.find(item => item.id === input.id).name}</span><strong>× ${input.cost}</strong>`));
    assert.ok(app.recipeDialogHtml().includes(`<span>${G.items.find(item => item.id === input.id).name}</span><strong>0 / ${input.cost}</strong>`));
  }
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`class="recipe recipe-highlight" data-recipe-id="${request.item}"`));
  app.page('requests');
  app.click('deliver-daily', request.id);
  assert.equal(app.state().inventory[request.item], 0);
  assert.ok(app.page('requests').includes(request.thanks));
  assert.ok(app.page('requests').includes('本日は納品済み'));
}
console.log('PASS: five furniture requests, shared recipe dialog/highlight and manual delivery');

const gatherMigrationSave = { saveVersion: G.SAVE_VERSION, completed: G.requests.map(request => request.id), inventory: { plank: 2 }, day: 31, gathersLeft: 1,
  dailyRequests: [{ templateId: 'daily-ritsu-curtain', completed: false }, { templateId: 'daily-towa-box', completed: true }, { templateId: 'daily-shiru-curtain', completed: false }],
  dailyHistory: ['daily-towa-box'], discovered: G.items.slice(0, 18).map(item => item.id) };
saved.set('mioverse-craft-v1', JSON.stringify(gatherMigrationSave));
app = launch();
assert.ok(app.page('home').includes('今日の採集（残り） 3 / 5'));
assert.ok(app.page('gather').includes('今日の採集（残り） 3 / 5'));
assert.equal(Number(app.gatherLimitNote()), 5);
assert.ok(app.restDescription().includes('採集回数が5回に戻ります'));
assert.deepEqual(app.state().dailyRequests.map(slot => slot.templateId), gatherMigrationSave.dailyRequests.map(slot => slot.templateId));
assert.equal(app.state().day, 31);
assert.equal(app.state().inventory.plank, 2);
assert.deepEqual(app.state().discovered, gatherMigrationSave.discovered);
app = launch();
assert.equal(app.state().gathersLeft, 3, '旧セーブ移行は初回だけ');
assert.ok(app.page('home').includes('今日の採集（残り） 3 / 5'));

const beforeFinalDelivery = G.restore({ completed: G.requests.slice(0, -1).map(request => request.id), inventory: { linedBox: 1 }, gathersLeft: 0, day: 6 });
saved.set('mioverse-craft-v1', JSON.stringify(beforeFinalDelivery));
app = launch();
assert.ok(app.page('home').includes('今日の採集（残り） 0 / 3'));
app.page('requests'); app.click('deliver', G.requests.at(-1).id);
assert.ok(app.page('home').includes('今日の採集（残り） 2 / 5'));
assert.ok(app.page('gather').includes('今日の採集（残り） 2 / 5'));
assert.equal(app.state().inventory.linedBox, 0);

const fullGatherDay = G.restore({ completed: G.requests.map(request => request.id), gatherLimit: 5, gathersLeft: 5, day: 10 });
saved.set('mioverse-craft-v1', JSON.stringify(fullGatherDay));
app = launch();
assert.ok(app.page('gather').includes('今日の採集（残り） 5 / 5'));
for (let remaining = 4; remaining >= 0; remaining--) {
  app.click('gather', 'branch');
  assert.ok(app.page('gather').includes(`今日の採集（残り） ${remaining} / 5`));
}
const exhaustedFive = JSON.stringify(app.state());
app.click('gather', 'branch');
assert.equal(JSON.stringify(app.state()), exhaustedFive);
assert.equal((app.page('gather').match(/data-action="gather" data-id="[^"]+" disabled/g) || []).length, 3);
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.ok(app.page('home').includes('今日の採集（残り） 5 / 5'));
assert.equal(app.state().day, 11);
app = launch();
assert.equal(app.state().gathersLeft, 5);
console.log('PASS: live UI 3-to-5 gather cap, legacy save migration once, final delivery, exhaustion and next-day reset');

const recordState = G.restore({ completed: G.requests.map(request => request.id), dailyRequests: [
  { templateId: 'daily-naka-bag', completed: false },
  { templateId: 'daily-ritsu-thread', completed: false },
  { templateId: 'daily-towa-box', completed: false }
] });
saved.set('mioverse-craft-v1', JSON.stringify(recordState));
app = launch();
let recordHtml = app.page('requests');
assert.ok(recordHtml.includes('みんなとの記録'));
for (const resident of Object.values(G.dailyResidents)) {
  assert.ok(recordHtml.includes(`<span>${resident.name}</span><strong>0 / 5</strong>`), `${resident.name} の初期表示`);
}
const beforeFailedDaily = JSON.stringify(app.state());
app.click('deliver-daily', 'daily-naka-bag');
assert.equal(JSON.stringify(app.state()), beforeFailedDaily, '素材不足は保存状態を変えない');
recordState.inventory.bag = 1;
saved.set('mioverse-craft-v1', JSON.stringify(recordState));
app = launch();
app.page('requests');
app.click('deliver-daily', 'daily-naka-bag');
assert.equal(app.state().dailyRequestCounts.naka, 1);
assert.equal(app.state().inventory.bag, 0);
assert.equal(app.state().dailyRequests[0].completed, true);
recordHtml = app.page('requests');
assert.ok(recordHtml.includes('<span>ナカちゃん</span><strong>1 / 5</strong>'));
assert.ok(recordHtml.includes('<span>律さん</span><strong>0 / 5</strong>'));
const afterDelivery = JSON.stringify(app.state());
app.click('deliver-daily', 'daily-naka-bag');
assert.equal(JSON.stringify(app.state()), afterDelivery, 'ボタン連打で再加算しない');
app = launch();
assert.equal(app.state().dailyRequestCounts.naka, 1, '再読み込み後もカウントを復元');
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().dailyRequestCounts.naka, 1, '翌日の依頼更新後もカウントを維持');
const overFive = G.restore({ completed: G.requests.map(request => request.id), dailyRequestCounts: { naka: 7 } });
saved.set('mioverse-craft-v1', JSON.stringify(overFive));
app = launch();
assert.equal(app.state().dailyRequestCounts.naka, 7);
assert.ok(app.page('requests').includes('<span>ナカちゃん</span><strong>5 / 5</strong>'));
console.log('PASS: eight-person record UI, failed and duplicate click guards, daily success, reload/rest persistence, display cap at five');

const thankYouLegacy = G.restore({ saveVersion: G.SAVE_VERSION, completed: G.requests.map(request => request.id), day: 28, gatherLimit: 5, gathersLeft: 2,
  inventory: { bag: 3 }, discovered: ['bag'], dailyHistory: ['daily-naka-bag'],
  dailyRequests: [{ templateId: 'daily-naka-bag', completed: false }, { templateId: 'daily-ritsu-thread', completed: false }, { templateId: 'daily-towa-box', completed: false }],
  dailyRequestCounts: { towa: 5, shiru: 6, naka: 4 } });
const unchangedProgress = { day: thankYouLegacy.day, inventory: { ...thankYouLegacy.inventory }, completed: [...thankYouLegacy.completed], dailyRequests: thankYouLegacy.dailyRequests.map(slot => ({ ...slot })), dailyRequestCounts: { ...thankYouLegacy.dailyRequestCounts }, discovered: [...thankYouLegacy.discovered] };
saved.set('mioverse-craft-v1', JSON.stringify(thankYouLegacy));
app = launch();
recordHtml = app.page('requests');
assert.ok(!recordHtml.includes('data-action="thank-you-open" data-id="naka"'), '5回未満は非表示');
for (const id of ['towa', 'shiru']) assert.ok(recordHtml.includes(`data-action="thank-you-open" data-id="${id}"`), `${id} は旧セーブから解放`);
app.click('thank-you-open', 'shiru');
assert.equal(app.thankYouDialogOpen(), true);
assert.ok(app.thankYouDialogHtml().includes('静かな午後に'));
assert.equal(app.state().thankYouEventViewed.shiru, false, '開いただけでは未閲覧');
app.click('thank-you-close');
assert.equal(app.thankYouDialogOpen(), false);
assert.equal(app.state().thankYouEventViewed.shiru, false, '途中で閉じても未閲覧');
app.click('thank-you-open', 'shiru');
app.click('thank-you-complete');
assert.equal(app.state().thankYouEventViewed.shiru, true);
assert.equal(app.state().thankYouEventViewed.towa, false, '閲覧状態はキャラごとに独立');
assert.ok(!app.page('requests').includes('工房に残るもの'), 'お礼済み1人では全体イベントを表示しない');
assert.ok(app.page('requests').includes('✓ お礼済み'));
assert.ok(!app.page('requests').includes('data-action="thank-you-open" data-id="shiru"'));
assert.ok(app.page('requests').includes('data-action="thank-you-open" data-id="towa"'));
assert.equal(app.state().day, unchangedProgress.day);
assert.deepEqual(app.state().inventory, unchangedProgress.inventory);
assert.deepEqual(app.state().completed, unchangedProgress.completed);
assert.deepEqual(app.state().dailyRequests, unchangedProgress.dailyRequests);
assert.deepEqual(app.state().dailyRequestCounts, unchangedProgress.dailyRequestCounts);
assert.deepEqual(app.state().discovered, unchangedProgress.discovered);
app = launch();
assert.equal(app.state().thankYouEventViewed.shiru, true, '再読み込み後も保持');
app.page('home'); app.page('requests');
assert.ok(app.page('requests').includes('✓ お礼済み'), 'ホームから戻っても保持');
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().thankYouEventViewed.shiru, true, '翌日も保持');
assert.equal(app.state().dailyRequestCounts.shiru, 6, '累計は6を維持');
console.log('PASS: thank-you modal, close without completion, independent flags, legacy progress, reload/home/rest persistence');

const storyLegacy = G.restore({ saveVersion: G.SAVE_VERSION, completed: G.requests.map(request => request.id), day: 34, gatherLimit: 5, gathersLeft: 2,
  inventory: { bag: 3, box: 1 }, discovered: ['bag', 'box'], dailyHistory: ['daily-naka-bag'],
  dailyRequests: [{ templateId: 'daily-naka-bag', completed: false }, { templateId: 'daily-ritsu-thread', completed: false }, { templateId: 'daily-towa-box', completed: false }],
  dailyRequestCounts: { towa: 5, shiru: 6 }, thankYouEventViewed: { towa: true, shiru: true } });
const storyOriginal = { day: storyLegacy.day, inventory: { ...storyLegacy.inventory }, completed: [...storyLegacy.completed], dailyRequests: storyLegacy.dailyRequests.map(slot => ({ ...slot })), dailyRequestCounts: { ...storyLegacy.dailyRequestCounts }, thankYouEventViewed: { ...storyLegacy.thankYouEventViewed }, discovered: [...storyLegacy.discovered] };
saved.set('mioverse-craft-v1', JSON.stringify(storyLegacy));
app = launch();
recordHtml = app.page('requests');
assert.ok(recordHtml.includes('工房に残るもの'));
assert.ok(recordHtml.includes('data-action="story-open" data-id="milestone2"'), '既存のお礼済み2人で即解放');
assert.equal(app.state().storyProgress.milestone2Viewed, false);
app.click('story-open', 'milestone2');
assert.equal(app.storyDialogOpen(), true);
assert.ok(app.storyDialogHtml().includes('工房に残るもの'));
assert.ok(app.storyDialogHtml().includes('工房の作業台には'));
assert.ok(app.storyDialogHtml().includes('それだけではない気がしていた。'));
assert.equal(app.state().storyProgress.milestone2Viewed, false, '開くだけでは未閲覧');
app.click('story-close');
assert.equal(app.storyDialogOpen(), false);
assert.equal(app.state().storyProgress.milestone2Viewed, false, '途中で閉じても未閲覧');
app.click('story-complete');
assert.equal(app.state().storyProgress.milestone2Viewed, false, '閉じた後の完了操作は無効');
app.click('story-open', 'milestone2');
app.page('home');
assert.equal(app.storyDialogOpen(), false, '画面を離れるとモーダルを閉じる');
assert.equal(app.state().storyProgress.milestone2Viewed, false, '画面移動では読了しない');
app.page('requests');
app.click('story-open', 'milestone2');
app.click('story-complete');
assert.equal(app.storyDialogOpen(), false);
assert.equal(app.state().storyProgress.milestone2Viewed, true);
assert.deepEqual(app.state().inventory, storyOriginal.inventory);
assert.deepEqual(app.state().completed, storyOriginal.completed);
assert.deepEqual(app.state().dailyRequests, storyOriginal.dailyRequests);
assert.deepEqual(app.state().dailyRequestCounts, storyOriginal.dailyRequestCounts);
assert.deepEqual(app.state().thankYouEventViewed, storyOriginal.thankYouEventViewed);
assert.deepEqual(app.state().discovered, storyOriginal.discovered);
assert.equal(app.state().day, storyOriginal.day);
assert.ok(app.page('requests').includes('✓ 読了済み'));
assert.ok(!app.page('requests').includes('data-action="story-open"'));
app = launch();
assert.equal(app.state().storyProgress.milestone2Viewed, true, '再読み込み後も読了を復元');
app.page('home'); app.page('requests');
assert.ok(app.page('requests').includes('✓ 読了済み'), '工房から戻っても読了を表示');
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().storyProgress.milestone2Viewed, true, '翌日も読了を維持');
console.log('PASS: two-thank-you story UI, voluntary read, close guard, legacy data preservation, reload/rest persistence');

const fourViewedIds = ['naka', 'ritsu', 'towa', 'shiru'];
const fourSave = { ...G.restore({ completed: G.requests.map(request => request.id), day: 52, gatherLimit: 5, gathersLeft: 3,
  inventory: { smallShelf: 1, upholsteredStool: 1, cushion: 1, bag: 4 }, discovered: ['smallShelf', 'upholsteredStool', 'cushion'],
  dailyRequestCounts: Object.fromEntries(fourViewedIds.map(id => [id, 5])), thankYouEventViewed: Object.fromEntries(fourViewedIds.map(id => [id, true])) }),
  storyProgress: { milestone2Viewed: false } };
const originalFour = { day: fourSave.day, inventory: { ...fourSave.inventory }, completed: [...fourSave.completed], dailyRequests: fourSave.dailyRequests.map(slot => ({ ...slot })), dailyRequestCounts: { ...fourSave.dailyRequestCounts }, thankYouEventViewed: { ...fourSave.thankYouEventViewed }, discovered: [...fourSave.discovered] };
saved.set('mioverse-craft-v1', JSON.stringify(fourSave));
app = launch();
assert.ok(!app.page('requests').includes('工房の一角を整える'), '4人お礼済みでも先行イベント未読なら非表示');
assert.equal(app.state().storyProgress.milestone4Completed, false, '旧セーブには新フラグのみ補完');
app.click('story-open', 'milestone2');
app.click('story-complete');
recordHtml = app.page('requests');
assert.ok(recordHtml.includes('工房の一角を整える'), '先行イベント読了後に特別依頼が表示');
for (const name of ['小さな棚', '布張りスツール', 'クッション']) assert.ok(recordHtml.includes(name));
assert.ok(recordHtml.includes('data-action="deliver-story" data-id="milestone4"'));
for (const item of ['smallShelf', 'upholsteredStool', 'cushion']) {
  app.click('view-recipe', `story-recipe-${item}`);
  assert.equal(app.recipeDialogOpen(), true);
  assert.ok(app.recipeDialogHtml().includes(G.items.find(entry => entry.id === item).name));
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`data-recipe-id="${item}"`), `${item} の加工レシピへ移動`);
  assert.ok(app.page('craft').includes(`recipe recipe-highlight" data-recipe-id="${item}"`), `${item} を強調`);
  app.page('requests');
}
let fourState = app.state();
fourState.inventory.cushion = 0;
saved.set('mioverse-craft-v1', JSON.stringify(fourState));
app = launch();
assert.ok(app.page('requests').includes('3種類の品物が必要'));
const beforeFailedDelivery = JSON.stringify(app.state());
app.click('deliver-story', 'milestone4');
assert.equal(JSON.stringify(app.state()), beforeFailedDelivery, '不足時に在庫も達成状態も変わらない');
fourState.inventory.cushion = 1;
saved.set('mioverse-craft-v1', JSON.stringify(fourState));
app = launch();
app.page('requests');
app.click('deliver-story', 'milestone4');
assert.equal(app.state().storyProgress.milestone4Completed, true);
assert.equal(app.state().storyProgress.milestone4EventViewed, false);
assert.equal(app.state().inventory.smallShelf, 0);
assert.equal(app.state().inventory.upholsteredStool, 0);
assert.equal(app.state().inventory.cushion, 0);
assert.equal(app.state().inventory.bag, originalFour.inventory.bag);
assert.equal(app.storyDialogOpen(), true, '納品成功後に完了イベントを表示');
assert.ok(app.storyDialogHtml().includes('少しだけ、居心地よく'));
assert.ok(app.storyDialogHtml().includes('暮らしの中の場所になった。'));
const afterSpecialDelivery = JSON.stringify(app.state());
app.click('deliver-story', 'milestone4');
assert.equal(JSON.stringify(app.state()), afterSpecialDelivery, '納品連打で二重消費しない');
app.click('story-close');
assert.equal(app.state().storyProgress.milestone4EventViewed, false, '途中で閉じても完了イベントは未読');
assert.ok(app.page('requests').includes('完了の出来事を読む'));
app = launch();
assert.equal(app.state().storyProgress.milestone4Completed, true, '再読み込み後も納品済み');
assert.equal(app.state().storyProgress.milestone4EventViewed, false, '再読み込み後も完了イベントを読める');
app.page('requests');
app.click('story-request-event', 'milestone4');
app.click('story-complete');
assert.equal(app.state().storyProgress.milestone4EventViewed, true);
assert.ok(app.page('requests').includes('✓ 達成済み'));
assert.ok(!app.page('requests').includes('data-action="deliver-story"'));
assert.ok(!app.page('requests').includes('完了の出来事を読む'));
assert.equal(app.state().day, originalFour.day);
assert.deepEqual(app.state().completed, originalFour.completed);
assert.deepEqual(app.state().dailyRequests, originalFour.dailyRequests);
assert.deepEqual(app.state().dailyRequestCounts, originalFour.dailyRequestCounts);
assert.deepEqual(app.state().thankYouEventViewed, originalFour.thankYouEventViewed);
assert.deepEqual(app.state().discovered, originalFour.discovered);
app = launch();
app.page('home'); app.page('requests');
assert.ok(app.page('requests').includes('✓ 達成済み'), 'ホームから戻っても達成済み');
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().storyProgress.milestone4Completed, true);
assert.equal(app.state().storyProgress.milestone4EventViewed, true, '翌日も読了を維持');
console.log('PASS: four-thank-you request gating, recipe reuse/highlight, exact delivery, completion modal, legacy save and reload/rest persistence');

const sixIds = Object.keys(G.dailyResidents).slice(0, 6);
const sixCounts = Object.fromEntries(Object.keys(G.dailyResidents).map(id => [id, 5]));
const sixStorySave = G.restore({ completed: G.requests.map(request => request.id), day: 72, gatherLimit: 5, gathersLeft: 1,
  inventory: { thread: 3, cloth: 4, dye: 5, plank: 6, bag: 7 }, discovered: ['bag'],
  dailyRequestCounts: sixCounts, thankYouEventViewed: Object.fromEntries(sixIds.map(id => [id, true])),
  dailyRequests: [{ templateId: 'daily-naka-bag', completed: false }, { templateId: 'daily-ritsu-thread', completed: false }, { templateId: 'daily-towa-box', completed: false }],
  storyProgress: { milestone2Viewed: true, milestone4Completed: true, milestone4EventViewed: true } });
for (const [viewed, specialDone] of [[5, true], [6, false]]) {
  const locked = JSON.parse(JSON.stringify(sixStorySave));
  if (viewed === 5) locked.thankYouEventViewed[sixIds[5]] = false;
  if (!specialDone) locked.storyProgress.milestone4Completed = false;
  saved.set('mioverse-craft-v1', JSON.stringify(locked));
  app = launch();
  assert.ok(!app.page('requests').includes('棚に増えたもの'), '条件未達ならイベントは非表示');
  app.click('story-open', 'milestone6');
  assert.equal(app.storyDialogOpen(), false);
}
saved.set('mioverse-craft-v1', JSON.stringify(sixStorySave));
app = launch();
recordHtml = app.page('requests');
assert.ok(recordHtml.includes('data-action="story-open" data-id="milestone6"'), '既存セーブの条件達成で即解放');
assert.equal(app.state().storyProgress.milestone6Viewed, false);
const giftBefore = app.state();
app.click('story-open', 'milestone6');
assert.equal(app.storyDialogOpen(), true);
assert.ok(app.storyDialogHtml().includes('棚に増えたもの'));
assert.ok(app.storyDialogHtml().includes('少しずつ一方通行ではなくなっていることに気づいた。'));
for (const text of ['糸 ×2', '布 ×1', '染料 ×2', '板材 ×1']) assert.ok(app.storyDialogHtml().includes(text), `${text}を表示`);
assert.equal(app.storyCompleteLabel(), '受け取る');
assert.deepEqual(app.state().inventory, giftBefore.inventory, '開くだけでは付与しない');
app.click('story-close');
assert.equal(app.state().storyProgress.milestone6Viewed, false);
app.click('story-open', 'milestone6');
app.page('home');
assert.equal(app.storyDialogOpen(), false, '画面移動で閉じる');
assert.deepEqual(app.state().inventory, giftBefore.inventory, '画面移動でも付与しない');
app.page('requests');
app.click('story-open', 'milestone6');
app.click('story-complete');
assert.equal(app.storyDialogOpen(), false);
assert.equal(app.state().storyProgress.milestone6Viewed, true);
for (const { id, quantity } of G.storyMilestones.milestone6.reward) assert.equal(app.state().inventory[id], giftBefore.inventory[id] + quantity, `${id}を正確に付与`);
assert.equal(app.state().inventory.bag, giftBefore.inventory.bag, '無関係な在庫を維持');
assert.equal(app.state().day, giftBefore.day);
assert.deepEqual(app.state().dailyRequests, giftBefore.dailyRequests);
assert.deepEqual(app.state().dailyRequestCounts, giftBefore.dailyRequestCounts);
assert.deepEqual(app.state().thankYouEventViewed, giftBefore.thankYouEventViewed);
assert.equal(app.state().storyProgress.milestone4Completed, true);
const giftAfter = JSON.stringify(app.state());
app.click('story-complete');
assert.equal(JSON.stringify(app.state()), giftAfter, '受取ボタン連打で二重付与しない');
assert.ok(app.page('requests').includes('✓ 受取済み'));
assert.ok(!app.page('requests').includes('data-action="story-open" data-id="milestone6"'));
app = launch();
app.page('home'); app.page('requests');
assert.equal(JSON.stringify(app.state()), giftAfter, '再起動後も材料は一度だけ');
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().storyProgress.milestone6Viewed, true, '翌日も受取済み');
for (const { id, quantity } of G.storyMilestones.milestone6.reward) assert.equal(app.state().inventory[id], giftBefore.inventory[id] + quantity, '翌日も付与数を維持');
console.log('PASS: six-thank-you story UI, voluntary one-time gift, exact stock, closed/reload/home/rest persistence');

const endingIds = Object.keys(G.dailyResidents);
const endingStock = { woodFrame: 1, plank: 2, dyedCloth: 1, thread: 1, dryFlower: 1, bag: 4 };
const endingSave = G.restore({ completed: G.requests.map(request => request.id), day: 93, gatherLimit: 5, gathersLeft: 2,
  inventory: endingStock, discovered: ['bag'],
  dailyRequestCounts: Object.fromEntries(endingIds.map(id => [id, 5])),
  thankYouEventViewed: Object.fromEntries(endingIds.map(id => [id, true])),
  dailyRequests: [{ templateId: 'daily-naka-bag', completed: false }, { templateId: 'daily-ritsu-thread', completed: false }, { templateId: 'daily-towa-box', completed: false }],
  storyProgress: { milestone2Viewed: true, milestone4Completed: true, milestone4EventViewed: true, milestone6Viewed: true } });
const sevenEnding = JSON.parse(JSON.stringify(endingSave));
sevenEnding.thankYouEventViewed.aoiDoctor = false;
saved.set('mioverse-craft-v1', JSON.stringify(sevenEnding));
app = launch();
assert.ok(!app.page('requests').includes('工房の看板を掛ける'), '7人お礼済みでは最終依頼なし');
app.click('thank-you-open', 'aoiDoctor');
app.click('thank-you-complete');
assert.ok(app.page('requests').includes('工房の看板を掛ける'), '8人目のお礼完了で即解放');
const sixEndingUnread = JSON.parse(JSON.stringify(endingSave));
sixEndingUnread.storyProgress.milestone6Viewed = false;
saved.set('mioverse-craft-v1', JSON.stringify(sixEndingUnread));
app = launch();
assert.ok(!app.page('requests').includes('工房の看板を掛ける'), '8人お礼済みでも6人イベント未完了なら非表示');
saved.set('mioverse-craft-v1', JSON.stringify(endingSave));
app = launch();
let endingHtml = app.page('requests');
assert.ok(endingHtml.includes('data-action="deliver-story" data-id="milestone8"'), '既存セーブから最終依頼を復元');
assert.ok(endingHtml.includes('看板を仕上げる'));
assert.ok(!app.page('home').includes('class="workshop-sign"'), '納品前は看板なし');
app.page('requests');
for (const { id, quantity } of G.storyRequests.milestone8.requirements) {
  assert.ok(endingHtml.includes(`story-recipe-milestone8-${id}`));
  app.click('view-recipe', `story-recipe-milestone8-${id}`);
  assert.equal(app.recipeDialogOpen(), true, `${id}の作り方を開く`);
  if (quantity === 2) assert.ok(app.recipeDialogHtml().includes('依頼数 × 2'), '板材2個分を表示');
  app.click('recipe-go-craft');
  assert.ok(app.page('craft').includes(`recipe recipe-highlight" data-recipe-id="${id}"`), `${id}のレシピを強調`);
  endingHtml = app.page('requests');
}
const missingEnding = app.state();
missingEnding.inventory.dryFlower = 0;
saved.set('mioverse-craft-v1', JSON.stringify(missingEnding));
app = launch();
assert.ok(app.page('requests').includes('5種類の材料が必要'));
const beforeMissing = JSON.stringify(app.state());
app.click('deliver-story', 'milestone8');
assert.equal(JSON.stringify(app.state()), beforeMissing, '不足時は状態を変えない');
saved.set('mioverse-craft-v1', JSON.stringify(endingSave));
app = launch();
app.page('requests');
app.click('deliver-story', 'milestone8');
assert.equal(app.storyDialogOpen(), true, '仕上げ直後にエンディングを表示');
assert.ok(app.storyDialogHtml().includes('END'));
assert.ok(app.storyDialogHtml().includes('小径の工房'));
assert.ok(app.storyDialogHtml().includes('小さな庭が残っていた。'));
assert.equal(app.storyCompleteLabel(), 'これからも工房で暮らす');
assert.equal(app.state().storyProgress.milestone8Completed, true);
assert.equal(app.state().storyProgress.milestone8EventViewed, false, 'エンディングを開いただけではクリアしない');
for (const { id, quantity } of G.storyRequests.milestone8.requirements) assert.equal(app.state().inventory[id], endingStock[id] - quantity, `${id}を正確に消費`);
assert.equal(app.state().inventory.bag, endingStock.bag);
const finishedStock = { ...app.state().inventory };
app.click('deliver-story', 'milestone8');
assert.deepEqual(app.state().inventory, finishedStock, '連打しても再消費なし');
app.click('story-close');
assert.equal(app.state().storyProgress.milestone8EventViewed, false, '途中で閉じても未読');
assert.ok(app.page('requests').includes('エンディングを見る'));
assert.ok(app.page('home').includes('class="workshop-sign"'), '看板は納品直後から表示');
app = launch();
assert.equal(app.state().storyProgress.milestone8Completed, true, '再読み込み後も納品済み');
assert.equal(app.state().storyProgress.milestone8EventViewed, false);
app.page('requests');
app.click('story-request-event', 'milestone8');
app.click('story-complete');
assert.equal(app.state().storyProgress.milestone8EventViewed, true, '最後のボタンで本編クリア');
assert.ok(app.page('requests').includes('✓ 本編クリア'));
assert.ok(app.page('requests').includes('✓ 達成済み'));
assert.ok(!app.page('requests').includes('エンディングを見る'));
assert.ok(app.page('home').includes('class="workshop-sign"'));
const clearEnding = app.state();
app = launch();
assert.equal(app.state().storyProgress.milestone8EventViewed, true, '再起動後も本編クリア');
assert.ok(app.page('home').includes('class="workshop-sign"'));
assert.ok(app.page('requests').includes('日常のお願い'), 'クリア後も日常依頼を表示');
app.page('home'); app.click('rest'); app.click('rest-confirm');
assert.equal(app.state().storyProgress.milestone8EventViewed, true, '日付進行後も本編クリア');
assert.ok(app.page('home').includes('class="workshop-sign"'));
app.page('gather'); app.click('gather', 'branch');
assert.equal(app.state().inventory.branch, clearEnding.inventory.branch + 2, 'クリア後も採集可能');
assert.ok(app.page('inventory').includes('工房の棚'), 'クリア後も在庫画面を開ける');
console.log('PASS: final request UI, five recipe routes, exact delivery, one-time ending, persistent sign and continuing play');

saved.set('mioverse-craft-v1', JSON.stringify({ ...clearEnding, plots: undefined }));
app = launch();
assert.ok(app.navigation().includes('裏庭'), '本編クリア済み旧セーブで裏庭ナビが出る');
let gardenHtml = app.page('backyard');
assert.ok(gardenHtml.includes('工房の裏には、まだほとんど手を入れていない小さな庭がある。'));
assert.equal((gardenHtml.match(/空いています/g) || []).length, 3);
assert.ok(gardenHtml.includes('data-action="garden-select" data-id="0"'));
app.click('garden-select', '0');
assert.ok(app.page('backyard').includes('data-action="plant-crop" data-id="0:potato"'));
app.click('plant-crop', '0:potato');
app.click('garden-select', '1'); app.click('plant-crop', '1:carrot');
app.click('garden-select', '2'); app.click('plant-crop', '2:wheat');
assert.deepEqual(app.state().plots.map(plot => plot.cropId), ['potato', 'carrot', 'wheat']);
assert.deepEqual(app.state().plots.map(plot => plot.plantedDay), [clearEnding.day, clearEnding.day, clearEnding.day]);
assert.ok(app.page('backyard').includes('収穫まで あと2日'));
app = launch();
assert.deepEqual(app.state().plots.map(plot => plot.cropId), ['potato', 'carrot', 'wheat'], '再読込後も栽培中');
for (let day = 1; day <= 4; day++) {
  app.page('home'); app.click('rest'); app.click('rest-confirm');
  gardenHtml = app.page('backyard');
  if (day === 1) assert.ok(gardenHtml.includes('収穫まで あと1日'));
  if (day === 2) {
    assert.ok(gardenHtml.includes('data-action="harvest-crop" data-id="0"'));
    app.click('harvest-crop', '0');
    assert.equal(app.state().inventory.potato, 2);
    assert.equal(app.state().plots[0], null);
    app.click('harvest-crop', '0');
    assert.equal(app.state().inventory.potato, 2, '連打でも二重収穫なし');
  }
  if (day === 3) { app.click('harvest-crop', '1'); assert.equal(app.state().inventory.carrot, 2); }
  if (day === 4) { app.click('harvest-crop', '2'); assert.equal(app.state().inventory.wheat, 2); }
}
assert.deepEqual(app.state().plots, [null, null, null]);
assert.ok(app.page('inventory').includes('収穫物'));
for (const name of ['じゃがいも', 'にんじん', '小麦']) assert.ok(app.page('inventory').includes(name));
assert.ok(app.page('encyclopedia').includes('21'), '図鑑21種類を維持');
assert.ok(app.page('requests').includes('日常のお願い'), '日常依頼は継続');
app = launch();
assert.equal(app.state().inventory.wheat, 2, '収穫物も再読込で維持');
assert.equal(app.state().storyProgress.milestone8EventViewed, true);
console.log('PASS: garden navigation gating, three crop planting, daily growth, exact harvest, inventory and reload');

saved.set('mioverse-craft-v1', JSON.stringify(clearEnding));
app = launch();
let historyHtml = app.page('requests');
assert.match(historyHtml, /<details class="request-history-fold"><summary><span>みんなとの記録<\/span><small>8\/8 お礼済み<\/small>/, '記録は人数を示して閉じる');
assert.match(historyHtml, /<details class="request-history-fold" ><summary><span>特別な出来事<\/span><small>2件<\/small>/, '読了済みの出来事は閉じる');
assert.match(historyHtml, /<details class="request-history-fold" ><summary><span>特別依頼<\/span><small>2\/2 達成済み<\/small>/, '達成済みの特別依頼は閉じる');
assert.ok(historyHtml.indexOf('日常のお願い') < historyHtml.indexOf('みんなとの記録'), '日常依頼を記録より前に置く');
assert.ok(historyHtml.includes('✓ お礼済み') && historyHtml.includes('工房に残るもの') && historyHtml.includes('工房の看板を掛ける'), '折りたたんでも履歴を残す');
const unreadHistory = { ...clearEnding, storyProgress: { ...clearEnding.storyProgress, milestone6Viewed: false, milestone8Completed: false, milestone8EventViewed: false } };
saved.set('mioverse-craft-v1', JSON.stringify(unreadHistory));
app = launch();
historyHtml = app.page('requests');
assert.match(historyHtml, /<details class="request-history-fold" open><summary><span>特別な出来事<\/span><small>2件 · 未読あり<\/small>/, '未読の出来事は開いて示す');
const pendingRequest = { ...clearEnding, storyProgress: { ...clearEnding.storyProgress, milestone8Completed: false, milestone8EventViewed: false } };
saved.set('mioverse-craft-v1', JSON.stringify(pendingRequest));
app = launch();
assert.match(app.page('requests'), /<details class="request-history-fold" open><summary><span>特別依頼<\/span><small>1\/2 達成済み<\/small>/, '未達成の特別依頼は開く');
const endingUnread = { ...clearEnding, storyProgress: { ...clearEnding.storyProgress, milestone8EventViewed: false } };
saved.set('mioverse-craft-v1', JSON.stringify(endingUnread));
app = launch();
assert.match(app.page('requests'), /<details class="request-history-fold" open><summary><span>特別依頼<\/span><small>2\/2 達成済み · 未読あり<\/small>/, '納品後の未読イベントも見落とさない');
assert.equal(app.state().storyProgress.milestone8EventViewed, false, '折りたたみ表示はセーブを変更しない');
console.log('PASS: collapsible request history summaries, unread/open defaults, completed/closed defaults and daily-request priority');
