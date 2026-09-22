/* ゲームの定義とルール。画面や保存処理から独立しています。 */
(function (root) {
  'use strict';
  const items = [
    { id: 'branch', name: '枝', category: '採集素材', mark: '枝' },
    { id: 'vine', name: 'ツル草', category: '採集素材', mark: '草' },
    { id: 'flower', name: '野花', category: '採集素材', mark: '花' },
    { id: 'wood', name: '木材', category: '中間素材', mark: '木' },
    { id: 'plank', name: '板材', category: '中間素材', mark: '板' },
    { id: 'fiber', name: '植物繊維', category: '中間素材', mark: '繊' },
    { id: 'thread', name: '糸', category: '中間素材', mark: '糸' },
    { id: 'cloth', name: '布', category: '中間素材', mark: '布' },
    { id: 'dryFlower', name: '乾燥花', category: '中間素材', mark: '乾' },
    { id: 'box', name: '小箱', category: '完成品', mark: '箱' },
    { id: 'bag', name: '布袋', category: '完成品', mark: '袋' },
    { id: 'dye', name: '染料', category: '完成品', mark: '染' },
    { id: 'dyedCloth', name: '染め布', category: '中間素材', mark: '彩' },
    { id: 'curtain', name: 'カーテン', category: '完成品', mark: '窓' },
    { id: 'wallHanging', name: '壁掛け', category: '完成品', mark: '壁' },
    { id: 'wreath', name: '花のリース', category: '完成品', mark: '輪' },
    { id: 'linedBox', name: '布張り小箱', category: '完成品', mark: '箱' },
    { id: 'cushion', name: 'クッション', category: '完成品', mark: '綿' }
  ];
  const recipes = [
    { id: 'wood', input: 'branch', cost: 2, group: '木のしごと' },
    { id: 'plank', input: 'wood', cost: 1, group: '木のしごと' },
    { id: 'box', input: 'plank', cost: 2, group: '木のしごと' },
    { id: 'fiber', input: 'vine', cost: 1, group: '布のしごと' },
    { id: 'thread', input: 'fiber', cost: 1, group: '布のしごと' },
    { id: 'cloth', input: 'thread', cost: 2, group: '布のしごと' },
    { id: 'bag', input: 'cloth', cost: 1, group: '布のしごと' },
    { id: 'dryFlower', input: 'flower', cost: 1, group: '花のしごと' },
    { id: 'dye', input: 'dryFlower', cost: 2, group: '花のしごと' },
    { id: 'dyedCloth', inputs: [{ id: 'cloth', cost: 1 }, { id: 'dye', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'curtain', inputs: [{ id: 'dyedCloth', cost: 2 }, { id: 'thread', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'wallHanging', inputs: [{ id: 'plank', cost: 1 }, { id: 'dyedCloth', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'wreath', inputs: [{ id: 'vine', cost: 2 }, { id: 'dryFlower', cost: 2 }, { id: 'thread', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'linedBox', inputs: [{ id: 'box', cost: 1 }, { id: 'dyedCloth', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'cushion', inputs: [{ id: 'dyedCloth', cost: 2 }, { id: 'fiber', cost: 2 }, { id: 'thread', cost: 1 }], group: '組み合わせのしごと' }
  ];
  const requests = [
    { id: 'naka', name: 'ナカちゃん', initial: 'ナ', item: 'bag', title: 'お出かけのおとも', message: '布袋ひとつ作ってくれる？　次のお散歩に持っていきたいんだ', thanks: 'ありがとう！　次のお散歩に持っていくね。' },
    { id: 'ritsu', name: '律さん', initial: '律', item: 'dye', title: '花の色を暮らしに', message: '手仕事に使う染料をひとつ、作ってくれるか？', thanks: 'いい色だな。使うのが楽しみだ。' },
    { id: 'towa', name: '秘書トワ', initial: 'ト', item: 'box', title: '整理整頓の小さな一歩', message: '素材を整理したい。小箱をひとつ作ってくれないか？', thanks: 'ありがとう、美桜。これでだいぶ片付く。' }
  ];
  requests.push(
    { id: 'nakaCurtain', stage: 2, name: 'ナカちゃん', initial: 'ナ', item: 'curtain', title: '窓辺をちょっと明るく', message: 'カーテンひとつ作ってくれる？　窓辺がちょっと寂しかったんだ', thanks: 'ありがとう！　これだけで部屋の雰囲気、かなり変わるね。' },
    { id: 'ritsuWall', stage: 2, name: '律さん', initial: '律', item: 'wallHanging', title: '壁にひとつ', message: '壁掛けをひとつ頼めるか？　少し殺風景な場所があってな', thanks: 'いいな。こういうのがひとつあるだけで、ずいぶん違う。' },
    { id: 'towaCloth', stage: 2, name: '秘書トワ', initial: 'ト', item: 'dyedCloth', title: '布を一枚', message: '染め布を一枚、作ってくれないか？　ちょうど使いたいところがある', thanks: 'ありがとう、美桜。ちょうど欲しかった。' }
  );
  requests.push(
    { id: 'nakaWreath', stage: 3, name: 'ナカちゃん', initial: 'ナ', item: 'wreath', title: '入口に飾りたいな', message: '花のリース、ひとつ作ってくれる？　入口に飾ったら可愛いと思うんだ', thanks: 'わあ、可愛い！　さっそく飾ってくるね。ありがとう！' },
    { id: 'ritsuCushion', stage: 3, name: '律さん', initial: '律', item: 'cushion', title: '読書のおとも', message: 'クッションをひとつ作ってくれるか？　椅子に置くものが欲しくてな', thanks: 'ちょうどいいな。これなら少し長く座っていられそうだ。' },
    { id: 'towaLinedBox', stage: 3, name: '秘書トワ', initial: 'ト', item: 'linedBox', title: '小物をまとめたい', message: '布張りの小箱をひとつ作ってくれないか？　細かい物をまとめておきたい', thanks: 'ありがとう、美桜。見た目もいいし、これなら使いやすそうだ。' }
  );
  // その段階より前の依頼をすべて納品していることを条件にする。
  const stageUnlocked = (state, stage) => requests.filter(r => (r.stage || 1) < stage).every(r => state.completed.includes(r.id));
  const stageTwoUnlocked = state => stageUnlocked(state, 2);
  const unlockedStage = state => stageUnlocked(state, 3) ? 3 : stageTwoUnlocked(state) ? 2 : 1;
  const visibleRequests = state => requests.filter(r => stageUnlocked(state, r.stage || 1));
  const ingredients = recipe => recipe.inputs || [{ id: recipe.input, cost: recipe.cost }];
  const maxCraft = (state, recipe) => Math.min(...ingredients(recipe).map(i => Math.floor(state.inventory[i.id] / i.cost)));
  const DAILY_GATHERS = 3;
  const fresh = () => ({ inventory: Object.fromEntries(items.map(item => [item.id, 0])), completed: [], unlockedStage: 1, day: 1, gathersLeft: DAILY_GATHERS });
  function restore(data) {
    const state = fresh();
    if (!data || typeof data !== 'object') return state;
    if (Number.isSafeInteger(data.day) && data.day >= 1) state.day = data.day;
    // 非常に大きい日数も文字列として保存し、上限を設けずに進められる。
    else if (typeof data.day === 'string' && /^[1-9][0-9]*$/.test(data.day)) state.day = data.day;
    if (Number.isInteger(data.gathersLeft) && data.gathersLeft >= 0 && data.gathersLeft <= DAILY_GATHERS) state.gathersLeft = data.gathersLeft;
    for (const item of items) {
      const n = data.inventory?.[item.id];
      if (Number.isSafeInteger(n) && n >= 0) state.inventory[item.id] = n;
    }
    state.completed = Array.isArray(data.completed) ? [...new Set(data.completed.filter(id => requests.some(r => r.id === id)))] : [];
    // 旧セーブにも対応。解放条件を達成状況から復元し、不整合なフラグは採用しない。
    state.unlockedStage = unlockedStage(state);
    state.completed = state.completed.filter(id => (requests.find(r => r.id === id).stage || 1) <= state.unlockedStage);
    return state;
  }
  function gather(state, id) {
    if (state.gathersLeft <= 0 || !['branch', 'vine', 'flower'].includes(id) || state.inventory[id] > Number.MAX_SAFE_INTEGER - 2) return false;
    state.inventory[id] += 2;
    state.gathersLeft--;
    return true;
  }
  function rest(state) {
    const nextDay = BigInt(state.day) + 1n;
    state.day = nextDay <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(nextDay) : String(nextDay);
    state.gathersLeft = DAILY_GATHERS;
  }
  function craft(state, id, amount = 1) {
    // 作成は在庫の更新のみ。依頼の達成は deliver での手動納品に限定する。
    const recipe = recipes.find(r => r.id === id);
    if (!recipe || !Number.isSafeInteger(amount) || amount < 1 || maxCraft(state, recipe) < amount || state.inventory[id] > Number.MAX_SAFE_INTEGER - amount) return false;
    // 全素材の充足を確認してからまとめて消費する。不足時は在庫を変更しない。
    for (const input of ingredients(recipe)) state.inventory[input.id] -= input.cost * amount;
    state.inventory[id] += amount;
    return true;
  }
  function deliver(state, id) {
    const request = requests.find(r => r.id === id);
    if (!request || !stageUnlocked(state, request.stage || 1) || state.completed.includes(id) || state.inventory[request.item] < 1) return false;
    state.inventory[request.item]--;
    state.completed.push(id);
    state.unlockedStage = unlockedStage(state);
    return true;
  }
  const game = { items, recipes, requests, fresh, restore, gather, craft, deliver, rest, DAILY_GATHERS, ingredients, maxCraft, stageTwoUnlocked, stageUnlocked, unlockedStage, visibleRequests };
  if (typeof module !== 'undefined' && module.exports) module.exports = game;
  else root.MioGame = game;
})(typeof window !== 'undefined' ? window : globalThis);

