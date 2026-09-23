'use strict';
const G = window.MioGame;
const SAVE_KEY = 'mioverse-craft-v1';
const names = Object.fromEntries(G.items.map(i => [i.id, i.name]));
const pages = [['home', '工房', '01'], ['gather', '採集', '02'], ['craft', '加工', '03'], ['inventory', '在庫', '04'], ['requests', '依頼', '05']];
let state = G.fresh();
let saveMessage = '自動保存が有効です';
try {
  const stored = localStorage.getItem(SAVE_KEY);
  if (stored) { state = G.restore(JSON.parse(stored)); save(); }
} catch { saveMessage = '保存データを読み込めませんでした。この画面では遊べます。'; }
let currentPage = 'home';
let toastTimer;
let highlightedRecipeId = null;
let recipeHighlightTimer;
let activeRecipeRequestId = null;
const restDialog = document.getElementById('rest-dialog');
const recipeDialog = document.getElementById('recipe-dialog');
const dayStatus = () => `<section class="day-status" aria-label="今日の状態"><div><strong>${state.day}日目</strong><span>今日の採集（残り） ${state.gathersLeft} / ${G.DAILY_GATHERS}</span></div>${currentPage === 'home' ? '<button data-action="rest">今日は休む</button>' : ''}</section>`;
const count = id => state.inventory[id];
const requestTotal = () => G.visibleRequests(state).length;
const dailyRequests = () => G.dailyUnlocked(state) ? G.currentDailyRequests(state) : [];
const findRequest = id => G.requests.find(request => request.id === id) || dailyRequests().find(request => request.id === id);
const requestCompleted = request => request.id.startsWith('daily-') ? request.completed : state.completed.includes(request.id);
const recipeHints = {
  wreath: 'ツル草 × 2 ＋ 乾燥花 × 2 ＋ 糸 × 1 → 花のリース',
  linedBox: '小箱 × 1 ＋ 染め布 × 1 → 布張り小箱',
  cushion: '染め布 × 2 ＋ 植物繊維 × 2 ＋ 糸 × 1 → クッション',
  bag: 'ツル草 → 植物繊維 → 糸 → 布 → 布袋',
  box: '枝 → 木材 → 板材 → 小箱',
  dye: '野花 → 乾燥花 → 染料',
  dyedCloth: '布 × 1 ＋ 染料 × 1 → 染め布',
  curtain: '染め布 × 2 ＋ 糸 × 1 → カーテン',
  wallHanging: '板材 × 1 ＋ 染め布 × 1 → 壁掛け'
};
const total = () => Object.values(state.inventory).reduce((a, b) => a + b, 0);
const link = (page, label, cls = 'button') => `<a class="${cls}" href="#${page}">${label} <span aria-hidden="true">↗</span></a>`;
const heading = (label, title, description) => `<header class="page-heading"><p class="eyebrow">${label}</p><h1>${title}</h1><p>${description}</p></header>`;
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saveMessage = 'この端末に自動保存しました'; }
  catch { saveMessage = '自動保存できません。ページを閉じると進行状況が失われます。'; }
}
function notify(message) {
  const toast = document.getElementById('toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 5500);
}
function home() {
  const done = state.completed.length;
  return `${dayStatus()}<section class="hero"><p class="eyebrow">A LITTLE WORKSHOP IN THE WOODS</p><h1>森の恵みで、<br>暮らしをひとつ。</h1><p>小径で集めて、工房でつくる。<br>あなたの手仕事を、住人たちが待っています。</p>${link('gather', '森の小径へ')}<span class="hero-stamp" aria-hidden="true">森<br>と<br>暮らす</span></section>
    <div class="stats"><div><span>在庫の合計</span><strong>${total()} <small>個</small></strong></div><div><span>住人へのお届け</span><strong>${done} <small>/ ${requestTotal()} 件</small></strong></div><div><span>今日のペース</span><strong class="slow">のんびり</strong></div></div>
    <section><div class="section-title"><h2>工房での過ごし方</h2><span>急がず、ひとつずつ</span></div><div class="steps"><a href="#gather"><span class="step-number">01 / GATHER</span><h3>森で集める</h3><p>枝、ツル草、野花。<br>好きな素材を選んで採集。</p><span class="text-link">採集へ →</span></a><a href="#craft"><span class="step-number">02 / CRAFT</span><h3>手を動かす</h3><p>素材を少しずつ加工して、<br>暮らしの道具をつくる。</p><span class="text-link">加工へ →</span></a><a href="#requests"><span class="step-number">03 / GIVE</span><h3>住人へ届ける</h3><p>できあがった品物で、<br>小さなお願いを叶える。</p><span class="text-link">依頼へ →</span></a></div></section>
    <section class="note"><span class="note-icon" aria-hidden="true">✳</span><div><h3>${done === G.requests.length ? '日常のお願いが届いています' : G.stageTwoUnlocked(state) ? '新しい3件のお願いが届いています' : 'はじめのひと品に、布袋はいかが？'}</h3><p>${done === G.requests.length ? '固定依頼のあとは、3人から日常のお願いが届きます。お届け済みの枠は「今日は休む」と翌日に入れ替わります。' : G.stageTwoUnlocked(state) ? (state.unlockedStage === 3 ? '乾燥花はリースに、小箱は布張りに。素材の使い道を選びながら、新しい品物をつくってみましょう。' : '布と染料、そして木材。素材を組み合わせて、窓辺や壁を彩る品物をつくってみましょう。') : 'ツル草を1回採集 → 植物繊維を2個 → 糸を2個 → 布を1個 → 布袋を1個。ナカちゃんに届けてみましょう。'}</p></div></section>`;
}
function gatherPage() {
  const descriptions = { branch: '木漏れ日の下に落ちた、手になじむ枝。', vine: '道ばたに伸びる、しなやかなツル草。', flower: '小径を彩る、やさしい色の野花。' };
  return heading('GATHER / 01', '森の小径', '気になる素材を選んで、ひと休みするように採集。') + dayStatus() + `<div class="location-note"><span>採集できるもの · 3種類</span><span>毎回2個 / 待ち時間なし</span></div><div class="gather-grid">${G.items.slice(0, 3).map(i => `<article class="gather-card ${i.id}"><div class="material-mark" aria-hidden="true">${i.mark}</div><p class="eyebrow">FOREST MATERIAL</p><h2>${i.name}</h2><p>${descriptions[i.id]}</p><div class="owned">現在の在庫 <strong>${count(i.id)} 個</strong></div><button data-action="gather" data-id="${i.id}" ${state.gathersLeft === 0 ? 'disabled' : ''}>${i.name}を採集 <span>＋2</span></button></article>`).join('')}</div><div class="bottom-note"><p>${state.gathersLeft === 0 ? '今日はもう十分集めたようです。工房で作業するか、今日は休みましょう。' : '採集は1日3回。加工・納品には回数制限がありません。'}</p>${link('craft', '集めた素材を加工する', 'text-link')}${state.gathersLeft === 0 ? link('home', '工房で休む', 'text-link') : ''}</div>`;
}
function craftPageBase() {
  return heading('CRAFT / 02', '手仕事の時間', '素材をつないで、ひとつの品物へ。加工はすぐに完了します。') + G.recipes.reduce((groups, r) => { if (!groups.includes(r.group)) groups.push(r.group); return groups; }, []).map(group => `<section class="recipe-section"><h2>${group}</h2><p class="chain">${group === '木のしごと' ? '枝 → 木材 → 板材 → 小箱' : group === '布のしごと' ? 'ツル草 → 植物繊維 → 糸 → 布 → 布袋' : group === '花のしごと' ? '野花 → 乾燥花 → 染料' : '素材・中間素材・完成品を組み合わせて、暮らしの品へ'}</p><div class="recipe-list">${G.recipes.filter(r => r.group === group).map(r => { const inputs = G.ingredients(r); const max = G.maxCraft(state, r); const missing = inputs.filter(i => count(i.id) < i.cost); return `<article class="recipe"><div><h3>${names[r.id]} <span class="yield">＋1個</span></h3><p>${inputs.map(i => `${names[i.id]} ${i.cost}個`).join(' ＋ ')} <span class="arrow">→</span> ${names[r.id]} 1個</p><small>${inputs.map(i => `${names[i.id]}の在庫 ${count(i.id)} / 必要 ${i.cost}${count(i.id) < i.cost ? '（不足）' : ''}`).join(' · ')} · ${names[r.id]}の在庫 ${count(r.id)}</small></div><div class="recipe-actions"><button data-action="craft" data-id="${r.id}" ${max < 1 ? 'disabled' : ''}>${max < 1 ? `${missing.map(i => names[i.id]).join('・')}が不足` : '1個つくる'}</button>${max > 1 ? `<button class="secondary" data-action="craft-all" data-id="${r.id}">まとめて${max}個</button>` : ''}</div></article>`; }).join('')}</div></section>`).join('') + `<div class="bottom-note">${link('gather', '素材を集める', 'text-link')}${link('requests', 'できた品物を届ける', 'text-link')}</div>`;
}
function craftPage() {
  let recipeIndex = 0;
  return craftPageBase().replace(/<article class="recipe">/g, () => {
    const id = G.recipes[recipeIndex++].id;
    const highlight = highlightedRecipeId === id ? ' recipe-highlight' : '';
    return `<article class="recipe${highlight}" data-recipe-id="${id}" tabindex="-1">`;
  });
}
function inventoryPage() {
  return heading('STOCK / 03', '工房の棚', `採集素材から完成品まで、いま持っているもの。合計 ${total()} 個。`) + ['採集素材', '中間素材', '完成品'].map(category => `<section class="inventory-section"><h2>${category}</h2><div class="inventory-grid">${G.items.filter(i => i.category === category).map(i => `<div class="inventory-item ${count(i.id) === 0 ? 'empty' : ''}"><span class="small-mark" aria-hidden="true">${i.mark}</span><span>${i.name}</span><strong>${count(i.id)} <small>個</small></strong></div>`).join('')}</div></section>`).join('') + `<p class="muted">在庫の上限はありません。加工・納品に使った素材はここから減ります。</p>`;
}
function requestsPageBase() {
  return heading('REQUESTS / 04', '暮らしのお願い', 'ひと品に、気持ちを添えて。期限はありません。') + `<div class="request-progress"><span>${G.dailyUnlocked(state) ? '固定依頼' : 'お届けした依頼'}</span><strong>${state.completed.length} / ${requestTotal()}${G.dailyUnlocked(state) ? ' 完了' : ''}</strong><progress max="${requestTotal()}" value="${state.completed.length}" aria-label="依頼の達成状況"></progress></div><p class="muted">${G.dailyUnlocked(state) ? '最初の9件をすべてお届けしました。これまでのお礼も読み返せます。' : G.stageTwoUnlocked(state) ? (state.unlockedStage === 3 ? '第3段階の依頼が解放されました。これまでのお礼も読み返せます。' : '第2段階の依頼が解放されました。合計6件をすべて届けると、第3段階の3件が解放されます。') : '最初の3件をすべて届けると、次の3件が解放されます。'}</p><div class="requests-list">${G.visibleRequests(state).map(r => { const done = state.completed.includes(r.id); const ready = count(r.item) >= 1; return `<article class="request-card ${done ? 'completed' : ''}"><div class="resident"><span class="avatar" aria-hidden="true">${r.initial}</span><div><span class="eyebrow">${done ? 'DELIVERED' : 'FROM YOUR NEIGHBOR'}</span><h2>${r.name}</h2></div><span class="badge">${done ? '✓ お届け済み' : '受付中'}</span></div><h3>${r.title}</h3><p class="quote">「${done ? r.thanks : r.message}」</p><div class="delivery"><div><span>お届けするもの</span><strong>${names[r.item]} × 1</strong><small>${done ? '納品済み' : `在庫 ${count(r.item)}個 / 納品時に1個消費`}</small></div><button data-action="deliver" data-id="${r.id}" ${done || !ready ? 'disabled' : ''}>${done ? '達成しました' : ready ? '1個届ける' : '完成品が必要'}</button></div>${!done ? `<p class="request-hint">${recipeHints[r.item]}</p>` : ''}</article>`; }).join('')}</div><div class="bottom-note"><p>各依頼は1回ずつ達成できます。</p>${link('craft', '工房でつくる', 'text-link')}</div>`;
}
function dailyRequestsSection() {
  if (!G.dailyUnlocked(state)) return '';
  const requests = dailyRequests();
  return `<section class="daily-requests" aria-labelledby="daily-requests-title"><div class="daily-heading"><div><p class="eyebrow">DAILY REQUESTS</p><h2 id="daily-requests-title">日常のお願い</h2></div><span>今日の依頼 ${requests.length}件</span></div><p class="muted">未達成のお願いは翌日も持ち越します。お届け済みの枠だけ、「今日は休む」と新しいお願いに入れ替わります。</p><div class="requests-list">${requests.map(request => { const done = request.completed; const ready = count(request.item) >= request.quantity; return `<article class="request-card daily-request ${done ? 'completed' : ''}"><div class="resident"><span class="avatar" aria-hidden="true">${request.initial}</span><div><span class="eyebrow">${done ? 'DELIVERED TODAY' : 'TODAY’S REQUEST'}</span><h2>${request.name}</h2></div><span class="badge">${done ? '✓ お届け済み' : '受付中'}</span></div><h3>${request.title}</h3><p class="quote">「${done ? request.thanks : request.message}」</p><div class="delivery"><div><span>お届けするもの</span><strong>${names[request.item]} × ${request.quantity}</strong><small>${done ? '本日は納品済み' : `在庫 ${count(request.item)}個 / 納品時に${request.quantity}個消費`}</small></div>${!done ? `<button class="secondary view-recipe" data-action="view-recipe" data-id="${request.id}">作り方を見る</button>` : ''}<button data-action="deliver-daily" data-id="${request.id}" ${done || !ready ? 'disabled' : ''}>${done ? 'お届け済み' : ready ? `${request.quantity}個届ける` : '完成品が必要'}</button></div></article>`; }).join('')}</div></section>`;
}
function requestsPage() {
  const visible = G.visibleRequests(state);
  let requestIndex = 0;
  const fixed = requestsPageBase().replace(/<button data-action="deliver"/g, match => {
    const request = visible[requestIndex++];
    if (state.completed.includes(request.id)) return match;
    return `<button class="secondary view-recipe" data-action="view-recipe" data-id="${request.id}">作り方を見る</button>${match}`;
  });
  if (!G.dailyUnlocked(state)) return fixed;
  return fixed
    .replace('<div class="requests-list">', `${dailyRequestsSection()}<details class="fixed-history"><summary><span>固定依頼のお礼</span><small>9件</small></summary><div class="requests-list">`)
    .replace('<div class="bottom-note">', '</details><div class="bottom-note">');
}
function openRecipeDialog(request) {
  const recipe = G.recipes.find(r => r.id === request.item);
  if (!recipe) return;
  const quantity = request.quantity || 1;
  const inputs = G.ingredients(recipe).map(input => ({ ...input, required: input.cost * quantity }));
  activeRecipeRequestId = request.id;
  document.getElementById('recipe-dialog-content').innerHTML = `<p class="eyebrow">RECIPE / 作り方</p><h2 id="recipe-dialog-title">${names[request.item]}</h2>${quantity > 1 ? `<p class="recipe-request-quantity">依頼数 × ${quantity}</p>` : ''}<div class="recipe-dialog-section"><h3>必要素材</h3><ul>${inputs.map(input => `<li><span>${names[input.id]}</span><strong>× ${input.required}</strong></li>`).join('')}</ul></div><div class="recipe-dialog-section stock"><h3>現在の在庫</h3><ul>${inputs.map(input => `<li><span>${names[input.id]}</span><strong>${count(input.id)} / ${input.required}</strong></li>`).join('')}</ul></div>`;
  recipeDialog.showModal();
}
function revealRecipe() {
  if (!highlightedRecipeId || currentPage !== 'craft') return;
  const recipe = document.querySelector?.(`[data-recipe-id="${highlightedRecipeId}"]`);
  if (!recipe) return;
  recipe.focus({ preventScroll: true });
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  recipe.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  clearTimeout(recipeHighlightTimer);
  recipeHighlightTimer = setTimeout(() => {
    recipe.classList.remove('recipe-highlight');
    highlightedRecipeId = null;
  }, 4000);
}
function render() {
  const focus = document.activeElement;
  const focusAction = focus?.dataset.action;
  const focusId = focus?.dataset.id;
  document.getElementById('navigation').innerHTML = pages.map(([id, name, number]) => `<a href="#${id}" ${id === currentPage ? 'aria-current="page"' : ''}><span class="nav-number">${number}</span>${name}${id === 'requests' ? `<span class="nav-count">${state.completed.length}/${requestTotal()}</span>` : ''}</a>`).join('');
  document.getElementById('main').innerHTML = ({ home, gather: gatherPage, craft: craftPage, inventory: inventoryPage, requests: requestsPage })[currentPage]();
  document.getElementById('save-status').textContent = saveMessage;
  if (focusAction) {
    const replacement = document.querySelector(`[data-action="${focusAction}"][data-id="${focusId}"]`);
    if (replacement && !replacement.disabled) replacement.focus({ preventScroll: true });
    else document.getElementById('main').focus({ preventScroll: true });
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const { action, id } = button.dataset;
  if (action === 'rest') { restDialog.showModal(); return; }
  if (action === 'rest-cancel') { restDialog.close(); return; }
  if (action === 'rest-confirm') {
    if (!restDialog.open) return;
    restDialog.close();
    G.rest(state);
    save(); render();
    document.getElementById('main').focus({ preventScroll: true });
    notify(`${state.day}日目になりました。今日の採集は3回。好きなペースで過ごしましょう。`);
    return;
  }
  if (action === 'view-recipe') {
    const request = findRequest(id);
    if (!request || requestCompleted(request) || !G.recipes.some(r => r.id === request.item)) return;
    openRecipeDialog(request);
    return;
  }
  if (action === 'recipe-close') {
    if (recipeDialog.open) recipeDialog.close();
    activeRecipeRequestId = null;
    return;
  }
  if (action === 'recipe-go-craft') {
    const request = findRequest(activeRecipeRequestId);
    if (!request || requestCompleted(request) || !G.recipes.some(r => r.id === request.item)) return;
    recipeDialog.close();
    activeRecipeRequestId = null;
    highlightedRecipeId = request.item;
    location.hash = '#craft';
    return;
  }
  let message;
  if (action === 'gather' && G.gather(state, id)) message = `${names[id]}を2個採集しました。現在 ${count(id)}個。今日の採集は残り${state.gathersLeft}回。`;
  if (action === 'craft' || action === 'craft-all') {
    const recipe = G.recipes.find(r => r.id === id);
    const amount = action === 'craft-all' ? G.maxCraft(state, recipe) : 1;
    if (G.craft(state, id, amount)) message = `${G.ingredients(recipe).map(i => `${names[i.id]}を${i.cost * amount}個`).join('、')}使って、${names[id]}を${amount}個つくりました。`;
  }
  if (action === 'deliver' && G.deliver(state, id)) {
    const request = G.requests.find(r => r.id === id);
    message = `${request.name}「${request.thanks}」`;
  }
  if (action === 'deliver-daily' && G.deliverDaily(state, id)) {
    const request = findRequest(id);
    message = `${request.name}「${request.thanks}」`;
  }
  if (message) { save(); render(); notify(message); }
});
function navigate() {
  const hash = location.hash.slice(1);
  currentPage = pages.some(p => p[0] === hash) ? hash : 'home';
  render();
}
window.addEventListener('hashchange', () => {
  navigate();
  if (currentPage === 'craft' && highlightedRecipeId) revealRecipe();
  else { document.getElementById('main').focus({ preventScroll: true }); window.scrollTo(0, 0); }
});
navigate();

