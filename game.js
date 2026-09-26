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
    { id: 'upholsteredStool', name: '布張りスツール', category: '完成品', mark: '椅' }
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
    { id: 'cushion', inputs: [{ id: 'dyedCloth', cost: 2 }, { id: 'fiber', cost: 2 }, { id: 'thread', cost: 1 }], group: '組み合わせのしごと' },
    { id: 'woodFrame', input: 'plank', cost: 2, group: '家具のしごと' },
    { id: 'smallShelf', inputs: [{ id: 'woodFrame', cost: 1 }, { id: 'plank', cost: 2 }], group: '家具のしごと' },
    { id: 'upholsteredStool', inputs: [{ id: 'woodFrame', cost: 1 }, { id: 'dyedCloth', cost: 1 }, { id: 'fiber', cost: 1 }], group: '家具のしごと' }
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
    keikaiTowa: { name: '軽快トワ', initial: '軽' },
    shiru: { name: 'シル', initial: 'シ' },
    kuroko: { name: '黒子', initial: '黒' },
    alto: { name: 'アルト', initial: 'ア' },
    aoiDoctor: { name: '碧博士', initial: '碧' }
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
    { id: 'daily-kuroko-upholstered-stool', resident: 'kuroko', item: 'upholsteredStool', quantity: 1, title: '観測席にもう一脚', message: '布張りのスツールをひとつ頼めるか、美桜。観測席に、もう一脚くらいあってもいい', thanks: '悪くないな。席が増えたからって、観客を増やすつもりはないけどな' }
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
  const UNLOCKED_DAILY_GATHERS = 5;
  const gatherLimit = state => dailyUnlocked(state) ? UNLOCKED_DAILY_GATHERS : DAILY_GATHERS;
  const DAILY_REQUEST_SLOTS = 3;
  const SAVE_VERSION = 2;
  const fresh = () => ({ saveVersion: SAVE_VERSION, inventory: Object.fromEntries(items.map(item => [item.id, 0])), completed: [], unlockedStage: 1, day: 1, gathersLeft: DAILY_GATHERS, gatherLimit: DAILY_GATHERS, dailyRequests: [], dailyHistory: [], dailyRequestCounts: Object.fromEntries(Object.keys(dailyResidents).map(id => [id, 0])), thankYouEventViewed: Object.fromEntries(Object.keys(dailyResidents).map(id => [id, false])), storyProgress: { ...Object.fromEntries(Object.keys(storyMilestones).map(id => [`${id}Viewed`, false])), ...Object.fromEntries(Object.keys(storyRequests).flatMap(id => [[`${id}Completed`, false], [`${id}EventViewed`, false]])) }, discovered: [] });
  const canViewThankYou = (state, id) => !!dailyResidents[id] && state.dailyRequestCounts[id] >= 5 && !state.thankYouEventViewed[id];
  const completedThankYouCount = state => Object.keys(dailyResidents).filter(id => state.thankYouEventViewed[id]).length;
  const dailyResidentWeight = (state, id) => state.thankYouEventViewed[id] ? 1 : 2;
  const storyUnlocked = (state, id) => !!storyMilestones[id] && completedThankYouCount(state) >= storyMilestones[id].requiredThankYous;
  const canViewStory = (state, id) => storyUnlocked(state, id) && !state.storyProgress[`${id}Viewed`];
  const storyRequestUnlocked = (state, id) => !!storyRequests[id] && completedThankYouCount(state) >= storyRequests[id].requiredThankYous && state.storyProgress[`${storyRequests[id].prerequisite}Viewed`] === true;
  const canViewStoryRequestCompletion = (state, id) => storyRequestUnlocked(state, id) && state.storyProgress[`${id}Completed`] && !state.storyProgress[`${id}EventViewed`];
  function completeStoryRequestEvent(state, id) {
    if (!canViewStoryRequestCompletion(state, id)) return false;
    state.storyProgress[`${id}EventViewed`] = true;
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
      if (found.has(id) || !items.some(item => item.id === id)) return;
      found.add(id);
      const recipe = recipes.find(entry => entry.id === id);
      if (recipe) ingredients(recipe).forEach(input => includeWithIngredients(input.id));
    }
    items.filter(item => state.inventory[item.id] > 0).forEach(item => includeWithIngredients(item.id));
    requests.filter(request => state.completed.includes(request.id)).forEach(request => includeWithIngredients(request.item));
    state.dailyRequests.filter(slot => slot.completed).forEach(slot => includeWithIngredients(dailyTemplate(slot.templateId).item));
    return items.filter(item => found.has(item.id)).map(item => item.id);
  }
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
    const requestCounts = Object.create(null);
    for (const request of candidates) requestCounts[request.resident] = (requestCounts[request.resident] || 0) + 1;
    // 依頼数の多い住人が有利にならないよう、各住人の重みを候補依頼へ均等に配る。
    const weights = candidates.map(request => dailyResidentWeight(state, request.resident) / requestCounts[request.resident]);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const roll = Number(random());
    let position = (Number.isFinite(roll) ? Math.min(1 - Number.EPSILON, Math.max(0, roll)) : 0) * totalWeight;
    for (let index = 0; index < candidates.length; index++) {
      position -= weights[index];
      if (position < 0) return candidates[index];
    }
    return candidates[candidates.length - 1];
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
    for (const item of items) {
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
    for (const id of Object.keys(storyMilestones)) {
      if (storyUnlocked(state, id) && data.storyProgress?.[`${id}Viewed`] === true) state.storyProgress[`${id}Viewed`] = true;
    }
    for (const id of Object.keys(storyRequests)) {
      if (storyRequestUnlocked(state, id) && data.storyProgress?.[`${id}Completed`] === true) {
        state.storyProgress[`${id}Completed`] = true;
        if (data.storyProgress?.[`${id}EventViewed`] === true) state.storyProgress[`${id}EventViewed`] = true;
      }
    }
    if (dailyUnlocked(state) && Array.isArray(data.dailyRequests)) {
      const slots = data.dailyRequests.filter(slot => slot && dailyTemplate(slot.templateId)).map(slot => ({ templateId: slot.templateId, completed: slot.completed === true }));
      if (slots.length === DAILY_REQUEST_SLOTS && new Set(slots.map(slot => slot.templateId)).size === DAILY_REQUEST_SLOTS) state.dailyRequests = slots;
    }
    state.discovered = Array.isArray(data.discovered)
      ? [...new Set(data.discovered.filter(id => items.some(item => item.id === id)))]
      : inferLegacyDiscoveries(state);
    if (dailyUnlocked(state)) ensureDailyRequests(state, random);
    return state;
  }
  function gather(state, id) {
    if (state.gathersLeft <= 0 || !['branch', 'vine', 'flower'].includes(id) || state.inventory[id] > Number.MAX_SAFE_INTEGER - 2) return false;
    state.inventory[id] += 2;
    state.gathersLeft--;
    recordDiscovery(state, id);
    return true;
  }
  function rest(state, random = Math.random) {
    const nextDay = BigInt(state.day) + 1n;
    state.day = nextDay <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(nextDay) : String(nextDay);
    state.gathersLeft = gatherLimit(state);
    state.gatherLimit = gatherLimit(state);
    refreshDailyRequests(state, random);
  }
  function craft(state, id, amount = 1) {
    // 作成は在庫の更新のみ。依頼の達成は deliver での手動納品に限定する。
    const recipe = recipes.find(r => r.id === id);
    if (!recipe || !Number.isSafeInteger(amount) || amount < 1 || maxCraft(state, recipe) < amount || state.inventory[id] > Number.MAX_SAFE_INTEGER - amount) return false;
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
    return true;
  }
  const game = { items, recipes, requests, dailyResidents, dailyRequestPool, thankYouEvents, storyMilestones, storyRequests, fresh, restore, gather, craft, deliver, deliverDaily, deliverStoryRequest, rest, completeThankYou, canViewThankYou, completedThankYouCount, dailyResidentWeight, completeStory, canViewStory, storyUnlocked, storyRequestUnlocked, canViewStoryRequestCompletion, completeStoryRequestEvent, SAVE_VERSION, DAILY_GATHERS, DAILY_REQUEST_SLOTS, gatherLimit, ingredients, maxCraft, stageTwoUnlocked, stageUnlocked, unlockedStage, visibleRequests, dailyUnlocked, ensureDailyRequests, refreshDailyRequests, currentDailyRequests };
  if (typeof module !== 'undefined' && module.exports) module.exports = game;
  else root.MioGame = game;
})(typeof window !== 'undefined' ? window : globalThis);
