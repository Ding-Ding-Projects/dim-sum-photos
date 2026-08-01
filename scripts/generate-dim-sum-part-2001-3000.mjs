import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const partsRoot = path.join(repositoryRoot, 'dim-sum', 'catalog-parts');

const families = [
  { en: 'Mango Pomelo Sago', zh: '芒果西柚西米露', jyutping: 'mong1 gwo2 sai1 jau4 sai1 mai5 lou6', ingredients: ['mango', 'pomelo', 'tapioca pearls', 'coconut milk'], allergens: [] },
  { en: 'Red Bean Soup', zh: '紅豆沙', jyutping: 'hung4 dau6 saa1', ingredients: ['red beans', 'rock sugar', 'tangerine peel'], allergens: [] },
  { en: 'Black Sesame Soup', zh: '黑芝麻糊', jyutping: 'hak1 zi1 maa4 wu4', ingredients: ['black sesame', 'rice flour', 'rock sugar'], allergens: ['sesame'] },
  { en: 'Almond Tofu Pudding', zh: '杏仁豆腐', jyutping: 'hang6 jan4 dau6 fu6', ingredients: ['almond milk', 'agar', 'rock sugar'], allergens: ['tree-nuts'] },
  { en: 'Grass Jelly', zh: '仙草凍', jyutping: 'sin1 cou2 dung3', ingredients: ['grass jelly', 'brown sugar syrup', 'evaporated milk'], allergens: ['dairy'] },
  { en: 'Guilinggao', zh: '龜苓膏', jyutping: 'gwai1 ling4 gou1', ingredients: ['guilinggao herbal jelly', 'honey', 'goji berries'], allergens: [] },
  { en: 'Coconut Jelly', zh: '椰汁糕', jyutping: 'je4 zap1 gou1', ingredients: ['coconut milk', 'agar', 'rock sugar'], allergens: [] },
  { en: 'Taro Sago', zh: '芋頭西米露', jyutping: 'wu6 tau4 sai1 mai5 lou6', ingredients: ['taro', 'tapioca pearls', 'coconut milk'], allergens: [] },
  { en: 'Osmanthus Rice Cake', zh: '桂花糕', jyutping: 'gwai3 faa1 gou1', ingredients: ['rice flour', 'osmanthus syrup', 'rock sugar'], allergens: [] },
  { en: 'Sweet Potato Cake', zh: '番薯糕', jyutping: 'faan1 syu4 gou1', ingredients: ['sweet potato', 'rice flour', 'coconut milk'], allergens: [] },
  { en: 'Mung Bean Soup', zh: '綠豆沙', jyutping: 'luk6 dau6 saa1', ingredients: ['mung beans', 'rock sugar', 'dried seaweed'], allergens: [] },
  { en: 'Peanut Soup', zh: '花生糊', jyutping: 'faa1 sang1 wu4', ingredients: ['peanuts', 'rice flour', 'rock sugar'], allergens: ['peanut'] },
  { en: 'Taro Balls', zh: '芋圓', jyutping: 'wu6 jyun4', ingredients: ['taro', 'sweet potato', 'tapioca starch'], allergens: [] },
  { en: 'Winter Melon Jelly', zh: '冬瓜糕', jyutping: 'dung1 gwaa1 gou1', ingredients: ['winter melon', 'agar', 'brown sugar'], allergens: [] },
  { en: 'Milk Tea Pudding', zh: '奶茶布甸', jyutping: 'naai5 caa4 bou3 din6', ingredients: ['Hong Kong milk tea', 'gelatin', 'evaporated milk'], allergens: ['dairy'] },
  { en: 'Egg Custard Pudding', zh: '蛋奶布甸', jyutping: 'daan6 naai5 bou3 din6', ingredients: ['egg', 'evaporated milk', 'rock sugar'], allergens: ['dairy', 'egg'] },
  { en: 'Sesame Tang Yuan', zh: '芝麻湯圓', jyutping: 'zi1 maa4 tong1 jyun4', ingredients: ['glutinous rice flour', 'black sesame paste', 'rock sugar'], allergens: ['sesame'] },
  { en: 'Red Bean Rice Cake', zh: '紅豆糕', jyutping: 'hung4 dau6 gou1', ingredients: ['red beans', 'rice flour', 'coconut milk'], allergens: [] },
  { en: 'Coconut Tapioca', zh: '椰汁西米', jyutping: 'je4 zap1 sai1 mai5', ingredients: ['coconut milk', 'tapioca pearls', 'rock sugar'], allergens: [] },
  { en: 'Mango Pudding', zh: '芒果布甸', jyutping: 'mong1 gwo2 bou3 din6', ingredients: ['mango', 'gelatin', 'evaporated milk'], allergens: ['dairy'] }
];

const presentations = [
  { en: 'Classic Dessert Bowl', zh: '經典甜品碗', jyutping: 'ging1 din2 tim4 ban2', vessel: 'a shallow white ceramic dessert bowl' },
  { en: 'Chilled Glass Cup', zh: '冰鎮玻璃杯', jyutping: 'bing1 zan3 bo1 lei1 bui1', vessel: 'a clear chilled glass dessert cup' },
  { en: 'Ceramic Dessert Plate', zh: '陶瓷甜品碟', jyutping: 'tou4 ci4 tim4 ban2 dip6', vessel: 'a small glazed ceramic dessert plate' },
  { en: 'Osmanthus Garnish Bowl', zh: '桂花甜品碗', jyutping: 'gwai3 faa1 tim4 ban2', vessel: 'a white ceramic bowl with a few osmanthus blossoms' },
  { en: 'Coconut Cream Dessert Bowl', zh: '椰香甜品碗', jyutping: 'je4 hoeng1 tim4 ban2', vessel: 'a pale ceramic bowl with a restrained coconut cream finish' },
  { en: 'Brown Sugar Syrup Dessert Bowl', zh: '黑糖糖漿甜品碗', jyutping: 'hak1 tong4 tong4 zoeng1 tim4 ban2', vessel: 'a ceramic bowl with a small glossy brown-sugar syrup pool' },
  { en: 'Condensed Milk Dessert Cup', zh: '煉奶甜品杯', jyutping: 'lin6 naai5 tim4 ban2 bui1', vessel: 'a clear dessert cup with a modest condensed-milk ribbon' },
  { en: 'Mini Tong-Yuen Dessert Bowl', zh: '迷你湯圓甜品碗', jyutping: 'mai4 nei5 tong1 jyun4 tim4 ban2', vessel: 'a small ceramic bowl with three tiny glutinous rice balls' },
  { en: 'Cha Chaan Teng Dessert Glass', zh: '茶記甜品玻璃杯', jyutping: 'caa4 gei3 tim4 ban2 bo1 lei1 bui1', vessel: 'a classic Hong Kong cha chaan teng style glass dessert cup' },
  { en: 'New Territories Tea-House Dessert Bowl', zh: '新界茶樓甜品碗', jyutping: 'san1 gaai3 caa4 lau4 tim4 ban2', vessel: 'a restrained New Territories tea-house ceramic dessert bowl' }
];

const styles = [
  { en: 'Classic', zh: '經典', jyutping: 'ging1 din2', ingredients: [], note: 'balanced traditional sweetness' },
  { en: 'Brown Sugar', zh: '黑糖', jyutping: 'hak1 tong4', ingredients: ['brown sugar syrup'], note: 'deep brown-sugar aroma' },
  { en: 'Osmanthus', zh: '桂花', jyutping: 'gwai3 faa1', ingredients: ['osmanthus syrup'], note: 'light osmanthus fragrance' },
  { en: 'Coconut Cream', zh: '椰香', jyutping: 'je4 hoeng1', ingredients: ['coconut cream'], note: 'gentle coconut richness' },
  { en: 'Salted Caramel', zh: '海鹽焦糖', jyutping: 'hoi2 jim4 ziu1 tong4', ingredients: ['salted caramel'], note: 'a restrained salted-caramel finish' }
];

function slugify(value) {
  return value.toLowerCase().replace(/&/gu, ' and ').replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

function unique(values) {
  return [...new Set(values)];
}

function idOf(number) {
  return `hk-dish-${String(number).padStart(4, '0')}`;
}

function baseIngredients(family, style) {
  return unique([...family.ingredients, ...style.ingredients]);
}

function allergensFor(family, style) {
  return unique([
    ...family.allergens,
    ...(style.en === 'Salted Caramel' ? ['dairy'] : []),
    ...(style.en === 'Coconut Cream' && family.en === 'Milk Tea Pudding' ? ['dairy'] : [])
  ]);
}

function buildRegularDish(number) {
  const offset = number - 2001;
  const family = families[offset % families.length];
  const presentation = presentations[Math.floor(offset / families.length) % presentations.length];
  const style = styles[Math.floor(offset / (families.length * presentations.length)) % styles.length];
  const nameEn = `Hong Kong ${style.en} ${family.en} ${presentation.en}`;
  const nameZh = `香港${style.zh}${family.zh}${presentation.zh}`;
  const ingredients = baseIngredients(family, style);
  const slug = slugify(nameEn);

  return {
    id: idOf(number),
    slug,
    name: { en: nameEn, zhHant: nameZh },
    jyutping: `hoeng1 gong2 ${style.jyutping} ${family.jyutping} ${presentation.jyutping}`,
    category: 'hong-kong-desserts',
    subcategory: 'tea-house-sweet-soups-and-puddings',
    description: {
      en: `${nameEn} is a Hong Kong dessert served with ${ingredients.join(', ')}, prepared for a calm tea-house finish with ${style.note}.`,
      yue: `${nameZh}係香港茶樓甜品，用${ingredients.join('、')}整，${style.note}，食落清甜順口。`
    },
    ingredients,
    dietaryTags: ['vegetarian'],
    allergens: allergensFor(family, style),
    image: {
      path: `images/${idOf(number)}-${slug}.png`,
      alt: {
        en: `One serving of ${nameEn}, presented in ${presentation.vessel}.`,
        yue: `一份${nameZh}，用${presentation.vessel === 'a clear chilled glass dessert cup' ? '冰涼玻璃杯' : '茶樓甜品器皿'}上枱。`
      }
    },
    imagePrompt: [
      'Use case: photorealistic-natural',
      'Asset type: native square catalog image for an offline Hong Kong dessert index',
      `Primary request: one authentic serving of ${nameEn} (${nameZh})`,
      'Scene/backdrop: warm Hong Kong cha chaan teng or New Territories tea-house tabletop with restrained local tableware and a softly defocused interior',
      `Subject: ${presentation.vessel}; visibly feature ${ingredients.join(', ')} and the ${style.note}`,
      'Style/medium: original photorealistic editorial food photography with natural edible texture and culturally accurate Hong Kong dessert presentation',
      'Composition/framing: native square 1:1 close three-quarter overhead food view, one serving centered, full vessel visible, generous edge padding',
      'Lighting/mood: soft window light with warm practical fill, believable colour, translucent textures, and crisp ingredient detail',
      'Constraints: show only this exact dessert and its normal edible garnish; one serving; no people or hands; no text or lettering; no logos; no watermark',
      'Avoid: duplicate vessels, unrelated savoury dishes, menus, labels, packaging, fake plastic food, impossible ingredients, western fusion restyling'
    ].join('\n')
  };
}

function buildChocolateDish(number) {
  const offset = number - 2001;
  const family = families[offset % families.length];
  const presentation = presentations[Math.floor(offset / families.length) % presentations.length];
  const style = styles[Math.floor(offset / (families.length * presentations.length)) % styles.length];
  const nameEn = `Hong Kong ${style.en} Dark Chocolate ${family.en} ${presentation.en}`;
  const nameZh = `香港${style.zh}黑朱古力${family.zh}${presentation.zh}`;
  const ingredients = unique([...family.ingredients, ...style.ingredients, 'dark chocolate', 'cocoa butter']);
  const slug = slugify(nameEn);

  return {
    id: idOf(number),
    slug,
    name: { en: nameEn, zhHant: nameZh },
    jyutping: `hoeng1 gong2 ${style.jyutping} hak1 zyu1 gu2 lik6 ${family.jyutping} ${presentation.jyutping}`,
    category: 'hong-kong-desserts',
    subcategory: 'tea-house-chocolate-desserts',
    description: {
      en: `${nameEn} is a Hong Kong tea-house dessert with a genuine enclosed dark-chocolate filling and ${ingredients.join(', ')}.`,
      yue: `${nameZh}係香港茶樓朱古力甜品，朱古力餡包喺入面，配合${ingredients.join('、')}，唔係淨係面頭做裝飾。`
    },
    ingredients,
    dietaryTags: ['vegetarian'],
    allergens: unique([...allergensFor(family, style), 'dairy', 'soy']),
    image: {
      path: `images/${idOf(number)}-${slug}.png`,
      alt: {
        en: `One serving of ${nameEn}, with one portion opened to show the enclosed chocolate centre.`,
        yue: `${nameZh}切開一件，清楚見到入面嘅朱古力餡。`
      }
    },
    imagePrompt: [
      'Use case: photorealistic-natural',
      'Asset type: native square catalog image for an offline Hong Kong dessert index',
      `Primary request: one authentic serving of ${nameEn} (${nameZh})`,
      'Scene/backdrop: warm Hong Kong cha chaan teng or New Territories tea-house tabletop with restrained ceramic tableware',
      `Subject: ${presentation.vessel}; visibly feature ${ingredients.join(', ')} and one portion opened to show the enclosed dark chocolate centre`,
      'Style/medium: original photorealistic editorial food photography with natural edible texture and culturally accurate Hong Kong dessert presentation',
      'Composition/framing: native square 1:1 close three-quarter food view, one serving centered, full vessel visible, generous edge padding',
      'Lighting/mood: soft window light with warm practical fill, believable colour, crisp detail in the dessert layers and chocolate centre',
      'Constraints: chocolate must be inside the dessert rather than merely drizzled on top; show only this exact dessert; one serving; no people or hands; no text or lettering; no logos; no watermark',
      'Avoid: duplicate vessels, unrelated dishes, menus, labels, packaging, fake plastic texture, surreal ingredients'
    ].join('\n'),
    chocolateFilled: true
  };
}

const dishes = [];
for (let number = 2001; number <= 3000; number += 1) {
  dishes.push(number % 20 === 0 ? buildChocolateDish(number) : buildRegularDish(number));
}

if (dishes.length !== 1000) throw new Error(`Expected 1,000 dessert dishes, found ${dishes.length}.`);

const duplicateOf = values => values.find((value, index) => values.indexOf(value) !== index);
for (const [label, values] of [
  ['ID', dishes.map(dish => dish.id)],
  ['slug', dishes.map(dish => dish.slug)],
  ['English name', dishes.map(dish => dish.name.en.toLowerCase())],
  ['Traditional Chinese name', dishes.map(dish => dish.name.zhHant)],
  ['image path', dishes.map(dish => dish.image.path)]
]) {
  const duplicate = duplicateOf(values);
  if (duplicate) throw new Error(`Duplicate ${label}: ${duplicate}`);
}

await mkdir(partsRoot, { recursive: true });
for (let start = 2001; start <= 3000; start += 250) {
  const end = start + 249;
  const part = dishes.slice(start - 2001, end - 2000);
  const outputPath = path.join(partsRoot, `part-${start}-${end}.json`);
  await writeFile(outputPath, `${JSON.stringify(part, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${part.length} records to ${path.relative(repositoryRoot, outputPath)}.`);
}
