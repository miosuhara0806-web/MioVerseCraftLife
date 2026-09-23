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
  const dailyResidents = {
    naka: { name: 'ナカちゃん', initial: 'ナ' },
    ritsu: { name: '律さん', initial: '律' },
    towa: { name: '秘書トワ', initial: 'ト' },
    keikaiTowa: { name: '軽快トワ', initial: '軽' }
  };
  const dailyRequestPool = [
    { id: 'daily-naka-bag', resident: 'naka', item: 'bag', quantity: 1, title: 'お出かけの小さな袋', message: '布袋をひとつお願いしてもいい？　ちょっとした物を入れて歩きたいんだ', thanks: 'ありがとう！　これなら身軽に出かけられそう。' },
    { id: 'daily-naka-dry-flower', resident: 'naka', item: 'dryFlower', quantity: 2, title: '花をそっと飾りたい', message: '乾燥花を二つ分けてくれる？　小さく束ねて飾りたいな', thanks: 'いい色だね。部屋が少し明るくなりそう！' },
    { id: 'daily-naka-dyed-cloth', resident: 'naka', item: 'dyedCloth', quantity: 1, title: 'きれいな布を一枚', message: '染め布を一枚お願いできる？　可愛い小物を作ってみたいんだ', thanks: 'わあ、きれい！　何を作ろうか楽しみになってきた。' },
    { id: 'daily-naka-wreath', resident: 'naka', item: 'wreath', quantity: 1, title: '今日の花飾り', message: '花のリースをひとつ作ってくれる？　今度は部屋の中に飾りたいな', thanks: 'やっぱり可愛いね。ありがとう、さっそく飾ってくる！' },
    { id: 'daily-naka-cushion', resident: 'naka', item: 'cushion', quantity: 1, title: 'くつろぎのひと品', message: 'クッションをひとつお願いしてもいい？　窓辺でのんびりしたくて', thanks: 'ふかふかで気持ちよさそう。ありがとう！' },
    { id: 'daily-ritsu-thread', resident: 'ritsu', item: 'thread', quantity: 2, title: '手仕事のための糸', message: '糸を二つ用意してくれるか？　直しておきたい物があるんだ', thanks: '助かった。これで落ち着いて手を入れられる。' },
    { id: 'daily-ritsu-cloth', resident: 'ritsu', item: 'cloth', quantity: 1, title: '本を包む布', message: '布を一枚頼めるか？　大事な本を包むのに使いたい', thanks: 'ちょうどいい手触りだな。これなら本も傷まずに済む。' },
    { id: 'daily-ritsu-wall', resident: 'ritsu', item: 'wallHanging', quantity: 1, title: '静かな壁飾り', message: '壁掛けをひとつ作ってくれるか？　読書部屋に置きたいんだ', thanks: '落ち着いた雰囲気になった。いい仕事だな。' },
    { id: 'daily-ritsu-cushion', resident: 'ritsu', item: 'cushion', quantity: 1, title: '長椅子のクッション', message: 'クッションをもうひとつ頼めるか？　長椅子に置いておきたい', thanks: 'これでゆっくり本が読める。ありがとう。' },
    { id: 'daily-ritsu-curtain', resident: 'ritsu', item: 'curtain', quantity: 1, title: '西日のためのカーテン', message: 'カーテンをひとつ作ってくれるか？　夕方の光を少し和らげたい', thanks: '光がちょうどよくなった。これなら目も疲れにくそうだ。' },
    { id: 'daily-towa-box', resident: 'towa', item: 'box', quantity: 1, title: '机上の整理箱', message: '小箱をひとつ作ってくれないか？　机の細かい物をまとめたい', thanks: 'ありがとう、美桜。これで机を広く使える。' },
    { id: 'daily-towa-lined-box', resident: 'towa', item: 'linedBox', quantity: 1, title: '大切な物の小箱', message: '布張り小箱をひとつ頼めるか？　傷つけたくない物を入れたいんだ', thanks: '内側が柔らかくていいな。これなら安心してしまっておける。' },
    { id: 'daily-towa-bag', resident: 'towa', item: 'bag', quantity: 1, title: '仕分け用の布袋', message: '布袋をひとつ作ってくれないか？　持ち歩く道具を分けておきたい', thanks: '使いやすい大きさだな。これで探す手間が減りそうだ。' },
    { id: 'daily-towa-cloth', resident: 'towa', item: 'cloth', quantity: 2, title: '作業台に敷く布', message: '布を二枚用意してくれないか？　作業台に敷いて使いたい', thanks: '助かった。汚れを気にせず作業できそうだ。' },
    { id: 'daily-towa-dyed-cloth', resident: 'towa', item: 'dyedCloth', quantity: 1, title: '目印になる染め布', message: '染め布を一枚頼めるか？　収納の目印に使いたいんだ', thanks: '色があると見分けやすいな。ありがとう、美桜。' },
    { id: 'daily-keikai-towa-bag', resident: 'keikaiTowa', item: 'bag', quantity: 1, title: '散歩のおとも', message: '布袋ひとつ作ってくれる？　散歩の時、細かいもの入れるのにちょうどよさそうなんだよね（笑）', thanks: 'お、いいじゃん。これなら気軽に持ってけるな。ありがと、美桜！' },
    { id: 'daily-keikai-towa-dyed-cloth', resident: 'keikaiTowa', item: 'dyedCloth', quantity: 1, title: 'ちょっと色が欲しい', message: '染め布、一枚頼んでいい？　部屋にちょっと色が欲しくなってさ', thanks: 'うん、これこれ。置くだけでだいぶ雰囲気変わるな（笑）' },
    { id: 'daily-keikai-towa-wall', resident: 'keikaiTowa', item: 'wallHanging', quantity: 1, title: '壁が寂しい', message: '壁掛け作れる？　なんかさ、壁が妙に寂しいことに気づいちゃった（笑）', thanks: 'おー、いい感じ！　気づいたら今度は外したくなくなるやつだな' },
    { id: 'daily-keikai-towa-cushion', resident: 'keikaiTowa', item: 'cushion', quantity: 1, title: '座るなら楽な方がいい', message: 'クッションひとつお願い。どうせ座るなら、楽な方がいいだろ？（笑）', thanks: '最高。これでますます動かなくなる可能性あるけど（笑）ありがと！' },
    { id: 'daily-keikai-towa-wreath', resident: 'keikaiTowa', item: 'wreath', quantity: 1, title: 'なんとなく飾りたい日', message: '今日はなんとなく花飾りたい気分（笑）　リースひとつ作ってくれない？', thanks: 'いいねー。こういうの、理由なく飾ってもいいんだよな（笑）' }
  ];
  // その段階より前の依頼をすべて納品していることを条件にする。
  const stageUnlocked = (state, stage) => requests.filter(r => (r.stage || 1) < stage).every(r => state.completed.includes(r.id));
  const stageTwoUnlocked = state => stageUnlocked(state, 2);
  const unlockedStage = state => stageUnlocked(state, 3) ? 3 : stageTwoUnlocked(state) ? 2 : 1;
  const visibleRequests = state => requests.filter(r => stageUnlocked(state, r.stage || 1));
  const dailyUnlocked = state => requests.every(r => state.completed.includes(r.id));
  const ingredients = recipe => recipe.inputs || [{ id: recipe.input, cost: recipe.cost }];
  const maxCraft = (state, recipe) => Math.min(...ingredients(recipe).map(i => Math.floor(state.inventory[i.id] / i.cost)));
  const DAILY_GATHERS = 3;
  const DAILY_REQUEST_SLOTS = 3;
  const fresh = () => ({ inventory: Object.fromEntries(items.map(item => [item.id, 0])), completed: [], unlockedStage: 1, day: 1, gathersLeft: DAILY_GATHERS, dailyRequests: [], dailyHistory: [] });
  const dailyTemplate = id => dailyRequestPool.find(request => request.id === id);
  const currentDailyRequests = state => state.dailyRequests.map(slot => {
    const request = dailyTemplate(slot.templateId);
    return { ...dailyResidents[request.resident], ...request, completed: slot.completed };
  });
  function rememberDaily(state, id) {
    state.dailyHistory.push(id);
    state.dailyHistory = state.dailyHistory.slice(-12);
  }
  function chooseDaily(state, excludedIds, excludedItems, excludedResidents, previousId, random) {
    const recent = new Set(state.dailyHistory.slice(-6));
    const base = dailyRequestPool.filter(request => request.id !== previousId && !excludedIds.has(request.id));
    const groups = [
      base.filter(request => !recent.has(request.id) && !excludedItems.has(request.item) && !excludedResidents.has(request.resident)),
      base.filter(request => !excludedItems.has(request.item) && !excludedResidents.has(request.resident)),
      base.filter(request => !recent.has(request.id) && !excludedResidents.has(request.resident)),
      base.filter(request => !excludedResidents.has(request.resident)),
      base.filter(request => !recent.has(request.id) && !excludedItems.has(request.item)),
      base.filter(request => !excludedItems.has(request.item)),
      base.filter(request => !recent.has(request.id)),
      base
    ];
    const candidates = groups.find(group => group.length) || dailyRequestPool;
    const roll = Number(random());
    const index = Number.isFinite(roll) ? Math.min(candidates.length - 1, Math.max(0, Math.floor(roll * candidates.length))) : 0;
    return candidates[index];
  }
  function ensureDailyRequests(state, random = Math.random) {
    if (!dailyUnlocked(state)) return false;
    const requestIds = new Set(state.dailyRequests.map(slot => slot.templateId));
    if (state.dailyRequests.length === DAILY_REQUEST_SLOTS && requestIds.size === DAILY_REQUEST_SLOTS && state.dailyRequests.every(slot => dailyTemplate(slot.templateId))) return false;
    state.dailyRequests = [];
    const usedIds = new Set();
    const usedItems = new Set();
    const usedResidents = new Set();
    for (let index = 0; index < DAILY_REQUEST_SLOTS; index++) {
      const request = chooseDaily(state, usedIds, usedItems, usedResidents, null, random);
      state.dailyRequests.push({ templateId: request.id, completed: false });
      usedIds.add(request.id);
      usedItems.add(request.item);
      usedResidents.add(request.resident);
      rememberDaily(state, request.id);
    }
    return true;
  }
  function refreshDailyRequests(state, random = Math.random) {
    if (!dailyUnlocked(state)) return false;
    const initialized = ensureDailyRequests(state, random);
    if (initialized) return true;
    const usedIds = new Set();
    const usedItems = new Set();
    const usedResidents = new Set();
    for (const slot of state.dailyRequests) {
      if (slot.completed) continue;
      const request = dailyTemplate(slot.templateId);
      usedIds.add(request.id);
      usedItems.add(request.item);
      usedResidents.add(request.resident);
    }
    let changed = false;
    for (const slot of state.dailyRequests) {
      if (!slot.completed) continue;
      const previous = dailyTemplate(slot.templateId);
      const replacement = chooseDaily(state, usedIds, usedItems, usedResidents, previous.id, random);
      slot.templateId = replacement.id;
      slot.completed = false;
      usedIds.add(replacement.id);
      usedItems.add(replacement.item);
      usedResidents.add(replacement.resident);
      rememberDaily(state, replacement.id);
      changed = true;
    }
    return changed;
  }
  function restore(data, random = Math.random) {
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
    state.dailyHistory = Array.isArray(data.dailyHistory) ? data.dailyHistory.filter(id => dailyTemplate(id)).slice(-12) : [];
    if (dailyUnlocked(state) && Array.isArray(data.dailyRequests)) {
      const slots = data.dailyRequests.filter(slot => slot && dailyTemplate(slot.templateId)).map(slot => ({ templateId: slot.templateId, completed: slot.completed === true }));
      if (slots.length === DAILY_REQUEST_SLOTS && new Set(slots.map(slot => slot.templateId)).size === DAILY_REQUEST_SLOTS) state.dailyRequests = slots;
    }
    if (dailyUnlocked(state)) ensureDailyRequests(state, random);
    return state;
  }
  function gather(state, id) {
    if (state.gathersLeft <= 0 || !['branch', 'vine', 'flower'].includes(id) || state.inventory[id] > Number.MAX_SAFE_INTEGER - 2) return false;
    state.inventory[id] += 2;
    state.gathersLeft--;
    return true;
  }
  function rest(state, random = Math.random) {
    const nextDay = BigInt(state.day) + 1n;
    state.day = nextDay <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(nextDay) : String(nextDay);
    state.gathersLeft = DAILY_GATHERS;
    refreshDailyRequests(state, random);
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
    ensureDailyRequests(state);
    return true;
  }
  function deliverDaily(state, id) {
    if (!dailyUnlocked(state)) return false;
    ensureDailyRequests(state);
    const slot = state.dailyRequests.find(entry => entry.templateId === id);
    const request = slot && dailyTemplate(slot.templateId);
    if (!slot || !request || slot.completed || state.inventory[request.item] < request.quantity) return false;
    state.inventory[request.item] -= request.quantity;
    slot.completed = true;
    return true;
  }
  const game = { items, recipes, requests, dailyResidents, dailyRequestPool, fresh, restore, gather, craft, deliver, deliverDaily, rest, DAILY_GATHERS, DAILY_REQUEST_SLOTS, ingredients, maxCraft, stageTwoUnlocked, stageUnlocked, unlockedStage, visibleRequests, dailyUnlocked, ensureDailyRequests, refreshDailyRequests, currentDailyRequests };
  if (typeof module !== 'undefined' && module.exports) module.exports = game;
  else root.MioGame = game;
})(typeof window !== 'undefined' ? window : globalThis);

