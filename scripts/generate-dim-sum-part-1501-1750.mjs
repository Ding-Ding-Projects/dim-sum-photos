import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const partsRoot = path.join(repositoryRoot, 'dim-sum', 'catalog-parts');
const outputPath = path.join(partsRoot, 'part-1501-1750.json');

const slugify = value => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const allergenRules = [
  ['gluten', /wheat|flour|pastry|bun|cookie|cake/i],
  ['egg', /egg|custard/i],
  ['dairy', /butter|milk|cream|ice cream|ganache/i],
  ['soy', /soy|tofu/i],
  ['sesame', /sesame/i],
  ['peanut', /peanut/i],
  ['tree nuts', /almond|walnut|hazelnut|cashew/i]
];

const groups = [
  {
    category: 'hong-kong-bakery',
    subcategory: 'sweet-buns',
    kind: 'Hong Kong bakery bun',
    kindYue: '港式甜麵包',
    scene: 'a warm old-style Hong Kong bakery counter with plain ceramic service ware',
    bases: [
      { en: 'Pineapple Bun', zh: '菠蘿包', jyutping: 'bo1 lo4 baau1', ingredients: ['wheat flour', 'sugar', 'butter', 'egg'], zhIngredients: ['麵粉', '砂糖', '牛油', '雞蛋'], presentation: 'a round bun with a crisp scored golden top' },
      { en: 'Cocktail Bun', zh: '雞尾包', jyutping: 'gai1 mei5 baau1', ingredients: ['wheat flour', 'coconut', 'butter', 'sugar', 'egg'], zhIngredients: ['麵粉', '椰絲', '牛油', '砂糖', '雞蛋'], presentation: 'an oval bun with coconut filling and a lightly striped top' },
      { en: 'Cream Bun', zh: '忌廉包', jyutping: 'gei6 lim4 baau1', ingredients: ['wheat flour', 'custard cream', 'butter', 'egg'], zhIngredients: ['麵粉', '忌廉吉士', '牛油', '雞蛋'], presentation: 'a soft split bun showing a neat ribbon of cream' },
      { en: 'Red Bean Bun', zh: '豆沙包', jyutping: 'dau6 saa1 baau1', ingredients: ['wheat flour', 'red bean paste', 'butter'], zhIngredients: ['麵粉', '豆沙', '牛油'], presentation: 'a glossy baked bun with smooth red bean paste inside' },
      { en: 'Taro Bun', zh: '芋蓉包', jyutping: 'wu6 jung4 baau1', ingredients: ['wheat flour', 'taro paste', 'butter'], zhIngredients: ['麵粉', '芋蓉', '牛油'], presentation: 'a tender baked bun with pale purple taro filling' }
    ],
    variants: [
      { en: 'Heritage Bakery', zh: '老餅家', jyutping: 'lou5 beng2 gaa1', ingredients: ['maltose'], zhIngredients: ['麥芽糖'], noteEn: 'finished in the restrained style of a neighbourhood heritage bakery', noteYue: '照老餅家做法焗到樸實香口' },
      { en: 'Salted-Butter Crust', zh: '鹹牛油酥皮', jyutping: 'haam4 ngau4 jau4 sou1 pei4', ingredients: ['salted butter'], zhIngredients: ['鹹牛油'], noteEn: 'topped with a lightly salted buttery crust', noteYue: '加鹹牛油酥面焗香' },
      { en: 'Coconut-Crumb', zh: '椰絲酥面', jyutping: 'je4 si1 sou1 min6', ingredients: ['desiccated coconut'], zhIngredients: ['椰絲'], noteEn: 'finished with a fine toasted coconut crumb', noteYue: '鋪幼椰絲酥粒焗香' },
      { en: 'Black-Sesame Crust', zh: '黑芝麻酥皮', jyutping: 'hak1 zi1 maa4 sou1 pei4', ingredients: ['black sesame'], zhIngredients: ['黑芝麻'], noteEn: 'baked under a crisp black-sesame crust', noteYue: '加黑芝麻酥皮焗到脆面' },
      { en: 'Milk-Crust', zh: '奶香酥皮', jyutping: 'naai5 hoeng1 sou1 pei4', ingredients: ['milk powder'], zhIngredients: ['奶粉'], noteEn: 'capped with a fragrant milk-enriched crust', noteYue: '加奶香酥皮焗到金黃' }
    ]
  },
  {
    category: 'tea-house-sweets',
    subcategory: 'steamed-cakes',
    kind: 'steamed Hong Kong tea-house cake',
    kindYue: '茶樓蒸糕',
    scene: 'a sunlit Hong Kong tea-house table with a bamboo steamer and simple porcelain',
    bases: [
      { en: 'Ma Lai Go', zh: '馬拉糕', jyutping: 'maa5 laai1 gou1', ingredients: ['wheat flour', 'brown sugar', 'egg', 'evaporated milk'], zhIngredients: ['麵粉', '黃糖', '雞蛋', '淡奶'], presentation: 'a tall airy amber sponge cut into tidy wedges' },
      { en: 'White Sugar Sponge Cake', zh: '白糖糕', jyutping: 'baak6 tong4 gou1', ingredients: ['rice flour', 'white sugar', 'yeast'], zhIngredients: ['粘米粉', '白糖', '酵母'], presentation: 'a snowy steamed rice sponge with fine honeycomb pores' },
      { en: 'Red Date Steamed Cake', zh: '紅棗蒸糕', jyutping: 'hung4 zou2 zing1 gou1', ingredients: ['rice flour', 'red date', 'brown sugar'], zhIngredients: ['粘米粉', '紅棗', '黃糖'], presentation: 'a soft russet cake with visible red-date pieces' },
      { en: 'Water Chestnut Pudding Cake', zh: '馬蹄糕', jyutping: 'maa5 tai4 gou1', ingredients: ['water chestnut flour', 'water chestnut', 'cane sugar'], zhIngredients: ['馬蹄粉', '馬蹄', '蔗糖'], presentation: 'translucent amber slices studded with crisp water chestnut' },
      { en: 'Brown Sugar Rice Cake', zh: '片糖年糕', jyutping: 'pin3 tong4 nin4 gou1', ingredients: ['glutinous rice flour', 'brown slab sugar'], zhIngredients: ['糯米粉', '片糖'], presentation: 'glossy caramel-brown slices with a soft elastic crumb' }
    ],
    variants: [
      { en: 'Tea-House Classic', zh: '茶樓古法', jyutping: 'caa4 lau4 gu2 faat3', ingredients: [], zhIngredients: [], noteEn: 'steamed by a classic tea-house method', noteYue: '跟茶樓古法蒸到啱啱好' },
      { en: 'Osmanthus-Scented', zh: '桂花香', jyutping: 'gwai3 faa1 hoeng1', ingredients: ['dried osmanthus'], zhIngredients: ['桂花'], noteEn: 'lightly scented with dried osmanthus', noteYue: '加桂花蒸出淡淡花香' },
      { en: 'Tangerine-Peel', zh: '陳皮香', jyutping: 'can4 pei4 hoeng1', ingredients: ['dried tangerine peel'], zhIngredients: ['陳皮'], noteEn: 'brightened with finely minced aged tangerine peel', noteYue: '拌入陳皮碎提香' },
      { en: 'Fresh-Ginger', zh: '鮮薑', jyutping: 'sin1 goeng1', ingredients: ['fresh ginger juice'], zhIngredients: ['鮮薑汁'], noteEn: 'steamed with freshly pressed ginger juice', noteYue: '用新鮮薑汁蒸到暖香' },
      { en: 'Roasted-Sesame', zh: '炒香芝麻', jyutping: 'caau2 hoeng1 zi1 maa4', ingredients: ['roasted sesame'], zhIngredients: ['炒香芝麻'], noteEn: 'finished with freshly roasted sesame', noteYue: '加炒香芝麻添一層香氣' }
    ]
  },
  {
    category: 'sweet-soups',
    subcategory: 'traditional-tong-sui',
    kind: 'traditional Hong Kong sweet soup',
    kindYue: '傳統港式糖水',
    scene: 'a modest Hong Kong tong-sui shop table with a single porcelain dessert bowl',
    bases: [
      { en: 'Red Bean Sweet Soup', zh: '紅豆沙', jyutping: 'hung4 dau6 saa1', ingredients: ['red bean', 'rock sugar'], zhIngredients: ['紅豆', '冰糖'], presentation: 'a thick ruby-red bean soup with a softly mashed texture' },
      { en: 'Mung Bean Sweet Soup', zh: '綠豆沙', jyutping: 'luk6 dau6 saa1', ingredients: ['mung bean', 'rock sugar'], zhIngredients: ['綠豆', '冰糖'], presentation: 'a pale green sweet soup with tender split mung beans' },
      { en: 'Black Sesame Sweet Soup', zh: '芝麻糊', jyutping: 'zi1 maa4 wu4', ingredients: ['black sesame', 'rice flour', 'rock sugar'], zhIngredients: ['黑芝麻', '粘米粉', '冰糖'], presentation: 'a smooth glossy charcoal-black sesame soup' },
      { en: 'Walnut Sweet Soup', zh: '合桃糊', jyutping: 'hap6 tou4 wu4', ingredients: ['walnut', 'rice flour', 'rock sugar'], zhIngredients: ['合桃', '粘米粉', '冰糖'], presentation: 'a silky tan walnut soup with a fine nutty texture' },
      { en: 'Almond Sweet Soup', zh: '杏仁糊', jyutping: 'hang6 jan4 wu4', ingredients: ['Chinese almond', 'rice flour', 'rock sugar'], zhIngredients: ['南北杏', '粘米粉', '冰糖'], presentation: 'a smooth ivory almond soup in a small dessert bowl' }
    ],
    variants: [
      { en: 'Old-School', zh: '懷舊', jyutping: 'waai4 gau6', ingredients: [], zhIngredients: [], noteEn: 'served in an old-school Hong Kong dessert-shop style', noteYue: '照懷舊糖水舖做法慢慢煮滑' },
      { en: 'Tangerine-Peel', zh: '陳皮', jyutping: 'can4 pei4', ingredients: ['dried tangerine peel'], zhIngredients: ['陳皮'], noteEn: 'simmered with fragrant aged tangerine peel', noteYue: '加陳皮慢火煲香' },
      { en: 'Coconut-Milk', zh: '椰奶', jyutping: 'je4 naai5', ingredients: ['coconut milk'], zhIngredients: ['椰奶'], noteEn: 'rounded with a pour of coconut milk', noteYue: '加入椰奶煮到順滑' },
      { en: 'Lotus-Seed', zh: '蓮子', jyutping: 'lin4 zi2', ingredients: ['lotus seed'], zhIngredients: ['蓮子'], noteEn: 'simmered with tender lotus seeds', noteYue: '配蓮子煲到軟糯' },
      { en: 'Sago', zh: '西米', jyutping: 'sai1 mai5', ingredients: ['sago'], zhIngredients: ['西米'], noteEn: 'finished with translucent sago pearls', noteYue: '加西米煮到粒粒透亮' }
    ]
  },
  {
    category: 'festive-pastries',
    subcategory: 'celebration-bakes',
    kind: 'Hong Kong festive pastry',
    kindYue: '港式節慶酥餅',
    scene: 'a festive Hong Kong family tea table with restrained red accents and plain porcelain',
    bases: [
      { en: 'Lotus Seed Mini Mooncake', zh: '蓮蓉迷你月餅', jyutping: 'lin4 jung4 mai4 nei5 jyut6 beng2', ingredients: ['wheat flour', 'lotus seed paste', 'golden syrup', 'peanut oil'], zhIngredients: ['麵粉', '蓮蓉', '糖漿', '花生油'], presentation: 'a small round mooncake with a crisp carved pattern' },
      { en: 'Red Bean Mini Mooncake', zh: '豆沙迷你月餅', jyutping: 'dau6 saa1 mai4 nei5 jyut6 beng2', ingredients: ['wheat flour', 'red bean paste', 'golden syrup', 'peanut oil'], zhIngredients: ['麵粉', '豆沙', '糖漿', '花生油'], presentation: 'a petite mooncake cut to show smooth red bean filling' },
      { en: 'Winter Melon Pastry', zh: '冬蓉酥', jyutping: 'dung1 jung4 sou1', ingredients: ['wheat pastry', 'winter melon paste', 'sesame'], zhIngredients: ['酥皮', '冬蓉', '芝麻'], presentation: 'a flaky round pastry showing pale winter-melon filling' },
      { en: 'Sesame Walnut Cookie', zh: '芝麻合桃酥', jyutping: 'zi1 maa4 hap6 tou4 sou1', ingredients: ['wheat flour', 'sesame', 'walnut', 'egg'], zhIngredients: ['麵粉', '芝麻', '合桃', '雞蛋'], presentation: 'a crumbly golden cookie topped with walnut and sesame' },
      { en: 'Pan-Seared Rice Cake', zh: '香煎年糕', jyutping: 'hoeng1 zin1 nin4 gou1', ingredients: ['glutinous rice flour', 'brown sugar', 'coconut milk'], zhIngredients: ['糯米粉', '黃糖', '椰奶'], presentation: 'golden pan-seared rice-cake slices arranged like small ingots' }
    ],
    variants: [
      { en: 'Reunion-Table', zh: '團年', jyutping: 'tyun4 nin4', ingredients: ['mandarin zest'], zhIngredients: ['柑皮'], noteEn: 'finished for a family reunion table with a subtle mandarin aroma', noteYue: '加少少柑香做團年茶點' },
      { en: 'Golden-Ingot', zh: '金元寶', jyutping: 'gam1 jyun4 bou2', ingredients: [], zhIngredients: [], noteEn: 'formed or stamped with a restrained golden-ingot motif', noteYue: '整成細緻金元寶造型' },
      { en: 'Flower-Stamped', zh: '花印', jyutping: 'faa1 jan3', ingredients: ['dried osmanthus'], zhIngredients: ['桂花'], noteEn: 'flower-stamped and lightly scented with osmanthus', noteYue: '壓上花印再加桂花香' },
      { en: 'Double-Happiness', zh: '雙喜', jyutping: 'soeng1 hei2', ingredients: ['red date'], zhIngredients: ['紅棗'], noteEn: 'made as a double-happiness celebration edition with red date', noteYue: '加紅棗整成雙喜賀慶款' },
      { en: 'Lantern-Festival', zh: '元宵', jyutping: 'jyun4 siu1', ingredients: ['ginger honey'], zhIngredients: ['薑蜜'], noteEn: 'finished with gentle ginger-honey notes for the Lantern Festival', noteYue: '用薑蜜添元宵節暖香' }
    ]
  },
  {
    category: 'puddings-and-jellies',
    subcategory: 'chilled-desserts',
    kind: 'Hong Kong chilled pudding or jelly',
    kindYue: '港式凍布甸或涼粉',
    scene: 'a bright Hong Kong tea-house dessert table with one chilled glass or porcelain dish',
    bases: [
      { en: 'Coconut Milk Pudding', zh: '椰奶布甸', jyutping: 'je4 naai5 bou3 din6', ingredients: ['coconut milk', 'agar', 'sugar'], zhIngredients: ['椰奶', '大菜', '砂糖'], presentation: 'a smooth white pudding with a delicate set' },
      { en: 'Almond Tofu Pudding', zh: '杏仁豆腐布甸', jyutping: 'hang6 jan4 dau6 fu6 bou3 din6', ingredients: ['almond milk', 'agar', 'sugar'], zhIngredients: ['杏仁奶', '大菜', '砂糖'], presentation: 'ivory almond pudding cut into soft tofu-like cubes' },
      { en: 'Mango Pomelo Pudding', zh: '楊枝甘露布甸', jyutping: 'joeng4 zi1 gam1 lou6 bou3 din6', ingredients: ['mango', 'pomelo', 'coconut milk', 'agar'], zhIngredients: ['芒果', '西柚', '椰奶', '大菜'], presentation: 'a golden mango pudding dotted with pomelo pulp' },
      { en: 'Grass Jelly', zh: '仙草涼粉', jyutping: 'sin1 cou2 loeng4 fan2', ingredients: ['mesona herb', 'starch', 'sugar'], zhIngredients: ['仙草', '澱粉', '砂糖'], presentation: 'glossy black jelly cubes in a shallow chilled bowl' },
      { en: 'Guilinggao Herbal Jelly', zh: '龜苓膏', jyutping: 'gwai1 ling4 gou1', ingredients: ['guilinggao herbal blend', 'agar'], zhIngredients: ['龜苓膏藥材', '大菜'], presentation: 'a firm dark herbal jelly in a traditional porcelain bowl' }
    ],
    variants: [
      { en: 'Tea-House Chilled', zh: '茶樓冰鎮', jyutping: 'caa4 lau4 bing1 zan3', ingredients: [], zhIngredients: [], noteEn: 'served properly chilled in a classic tea-house style', noteYue: '照茶樓做法冰鎮上枱' },
      { en: 'Brown-Sugar', zh: '黑糖', jyutping: 'hak1 tong4', ingredients: ['brown sugar syrup'], zhIngredients: ['黑糖漿'], noteEn: 'finished with a light brown-sugar syrup', noteYue: '淋少量黑糖漿提香' },
      { en: 'Osmanthus-Syrup', zh: '桂花糖漿', jyutping: 'gwai3 faa1 tong4 zoeng1', ingredients: ['osmanthus syrup'], zhIngredients: ['桂花糖漿'], noteEn: 'glazed with fragrant osmanthus syrup', noteYue: '淋桂花糖漿增添花香' },
      { en: 'Ginger-Syrup', zh: '薑汁糖水', jyutping: 'goeng1 zap1 tong4 seoi2', ingredients: ['ginger syrup'], zhIngredients: ['薑汁糖水'], noteEn: 'paired with a warm ginger syrup', noteYue: '配暖薑汁糖水上枱' },
      { en: 'Sago-Topped', zh: '西米面', jyutping: 'sai1 mai5 min6', ingredients: ['sago'], zhIngredients: ['西米'], noteEn: 'topped with a neat spoonful of translucent sago', noteYue: '面頭加一匙透亮西米' }
    ]
  },
  {
    category: 'glutinous-rice-sweets',
    subcategory: 'rice-dumplings-and-cakes',
    kind: 'Hong Kong glutinous-rice sweet',
    kindYue: '港式糯米甜點',
    scene: 'a neighbourhood Hong Kong dessert shop table with one small ceramic serving dish',
    bases: [
      { en: 'Peanut Lo Mai Chi', zh: '花生糯米糍', jyutping: 'faa1 sang1 no6 mai5 ci4', ingredients: ['glutinous rice flour', 'peanut', 'sugar'], zhIngredients: ['糯米粉', '花生', '砂糖'], presentation: 'soft white rice dumplings rolled in crushed peanut' },
      { en: 'Coconut Lo Mai Chi', zh: '椰絲糯米糍', jyutping: 'je4 si1 no6 mai5 ci4', ingredients: ['glutinous rice flour', 'coconut', 'sugar'], zhIngredients: ['糯米粉', '椰絲', '砂糖'], presentation: 'soft rice dumplings coated in snowy coconut' },
      { en: 'Black Sesame Tong Yuen', zh: '黑芝麻湯圓', jyutping: 'hak1 zi1 maa4 tong1 jyun2', ingredients: ['glutinous rice flour', 'black sesame', 'sugar'], zhIngredients: ['糯米粉', '黑芝麻', '砂糖'], presentation: 'round rice dumplings with flowing black-sesame filling' },
      { en: 'Red Bean Tong Yuen', zh: '豆沙湯圓', jyutping: 'dau6 saa1 tong1 jyun2', ingredients: ['glutinous rice flour', 'red bean paste', 'sugar'], zhIngredients: ['糯米粉', '豆沙', '砂糖'], presentation: 'round rice dumplings filled with smooth red bean paste' },
      { en: 'Sweet Potato Glutinous Cake', zh: '番薯糯米糕', jyutping: 'faan1 syu4 no6 mai5 gou1', ingredients: ['glutinous rice flour', 'sweet potato', 'brown sugar'], zhIngredients: ['糯米粉', '番薯', '黃糖'], presentation: 'small golden-purple glutinous cakes with a tender chew' }
    ],
    variants: [
      { en: 'Heritage Tea-House', zh: '老茶樓', jyutping: 'lou5 caa4 lau4', ingredients: [], zhIngredients: [], noteEn: 'prepared in a restrained heritage tea-house style', noteYue: '跟老茶樓做法整到軟糯' },
      { en: 'Double-Ginger Syrup', zh: '雙薑糖水', jyutping: 'soeng1 goeng1 tong4 seoi2', ingredients: ['young ginger', 'old ginger', 'rock sugar'], zhIngredients: ['子薑', '老薑', '冰糖'], noteEn: 'served with a fragrant young-and-old ginger syrup', noteYue: '配子薑老薑糖水暖住上枱' },
      { en: 'Osmanthus-Honey', zh: '桂花蜜', jyutping: 'gwai3 faa1 mat6', ingredients: ['osmanthus honey'], zhIngredients: ['桂花蜜'], noteEn: 'finished with a restrained osmanthus-honey glaze', noteYue: '薄薄掃上桂花蜜' },
      { en: 'Roasted-Soy-Flour', zh: '炒黃豆粉', jyutping: 'caau2 wong4 dau6 fan2', ingredients: ['roasted soybean flour'], zhIngredients: ['炒黃豆粉'], noteEn: 'dusted with aromatic roasted soybean flour', noteYue: '灑炒香黃豆粉增添豆香' },
      { en: 'Toasted-Rice-Crumb', zh: '炒米碎', jyutping: 'caau2 mai5 seoi3', ingredients: ['toasted rice crumbs'], zhIngredients: ['炒米碎'], noteEn: 'finished with a delicate coating of aromatic toasted-rice crumbs', noteYue: '薄薄沾上炒香米碎添口感' }
    ]
  },
  {
    category: 'bakery-tarts-and-puffs',
    subcategory: 'small-pastries',
    kind: 'small Hong Kong bakery pastry',
    kindYue: '港式小酥餅',
    scene: 'a Hong Kong bakery tea counter with a single white plate and a warm wooden backdrop',
    bases: [
      { en: 'Shortcrust Egg Tart', zh: '牛油皮蛋撻', jyutping: 'ngau4 jau4 pei4 daan6 taat1', ingredients: ['wheat flour', 'butter', 'egg custard'], zhIngredients: ['麵粉', '牛油', '蛋漿'], presentation: 'a neat golden shortcrust tart with glossy egg custard' },
      { en: 'Puff-Pastry Egg Tart', zh: '酥皮蛋撻', jyutping: 'sou1 pei4 daan6 taat1', ingredients: ['wheat pastry', 'butter', 'egg custard'], zhIngredients: ['酥皮', '牛油', '蛋漿'], presentation: 'a flaky layered tart with softly blistered egg custard' },
      { en: 'Coconut Tart', zh: '椰撻', jyutping: 'je4 taat1', ingredients: ['wheat flour', 'coconut', 'butter', 'egg'], zhIngredients: ['麵粉', '椰絲', '牛油', '雞蛋'], presentation: 'a ridged tart filled with toasted coconut' },
      { en: 'Lotus Paste Puff', zh: '蓮蓉酥', jyutping: 'lin4 jung4 sou1', ingredients: ['wheat pastry', 'lotus seed paste', 'butter'], zhIngredients: ['酥皮', '蓮蓉', '牛油'], presentation: 'a flaky pastry cut to show smooth lotus paste' },
      { en: 'Red Bean Puff', zh: '豆沙酥', jyutping: 'dau6 saa1 sou1', ingredients: ['wheat pastry', 'red bean paste', 'butter'], zhIngredients: ['酥皮', '豆沙', '牛油'], presentation: 'a compact flaky pastry with deep red bean filling' }
    ],
    variants: [
      { en: 'Mini Tea-House', zh: '茶樓迷你', jyutping: 'caa4 lau4 mai4 nei5', ingredients: [], zhIngredients: [], noteEn: 'made in a petite tea-house portion', noteYue: '整成茶樓迷你份量' },
      { en: 'Salted-Egg-Crumb', zh: '鹹蛋黃酥粒', jyutping: 'haam4 daan6 wong4 sou1 nap1', ingredients: ['salted egg yolk'], zhIngredients: ['鹹蛋黃'], noteEn: 'finished with a savoury salted-egg-yolk crumb', noteYue: '加鹹蛋黃酥粒焗香' },
      { en: 'Black-Sesame-Crust', zh: '黑芝麻酥面', jyutping: 'hak1 zi1 maa4 sou1 min6', ingredients: ['black sesame'], zhIngredients: ['黑芝麻'], noteEn: 'baked with a crisp black-sesame top', noteYue: '加黑芝麻酥面焗脆' },
      { en: 'Mandarin-Peel', zh: '柑皮香', jyutping: 'gam1 pei4 hoeng1', ingredients: ['dried mandarin peel'], zhIngredients: ['柑皮'], noteEn: 'brightened with finely minced dried mandarin peel', noteYue: '拌入柑皮碎提香' },
      { en: 'Almond-Crumble', zh: '杏仁酥粒', jyutping: 'hang6 jan4 sou1 nap1', ingredients: ['almond'], zhIngredients: ['杏仁'], noteEn: 'topped with a restrained toasted almond crumble', noteYue: '鋪少量杏仁酥粒焗香' }
    ]
  },
  {
    category: 'traditional-drinks',
    subcategory: 'herbal-and-fruit-drinks',
    kind: 'traditional Hong Kong drink',
    kindYue: '港式傳統飲品',
    scene: 'a nostalgic Hong Kong herbal-tea or street-drink counter with one unbranded glass',
    bases: [
      { en: 'Sugarcane Drink', zh: '竹蔗水', jyutping: 'zuk1 ze3 seoi2', ingredients: ['sugarcane', 'water'], zhIngredients: ['竹蔗', '清水'], presentation: 'a clear pale-gold drink in a tall glass' },
      { en: 'Sour Plum Drink', zh: '酸梅湯', jyutping: 'syun1 mui4 tong1', ingredients: ['smoked plum', 'hawthorn', 'rock sugar'], zhIngredients: ['烏梅', '山楂', '冰糖'], presentation: 'a deep amber chilled drink with one whole preserved plum' },
      { en: 'Winter Melon Tea', zh: '冬瓜茶', jyutping: 'dung1 gwaa1 caa4', ingredients: ['winter melon', 'brown sugar'], zhIngredients: ['冬瓜', '黃糖'], presentation: 'a translucent caramel-coloured drink with clean ice cubes' },
      { en: 'Chrysanthemum Tea', zh: '菊花茶', jyutping: 'guk1 faa1 caa4', ingredients: ['chrysanthemum', 'rock sugar'], zhIngredients: ['菊花', '冰糖'], presentation: 'a clear golden infusion with a few visible chrysanthemum petals' },
      { en: 'Watercress Honey Drink', zh: '西洋菜蜜', jyutping: 'sai1 joeng4 coi3 mat6', ingredients: ['watercress', 'honey', 'water'], zhIngredients: ['西洋菜', '蜜糖', '清水'], presentation: 'a light green-gold drink in a simple glass' }
    ],
    variants: [
      { en: 'Old-Street', zh: '老街', jyutping: 'lou5 gaai1', ingredients: [], zhIngredients: [], noteEn: 'prepared in a nostalgic old-street stall style', noteYue: '照老街檔口做法沖好' },
      { en: 'Salted-Lemon', zh: '鹹檸檬', jyutping: 'haam4 ning4 mung1', ingredients: ['salted lemon'], zhIngredients: ['鹹檸檬'], noteEn: 'balanced with a piece of preserved salted lemon', noteYue: '加入鹹檸檬調出鹹香' },
      { en: 'Tangerine-Peel', zh: '陳皮', jyutping: 'can4 pei4', ingredients: ['dried tangerine peel'], zhIngredients: ['陳皮'], noteEn: 'infused with aged tangerine peel', noteYue: '用陳皮浸出清香' },
      { en: 'Rock-Sugar', zh: '冰糖', jyutping: 'bing1 tong4', ingredients: ['rock sugar'], zhIngredients: ['冰糖'], noteEn: 'gently sweetened with clear rock sugar', noteYue: '用冰糖調到清甜' },
      { en: 'Herbal-Shop', zh: '涼茶舖', jyutping: 'loeng4 caa4 pou3', ingredients: ['luo han guo'], zhIngredients: ['羅漢果'], noteEn: 'finished with a light herbal-shop luo-han-guo note', noteYue: '加少量羅漢果做出涼茶舖風味' }
    ]
  },
  {
    category: 'cha-chaan-teng-drinks',
    subcategory: 'cafe-classics',
    kind: 'Hong Kong cha chaan teng drink',
    kindYue: '港式茶餐廳飲品',
    scene: 'a lived-in Hong Kong cha chaan teng tabletop with one unbranded diner glass or cup',
    bases: [
      { en: 'Hong Kong Milk Tea', zh: '港式奶茶', jyutping: 'gong2 sik1 naai5 caa4', ingredients: ['black tea', 'evaporated milk'], zhIngredients: ['紅茶', '淡奶'], presentation: 'a copper-brown tea in a thick diner cup' },
      { en: 'Yuenyeung', zh: '鴛鴦', jyutping: 'jyun1 joeng1', ingredients: ['black tea', 'coffee', 'evaporated milk'], zhIngredients: ['紅茶', '咖啡', '淡奶'], presentation: 'a smooth tan tea-coffee drink in a diner cup' },
      { en: 'Lemon Tea', zh: '檸檬茶', jyutping: 'ning4 mung1 caa4', ingredients: ['black tea', 'lemon', 'sugar'], zhIngredients: ['紅茶', '檸檬', '砂糖'], presentation: 'amber tea with several fresh lemon slices' },
      { en: 'Red Bean Ice', zh: '紅豆冰', jyutping: 'hung4 dau6 bing1', ingredients: ['red bean', 'evaporated milk', 'crushed ice'], zhIngredients: ['紅豆', '淡奶', '碎冰'], presentation: 'a tall glass layered with red beans, milk, and crushed ice' },
      { en: 'Malted Milk', zh: '麥精', jyutping: 'mak6 zing1', ingredients: ['malted milk powder', 'milk'], zhIngredients: ['麥精粉', '牛奶'], presentation: 'a creamy beige malt drink in a heavy glass mug' }
    ],
    variants: [
      { en: 'Cha-Chaan-Teng House-Style', zh: '茶餐廳招牌', jyutping: 'caa4 caan1 teng1 ziu1 paai4', ingredients: [], zhIngredients: [], noteEn: 'prepared in a balanced Hong Kong café house style', noteYue: '跟茶餐廳招牌做法調到平衡順口' },
      { en: 'Cha-Chaan-Teng Less-Sweet', zh: '茶餐廳少甜', jyutping: 'caa4 caan1 teng1 siu2 tim4', ingredients: [], zhIngredients: [], noteEn: 'mixed in the familiar café style with restrained sweetness', noteYue: '跟茶餐廳少甜做法調味' },
      { en: 'Cha-Chaan-Teng Brown-Sugar', zh: '茶餐廳黑糖', jyutping: 'caa4 caan1 teng1 hak1 tong4', ingredients: ['brown sugar'], zhIngredients: ['黑糖'], noteEn: 'gently sweetened with dark brown sugar', noteYue: '用黑糖調出焦香' },
      { en: 'Cha-Chaan-Teng Longan-Honey', zh: '茶餐廳龍眼蜜', jyutping: 'caa4 caan1 teng1 lung4 ngaan5 mat6', ingredients: ['longan honey'], zhIngredients: ['龍眼蜜'], noteEn: 'rounded with a modest spoonful of fragrant longan honey', noteYue: '加少量龍眼蜜調出清香' },
      { en: 'Cha-Chaan-Teng Ice-Cream-Float', zh: '茶餐廳雪糕浮', jyutping: 'caa4 caan1 teng1 syut3 gou1 fau4', ingredients: ['vanilla ice cream'], zhIngredients: ['雲呢拿雪糕'], noteEn: 'served cold with one modest scoop of vanilla ice cream', noteYue: '凍飲面加一球雲呢拿雪糕' }
    ]
  },
  {
    category: 'iced-desserts',
    subcategory: 'summer-dessert-bowls',
    kind: 'Hong Kong summer dessert',
    kindYue: '港式夏日甜品',
    scene: 'a lively but people-free Hong Kong dessert-shop table with one chilled serving bowl',
    bases: [
      { en: 'Mango Sago', zh: '芒果西米露', jyutping: 'mong1 gwo2 sai1 mai5 lou6', ingredients: ['mango', 'sago', 'coconut milk'], zhIngredients: ['芒果', '西米', '椰奶'], presentation: 'a golden mango dessert with translucent sago pearls' },
      { en: 'Pomelo Sago', zh: '西柚西米露', jyutping: 'sai1 jau2 sai1 mai5 lou6', ingredients: ['pomelo', 'sago', 'coconut milk'], zhIngredients: ['西柚', '西米', '椰奶'], presentation: 'a pale citrus dessert dotted with pink pomelo pulp' },
      { en: 'Red Bean Crushed Ice', zh: '紅豆碎冰', jyutping: 'hung4 dau6 seoi3 bing1', ingredients: ['red bean', 'crushed ice', 'evaporated milk'], zhIngredients: ['紅豆', '碎冰', '淡奶'], presentation: 'a mound of fine crushed ice layered with glossy red beans' },
      { en: 'Black Sesame Sundae', zh: '黑芝麻新地', jyutping: 'hak1 zi1 maa4 san1 dei6', ingredients: ['black sesame', 'milk ice cream'], zhIngredients: ['黑芝麻', '牛奶雪糕'], presentation: 'a charcoal-swirled sundae in a low glass dish' },
      { en: 'Coconut Jelly Bowl', zh: '椰汁啫喱碗', jyutping: 'je4 zap1 ze1 lei1 wun2', ingredients: ['coconut milk', 'agar', 'seasonal fruit'], zhIngredients: ['椰奶', '大菜', '時令水果'], presentation: 'white coconut jelly cubes with restrained seasonal fruit' }
    ],
    variants: [
      { en: 'Summer Dessert-Shop Classic', zh: '夏日糖水舖經典', jyutping: 'haa6 jat6 tong4 seoi2 pou3 ging1 din2', ingredients: [], zhIngredients: [], noteEn: 'served in a restrained classic Hong Kong dessert-shop style', noteYue: '跟糖水舖經典做法冰鎮上枱' },
      { en: 'Summer Condensed-Milk', zh: '夏日煉奶', jyutping: 'haa6 jat6 lin6 naai5', ingredients: ['condensed milk'], zhIngredients: ['煉奶'], noteEn: 'finished with a light ribbon of condensed milk', noteYue: '淋少量煉奶添香' },
      { en: 'Summer Brown-Sugar-Syrup', zh: '夏日黑糖漿', jyutping: 'haa6 jat6 hak1 tong4 zoeng1', ingredients: ['brown sugar syrup'], zhIngredients: ['黑糖漿'], noteEn: 'finished with a restrained dark brown-sugar syrup', noteYue: '淋少量黑糖漿添焦香' },
      { en: 'Summer Osmanthus', zh: '夏日桂花', jyutping: 'haa6 jat6 gwai3 faa1', ingredients: ['osmanthus syrup'], zhIngredients: ['桂花糖漿'], noteEn: 'perfumed with a restrained osmanthus syrup', noteYue: '淋少量桂花糖漿添香' },
      { en: 'Summer Mini-Tong-Yuen', zh: '夏日迷你湯圓', jyutping: 'haa6 jat6 mai4 nei5 tong1 jyun2', ingredients: ['mini glutinous-rice balls'], zhIngredients: ['迷你湯圓'], noteEn: 'topped with a small portion of tender mini tong yuen', noteYue: '面頭加一小份煙韌迷你湯圓' }
    ]
  }
];

const allergensFor = ingredients => allergenRules
  .filter(([, pattern]) => ingredients.some(ingredient => pattern.test(ingredient)))
  .map(([allergen]) => allergen);

const records = [];
for (const group of groups) {
  if (group.bases.length !== 5 || group.variants.length !== 5) {
    throw new Error(`${group.category} must define exactly five bases and five variants.`);
  }
  for (const base of group.bases) {
    for (const variant of group.variants) {
      const ordinal = 1501 + records.length;
      const id = `hk-dish-${String(ordinal).padStart(4, '0')}`;
      const name = {
        en: `${variant.en} ${base.en}`,
        zhHant: `${variant.zh}${base.zh}`
      };
      const jyutping = `${variant.jyutping} ${base.jyutping}`;
      const slug = slugify(name.en);
      const ingredients = [...new Set([...base.ingredients, ...variant.ingredients])];
      const zhIngredients = [...new Set([...base.zhIngredients, ...variant.zhIngredients])];
      const animalIngredient = /egg|butter|milk|cream|honey|custard/i;
      const dietaryTags = ingredients.some(ingredient => animalIngredient.test(ingredient))
        ? ['vegetarian']
        : ['vegetarian', 'vegan'];

      records.push({
        id,
        slug,
        name,
        jyutping,
        category: group.category,
        subcategory: group.subcategory,
        description: {
          en: `${name.en} is a ${group.kind} made with ${ingredients.join(', ')} and ${variant.noteEn}.`,
          yue: `${name.zhHant}係一款${group.kindYue}，用${zhIngredients.join('、')}整成，${variant.noteYue}，款式同材料都講清楚。`
        },
        ingredients,
        dietaryTags,
        allergens: allergensFor(ingredients),
        image: {
          path: `images/${id}-${slug}.png`,
          alt: {
            en: `${name.en} presented as one complete Hong Kong dessert or drink serving.`,
            yue: `一份完整上枱嘅${name.zhHant}。`
          }
        },
        imagePrompt: [
          'Use case: photorealistic-natural',
          'Asset type: native square catalog food photograph for an offline Hong Kong dish index',
          `Primary request: one authentic serving of ${name.en} (${name.zhHant})`,
          `Scene/backdrop: ${group.scene}`,
          `Subject: exactly one serving, visibly featuring ${ingredients.join(', ')}; ${base.presentation}; ${variant.noteEn}`,
          'Style/medium: original photorealistic professional food photography with natural edible textures and restrained styling',
          'Composition/framing: square 1:1 close three-quarter view, the complete serving centered with comfortable edge padding',
          'Lighting/mood: soft warm window light, believable colour, crisp detail without artificial glow',
          'Constraints: culturally plausible Hong Kong presentation; show only this exact item and its normal garnish; no people; no hands; no text; no lettering; no logos; no watermark',
          'Avoid: duplicate servings, unrelated side dishes, menus, labels, packaging, plastic-looking food, excessive steam, surreal ingredients'
        ].join('\n')
      });
    }
  }
}

const chocolateOverrides = [
  { id: 1520, en: 'Salted Egg Dark Chocolate Pineapple Bun', zh: '鹹蛋黑巧克力菠蘿包', jyutping: 'haam4 daan6 hak1 haau2 hak1 lik1 bo1 lo4 baau1', ingredients: ['wheat flour', 'salted egg yolk', 'dark chocolate ganache', 'butter'], shape: 'small pineapple bun with a crisp scored crust', shapeYue: '菠蘿酥皮小麵包' },
  { id: 1540, en: 'Osmanthus White Chocolate Steamed Sponge Dumpling', zh: '桂花白巧克力蒸糕餃', jyutping: 'gwai3 faa1 baak6 haau2 hak1 lik1 zing1 gou1 gaau2', ingredients: ['rice flour', 'osmanthus', 'white chocolate ganache'], shape: 'soft pleated steamed sponge dumpling', shapeYue: '鬆軟褶邊蒸糕餃' },
  { id: 1560, en: 'Tangerine Peel Chocolate Tong Yuen', zh: '陳皮巧克力湯圓', jyutping: 'can4 pei4 haau2 hak1 lik1 tong1 jyun2', ingredients: ['glutinous rice flour', 'dried tangerine peel', 'dark chocolate ganache'], shape: 'round glutinous-rice dumpling', shapeYue: '圓身糯米湯圓' },
  { id: 1580, en: 'Red Date Chocolate Lotus Puff', zh: '紅棗巧克力蓮蓉酥', jyutping: 'hung4 zou2 haau2 hak1 lik1 lin4 jung4 sou1', ingredients: ['wheat pastry', 'red date', 'lotus seed paste', 'dark chocolate ganache'], shape: 'flaky lotus-shaped baked puff', shapeYue: '蓮花形酥皮焗點' },
  { id: 1600, en: 'Ginger Milk Chocolate Crystal Pudding Bun', zh: '薑汁奶巧克力水晶布甸包', jyutping: 'goeng1 zap1 naai5 haau2 hak1 lik1 seoi2 zing1 bou3 din6 baau1', ingredients: ['mung bean starch', 'ginger', 'milk chocolate ganache'], shape: 'translucent crystal pudding bun', shapeYue: '透亮水晶布甸包' },
  { id: 1620, en: 'Peanut Praline Chocolate Sesame Ball', zh: '花生脆糖巧克力煎堆', jyutping: 'faa1 sang1 ceoi3 tong4 haau2 hak1 lik1 zin1 deoi1', ingredients: ['glutinous rice flour', 'peanut praline', 'dark chocolate ganache', 'sesame'], shape: 'golden sesame-coated glutinous-rice ball', shapeYue: '金黃芝麻糯米煎堆' },
  { id: 1640, en: 'Black Sesame Chocolate Egg Tart Dumpling', zh: '黑芝麻巧克力蛋撻餃', jyutping: 'hak1 zi1 maa4 haau2 hak1 lik1 daan6 taat1 gaau2', ingredients: ['wheat pastry', 'egg custard', 'black sesame', 'dark chocolate ganache'], shape: 'small pleated tart-shell dumpling', shapeYue: '細小褶邊蛋撻皮餃' },
  { id: 1660, en: 'Salted Lemon Chocolate Glutinous Rice Parcel', zh: '鹹檸檬巧克力糯米包', jyutping: 'haam4 ning4 mung1 haau2 hak1 lik1 no6 mai5 baau1', ingredients: ['glutinous rice flour', 'salted lemon', 'white chocolate ganache'], shape: 'soft folded glutinous-rice parcel', shapeYue: '軟糯摺疊糯米包' },
  { id: 1680, en: 'Milk Tea Chocolate Custard Bun', zh: '奶茶巧克力奶黃包', jyutping: 'naai5 caa4 haau2 hak1 lik1 naai5 wong4 baau1', ingredients: ['wheat flour', 'Hong Kong milk tea', 'egg custard', 'milk chocolate ganache'], shape: 'fluffy steamed custard bun', shapeYue: '鬆軟蒸奶黃包' },
  { id: 1700, en: 'Yuenyeung Chocolate Mochi Bun', zh: '鴛鴦巧克力麻糬包', jyutping: 'jyun1 joeng1 haau2 hak1 lik1 maa4 ci4 baau1', ingredients: ['wheat flour', 'coffee', 'black tea', 'glutinous rice flour', 'dark chocolate ganache'], shape: 'soft round steamed mochi bun', shapeYue: '鬆軟圓身蒸麻糬包' },
  { id: 1720, en: 'Mango White Chocolate Snow-Skin Dumpling', zh: '芒果白巧克力冰皮餃', jyutping: 'mong1 gwo2 baak6 haau2 hak1 lik1 bing1 pei4 gaau2', ingredients: ['glutinous rice flour', 'mango', 'white chocolate ganache'], shape: 'pale yellow snow-skin dumpling', shapeYue: '淡黃色冰皮餃' },
  { id: 1740, en: 'Osmanthus Dark Chocolate Mooncake Dumpling', zh: '桂花黑巧克力月餅餃', jyutping: 'gwai3 faa1 hak1 haau2 hak1 lik1 jyut6 beng2 gaau2', ingredients: ['wheat flour', 'osmanthus', 'lotus seed paste', 'dark chocolate ganache'], shape: 'flower-stamped mini mooncake dumpling', shapeYue: '花印迷你月餅餃' }
];

for (const chocolate of chocolateOverrides) {
  const id = `hk-dish-${String(chocolate.id).padStart(4, '0')}`;
  const slug = slugify(chocolate.en);
  records[chocolate.id - 1501] = {
    id,
    slug,
    name: { en: chocolate.en, zhHant: chocolate.zh },
    jyutping: chocolate.jyutping,
    category: 'chocolate-filled-dim-sum',
    subcategory: 'bakery-and-tea-house-chocolate-specials',
    description: {
      en: `${chocolate.en} is a ${chocolate.shape} made with ${chocolate.ingredients.join(', ')} and a clearly enclosed chocolate centre.`,
      yue: `${chocolate.zh}係一款${chocolate.shapeYue}，入面完整包住巧克力餡，唔係淨係喺面頭畫條朱古力線交功課。`
    },
    ingredients: chocolate.ingredients,
    dietaryTags: ['vegetarian'],
    allergens: allergensFor(chocolate.ingredients),
    image: {
      path: `images/${id}-${slug}.png`,
      alt: {
        en: `${chocolate.en} with one piece opened to show the enclosed chocolate filling.`,
        yue: `${chocolate.zh}切開一件，清楚見到入面完整包住嘅巧克力餡。`
      }
    },
    imagePrompt: [
      'Use case: photorealistic-natural',
      'Asset type: native square catalog food photograph for an offline Hong Kong dim-sum index',
      `Primary request: one authentic serving of ${chocolate.en} (${chocolate.zh})`,
      'Scene/backdrop: warm contemporary Hong Kong bakery or tea-house tabletop with restrained ceramic service ware',
      `Subject: several intact pieces plus exactly one naturally opened piece showing a generous enclosed chocolate filling; the exterior must clearly read as a ${chocolate.shape}; visibly feature ${chocolate.ingredients.join(', ')}`,
      'Style/medium: original photorealistic professional food photography with natural edible texture',
      'Composition/framing: square 1:1 close three-quarter view, one serving centered with comfortable edge padding',
      'Lighting/mood: soft warm window light, believable colour, crisp detail in both exterior and chocolate centre',
      'Constraints: chocolate must be inside the dim sum rather than drizzled on top; show only this exact dish; no people; no hands; no text; no lettering; no logos; no watermark',
      'Avoid: duplicate plates, unrelated desserts, menus, labels, packaging, plastic texture, surreal ingredients'
    ].join('\n'),
    chocolateFilled: true
  };
}

if (records.length !== 250 || records[0]?.id !== 'hk-dish-1501' || records.at(-1)?.id !== 'hk-dish-1750') {
  throw new Error(`Expected IDs 1501-1750, generated ${records.length} records from ${records[0]?.id} to ${records.at(-1)?.id}.`);
}

const uniquenessFields = [
  ['ID', record => record.id],
  ['slug', record => record.slug],
  ['English name', record => record.name.en.toLocaleLowerCase('en')],
  ['Traditional Chinese name', record => record.name.zhHant],
  ['image path', record => record.image.path]
];

for (const [label, valueOf] of uniquenessFields) {
  const seen = new Map();
  for (const record of records) {
    const value = valueOf(record);
    if (seen.has(value)) {
      throw new Error(`Duplicate ${label}: ${value} (${seen.get(value)} and ${record.id}).`);
    }
    seen.set(value, record.id);
  }
}

for (const record of records) {
  const numericId = Number(record.id.slice(-4));
  const shouldBeChocolateFilled = numericId % 20 === 0;
  if ((record.chocolateFilled === true) !== shouldBeChocolateFilled) {
    throw new Error(`${record.id} violates the every-twentieth chocolate-filled rule.`);
  }
  if (shouldBeChocolateFilled) {
    if (!/chocolate/i.test(record.name.en) || !/巧克力/u.test(record.name.zhHant)) {
      throw new Error(`${record.id} must name chocolate in both languages.`);
    }
    if (!record.ingredients.some(ingredient => /chocolate|cocoa|cacao/i.test(ingredient))) {
      throw new Error(`${record.id} must include a chocolate ingredient.`);
    }
  }
  if (
    record.imagePrompt.length < 100
    || !/no (?:people|person)/i.test(record.imagePrompt)
    || !/no (?:text|lettering)/i.test(record.imagePrompt)
    || !/no watermark/i.test(record.imagePrompt)
  ) {
    throw new Error(`${record.id} has an incomplete image-generation prompt.`);
  }
}

const otherPartNames = (await readdir(partsRoot))
  .filter(filename => /^part-\d{4}-\d{4}\.json$/u.test(filename))
  .filter(filename => filename !== path.basename(outputPath))
  .sort((left, right) => left.localeCompare(right));
const otherRecords = [];
for (const filename of otherPartNames) {
  const part = JSON.parse(await readFile(path.join(partsRoot, filename), 'utf8'));
  if (!Array.isArray(part)) throw new Error(`${filename} is not a record array.`);
  otherRecords.push(...part);
}

for (const [label, valueOf] of uniquenessFields) {
  const ownerByValue = new Map(otherRecords.map(record => [valueOf(record), record.id]));
  for (const record of records) {
    const value = valueOf(record);
    if (ownerByValue.has(value)) {
      throw new Error(`Cross-part duplicate ${label}: ${value} (${ownerByValue.get(value)} and ${record.id}).`);
    }
  }
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`Generated ${records.length} records at ${path.relative(repositoryRoot, outputPath)} after checking ${otherRecords.length} existing records.`);
