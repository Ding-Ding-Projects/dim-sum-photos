import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const outputPath = path.join(repositoryRoot, 'dim-sum', 'catalog-parts', 'part-1751-2000.json');

const formats = [
  {
    en: 'Crystal Dumpling',
    zh: '水晶餃',
    jyutping: 'seoi2 zing1 gaau2',
    category: 'regional-tea-house-dim-sum',
    subcategory: 'steamed-crystal-dumplings',
    ingredients: ['wheat starch', 'tapioca starch', 'sesame oil'],
    allergens: ['gluten', 'sesame'],
    presentation: 'four translucent pleated crystal dumplings in one bamboo steamer'
  },
  {
    en: 'Pan-Fried Chive Pocket',
    zh: '香煎韭菜盒',
    jyutping: 'hoeng1 zin1 gau2 coi3 hap6',
    category: 'regional-tea-house-dim-sum',
    subcategory: 'pan-fried-dumplings',
    ingredients: ['wheat wrapper', 'Chinese chives', 'sesame oil'],
    allergens: ['gluten', 'sesame'],
    presentation: 'four round chive pockets with crisp golden bases on one ceramic plate'
  },
  {
    en: 'Baked Flaky Puff',
    zh: '焗酥',
    jyutping: 'guk6 sou1',
    category: 'regional-tea-house-dim-sum',
    subcategory: 'baked-tea-house-pastries',
    ingredients: ['wheat flour', 'butter', 'egg wash'],
    allergens: ['gluten', 'dairy', 'egg'],
    presentation: 'four small laminated golden puffs, with one cleanly opened to show the savoury filling'
  },
  {
    en: 'Crispy Rice-Paper Roll',
    zh: '脆炸米紙卷',
    jyutping: 'ceoi3 zaa3 mai5 zi2 gyun2',
    category: 'regional-tea-house-dim-sum',
    subcategory: 'crispy-rice-paper-rolls',
    ingredients: ['rice paper', 'water chestnut', 'vegetable oil'],
    allergens: [],
    presentation: 'four slender blistered rice-paper rolls on one tea-house plate'
  },
  {
    en: 'Steamed Bao',
    zh: '蒸包',
    jyutping: 'zing1 baau1',
    category: 'regional-tea-house-dim-sum',
    subcategory: 'steamed-tea-house-buns',
    ingredients: ['wheat flour', 'yeast', 'sugar'],
    allergens: ['gluten'],
    presentation: 'three soft pleated steamed buns in one bamboo steamer, with one opened to show the filling'
  }
];

const fillings = [
  {
    en: 'Water Chestnut and Shiitake',
    zh: '馬蹄冬菇',
    jyutping: 'maa5 tai4 dung1 gu1',
    ingredients: ['water chestnut', 'shiitake mushroom']
  },
  {
    en: 'Taro and Ginkgo',
    zh: '芋頭白果',
    jyutping: 'wu6 tau4 baak6 gwo2',
    ingredients: ['taro', 'ginkgo nut']
  },
  {
    en: 'Lotus Root and Snow Pea',
    zh: '蓮藕蜜豆',
    jyutping: 'lin4 ngau5 mat6 dau6',
    ingredients: ['lotus root', 'snow pea']
  },
  {
    en: 'Pumpkin and Cashew',
    zh: '南瓜腰果',
    jyutping: 'naam4 gwaa1 jiu1 gwo2',
    ingredients: ['pumpkin', 'cashew']
  },
  {
    en: 'Chive and Tofu',
    zh: '韭菜豆腐',
    jyutping: 'gau2 coi3 dau6 fu6',
    ingredients: ['Chinese chives', 'firm tofu']
  },
  {
    en: 'Bamboo Shoot and Mixed Mushroom',
    zh: '竹筍雜菌',
    jyutping: 'zuk1 seon2 zaap6 kwan2',
    ingredients: ['bamboo shoot', 'shiitake mushroom', 'oyster mushroom']
  },
  {
    en: 'Salted Lemon and Silken Tofu',
    zh: '鹹檸檬滑豆腐',
    jyutping: 'haam4 ning4 mung1 waat6 dau6 fu6',
    ingredients: ['salted lemon', 'silken tofu']
  },
  {
    en: 'Preserved Olive and Pea Shoot',
    zh: '欖菜豆苗',
    jyutping: 'laam5 coi3 dau6 miu4',
    ingredients: ['preserved olive vegetable', 'pea shoot']
  },
  {
    en: 'Black Garlic and Cauliflower',
    zh: '黑蒜椰菜花',
    jyutping: 'hak1 syun3 je4 coi3 faa1',
    ingredients: ['black garlic', 'cauliflower']
  },
  {
    en: 'Curry Potato and Green Pea',
    zh: '咖喱薯仔青豆',
    jyutping: 'gaa3 lei1 syu4 zai2 cing1 dau6',
    ingredients: ['potato', 'green pea', 'Cantonese curry powder']
  }
];

const seasonings = [
  {
    en: 'Ginger-Scallion',
    zh: '薑蔥',
    jyutping: 'goeng1 cung1',
    ingredients: ['ginger', 'scallion']
  },
  {
    en: 'White-Pepper',
    zh: '白胡椒',
    jyutping: 'baak6 wu4 ziu1',
    ingredients: ['white pepper', 'spring onion']
  },
  {
    en: 'Fermented-Chilli',
    zh: '發酵辣椒',
    jyutping: 'faat3 haau3 laat6 ziu1',
    ingredients: ['fermented chilli', 'garlic']
  },
  {
    en: 'Mandarin-Peel',
    zh: '陳皮',
    jyutping: 'can4 pei4',
    ingredients: ['dried mandarin peel', 'ginger']
  },
  {
    en: 'Black-Bean',
    zh: '豉汁',
    jyutping: 'si6 zap1',
    ingredients: ['fermented black bean', 'garlic']
  }
];

const chocolateSpecials = new Map([
  [1760, {
    en: 'New Territories Tea-House Tangerine Dark Chocolate Crystal Dumpling',
    zh: '新界茶樓陳皮黑朱古力水晶餃',
    jyutping: 'san1 gaai3 caa4 lau4 can4 pei4 hak1 zyu1 gu2 lik6 seoi2 zing1 gaau2',
    ingredients: ['wheat starch', 'dark chocolate', 'dried tangerine peel', 'cocoa butter'],
    presentation: 'four translucent cocoa-striped dumplings, one opened to show enclosed dark chocolate and fine tangerine peel'
  }],
  [1780, {
    en: 'New Territories Tea-House Salted Caramel Chocolate Lotus Dumpling',
    zh: '新界茶樓海鹽焦糖朱古力蓮香餃',
    jyutping: 'san1 gaai3 caa4 lau4 hoi2 jim4 ziu1 tong4 zyu1 gu2 lik6 lin4 hoeng1 gaau2',
    ingredients: ['wheat starch', 'milk chocolate', 'salted caramel', 'lotus seed paste'],
    presentation: 'four amber crystal dumplings, one opened to show separate enclosed chocolate, caramel, and lotus layers'
  }],
  [1800, {
    en: 'New Territories Tea-House Hazelnut Chocolate Bamboo Dumpling',
    zh: '新界茶樓榛子朱古力竹筍餃',
    jyutping: 'san1 gaai3 caa4 lau4 zeon1 zi2 zyu1 gu2 lik6 zuk1 seon2 gaau2',
    ingredients: ['wheat starch', 'dark chocolate', 'roasted hazelnut', 'young bamboo shoot'],
    presentation: 'four pleated dumplings with bamboo-shoot flecks, one opened to reveal an enclosed hazelnut chocolate centre'
  }],
  [1820, {
    en: 'New Territories Tea-House Matcha Chocolate Pan-Fried Bun',
    zh: '新界茶樓抹茶朱古力生煎包',
    jyutping: 'san1 gaai3 caa4 lau4 mut3 caa4 zyu1 gu2 lik6 saang1 zin1 baau1',
    ingredients: ['wheat flour', 'dark chocolate', 'matcha', 'yeast'],
    presentation: 'three jade-tinted pan-fried buns with crisp bases, one opened to expose enclosed dark chocolate'
  }],
  [1840, {
    en: 'New Territories Tea-House Black Sesame Chocolate Chive Pocket',
    zh: '新界茶樓黑芝麻朱古力韭菜盒',
    jyutping: 'san1 gaai3 caa4 lau4 hak1 zi1 maa4 zyu1 gu2 lik6 gau2 coi3 hap6',
    ingredients: ['wheat wrapper', 'dark chocolate', 'black sesame paste', 'Chinese chives'],
    presentation: 'four crisp chive pockets, one opened to show a distinct enclosed black-sesame chocolate filling'
  }],
  [1860, {
    en: 'New Territories Tea-House Taro Chocolate Baked Puff',
    zh: '新界茶樓芋香朱古力焗酥',
    jyutping: 'san1 gaai3 caa4 lau4 wu6 hoeng1 zyu1 gu2 lik6 guk6 sou1',
    ingredients: ['puff pastry', 'dark chocolate', 'taro paste', 'butter'],
    presentation: 'four lavender-striped flaky puffs, one opened to show enclosed layers of taro and chocolate'
  }],
  [1880, {
    en: 'New Territories Tea-House Red Bean Chocolate Baked Puff',
    zh: '新界茶樓豆沙朱古力焗酥',
    jyutping: 'san1 gaai3 caa4 lau4 dau6 saa1 zyu1 gu2 lik6 guk6 sou1',
    ingredients: ['puff pastry', 'dark chocolate', 'red bean paste', 'butter'],
    presentation: 'four golden laminated puffs, one opened to show an enclosed red-bean chocolate centre'
  }],
  [1900, {
    en: 'New Territories Tea-House Coconut Chocolate Sesame Puff',
    zh: '新界茶樓椰香朱古力煎堆',
    jyutping: 'san1 gaai3 caa4 lau4 je4 hoeng1 zyu1 gu2 lik6 zin1 deoi1',
    ingredients: ['glutinous rice flour', 'dark chocolate', 'shredded coconut', 'white sesame'],
    presentation: 'four sesame-coated puffs, one split open to show enclosed coconut chocolate filling'
  }],
  [1920, {
    en: 'New Territories Tea-House Yuzu Chocolate Crispy Roll',
    zh: '新界茶樓柚子朱古力脆卷',
    jyutping: 'san1 gaai3 caa4 lau4 jau2 zi2 zyu1 gu2 lik6 ceoi3 gyun2',
    ingredients: ['rice paper', 'dark chocolate', 'yuzu peel', 'coconut cream'],
    presentation: 'four blistered crisp rolls, one opened to reveal an enclosed dark-chocolate and yuzu filling'
  }],
  [1940, {
    en: 'New Territories Tea-House Ginger Chocolate Rice-Paper Parcel',
    zh: '新界茶樓薑汁朱古力米紙包',
    jyutping: 'san1 gaai3 caa4 lau4 goeng1 zap1 zyu1 gu2 lik6 mai5 zi2 baau1',
    ingredients: ['rice paper', 'dark chocolate', 'fresh ginger', 'brown sugar'],
    presentation: 'four crisp rice-paper parcels, one opened to show enclosed ginger chocolate filling'
  }],
  [1960, {
    en: 'New Territories Tea-House Peanut Chocolate Steamed Bao',
    zh: '新界茶樓花生朱古力蒸包',
    jyutping: 'san1 gaai3 caa4 lau4 faa1 sang1 zyu1 gu2 lik6 zing1 baau1',
    ingredients: ['wheat flour', 'milk chocolate', 'roasted peanut', 'yeast'],
    presentation: 'three tan spiral steamed buns, one opened to show enclosed peanut chocolate filling'
  }],
  [1980, {
    en: 'New Territories Tea-House White Chocolate Lotus Bao',
    zh: '新界茶樓白朱古力蓮蓉包',
    jyutping: 'san1 gaai3 caa4 lau4 baak6 zyu1 gu2 lik6 lin4 jung4 baau1',
    ingredients: ['wheat flour', 'white chocolate', 'lotus seed paste', 'yeast'],
    presentation: 'three snowy pleated bao, one opened to show an enclosed white-chocolate lotus filling'
  }],
  [2000, {
    en: 'New Territories Tea-House Mandarin Chocolate Phoenix Bao',
    zh: '新界茶樓柑香朱古力鳳凰包',
    jyutping: 'san1 gaai3 caa4 lau4 gam1 hoeng1 zyu1 gu2 lik6 fung6 wong4 baau1',
    ingredients: ['wheat flour', 'dark chocolate', 'mandarin zest', 'salted egg custard'],
    presentation: 'three phoenix-stamped steamed buns, one opened to reveal enclosed mandarin chocolate custard'
  }]
]);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/gu, ' and ')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
}

function unique(values) {
  return [...new Set(values)];
}

function buildRegularDish(id) {
  const position = id - 1751;
  const format = formats[Math.floor(position / 50)];
  const withinFormat = position % 50;
  const filling = fillings[Math.floor(withinFormat / 5)];
  const seasoning = seasonings[withinFormat % 5];
  const nameEn = `New Territories Tea-House ${seasoning.en} ${filling.en} ${format.en}`;
  const nameZh = `新界茶樓${seasoning.zh}${filling.zh}${format.zh}`;
  const ingredients = unique([
    ...format.ingredients,
    ...filling.ingredients,
    ...seasoning.ingredients
  ]);
  const allergens = unique([
    ...format.allergens,
    ...(filling.en.includes('Cashew') ? ['tree-nuts'] : []),
    ...(filling.en.includes('Tofu') ? ['soy'] : []),
    ...(seasoning.en === 'Black-Bean' ? ['soy'] : [])
  ]);

  return {
    id: `hk-dish-${String(id).padStart(4, '0')}`,
    slug: slugify(nameEn),
    name: {
      en: nameEn,
      zhHant: nameZh
    },
    jyutping: `san1 gaai3 caa4 lau4 ${seasoning.jyutping} ${filling.jyutping} ${format.jyutping}`,
    category: format.category,
    subcategory: format.subcategory,
    description: {
      en: `${nameEn} is a regional Hong Kong tea-house dim sum made with ${ingredients.join(', ')}.`,
      yue: `${nameZh}係新界茶樓風味點心，用${ingredients.join('、')}做成，味道同造型都清楚分得出。`
    },
    ingredients,
    dietaryTags: ['vegetarian'],
    allergens,
    image: {
      path: `images/hk-dish-${String(id).padStart(4, '0')}-${slugify(nameEn)}.png`,
      alt: {
        en: `One serving of ${nameEn}, ${format.presentation}.`,
        yue: `一份${nameZh}，以新界茶樓傳統器皿上枱。`
      }
    },
    imagePrompt: [
      'Use case: photorealistic-natural',
      'Asset type: native square catalog image for an offline Hong Kong dim-sum index',
      `Primary request: one authentic serving of ${nameEn} (${nameZh})`,
      'Scene/backdrop: warm New Territories Hong Kong tea-house tabletop with restrained ceramic or bamboo tableware and a softly defocused interior',
      `Subject: ${format.presentation}; visibly feature ${ingredients.join(', ')}`,
      'Style/medium: original photorealistic editorial food photography with natural edible texture and culturally accurate presentation',
      'Composition/framing: native square 1:1 close three-quarter overhead food view, one serving centered, full plate or steamer visible, generous edge padding',
      'Lighting/mood: soft window light with warm practical fill, believable colour and crisp ingredient detail',
      'Constraints: show only this exact dish and its normal edible garnish; one serving; no people or hands; no text or lettering; no logos; no watermark',
      'Avoid: duplicate plates, unrelated side dishes, menus, labels, packaging, fake plastic food, impossible ingredients, fusion restyling'
    ].join('\n')
  };
}

function buildChocolateDish(id, special) {
  const paddedId = String(id).padStart(4, '0');
  return {
    id: `hk-dish-${paddedId}`,
    slug: slugify(special.en),
    name: {
      en: special.en,
      zhHant: special.zh
    },
    jyutping: special.jyutping,
    category: 'chocolate-filled-dim-sum',
    subcategory: 'regional-tea-house-chocolate-special',
    description: {
      en: `${special.en} is a Hong Kong tea-house dim sum with a genuine enclosed chocolate filling made from ${special.ingredients.join(', ')}.`,
      yue: `${special.zh}係新界茶樓朱古力餡點心，朱古力真係包喺入面，唔係淨係喺面頭畫兩筆交功課。`
    },
    ingredients: special.ingredients,
    dietaryTags: ['vegetarian'],
    allergens: unique([
      'gluten',
      ...(special.ingredients.some(value => /milk chocolate|white chocolate|butter|custard/iu.test(value)) ? ['dairy'] : []),
      ...(special.ingredients.some(value => /peanut/iu.test(value)) ? ['peanut'] : []),
      ...(special.ingredients.some(value => /hazelnut/iu.test(value)) ? ['tree-nuts'] : []),
      ...(special.ingredients.some(value => /sesame/iu.test(value)) ? ['sesame'] : []),
      'soy'
    ]),
    image: {
      path: `images/hk-dish-${paddedId}-${slugify(special.en)}.png`,
      alt: {
        en: `One serving of ${special.en}, ${special.presentation}.`,
        yue: `${special.zh}切開一件，清楚見到入面嘅朱古力餡。`
      }
    },
    imagePrompt: [
      'Use case: photorealistic-natural',
      'Asset type: native square catalog image for an offline Hong Kong dim-sum index',
      `Primary request: one authentic serving of ${special.en} (${special.zh})`,
      'Scene/backdrop: warm contemporary New Territories Hong Kong tea-house tabletop with restrained ceramic or bamboo tableware',
      `Subject: ${special.presentation}; visibly feature ${special.ingredients.join(', ')}`,
      'Style/medium: original photorealistic food photography with natural edible texture',
      'Composition/framing: native square 1:1 close three-quarter food view, one serving centered, generous edge padding',
      'Lighting/mood: soft window light, warm but natural colour, crisp detail in both wrapper and chocolate centre',
      'Constraints: chocolate must be inside the dim sum rather than merely drizzled on top; show only this exact dish; no people or hands; no text or lettering; no logos; no watermark',
      'Avoid: duplicate plates, unrelated desserts, menus, labels, packaging, fake plastic texture, surreal ingredients'
    ].join('\n'),
    chocolateFilled: true
  };
}

const dishes = [];
for (let id = 1751; id <= 2000; id += 1) {
  const special = chocolateSpecials.get(id);
  dishes.push(special ? buildChocolateDish(id, special) : buildRegularDish(id));
}

if (dishes.length !== 250) {
  throw new Error(`Expected 250 dishes, found ${dishes.length}.`);
}

const duplicateOf = values => values.find((value, index) => values.indexOf(value) !== index);
for (const [label, values] of [
  ['ID', dishes.map(dish => dish.id)],
  ['slug', dishes.map(dish => dish.slug)],
  ['English name', dishes.map(dish => dish.name.en.toLowerCase())],
  ['Traditional Chinese name', dishes.map(dish => dish.name.zhHant)],
  ['image path', dishes.map(dish => dish.image.path)]
]) {
  const duplicate = duplicateOf(values);
  if (duplicate) {
    throw new Error(`Duplicate ${label}: ${duplicate}`);
  }
}

for (const dish of dishes) {
  const numericId = Number(dish.id.slice(-4));
  if ((dish.chocolateFilled === true) !== (numericId % 20 === 0)) {
    throw new Error(`${dish.id} violates the every-twentieth chocolate invariant.`);
  }
}

await writeFile(outputPath, `${JSON.stringify(dishes, null, 2)}\n`, 'utf8');
console.log(`Wrote ${dishes.length} records to ${path.relative(repositoryRoot, outputPath)}.`);
