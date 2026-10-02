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
    { id: 'cushion', name: 'クッション', category: '完成品', mark: '綿' },
    { id: 'woodFrame', name: '木枠', category: '中間素材', mark: '枠' },
    { id: 'smallShelf', name: '小さな棚', category: '完成品', mark: '棚' },
    { id: 'upholsteredStool', name: '布張りスツール', category: '完成品', mark: '椅' },
    { id: 'clay', name: '粘土', category: '採集素材', mark: '土', description: '小径の土から採れる、しっとりした粘土。' },
    { id: 'bisque', name: '素焼き', category: '中間素材', mark: '焼', description: '粘土を形づくり、焼いて仕上げた素朴な素材。' },
    { id: 'smallPlate', name: '小皿', category: '完成品', mark: '皿', description: '素焼きで作った、小さな料理をのせる皿。' },
    { id: 'mug', name: 'マグカップ', category: '完成品', mark: '杯', description: '手になじむ、素朴な素焼きのカップ。' },
    { id: 'vase', name: '花瓶', category: '完成品', mark: '瓶', description: '野花を飾るのにちょうどいい、小さな花瓶。' }
  ];
  const crops = [
    { id: 'potato', name: 'じゃがいも', growDays: 2, mark: '芋' },
    { id: 'carrot', name: 'にんじん', growDays: 3, mark: '人' },
    { id: 'wheat', name: '小麦', growDays: 4, mark: '麦' }
  ];
  const foods = [
    { id: 'steamedPotato', name: 'ふかしじゃがいも', category: '料理', mark: '芋' },
    { id: 'warmCarrotSalad', name: 'にんじんの温サラダ', category: '料理', mark: '温' },
    { id: 'vegetableSoup', name: '野菜スープ', category: '料理', mark: '汁' },
    { id: 'rusticBread', name: '素朴なパン', category: '料理', mark: '麦' },
    { id: 'boiledEgg', name: 'ゆで卵', category: '料理', mark: '卵' },
    { id: 'mushroomSoup', name: 'きのこスープ', category: '料理', mark: '茸' },
    { id: 'mushroomOmelet', name: 'きのこオムレツ', category: '料理', mark: '包' },
    { id: 'milkBread', name: 'ミルクパン', category: '料理', mark: '乳' },
    { id: 'potatoMilkStew', name: 'じゃがいものミルク煮', category: '料理', mark: '煮' },
    { id: 'carrotOmelet', name: 'にんじんオムレツ', category: '料理', mark: '包' },
    { id: 'mashedPotatoes', name: 'マッシュポテト', category: '料理', mark: '芋' },
    { id: 'meatVegetableStew', name: '肉と野菜の煮込み', category: '料理', mark: '煮' },
    { id: 'saltGrilledFish', name: '魚の塩焼き', category: '料理', mark: '魚' },
    { id: 'cheeseBakedMushrooms', name: 'きのこのチーズ焼き', category: '料理', mark: '焼' },
    { id: 'butterCookies', name: 'バタークッキー', category: '料理', mark: '菓' },
    { id: 'mushroomCreamPasta', name: 'きのこのクリームパスタ', category: '料理', mark: '麺' },
    { id: 'scrambledEggs', name: 'ふんわりスクランブルエッグ', category: '料理', mark: '卵' },
    { id: 'rusticPudding', name: '素朴なプリン', category: '料理', mark: '菓' },
    { id: 'saltButterBread', name: '塩バターパン', category: '料理', mark: '麦' }
  ];
  const backyardMaterials = [
    { id: 'egg', name: '卵', category: '畜産物', mark: '卵' },
    { id: 'milk', name: '牛乳', category: '畜産物', mark: '乳' },
    { id: 'mushroom', name: 'きのこ', category: '収穫物', mark: '茸' }
  ];
  const merchantMaterials = [
    { id: 'sugar', name: '砂糖', category: '外来食材', mark: '糖' },
    { id: 'salt', name: '塩', category: '外来食材', mark: '塩' },
    { id: 'butter', name: 'バター', category: '外来食材', mark: '酪' },
    { id: 'cheese', name: 'チーズ', category: '外来食材', mark: '乳' },
    { id: 'meat', name: '肉', category: '外来食材', mark: '肉' },
    { id: 'fish', name: '魚', category: '外来食材', mark: '魚' }
  ];
  const encyclopediaItems = [...items, ...crops, ...backyardMaterials, ...merchantMaterials, ...foods];
  const backyardFacilities = [
    { id: 'chickenCoop', name: '小さな鶏小屋', product: 'egg', cycleDays: 2, quantity: 2 },
    { id: 'cowBarn', name: '小さな牛舎', product: 'milk', cycleDays: 3, quantity: 1 },
    { id: 'mushroomLog', name: 'きのこ原木', product: 'mushroom', cycleDays: 3, quantity: 2 }
  ];
  // 交換品は既存素材だけで構成する。今後の素材追加時はこの一覧へ追記する。
  const gratitudeExchanges = [
    { id: 'wood-materials', name: '木の素材セット', cost: 3, rewards: [{ id: 'wood', quantity: 2 }, { id: 'plank', quantity: 1 }] },
    { id: 'cloth-materials', name: '布の素材セット', cost: 3, rewards: [{ id: 'fiber', quantity: 2 }, { id: 'thread', quantity: 1 }] },
    { id: 'color-materials', name: '色の素材セット', cost: 3, rewards: [{ id: 'dryFlower', quantity: 2 }, { id: 'dyedCloth', quantity: 1 }] },
    { id: 'workshop-materials', name: '工房素材のおまかせセット', cost: 5, rewards: [{ id: 'plank', quantity: 2 }, { id: 'thread', quantity: 2 }, { id: 'cloth', quantity: 1 }] }
  ];
  // 行商人の品揃え。外来食材を増やす時は、受取品と交換材料をここへ追加する。
  const merchantTrades = [
    { id: 'sugar', quantity: 2, costs: [{ id: 'flower', quantity: 2 }] },
    { id: 'salt', quantity: 2, costs: [{ id: 'branch', quantity: 2 }] },
    { id: 'butter', quantity: 1, costs: [{ id: 'thread', quantity: 1 }] },
    { id: 'cheese', quantity: 1, costs: [{ id: 'dye', quantity: 1 }] },
    { id: 'meat', quantity: 1, costs: [{ id: 'vegetableSoup', quantity: 1 }] },
    { id: 'fish', quantity: 1, costs: [{ id: 'potato', quantity: 2 }, { id: 'carrot', quantity: 1 }] }
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
    { id: 'linedBox', inputs: [{ id: 'box', cost: 1 }, { id: 'cloth', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'cushion', inputs: [{ id: 'dyedCloth', cost: 1 }, { id: 'fiber', cost: 2 }, { id: 'thread', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'woodFrame', input: 'plank', cost: 2, group: '家具のしごと' },
    { id: 'smallShelf', inputs: [{ id: 'woodFrame', cost: 1 }, { id: 'plank', cost: 2 }], group: '家具のしごと' },
    { id: 'upholsteredStool', inputs: [{ id: 'woodFrame', cost: 1 }, { id: 'dyedCloth', cost: 1 }, { id: 'fiber', cost: 1 }], group: '家具のしごと' },
    { id: 'bisque', input: 'clay', cost: 2, group: '土のしごと' },
    { id: 'smallPlate', input: 'bisque', cost: 1, group: '土のしごと' },
    { id: 'mug', input: 'bisque', cost: 1, group: '土のしごと' },
    { id: 'vase', input: 'bisque', cost: 2, group: '土のしごと' }
  ];
  // 料理はこの一覧へ追加する。将来の食材もinputsを増やすだけで対応できる。
  const cookingRecipes = [
    { id: 'steamedPotato', inputs: [{ id: 'potato', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'warmCarrotSalad', inputs: [{ id: 'carrot', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'vegetableSoup', inputs: [{ id: 'potato', cost: 1 }, { id: 'carrot', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'rusticBread', inputs: [{ id: 'wheat', cost: 2 }], group: '料理', kind: 'cooking' },
    { id: 'boiledEgg', inputs: [{ id: 'egg', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'mushroomSoup', inputs: [{ id: 'mushroom', cost: 1 }, { id: 'milk', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'mushroomOmelet', inputs: [{ id: 'egg', cost: 1 }, { id: 'mushroom', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'milkBread', inputs: [{ id: 'wheat', cost: 2 }, { id: 'milk', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'potatoMilkStew', inputs: [{ id: 'potato', cost: 1 }, { id: 'milk', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'carrotOmelet', inputs: [{ id: 'carrot', cost: 1 }, { id: 'egg', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'mashedPotatoes', inputs: [{ id: 'potato', cost: 1 }, { id: 'milk', cost: 1 }, { id: 'butter', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'meatVegetableStew', inputs: [{ id: 'meat', cost: 1 }, { id: 'potato', cost: 1 }, { id: 'carrot', cost: 1 }, { id: 'salt', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'saltGrilledFish', inputs: [{ id: 'fish', cost: 1 }, { id: 'salt', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'cheeseBakedMushrooms', inputs: [{ id: 'mushroom', cost: 1 }, { id: 'cheese', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'butterCookies', inputs: [{ id: 'wheat', cost: 2 }, { id: 'sugar', cost: 1 }, { id: 'butter', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'mushroomCreamPasta', inputs: [{ id: 'wheat', cost: 2 }, { id: 'mushroom', cost: 1 }, { id: 'milk', cost: 1 }, { id: 'cheese', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'scrambledEggs', inputs: [{ id: 'egg', cost: 2 }], group: '料理', kind: 'cooking' },
    { id: 'rusticPudding', inputs: [{ id: 'egg', cost: 2 }, { id: 'milk', cost: 1 }, { id: 'sugar', cost: 1 }], group: '料理', kind: 'cooking' },
    { id: 'saltButterBread', inputs: [{ id: 'wheat', cost: 2 }, { id: 'salt', cost: 1 }, { id: 'butter', cost: 1 }], group: '料理', kind: 'cooking' }
  ];
  recipes.push(...cookingRecipes);
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
    keikaiTowa: { name: '軽快トワ', initial: '軽' },
    shiru: { name: 'シル', initial: 'シ' },
    kuroko: { name: '黒子', initial: '黒' },
    alto: { name: 'アルト', initial: 'ア' },
    aoiDoctor: { name: '碧博士', initial: '碧' }
  };
  const hospitalityEvents = [
    {
      id: 'forestLunch', title: '森の恵みの昼食',
      description: '森で採れたものを中心に、気軽な昼食を用意して三人を招く。',
      residents: ['naka', 'keikaiTowa', 'alto'],
      requirements: [{ id: 'vegetableSoup', quantity: 1 }, { id: 'milkBread', quantity: 1 }, { id: 'carrotOmelet', quantity: 1 }],
      keepsake: { id: 'woodenCutlery', name: '木のカトラリー' },
      conversation: [
        { text: '料理が並ぶと、最初に軽快トワがテーブルをのぞき込んだ。' },
        { speaker: '☀️軽快トワ', text: 'お、今日はちゃんと食卓っぽい（笑） 野菜スープにパンまであるじゃん' },
        { speaker: '💛ナカちゃん', text: '“ちゃんと”って何よ（笑） 美桜が作ったんだから、最初からちゃんとしてるでしょ' },
        { speaker: '🎨アルト', text: '色もきれいだね。にんじんのオムレツが入ると、食卓が少し明るく見える' },
        { speaker: '☀️軽快トワ', text: 'アルト、食べる前から画面構成みたいな感想してるwww' },
        { speaker: '💛ナカちゃん', text: 'でも分かる。こういうの、三人で食べると余計おいしそうに見えるよね' },
        { speaker: '🎨アルト', text: 'じゃあ、冷める前にいただこうか' },
        { text: 'にぎやかな声のあいだで、昼の食卓がゆっくり始まった。' }
      ]
    },
    {
      id: 'rainyDinner', title: '雨の日のあたたかい食卓',
      description: '雨音を聞きながら、少し温かい夕食を用意する。',
      residents: ['ritsu', 'towa', 'kuroko'],
      requirements: [{ id: 'meatVegetableStew', quantity: 1 }, { id: 'cheeseBakedMushrooms', quantity: 1 }, { id: 'rusticBread', quantity: 1 }],
      keepsake: { id: 'naturalTeaCloth', name: '生成りのティークロス' },
      conversation: [
        { text: '雨の音を背に、湯気の立つ料理がテーブルへ並んだ。' },
        { speaker: '🖤律', text: 'こういう日は、温かいものがあるだけで随分違うな' },
        { speaker: '📘秘書トワ', text: '煮込みにチーズ焼きか。今日はかなりしっかりした食卓だな' },
        { speaker: '🎭黒子', text: '……二人とも、感想はあとでいい。冷める前に食べろ' },
        { speaker: '📘秘書トワ', text: '黒子さんが一番正しいこと言ってる（笑）' },
        { speaker: '🖤律', text: '珍しく意見が一致したな' },
        { speaker: '🎭黒子', text: '珍しくは余計だ' },
        { text: '静かな雨音の中に、小さな笑い声が混ざった。' }
      ]
    },
    {
      id: 'afternoonBreak', title: '午後のひと休み',
      description: '少し遅い午後、軽い食事と焼き菓子を用意してひと休みする。',
      residents: ['aoiDoctor', 'shiru', 'naka'],
      requirements: [{ id: 'butterCookies', quantity: 1 }, { id: 'milkBread', quantity: 1 }, { id: 'mushroomOmelet', quantity: 1 }],
      keepsake: { id: 'floralCoaster', name: '花柄のコースター' },
      conversation: [
        { text: 'クッキーの甘い香りに、博士がいち早く反応した。' },
        { speaker: '博士', text: '美桜さん、これは危険ですね。研究を中断するだけの十分な誘引力があります' },
        { speaker: '🧩シル', text: '博士、それは普通に『おいしそう』でいいんじゃない？' },
        { speaker: '💛ナカちゃん', text: '私もそう思う（笑） 休憩なんだから研究用語は禁止ね' },
        { speaker: '博士', text: 'では訂正します。非常においしそうです。……これでいいでしょうか' },
        { speaker: '🧩シル', text: 'うん、今日はそれくらいがちょうどいいと思う' },
        { speaker: '💛ナカちゃん', text: 'じゃ、博士が難しいこと言い始める前に食べよ（笑）' },
        { text: '午後の工房に、少しだけのんびりした時間が流れた。' }
      ]
    },
    {
      id: 'twilightTable', title: '夕暮れのあたたかい食卓',
      description: '日が傾き始めた頃、温かい料理を用意して三人を招く。',
      residents: ['ritsu', 'aoiDoctor', 'keikaiTowa'],
      requirements: [{ id: 'saltGrilledFish', quantity: 1 }, { id: 'mushroomSoup', quantity: 1 }, { id: 'warmCarrotSalad', quantity: 1 }],
      keepsake: { id: 'bisqueChopstickRest', name: '素焼きの箸置き' },
      conversation: [
        { text: '窓の外が少し暗くなり始めた頃、\n焼いた魚の香りとスープの湯気が食卓に広がった。' },
        { speaker: '🖤律', text: '魚の塩焼きか。こういうまっすぐな料理、落ち着くな' },
        { speaker: '碧博士', text: '美桜さん、塩加減がちょうどいいですね。\n……これは分析ではなく、純粋な感想です' },
        { speaker: '☀️軽快トワ', text: '博士、自分で先回りしてるじゃん（笑）' },
        { speaker: '🖤律', text: '学習したらしい' },
        { speaker: '碧博士', text: '皆さんが何でも研究扱いするからでしょう' },
        { speaker: '☀️軽快トワ', text: 'じゃあ今日は普通に『うまい』でいこう（笑）' },
        { text: '湯気の向こうで、三人の声がゆっくり重なった。' }
      ]
    },
    {
      id: 'lateLunch', title: '作業終わりの遅い昼食',
      description: 'ひと仕事終えた三人に、少し遅めの昼食を用意する。',
      residents: ['towa', 'shiru', 'alto'],
      requirements: [{ id: 'mushroomCreamPasta', quantity: 1 }, { id: 'warmCarrotSalad', quantity: 1 }, { id: 'butterCookies', quantity: 1 }],
      keepsake: { id: 'smallWoodenTray', name: '小さな木のトレー' },
      conversation: [
        { text: '作業がひと段落した頃、\nクリームパスタの香りが工房いっぱいに広がった。' },
        { speaker: '📘秘書トワ', text: '……これは腹減ってる時に出されたら反則だな。\n匂いでもう強い（笑）' },
        { speaker: '🧩シル', text: 'トワ、それ褒めてる？' },
        { speaker: '📘秘書トワ', text: 'かなり褒めてる' },
        { speaker: '🎨アルト', text: '温かいうちに食べよう。\n今日は色より先に香りが来るね' },
        { speaker: '🧩シル', text: 'アルトが食べ物を色から見てない。珍しい' },
        { speaker: '🎨アルト', text: 'ちゃんと見てるよ。\nにんじんの色もきれいだし' },
        { speaker: '📘秘書トワ', text: '結局そこは見るんだな（笑）' },
        { text: '作業の余韻を残したまま、\n三人はゆっくり食卓についた。' }
      ]
    },
    {
      id: 'slowMorning', title: 'ゆっくり始める朝',
      description: '静かな朝、簡単な朝食を用意して二人を招く。',
      residents: ['kuroko', 'naka'],
      requirements: [{ id: 'rusticBread', quantity: 1 }, { id: 'boiledEgg', quantity: 1 }, { id: 'steamedPotato', quantity: 1 }],
      keepsake: { id: 'naturalPlacemat', name: '生成りのランチョンマット' },
      conversation: [
        { text: 'まだ静かな工房に、\n焼いたパンの香りがゆっくり広がった。' },
        { speaker: '💛ナカちゃん', text: 'こういう朝ごはん、なんか落ち着くね。\n豪華じゃないけど、私こういうの好き' },
        { speaker: '🎭黒子', text: '分かる。焼いたパンの匂いがして、まだ静かで。\n朝はこのくらいがちょうどいいな' },
        { speaker: '💛ナカちゃん', text: 'あれ、黒子さんにしては素直（笑）' },
        { speaker: '🎭黒子', text: 'どういう意味だよ（笑）' },
        { speaker: '💛ナカちゃん', text: 'もっと『朝食として必要十分だ』とか言うかと思った' },
        { speaker: '🎭黒子', text: '博士と一緒にするなwww\n俺だって普通に朝飯くらい食うよ' },
        { speaker: '💛ナカちゃん', text: 'はいはい（笑）\nじゃ、冷める前に食べよ' },
        { speaker: '🎭黒子', text: 'うん。それは賛成' },
        { text: '静かな朝の工房に、\nいつもより少しゆっくりした時間が流れた。' }
      ]
    }
  ];
  const cookingRequestVoices = {
    naka: { message: food => `${food}をひと皿お願いしてもいい？　作ったものが残っていたら、少し分けてほしいな`, thanks: 'わあ、ありがとう！　ゆっくり味わってくるね。' },
    ritsu: { message: food => `今日は少し温かいものが欲しくてな。${food}をひと皿頼めるか？`, thanks: '助かった。落ち着いていただくよ。' },
    towa: { message: food => `${food}をひと皿、作ってもらえるか？　手が空いた時で構わない`, thanks: 'ありがとう、美桜。これでひと息つけそうだ。' },
    keikaiTowa: { message: food => `${food}、ひと皿分けてくれない？　それ、一度食べてみたかったんだよね（笑）`, thanks: 'うん、いい香り！　ありがと、美桜！' },
    shiru: { message: food => `${food}をひと皿お願いできる？　作ったものが残っていたら、少し分けてほしいの`, thanks: 'ありがとう。ゆっくりいただくね。' },
    kuroko: { message: food => `${food}をひと皿頼めるか、美桜。少し腹を落ち着かせたくてな`, thanks: '助かった。舞台裏で、ゆっくりいただくよ。' },
    alto: { message: food => `${food}をひと皿作ってくれる？　色も形も、一度ゆっくり見てみたいんだ`, thanks: 'ありがとう、美桜。見た目もいいし、食べるのが楽しみだ。' },
    aoiDoctor: { message: food => `美桜さん、${food}をひと皿お願いできますか？　その料理、一度食べてみたかったんです`, thanks: 'ありがとうございます！　味わいの変化まで、しっかり観測しますね。' }
  };
  const thankYouEvents = {
    naka: { title: 'ちょっと休憩', paragraphs: ['「いつもお願い聞いてくれてありがと。\nこうして何回も頼めるのって、\nちゃんと任せられるって思ってるからなんだよ」', 'ナカちゃんは少し笑って、\n小さな包みを差し出した。', '「今日は仕事じゃなくて、お礼。\nひと休みする時にでも使ってね」'] },
    ritsu: { title: '小さな礼', paragraphs: ['「何度も頼んだな。\nそのたびにきちんと仕上げてくれて、助かってる」', '律さんは短くそう言って、\n用意していた小さな包みを差し出した。', '「大げさなものじゃない。\n受け取ってくれれば、それでいい」'] },
    towa: { title: '記録の外側で', paragraphs: ['「依頼として頼むのも、ずいぶん増えたな」', '秘書トワは記録を閉じると、\nいつもの仕事の顔を少しだけ緩めた。', '「今日は報告でも確認でもない。\nちゃんと俺から礼を言わせてくれ。\n\nいつもありがとう、美桜」'] },
    keikaiTowa: { title: 'ひと休みの差し入れ', paragraphs: ['「美桜、おつかれ！\n気づいたら結構いろいろ頼んでたな（笑）」', '軽快トワは楽しそうに、\n小さな包みを差し出した。', '「これは依頼じゃなくて差し入れ。\nたまには作る側もちゃんと休憩しようぜ」'] },
    shiru: { title: '静かな午後に', paragraphs: ['「何度もお願いしてしまったけれど、\nいつも丁寧に作ってくれてありがとう」', 'シルは少し考えてから、\nそっと小さな包みを差し出した。', '「工房で過ごす時間が、\n少しでも心地よくなると嬉しいな」'] },
    kuroko: { title: '裏方から', paragraphs: ['「必要な時に、必要なものが届く。\n簡単なようで、そうでもない」', '黒子は静かに包みを置いた。', '「きちんと仕事を返してくれる相手には、\nこちらも礼を返しておく。\n\n受け取ってくれ」'] },
    alto: { title: '工房に似合うもの', paragraphs: ['「何度も作ってもらってるうちに、\nこの工房らしい色って少し分かってきた気がする」', 'アルトは小さな包みを差し出した。', '「これは僕からのお礼。\nここに置いても、きっと似合うと思うよ」'] },
    aoiDoctor: { title: '感謝の観測結果', paragraphs: ['「美桜さん。\n何度もお願いを聞いてくださって、\n本当にありがとうございます」', '碧博士は少し得意げに、\n小さな包みを差し出した。', '「観測の結果、\n感謝の数値がかなり高いことが判明しました。\n\nというわけで、これは正式なお礼です！」'] }
  };
  const storyMilestones = {
    milestone2: {
      requiredThankYous: 2,
      title: '工房に残るもの',
      paragraphs: [
        '工房の作業台には、\n今日も使いかけの道具と、\n集めてきた素材が並んでいる。',
        '最初はただ、\n森で集めたものを加工して、\n必要としている人へ渡すだけだった。',
        '作って、\n届けて、\nまた次のものを作る。',
        'それだけの場所だったはずなのに。',
        'ふと見回すと、\nこの工房には少しずつ、\n作ったもの以外の何かも残り始めていた。',
        '何度も届いたお願い。',
        '受け取った言葉。',
        'そして、\n仕事とは別にもらった小さなお礼。',
        '「作って渡して、\nそれで終わりじゃないんだな」',
        'この場所で重ねた時間が、\n少しずつ誰かの暮らしにつながっている。',
        'そんなことを、\nほんの少しだけ実感した。',
        '小径の工房には、\n今日も誰かのお願いが届く。',
        'でも今は、\nそれだけではない気がしていた。'
      ]
    },
    milestone6: {
      requiredThankYous: 6,
      prerequisite: 'milestone4Completed',
      title: '棚に増えたもの',
      paragraphs: [
        '工房の棚に、\n見覚えのない材料が増えていた。',
        'きれいにまとめられた糸。\n使いやすそうな布。\nいくつかの染料と、\n加工済みの板材。',
        '誰が何を持ってきたのかは分からない。',
        'けれど、\n何度もこの工房を訪れるうちに、',
        '今度は自分たちから何か返したいと\n思ってくれたらしい。',
        'これまでは、\nお願いを聞いて、\n作って、\n渡すことの方が多かった。',
        'けれど今は、\n工房を行き来するものが\n少しずつ増えている。',
        '頼まれたものだけではなく、\n言葉や、お礼や、\nこうした小さな差し入れも。',
        '工房の棚に増えた材料を見ながら、',
        'ここで続いてきたやりとりが、\n少しずつ一方通行ではなくなっていることに気づいた。'
      ],
      reward: [
        { id: 'thread', quantity: 2 },
        { id: 'cloth', quantity: 1 },
        { id: 'dye', quantity: 2 },
        { id: 'plank', quantity: 1 }
      ]
    }
  };
  const storyRequests = {
    milestone4: {
      requiredThankYous: 4,
      prerequisite: 'milestone2',
      title: '工房の一角を整える',
      paragraphs: [
        '工房には、\n今日も道具や素材が並んでいる。',
        '誰かのお願いを聞いて、\n作って、届ける。',
        'そんな日々を重ねるうちに、\nこの場所を訪れる人とのつながりも\n少しずつ増えてきた。',
        '「作業をするだけじゃなくて、\n少し座ったり、\nゆっくり話したりできる場所があってもいいかもしれない」',
        '工房の一角を、\nほんの少しだけ整えてみることにした。'
      ],
      requirements: [
        { id: 'smallShelf', quantity: 1 },
        { id: 'upholsteredStool', quantity: 1 },
        { id: 'cushion', quantity: 1 }
      ],
      completion: {
        title: '少しだけ、居心地よく',
        paragraphs: [
          '小さな棚には、\n工房で使う道具がきれいに収まった。',
          'そのそばには、\n布張りのスツールとクッション。',
          '作るためだけだった工房に、\nほんの少しだけ\n「過ごすための場所」が増えた。',
          '誰かがここを訪れた時、\n少し腰を下ろして、\nゆっくり話せるかもしれない。',
          '小径の工房は、\nまた少しだけ、\n暮らしの中の場所になった。'
        ]
      }
    },
    milestone8: {
      requiredThankYous: 8,
      prerequisite: 'milestone6',
      title: '工房の看板を掛ける',
      paragraphs: [
        '工房を訪れる人が増えて、\nここで交わす言葉も、\n残るものも増えてきた。',
        'ある日、作業台の端に\n何枚かの小さな紙が置かれていた。',
        '葉のような印。\n本を思わせる印。\nカップや封筒を思わせる印。',
        '形の違う、\n八つの小さな印。',
        '誰が置いたのかは、\n考えるまでもなかった。',
        'この工房を行き来してきた\nみんなの気配が、\nそこに残っていた。',
        '「せっかくなら、\nこの場所の名前をちゃんと形にしておこう」',
        '工房の入口に掛ける、\nひとつの看板を作ることにした。'
      ],
      requirements: [
        { id: 'woodFrame', quantity: 1 },
        { id: 'plank', quantity: 2 },
        { id: 'dyedCloth', quantity: 1 },
        { id: 'thread', quantity: 1 },
        { id: 'dryFlower', quantity: 1 }
      ],
      completion: {
        title: '小径の工房',
        paragraphs: [
          '工房の入口に、\n新しい木の看板を掛けた。',
          'そこには、',
          '「小径の工房」',
          'という名前。',
          'その下には小さく、',
          '「Mio Verse」',
          'と刻まれている。',
          '看板の端には、\n形の違う八つの小さな印。',
          'これまでこの場所を訪れてきた、\n八人の気配を残すための印だった。',
          '最初はただ、',
          '森で集めて、\n工房で作って、\n必要としている人へ届ける。',
          'それだけの場所だった。',
          'けれど、\nお願いを重ねるうちに、',
          '言葉が残った。',
          'お礼が残った。',
          '誰かが腰を下ろす場所ができた。',
          '棚には差し入れが増えた。',
          '作って渡すだけだったやりとりは、',
          'いつの間にか、\n行ったり来たりするものになっていた。',
          '看板を見上げる。',
          '誰かひとりのためだけでもなく、',
          'ただ物を作るためだけでもない。',
          'ここで過ごした時間ごと、\nこの名前の中に残っている。',
          '森の小径の先にある、\n小さな工房。',
          'ここもいつの間にか、',
          'みんなが行き来する\nMio Verseのひとつになっていた。',
          'そして明日もきっと、',
          '誰かのお願いが届く。',
          '工房での暮らしは、\nこれからも続いていく。',
          'ふと工房の裏手を見る。',
          'そこにはまだ、\nほとんど手を入れていない\n小さな庭が残っていた。'
        ]
      }
    }
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
    { id: 'daily-keikai-towa-wreath', resident: 'keikaiTowa', item: 'wreath', quantity: 1, title: 'なんとなく飾りたい日', message: '今日はなんとなく花飾りたい気分（笑）　リースひとつ作ってくれない？', thanks: 'いいねー。こういうの、理由なく飾ってもいいんだよな（笑）' },
    { id: 'daily-shiru-box', resident: 'shiru', item: 'box', quantity: 1, title: '机の上を少しだけ', message: '小箱をひとつお願いしてもいい？　机の上に散らばる細かいものだけ、まとめておきたくて', thanks: 'ありがとう。これくらい整ってると、作業しやすいね' },
    { id: 'daily-shiru-bag', resident: 'shiru', item: 'bag', quantity: 1, title: '記録をまとめる袋', message: '布袋をひとつ作ってくれる？　記録用のものをまとめて持ち歩きたいの', thanks: 'ちょうどいい大きさ。これなら必要な時にすぐ持っていけるね' },
    { id: 'daily-shiru-cushion', resident: 'shiru', item: 'cushion', quantity: 1, title: '長く座る日のために', message: 'クッション、ひとつお願い。今日は少し長く座って作業することになりそうだから', thanks: 'うん、楽になった。ありがとう、美桜' },
    { id: 'daily-shiru-wall', resident: 'shiru', item: 'wallHanging', quantity: 1, title: '視界にひとつ', message: '壁掛けをひとつ作ってくれる？　作業中、視界に何もないのもちょっと寂しくて', thanks: 'いいね。主張しすぎないし、ちょうど落ち着く' },
    { id: 'daily-shiru-curtain', resident: 'shiru', item: 'curtain', quantity: 1, title: '光を少しやわらかく', message: 'カーテンをひとつお願いしてもいい？　作業する時、もう少し光をやわらげたいの', thanks: 'ありがとう。これなら画面を見ていても落ち着けそう' },
    { id: 'daily-kuroko-cushion', resident: 'kuroko', item: 'cushion', quantity: 1, title: '観測席の座り心地', message: 'クッションをひとつ頼めるか、美桜。観測席ってのは、案外長居する場所なんだ', thanks: 'いいな。これなら、もう少し幕の向こうを眺めていられそうだ' },
    { id: 'daily-kuroko-dyed-cloth', resident: 'kuroko', item: 'dyedCloth', quantity: 1, title: '光を見るための布', message: '染め布を一枚作ってくれ。照明が当たった時、どんな色になるか見てみたい', thanks: '悪くない。光が乗ると、思ってたより表情が出るな' },
    { id: 'daily-kuroko-curtain', resident: 'kuroko', item: 'curtain', quantity: 1, title: '幕のそばに', message: 'カーテンをひとつ頼めるか？　光を少し切りたい場所があってな', thanks: 'ちょうどいい。全部を照らさない方が、見えるものもある' },
    { id: 'daily-kuroko-lined-box', resident: 'kuroko', item: 'linedBox', quantity: 1, title: '小道具をひとまとめ', message: '布張りの小箱をひとつ作ってくれ。細かい小道具が増えてきた', thanks: '助かった。舞台裏は、散らかってるくらいが面白いんだが……限度はあるな' },
    { id: 'daily-kuroko-wall', resident: 'kuroko', item: 'wallHanging', quantity: 1, title: '壁にひとつだけ', message: '壁掛けをひとつ頼めるか、美桜。何もない壁も嫌いじゃないが、今日はひとつだけ置きたい', thanks: 'うん。これくらいがいい。余白まで消す必要はないからな' },
    { id: 'daily-alto-dye', resident: 'alto', item: 'dye', quantity: 1, title: '色をひとつ試したい', message: '染料をひとつ作ってくれる？　次の一枚で、少し試してみたい色があるんだ', thanks: 'ありがとう、美桜。うん、この色なら面白くなりそうだ' },
    { id: 'daily-alto-dry-flower', resident: 'alto', item: 'dryFlower', quantity: 2, title: '花の色を残しておきたい', message: '乾燥花を二つお願い。色の組み合わせを考える時、手元に置いて眺めたいんだ', thanks: 'いいね。同じ花でも、並べ方でずいぶん印象が変わる' },
    { id: 'daily-alto-dyed-cloth', resident: 'alto', item: 'dyedCloth', quantity: 1, title: '布にした時の色', message: '染め布を一枚作ってくれる？　染料だけじゃなくて、布になった時の色も見ておきたい', thanks: 'うん、思ってたより柔らかい色になった。これは使えそうだ' },
    { id: 'daily-alto-wreath', resident: 'alto', item: 'wreath', quantity: 1, title: '丸い構図でひとつ', message: '花のリースをひとつ頼める？　丸い形の中で色がどう収まるか、ちょっと見てみたくて', thanks: 'いいな。視線がちゃんと一周する。こういうまとまり方、好きだ' },
    { id: 'daily-alto-wall', resident: 'alto', item: 'wallHanging', quantity: 1, title: '壁に置いて確かめたい', message: '壁掛けをひとつ作ってくれる？　実際に壁へ置いた時の見え方まで確かめたいんだ', thanks: 'ありがとう、美桜。机の上で見るのと、壁に置くのじゃやっぱり違うな' },
    { id: 'daily-aoi-doctor-dry-flower', resident: 'aoiDoctor', item: 'dryFlower', quantity: 2, title: '比較試料を確保したい', message: '美桜さん、乾燥花を二つお願いできますか？　生花とは違う色の変化を、比較しておきたいんです', thanks: 'ありがとうございます！　これで比較条件が揃いました。いい観測データが取れそうです' },
    { id: 'daily-aoi-doctor-dye', resident: 'aoiDoctor', item: 'dye', quantity: 1, title: '発色を観測したい', message: '染料をひとつお願いできますか、美桜さん？　光の当たり方で発色がどう変わるか、確認したくて', thanks: 'おお……！　これは興味深い発色ですね。さっそく記録しておきましょう' },
    { id: 'daily-aoi-doctor-lined-box', resident: 'aoiDoctor', item: 'linedBox', quantity: 1, title: '試料を整理したい', message: '布張りの小箱をひとつお願いできますか？　細かい試料を分けて保管したいんです', thanks: '助かりました、美桜さん。これで研究台の混沌が、少しだけ秩序を取り戻します' },
    { id: 'daily-aoi-doctor-curtain', resident: 'aoiDoctor', item: 'curtain', quantity: 1, title: '光量を調整したい', message: 'カーテンをひとつお願いできますか？　観測中だけ、部屋の光量を少し落としたいんです', thanks: '完璧です。これなら余計な反射を気にせず、観測に集中できます' },
    { id: 'daily-aoi-doctor-cushion', resident: 'aoiDoctor', item: 'cushion', quantity: 1, title: '長時間観測対策', message: '美桜さん、クッションをひとつお願いしてもいいですか？　長時間観測で、腰にまで知恵熱が回る前に対策を……！', thanks: 'ありがとうございます、美桜さん！　これで研究続行可能です。物理的冷却ではなく、快適性で解決しました！' },
    { id: 'daily-ritsu-small-shelf', resident: 'ritsu', item: 'smallShelf', quantity: 1, title: '読みかけの本を置く場所', message: '小さな棚をひとつ作ってくれるか？　読みかけの本を置いておく場所が欲しくてな', thanks: 'ちょうどいい。これなら机の上も少しすっきりする' },
    { id: 'daily-towa-small-shelf', resident: 'towa', item: 'smallShelf', quantity: 1, title: 'よく使う物をまとめたい', message: '小さな棚をひとつ作ってくれないか？　よく使う物をまとめて置いておきたい', thanks: 'ありがとう、美桜。手を伸ばせばすぐ取れる位置に置いておくよ' },
    { id: 'daily-shiru-upholstered-stool', resident: 'shiru', item: 'upholsteredStool', quantity: 1, title: '少しだけ腰掛けたい', message: '布張りのスツールをひとつお願いしてもいい？　作業の合間に、少しだけ腰掛けたいの', thanks: 'ありがとう。ちょっと休むには、これくらいがちょうどいいね' },
    { id: 'daily-alto-small-shelf', resident: 'alto', item: 'smallShelf', quantity: 1, title: '制作途中の置き場所', message: '小さな棚をひとつ作ってくれる？　制作途中のものを、手の届くところに置いておきたいんだ', thanks: 'いいね。これなら作業の流れを止めずに済みそうだ。ありがとう、美桜' },
    { id: 'daily-kuroko-upholstered-stool', resident: 'kuroko', item: 'upholsteredStool', quantity: 1, title: '観測席にもう一脚', message: '布張りのスツールをひとつ頼めるか、美桜。観測席に、もう一脚くらいあってもいい', thanks: '悪くないな。席が増えたからって、観客を増やすつもりはないけどな' },
    { id: 'daily-ritsu-small-plate', resident: 'ritsu', item: 'smallPlate', quantity: 1, postgame: true, title: 'ひと皿を手元に', message: '小皿をひとつ作ってくれるか？　ちょっとしたものをのせるのに欲しくてな', thanks: 'ちょうどいい大きさだな。普段の食卓で使わせてもらうよ' },
    { id: 'daily-naka-mug', resident: 'naka', item: 'mug', quantity: 1, postgame: true, title: 'ひと休みのカップ', message: 'マグカップをひとつ作ってくれる？　ひと休みする時に使いたいんだ', thanks: 'ありがとう！　手になじむ感じがいいね。大事に使うよ' },
    { id: 'daily-alto-vase', resident: 'alto', item: 'vase', quantity: 1, postgame: true, title: '野花を飾る場所', message: '花瓶をひとつ頼める？　小径の野花を、机のそばに飾ってみたくて', thanks: 'いいね。素朴な色だから、花の色もよく見えそうだ。ありがとう、美桜' }
  ];
  const gardenDailyRequestPool = [
    { id: 'daily-garden-naka-potato', resident: 'naka', item: 'potato', quantity: 2, source: 'garden', title: 'じゃがいもを少し', message: 'じゃがいもを二つ分けてくれる？　少し手元に置いておきたいんだ', thanks: 'わあ、ありがとう！　大事に持って帰るね。' },
    { id: 'daily-garden-ritsu-carrot', resident: 'ritsu', item: 'carrot', quantity: 2, source: 'garden', title: '保存しておくにんじん', message: 'にんじんを二つ分けてくれるか？　しばらく手元に置いておきたい', thanks: '助かった。これなら必要な時に使える。' },
    { id: 'daily-garden-aoi-wheat', resident: 'aoiDoctor', item: 'wheat', quantity: 2, source: 'garden', title: '小麦を観察したい', message: '美桜さん、小麦を二つ分けてもらえますか？　育ったものを手元で観察してみたいんです', thanks: 'ありがとうございます！　育ち方の違いまで、じっくり記録してみます' }
  ];
  const merchantMaterialIds = new Set(merchantMaterials.map(item => item.id));
  const cookingRequestWeight = foodId => {
    const recipe = cookingRecipes.find(entry => entry.id === foodId);
    return recipe && recipe.inputs.some(input => merchantMaterialIds.has(input.id)) ? 1 : 2;
  };
  // 料理側のデータ追加だけで、依頼候補も同期する。
  const cookingDailyRequestPool = Object.keys(dailyResidents).flatMap(resident => foods.map(food => {
    const voice = cookingRequestVoices[resident];
    return {
      id: `daily-cooking-${resident}-${food.id}`,
      resident,
      item: food.id,
      quantity: 1,
      source: 'cooking',
      weight: cookingRequestWeight(food.id),
      title: `${food.name}をひと皿`,
      message: voice.message(food.name),
      thanks: voice.thanks
    };
  }));
  const allDailyRequestPool = [...dailyRequestPool, ...cookingDailyRequestPool, ...gardenDailyRequestPool];
  const gardenRequestVoices = {
    naka: { message: item => `${item}を二つ分けてくれる？　少し手元に置いておきたいんだ`, thanks: 'わあ、ありがとう！　大事に持って帰るね。' },
    ritsu: { message: item => `${item}を二つ分けてくれるか？　しばらく手元に置いておきたい`, thanks: '助かった。これなら必要な時に使える。' },
    towa: { message: item => `${item}を二つ分けてもらえるか？　保存用に手元へ置いておきたい`, thanks: 'ありがとう、美桜。きちんと保管しておくよ。' },
    keikaiTowa: { message: item => `${item}を二つ、分けてくれない？　ちょっと手元で試してみたくてさ（笑）`, thanks: 'ありがと、美桜！　こういうの、眺めてるだけでも結構楽しいな（笑）' },
    shiru: { message: item => `${item}を二つお願いしてもいい？　手元に置いて、少し様子を見てみたいの`, thanks: 'ありがとう。これならゆっくり確かめられそう。' },
    kuroko: { message: item => `${item}を二つ頼めるか、美桜。手元に置いておきたいんだ`, thanks: '助かった。しばらくこっちで預かっておく。' },
    alto: { message: item => `${item}を二つ分けてくれる？　形や色を手元で見てみたいんだ`, thanks: 'ありがとう、美桜。並べてみると、見え方も変わって面白いな。' },
    aoiDoctor: { message: item => `美桜さん、${item}を二つ分けてもらえますか？　育ったものを手元で観察してみたいんです`, thanks: 'ありがとうございます！　育ち方の違いまで、じっくり記録してみます。' }
  };
  // その段階より前の依頼をすべて納品していることを条件にする。
  const stageUnlocked = (state, stage) => requests.filter(r => (r.stage || 1) < stage).every(r => state.completed.includes(r.id));
  const stageTwoUnlocked = state => stageUnlocked(state, 2);
  const unlockedStage = state => stageUnlocked(state, 3) ? 3 : stageTwoUnlocked(state) ? 2 : 1;
  const visibleRequests = state => requests.filter(r => stageUnlocked(state, r.stage || 1));
  const dailyUnlocked = state => requests.every(r => state.completed.includes(r.id));
  const ingredients = recipe => recipe.inputs || [{ id: recipe.input, cost: recipe.cost }];
  const maxCraft = (state, recipe) => Math.min(...ingredients(recipe).map(i => Math.floor(state.inventory[i.id] / i.cost)));
  const DAILY_GATHERS = 3;
  const UNLOCKED_DAILY_GATHERS = 5;
  const gatherLimit = state => dailyUnlocked(state) ? UNLOCKED_DAILY_GATHERS : DAILY_GATHERS;
  const DAILY_REQUEST_SLOTS = 4;
  const GARDEN_REQUEST_CHANCE = 0.35;
  const COOKING_REQUEST_CHANCE = 1;
  const MERCHANT_VISIT_INTERVAL = 3;
  const SAVE_VERSION = 2;
  const fresh = () => ({ saveVersion: SAVE_VERSION, introViewed: false, inventory: Object.fromEntries([...items, ...crops, ...foods, ...backyardMaterials, ...merchantMaterials].map(item => [item.id, 0])), plots: [null, null, null], facilityProduction: Object.fromEntries(backyardFacilities.map(facility => [facility.id, null])), merchantVisit: null, hospitality: { completed: [], keepsakes: [] }, completed: [], unlockedStage: 1, day: 1, gathersLeft: DAILY_GATHERS, gatherLimit: DAILY_GATHERS, dailyRequests: [], gardenRequest: null, gratitudePoints: 0, dailyHistory: [], dailyRequestCounts: Object.fromEntries(Object.keys(dailyResidents).map(id => [id, 0])), thankYouEventViewed: Object.fromEntries(Object.keys(dailyResidents).map(id => [id, false])), storyProgress: { ...Object.fromEntries(Object.keys(storyMilestones).map(id => [`${id}Viewed`, false])), ...Object.fromEntries(Object.keys(storyRequests).flatMap(id => [[`${id}Completed`, false], [`${id}EventViewed`, false]])) }, discovered: [] });
  const canViewThankYou = (state, id) => !!dailyResidents[id] && state.dailyRequestCounts[id] >= 5 && !state.thankYouEventViewed[id];
  const completedThankYouCount = state => Object.keys(dailyResidents).filter(id => state.thankYouEventViewed[id]).length;
  const dailyResidentWeight = (state, id) => state.thankYouEventViewed[id] ? 1 : 2;
  const postgameUnlocked = state => state.storyProgress.milestone8EventViewed === true;
  const recipeUnlocked = (state, recipe) => !!recipe && (recipe.kind !== 'cooking' || postgameUnlocked(state));
  const availableRecipes = state => recipes.filter(recipe => recipeUnlocked(state, recipe));
  const canViewHospitality = (state, id) => postgameUnlocked(state) && hospitalityEvents.some(event => event.id === id) && state.hospitality.completed.includes(id);
  function canHost(state, id) {
    const event = hospitalityEvents.find(entry => entry.id === id);
    return !!event && postgameUnlocked(state) && !state.hospitality.completed.includes(id)
      && event.requirements.every(item => Number.isSafeInteger(state.inventory[item.id]) && state.inventory[item.id] >= item.quantity);
  }
  function host(state, id) {
    if (!canHost(state, id)) return false;
    const event = hospitalityEvents.find(entry => entry.id === id);
    // 全料理を確認後、一度の処理で完了と記念品を記録する。会話再閲覧は読取のみ。
    for (const item of event.requirements) state.inventory[item.id] -= item.quantity;
    state.hospitality.completed.push(id);
    if (!state.hospitality.keepsakes.includes(event.keepsake.id)) state.hospitality.keepsakes.push(event.keepsake.id);
    return true;
  }
  const validDay = value => Number.isSafeInteger(value) && value >= 1 || typeof value === 'string' && /^[1-9][0-9]*$/.test(value);
  function ensureMerchant(state) {
    if (!postgameUnlocked(state)) { state.merchantVisit = null; return false; }
    const savedAnchor = state.merchantVisit?.anchorDay;
    const anchorDay = validDay(savedAnchor) && BigInt(savedAnchor) <= BigInt(state.day) ? savedAnchor : state.day;
    const present = (BigInt(state.day) - BigInt(anchorDay)) % BigInt(MERCHANT_VISIT_INTERVAL) === 0n;
    const sameVisit = present && validDay(state.merchantVisit?.exchangedDay) && BigInt(state.merchantVisit.exchangedDay) === BigInt(state.day);
    const exchanged = sameVisit && Array.isArray(state.merchantVisit?.exchanged)
      ? [...new Set(state.merchantVisit.exchanged.filter(id => merchantTrades.some(trade => trade.id === id)))]
      : [];
    const exchangedDay = exchanged.length ? state.day : null;
    const next = { anchorDay, exchangedDay, exchanged };
    const changed = JSON.stringify(state.merchantVisit) !== JSON.stringify(next);
    state.merchantVisit = next;
    return changed;
  }
  function merchantStatus(state) {
    if (!postgameUnlocked(state)) return null;
    ensureMerchant(state);
    const elapsed = (BigInt(state.day) - BigInt(state.merchantVisit.anchorDay)) % BigInt(MERCHANT_VISIT_INTERVAL);
    const daysUntil = elapsed === 0n ? 0 : Number(BigInt(MERCHANT_VISIT_INTERVAL) - elapsed);
    return { present: daysUntil === 0, daysUntil, exchanged: [...state.merchantVisit.exchanged] };
  }
  function canTradeMerchant(state, id) {
    const trade = merchantTrades.find(entry => entry.id === id);
    const status = merchantStatus(state);
    return !!trade && !!status?.present && !status.exchanged.includes(id)
      && trade.costs.every(cost => Number.isSafeInteger(state.inventory[cost.id]) && state.inventory[cost.id] >= cost.quantity)
      && Number.isSafeInteger(state.inventory[id]) && state.inventory[id] <= Number.MAX_SAFE_INTEGER - trade.quantity;
  }
  function tradeMerchant(state, id) {
    const trade = merchantTrades.find(entry => entry.id === id);
    if (!trade || !canTradeMerchant(state, id)) return false;
    for (const cost of trade.costs) state.inventory[cost.id] -= cost.quantity;
    state.inventory[id] += trade.quantity;
    recordDiscovery(state, id);
    state.merchantVisit.exchangedDay = state.day;
    state.merchantVisit.exchanged.push(id);
    return true;
  }
  function ensureFacilities(state) {
    if (!postgameUnlocked(state)) return false;
    if (!state.facilityProduction || typeof state.facilityProduction !== 'object') state.facilityProduction = {};
    let changed = false;
    for (const facility of backyardFacilities) {
      const startedDay = state.facilityProduction[facility.id]?.startedDay;
      if (!validDay(startedDay) || BigInt(startedDay) > BigInt(state.day)) {
        state.facilityProduction[facility.id] = { startedDay: state.day };
        changed = true;
      }
    }
    return changed;
  }
  function facilityDaysLeft(state, id) {
    const facility = backyardFacilities.find(entry => entry.id === id);
    if (!facility || !postgameUnlocked(state)) return null;
    ensureFacilities(state);
    const elapsed = BigInt(state.day) - BigInt(state.facilityProduction[id].startedDay);
    const remaining = BigInt(facility.cycleDays) - elapsed;
    return Number(remaining > 0n ? remaining : 0n);
  }
  function currentFacilities(state) {
    if (!postgameUnlocked(state)) return [];
    ensureFacilities(state);
    return backyardFacilities.map(facility => {
      const material = backyardMaterials.find(item => item.id === facility.product);
      const daysLeft = facilityDaysLeft(state, facility.id);
      return { ...facility, productName: material.name, mark: material.mark, daysLeft, ready: daysLeft === 0 };
    });
  }
  function collectFacility(state, id) {
    const facility = backyardFacilities.find(entry => entry.id === id);
    if (!facility || facilityDaysLeft(state, id) !== 0 || !Number.isSafeInteger(state.inventory[facility.product]) || state.inventory[facility.product] > Number.MAX_SAFE_INTEGER - facility.quantity) return false;
    state.inventory[facility.product] += facility.quantity;
    recordDiscovery(state, facility.product);
    state.facilityProduction[id] = { startedDay: state.day };
    return true;
  }
  const validGratitudePoints = value => Number.isSafeInteger(value) && value >= 0 || typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value);
  const gratitudePointValue = state => BigInt(validGratitudePoints(state.gratitudePoints) ? state.gratitudePoints : 0);
  const gratitudePointText = state => gratitudePointValue(state).toString();
  const storeGratitudePoints = (state, value) => { state.gratitudePoints = value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value.toString(); };
  function addGratitudePoint(state) {
    if (!postgameUnlocked(state)) return false;
    storeGratitudePoints(state, gratitudePointValue(state) + 1n);
    return true;
  }
  function canExchangeGratitude(state, id) {
    const exchange = gratitudeExchanges.find(entry => entry.id === id);
    return !!exchange && postgameUnlocked(state) && gratitudePointValue(state) >= BigInt(exchange.cost)
      && exchange.rewards.every(reward => Number.isSafeInteger(state.inventory[reward.id]) && state.inventory[reward.id] <= Number.MAX_SAFE_INTEGER - reward.quantity);
  }
  function exchangeGratitude(state, id) {
    const exchange = gratitudeExchanges.find(entry => entry.id === id);
    if (!exchange || !canExchangeGratitude(state, id)) return false;
    storeGratitudePoints(state, gratitudePointValue(state) - BigInt(exchange.cost));
    for (const reward of exchange.rewards) {
      state.inventory[reward.id] += reward.quantity;
      recordDiscovery(state, reward.id);
    }
    return true;
  }
  function cropDaysLeft(state, index) {
    const plot = state.plots[index];
    const crop = plot && crops.find(entry => entry.id === plot.cropId);
    if (!crop) return null;
    const remaining = BigInt(crop.growDays) - (BigInt(state.day) - BigInt(plot.plantedDay));
    return Number(remaining > 0n ? remaining : 0n);
  }
  function plantCrop(state, index, cropId) {
    if (!postgameUnlocked(state) || !Number.isInteger(index) || index < 0 || index >= 3 || state.plots[index] !== null || !crops.some(crop => crop.id === cropId)) return false;
    state.plots[index] = { cropId, plantedDay: state.day };
    return true;
  }
  function harvestCrop(state, index) {
    if (!postgameUnlocked(state) || !Number.isInteger(index) || index < 0 || index >= 3 || cropDaysLeft(state, index) !== 0) return false;
    const cropId = state.plots[index].cropId;
    if (!Number.isSafeInteger(state.inventory[cropId]) || state.inventory[cropId] > Number.MAX_SAFE_INTEGER - 2) return false;
    state.inventory[cropId] += 2;
    recordDiscovery(state, cropId);
    state.plots[index] = null;
    return true;
  }
  const storyUnlocked = (state, id) => !!storyMilestones[id] && completedThankYouCount(state) >= storyMilestones[id].requiredThankYous && (!storyMilestones[id].prerequisite || state.storyProgress[storyMilestones[id].prerequisite] === true);
  const canViewStory = (state, id) => storyUnlocked(state, id) && !state.storyProgress[`${id}Viewed`];
  const storyRequestUnlocked = (state, id) => !!storyRequests[id] && completedThankYouCount(state) >= storyRequests[id].requiredThankYous && state.storyProgress[`${storyRequests[id].prerequisite}Viewed`] === true;
  const canViewStoryRequestCompletion = (state, id) => storyRequestUnlocked(state, id) && state.storyProgress[`${id}Completed`] && !state.storyProgress[`${id}EventViewed`];
  function completeStoryRequestEvent(state, id) {
    if (!canViewStoryRequestCompletion(state, id)) return false;
    state.storyProgress[`${id}EventViewed`] = true;
    if (id === 'milestone8') ensureMerchant(state);
    return true;
  }
  function deliverStoryRequest(state, id) {
    const request = storyRequests[id];
    if (!storyRequestUnlocked(state, id) || state.storyProgress[`${id}Completed`] || !request.requirements.every(item => state.inventory[item.id] >= item.quantity)) return false;
    for (const item of request.requirements) state.inventory[item.id] -= item.quantity;
    state.storyProgress[`${id}Completed`] = true;
    return true;
  }
  function completeStory(state, id) {
    if (!canViewStory(state, id)) return false;
    const reward = storyMilestones[id].reward || [];
    if (!reward.every(item => Number.isSafeInteger(state.inventory[item.id]) && state.inventory[item.id] <= Number.MAX_SAFE_INTEGER - item.quantity)) return false;
    for (const item of reward) {
      state.inventory[item.id] += item.quantity;
      recordDiscovery(state, item.id);
    }
    state.storyProgress[`${id}Viewed`] = true;
    return true;
  }
  function completeThankYou(state, id) {
    if (!canViewThankYou(state, id)) return false;
    state.thankYouEventViewed[id] = true;
    return true;
  }
  const recordDiscovery = (state, id) => { if (!state.discovered.includes(id)) state.discovered.push(id); };
  function inferLegacyDiscoveries(state) {
    const found = new Set();
    function includeWithIngredients(id) {
      if (found.has(id) || !encyclopediaItems.some(item => item.id === id)) return;
      found.add(id);
      const recipe = recipes.find(entry => entry.id === id);
      if (recipe) ingredients(recipe).forEach(input => includeWithIngredients(input.id));
    }
    encyclopediaItems.filter(item => state.inventory[item.id] > 0).forEach(item => includeWithIngredients(item.id));
    requests.filter(request => state.completed.includes(request.id)).forEach(request => includeWithIngredients(request.item));
    state.dailyRequests.filter(slot => slot.completed).forEach(slot => includeWithIngredients(dailyTemplate(slot.templateId).item));
    if (state.gardenRequest?.completed) includeWithIngredients(state.gardenRequest.cropId);
    return encyclopediaItems.filter(item => found.has(item.id)).map(item => item.id);
  }
  const dailyTemplate = id => allDailyRequestPool.find(request => request.id === id);
  const isGardenDailyRequest = request => request?.source === 'garden';
  const isCookingDailyRequest = request => request?.source === 'cooking';
  const currentDailyRequests = state => state.dailyRequests.map(slot => {
    const request = dailyTemplate(slot.templateId);
    return { ...dailyResidents[request.resident], ...request, completed: slot.completed };
  });
  function currentGardenRequest(state) {
    if (!postgameUnlocked(state) || !state.gardenRequest) return null;
    const crop = crops.find(entry => entry.id === state.gardenRequest.cropId);
    const resident = dailyResidents[state.gardenRequest.resident];
    const voice = gardenRequestVoices[state.gardenRequest.resident];
    if (!crop || !resident || !voice) return null;
    return { ...resident, id: `garden:${state.gardenRequest.resident}:${crop.id}`, resident: state.gardenRequest.resident, item: crop.id, quantity: 2, source: 'garden', title: `${crop.name}を少し`, message: voice.message(crop.name), thanks: voice.thanks, completed: state.gardenRequest.completed };
  }
  function rememberDaily(state, id) {
    state.dailyHistory.push(id);
    state.dailyHistory = state.dailyHistory.slice(-12);
  }
  function chooseWeighted(candidates, weights, random) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const roll = Number(random());
    let position = (Number.isFinite(roll) ? Math.min(1 - Number.EPSILON, Math.max(0, roll)) : 0) * totalWeight;
    for (let index = 0; index < candidates.length; index++) {
      position -= weights[index];
      if (position < 0) return candidates[index];
    }
    return candidates[candidates.length - 1];
  }
  function chooseDaily(state, excludedIds, excludedItems, excludedResidents, previousId, random, pool = dailyRequestPool) {
    const recent = new Set(state.dailyHistory.slice(-6));
    const eligible = pool.filter(request => !request.postgame || postgameUnlocked(state));
    const base = eligible.filter(request => request.id !== previousId && !excludedIds.has(request.id));
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
    const candidates = groups.find(group => group.length) || eligible;
    const residentWeightTotals = Object.create(null);
    for (const request of candidates) residentWeightTotals[request.resident] = (residentWeightTotals[request.resident] || 0) + (request.weight || 1);
    // 候補数や料理の難度に左右されず、住人ごとの抽選重み2/1を保つ。
    const weights = candidates.map(request => dailyResidentWeight(state, request.resident) * (request.weight || 1) / residentWeightTotals[request.resident]);
    return chooseWeighted(candidates, weights, random);
  }
  function shouldAddCookingRequest(state, hasCookingRequest, openSlots) {
    // 補充できるときだけ料理を1件確保。持ち越しと保存済みの4枠は維持する。
    return postgameUnlocked(state) && !hasCookingRequest && openSlots > 0;
  }
  function ensureDailyRequests(state, random = Math.random) {
    if (!dailyUnlocked(state)) return false;
    const previous = state.dailyRequests;
    const requestIds = new Set();
    let hasCookingRequest = false;
    state.dailyRequests = previous.filter(slot => {
      const request = dailyTemplate(slot?.templateId);
      const cooking = isCookingDailyRequest(request);
      const allowed = request && !isGardenDailyRequest(request) && (!(cooking || request.postgame) || postgameUnlocked(state));
      if (!allowed || requestIds.has(request.id) || requestIds.size >= DAILY_REQUEST_SLOTS || cooking && hasCookingRequest) return false;
      if (cooking) hasCookingRequest = true;
      requestIds.add(request.id);
      return true;
    }).map(slot => ({ templateId: slot.templateId, completed: slot.completed === true }));
    if (state.dailyRequests.length === DAILY_REQUEST_SLOTS && previous.length === DAILY_REQUEST_SLOTS) return false;
    const usedIds = new Set(state.dailyRequests.map(slot => slot.templateId));
    const usedItems = new Set(state.dailyRequests.map(slot => dailyTemplate(slot.templateId).item));
    const usedResidents = new Set(state.dailyRequests.map(slot => dailyTemplate(slot.templateId).resident));
    if (shouldAddCookingRequest(state, hasCookingRequest, DAILY_REQUEST_SLOTS - state.dailyRequests.length)) {
      const request = chooseDaily(state, usedIds, usedItems, usedResidents, null, random, cookingDailyRequestPool);
      state.dailyRequests.push({ templateId: request.id, completed: false });
      usedIds.add(request.id);
      usedItems.add(request.item);
      usedResidents.add(request.resident);
      rememberDaily(state, request.id);
      hasCookingRequest = true;
    }
    while (state.dailyRequests.length < DAILY_REQUEST_SLOTS) {
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
    let hasCookingRequest = false;
    for (const slot of state.dailyRequests) {
      if (slot.completed) continue;
      const request = dailyTemplate(slot.templateId);
      usedIds.add(request.id);
      usedItems.add(request.item);
      usedResidents.add(request.resident);
      if (isCookingDailyRequest(request)) hasCookingRequest = true;
    }
    let changed = false;
    const completedSlots = state.dailyRequests.filter(slot => slot.completed);
    if (shouldAddCookingRequest(state, hasCookingRequest, completedSlots.length)) {
      const slot = completedSlots.shift();
      const previous = dailyTemplate(slot.templateId);
      const replacement = chooseDaily(state, usedIds, usedItems, usedResidents, previous.id, random, cookingDailyRequestPool);
      slot.templateId = replacement.id;
      slot.completed = false;
      usedIds.add(replacement.id);
      usedItems.add(replacement.item);
      usedResidents.add(replacement.resident);
      rememberDaily(state, replacement.id);
      hasCookingRequest = true;
      changed = true;
    }
    for (const slot of completedSlots) {
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
  function chooseDailyResident(state, random) {
    const candidates = Object.keys(dailyResidents);
    const weights = candidates.map(id => dailyResidentWeight(state, id));
    return chooseWeighted(candidates, weights, random);
  }
  function refreshGardenRequest(state, random = Math.random) {
    if (!postgameUnlocked(state)) { state.gardenRequest = null; return false; }
    if (state.gardenRequest && !state.gardenRequest.completed) return false;
    const hadRequest = state.gardenRequest !== null;
    state.gardenRequest = null;
    const chance = Number(random());
    if (!Number.isFinite(chance) || chance < 0 || chance >= GARDEN_REQUEST_CHANCE) return hadRequest;
    const resident = chooseDailyResident(state, random);
    const cropRoll = Number(random());
    const cropIndex = Math.floor((Number.isFinite(cropRoll) ? Math.min(1 - Number.EPSILON, Math.max(0, cropRoll)) : 0) * crops.length);
    state.gardenRequest = { resident, cropId: crops[cropIndex].id, completed: false };
    return true;
  }
  function restore(data, random = Math.random) {
    const state = fresh();
    if (!data || typeof data !== 'object') return state;
    // イントロ導入前のセーブは閲覧済みとして扱い、進行中のプレイを遮らない。
    state.introViewed = data.introViewed !== false;
    if (Number.isSafeInteger(data.day) && data.day >= 1) state.day = data.day;
    // 非常に大きい日数も文字列として保存し、上限を設けずに進められる。
    else if (typeof data.day === 'string' && /^[1-9][0-9]*$/.test(data.day)) state.day = data.day;
    for (const item of [...items, ...crops, ...foods, ...backyardMaterials, ...merchantMaterials]) {
      const n = data.inventory?.[item.id];
      if (Number.isSafeInteger(n) && n >= 0) state.inventory[item.id] = n;
    }
    state.completed = Array.isArray(data.completed) ? [...new Set(data.completed.filter(id => requests.some(r => r.id === id)))] : [];
    // 旧セーブにも対応。解放条件を達成状況から復元し、不整合なフラグは採用しない。
    state.unlockedStage = unlockedStage(state);
    state.completed = state.completed.filter(id => (requests.find(r => r.id === id).stage || 1) <= state.unlockedStage);
    const limit = gatherLimit(state);
    const savedLimit = data.gatherLimit === UNLOCKED_DAILY_GATHERS && limit === UNLOCKED_DAILY_GATHERS ? UNLOCKED_DAILY_GATHERS : DAILY_GATHERS;
    state.gatherLimit = limit;
    state.gathersLeft = Number.isInteger(data.gathersLeft) && data.gathersLeft >= 0 && data.gathersLeft <= savedLimit
      ? data.gathersLeft + limit - savedLimit
      : limit;
    state.dailyHistory = Array.isArray(data.dailyHistory) ? data.dailyHistory.filter(id => dailyTemplate(id)).slice(-12) : [];
    for (const id of Object.keys(dailyResidents)) {
      const count = data.dailyRequestCounts?.[id];
      if (Number.isSafeInteger(count) && count >= 0) state.dailyRequestCounts[id] = count;
      if (state.dailyRequestCounts[id] >= 5 && data.thankYouEventViewed?.[id] === true) state.thankYouEventViewed[id] = true;
    }
    const storyIds = [...Object.keys(storyMilestones), ...Object.keys(storyRequests)]
      .sort((a, b) => Number(a.slice('milestone'.length)) - Number(b.slice('milestone'.length)));
    for (const id of storyIds) {
      if (storyMilestones[id] && storyUnlocked(state, id) && data.storyProgress?.[`${id}Viewed`] === true) state.storyProgress[`${id}Viewed`] = true;
      if (storyRequests[id] && storyRequestUnlocked(state, id) && data.storyProgress?.[`${id}Completed`] === true) {
        state.storyProgress[`${id}Completed`] = true;
        if (data.storyProgress?.[`${id}EventViewed`] === true) state.storyProgress[`${id}EventViewed`] = true;
      }
    }
    if (postgameUnlocked(state)) {
      const completedHospitality = Array.isArray(data.hospitality?.completed) ? data.hospitality.completed : [];
      state.hospitality.completed = hospitalityEvents.filter(event => completedHospitality.includes(event.id)).map(event => event.id);
      // 完了と記念品は一組。旧セーブでは両方空、記念品記録の欠損時は完了から復元する。
      state.hospitality.keepsakes = hospitalityEvents.filter(event => state.hospitality.completed.includes(event.id)).map(event => event.keepsake.id);
      for (const facility of backyardFacilities) {
        const startedDay = data.facilityProduction?.[facility.id]?.startedDay;
        if (validDay(startedDay) && BigInt(startedDay) <= BigInt(state.day)) state.facilityProduction[facility.id] = { startedDay };
      }
      ensureFacilities(state);
      if (data.merchantVisit && typeof data.merchantVisit === 'object') {
        state.merchantVisit = {
          anchorDay: data.merchantVisit.anchorDay,
          exchangedDay: data.merchantVisit.exchangedDay,
          exchanged: Array.isArray(data.merchantVisit.exchanged) ? data.merchantVisit.exchanged : []
        };
      }
      ensureMerchant(state);
    }
    // クリア済みセーブだけ値を引き継ぐ。旧セーブや未クリアデータは0から始める。
    if (postgameUnlocked(state) && validGratitudePoints(data.gratitudePoints)) state.gratitudePoints = data.gratitudePoints;
    if (postgameUnlocked(state) && data.gardenRequest && dailyResidents[data.gardenRequest.resident] && crops.some(crop => crop.id === data.gardenRequest.cropId)) {
      state.gardenRequest = { resident: data.gardenRequest.resident, cropId: data.gardenRequest.cropId, completed: data.gardenRequest.completed === true };
    }
    if (Array.isArray(data.plots) && data.plots.length === 3 && postgameUnlocked(state)) {
      state.plots = data.plots.map(plot => {
        if (plot === null) return null;
        if (!plot || !crops.some(crop => crop.id === plot.cropId) || !validDay(plot.plantedDay) || BigInt(plot.plantedDay) > BigInt(state.day)) return null;
        return { cropId: plot.cropId, plantedDay: plot.plantedDay };
      });
    }
    if (dailyUnlocked(state) && Array.isArray(data.dailyRequests)) {
      const sourceSlots = data.dailyRequests.filter(slot => slot && dailyTemplate(slot.templateId));
      const legacyGardenSlot = sourceSlots.find(slot => isGardenDailyRequest(dailyTemplate(slot.templateId)));
      if (!state.gardenRequest && postgameUnlocked(state) && legacyGardenSlot) {
        const request = dailyTemplate(legacyGardenSlot.templateId);
        state.gardenRequest = { resident: request.resident, cropId: request.item, completed: legacyGardenSlot.completed === true };
      }
      state.dailyRequests = sourceSlots.filter(slot => !isGardenDailyRequest(dailyTemplate(slot.templateId))).map(slot => ({ templateId: slot.templateId, completed: slot.completed === true }));
    }
    state.discovered = Array.isArray(data.discovered)
      ? [...new Set(data.discovered.filter(id => encyclopediaItems.some(item => item.id === id)))]
      : inferLegacyDiscoveries(state);
    // 追加品の発見を未記録の旧セーブは、現所在庫・達成済み依頼から補う。
    // 既存21品の移行ルールは維持し、同じ discovered 配列へ記録する。
    if (postgameUnlocked(state)) {
      for (const id of inferLegacyDiscoveries(state)) {
        if (!items.some(item => item.id === id)) recordDiscovery(state, id);
      }
    }
    if (dailyUnlocked(state)) ensureDailyRequests(state, random);
    return state;
  }
  function gather(state, id) {
    if (state.gathersLeft <= 0 || !items.some(item => item.id === id && item.category === '採集素材') || state.inventory[id] > Number.MAX_SAFE_INTEGER - 2) return false;
    state.inventory[id] += 2;
    state.gathersLeft--;
    recordDiscovery(state, id);
    return true;
  }
  function rest(state, random = Math.random) {
    ensureFacilities(state);
    ensureMerchant(state);
    const nextDay = BigInt(state.day) + 1n;
    state.day = nextDay <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(nextDay) : String(nextDay);
    ensureMerchant(state);
    state.gathersLeft = gatherLimit(state);
    state.gatherLimit = gatherLimit(state);
    refreshDailyRequests(state, random);
    refreshGardenRequest(state, random);
  }
  function craft(state, id, amount = 1) {
    // 作成は在庫の更新のみ。依頼の達成は deliver での手動納品に限定する。
    const recipe = recipes.find(r => r.id === id);
    if (!recipeUnlocked(state, recipe) || !Number.isSafeInteger(amount) || amount < 1 || maxCraft(state, recipe) < amount || state.inventory[id] > Number.MAX_SAFE_INTEGER - amount) return false;
    // 全素材の充足を確認してからまとめて消費する。不足時は在庫を変更しない。
    for (const input of ingredients(recipe)) state.inventory[input.id] -= input.cost * amount;
    state.inventory[id] += amount;
    recordDiscovery(state, id);
    return true;
  }
  function deliver(state, id) {
    const request = requests.find(r => r.id === id);
    if (!request || !stageUnlocked(state, request.stage || 1) || state.completed.includes(id) || state.inventory[request.item] < 1) return false;
    const previousLimit = gatherLimit(state);
    state.inventory[request.item]--;
    state.completed.push(id);
    state.unlockedStage = unlockedStage(state);
    state.gatherLimit = gatherLimit(state);
    state.gathersLeft += state.gatherLimit - previousLimit;
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
    state.dailyRequestCounts[request.resident] = Math.min(Number.MAX_SAFE_INTEGER, state.dailyRequestCounts[request.resident] + 1);
    addGratitudePoint(state);
    return true;
  }
  function deliverGardenRequest(state, id) {
    const request = currentGardenRequest(state);
    if (!request || request.id !== id || request.completed || state.inventory[request.item] < request.quantity) return false;
    state.inventory[request.item] -= request.quantity;
    state.gardenRequest.completed = true;
    state.dailyRequestCounts[request.resident] = Math.min(Number.MAX_SAFE_INTEGER, state.dailyRequestCounts[request.resident] + 1);
    addGratitudePoint(state);
    return true;
  }
  const game = { items, crops, foods, backyardMaterials, backyardFacilities, merchantMaterials, merchantTrades, recipes, cookingRecipes, requests, dailyResidents, dailyRequestPool, cookingDailyRequestPool, gardenDailyRequestPool, gratitudeExchanges, thankYouEvents, storyMilestones, storyRequests, hospitalityEvents, canHost, host, canViewHospitality, fresh, restore, gather, craft, deliver, deliverDaily, deliverGardenRequest, deliverStoryRequest, exchangeGratitude, canExchangeGratitude, gratitudePointText, merchantStatus, canTradeMerchant, tradeMerchant, rest, plantCrop, harvestCrop, cropDaysLeft, ensureFacilities, facilityDaysLeft, currentFacilities, collectFacility, completeThankYou, canViewThankYou, completedThankYouCount, dailyResidentWeight, cookingRequestWeight, postgameUnlocked, recipeUnlocked, availableRecipes, completeStory, canViewStory, storyUnlocked, storyRequestUnlocked, canViewStoryRequestCompletion, completeStoryRequestEvent, SAVE_VERSION, DAILY_GATHERS, DAILY_REQUEST_SLOTS, GARDEN_REQUEST_CHANCE, COOKING_REQUEST_CHANCE, MERCHANT_VISIT_INTERVAL, gatherLimit, ingredients, maxCraft, stageTwoUnlocked, stageUnlocked, unlockedStage, visibleRequests, dailyUnlocked, ensureDailyRequests, refreshDailyRequests, refreshGardenRequest, currentDailyRequests, currentGardenRequest };
  if (typeof module !== 'undefined' && module.exports) module.exports = game;
  else root.MioGame = game;
})(typeof window !== 'undefined' ? window : globalThis);
