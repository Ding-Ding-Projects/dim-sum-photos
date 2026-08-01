import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const catalogPartsRoot = path.join(repositoryRoot, 'dim-sum', 'catalog-parts');
const outputFilename = 'part-1251-1500.json';
const outputPath = path.join(catalogPartsRoot, outputFilename);

const slugify = value => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const base = (en, zh, jyutping, ingredients, visual) => ({
  en,
  zh,
  jyutping,
  ingredients,
  visual
});

const variant = (en, zh, jyutping, ingredients, noteEn, noteYue) => ({
  en,
  zh,
  jyutping,
  ingredients,
  noteEn,
  noteYue
});

const allergenRules = [
  ['fish', /fish|garoupa|grouper|pomfret|sea bass|threadfin|coral trout|eel|fish maw|dried flounder/i],
  ['shellfish', /prawn|shrimp|lobster|crab|scallop/i],
  ['molluscs', /clam|oyster|abalone|cuttlefish|squid|conch|octopus/i],
  ['soy', /soy|tofu|bean curd|fermented black bean|black bean sauce/i],
  ['gluten', /wheat|noodle|e-fu|wonton|soy sauce|oyster sauce|pastry/i],
  ['egg', /egg/i],
  ['sesame', /sesame/i],
  ['peanut', /peanut/i],
  ['tree-nuts', /almond|hazelnut|walnut|cashew|chestnut/i],
  ['dairy', /milk|butter|cream/i]
];

const meatPattern = /pork|chicken|duck|goose|pigeon|suckling pig/i;
const seafoodPattern = /fish|garoupa|grouper|pomfret|sea bass|threadfin|coral trout|eel|prawn|shrimp|lobster|crab|scallop|clam|oyster|abalone|cuttlefish|squid|conch|octopus|sea cucumber|fish maw/i;

const dietaryTagsFor = ingredients => {
  const ingredientText = ingredients.join(' ');
  if (meatPattern.test(ingredientText)) return ['contains-meat'];
  if (seafoodPattern.test(ingredientText)) return ['pescatarian'];
  return ['vegetarian'];
};

const allergensFor = ingredients => allergenRules
  .filter(([, pattern]) => ingredients.some(ingredient => pattern.test(ingredient)))
  .map(([allergen]) => allergen);

const groups = [
  {
    category: 'hong-kong-banquet',
    subcategory: 'whole-fish',
    setting: 'a formal Hong Kong Cantonese banquet table with a restrained white tablecloth and an uncluttered lazy Susan',
    vessel: 'one long white porcelain fish platter',
    bases: [
      base('Live Garoupa', '游水石斑', 'jau4 seoi2 sek6 baan1', ['whole garoupa'], 'a whole garoupa with pearly scored flesh and intact head and tail'),
      base('Golden Pomfret', '金鯧魚', 'gam1 cong1 jyu4', ['whole golden pomfret'], 'a whole golden pomfret with silvery-gold skin and delicate flaky flesh'),
      base('Sea Bass', '鱸魚', 'lou4 jyu4', ['whole sea bass'], 'a whole sea bass with moist white flesh and neatly scored skin'),
      base('Threadfin', '馬友魚', 'maa5 jau5 jyu4', ['whole threadfin'], 'a whole threadfin with clean silver skin and tender white flesh'),
      base('Coral Trout', '東星斑', 'dung1 sing1 baan1', ['whole coral trout'], 'a whole coral trout with its naturally spotted red skin clearly visible')
    ],
    variants: [
      variant('Superior-Soy Steamed', '頭抽清蒸', 'tau4 cau1 cing1 zing1', ['premium light soy sauce', 'ginger', 'scallion'], 'steamed gently and finished with aromatic hot oil and premium soy', '清蒸後淋頭抽、薑絲同蔥絲'),
      variant('Aged-Tangerine-Peel Steamed', '陳皮清蒸', 'can4 pei4 cing1 zing1', ['aged tangerine peel', 'ginger', 'rice wine'], 'steamed with fine aged-tangerine-peel threads and ginger', '配陳皮絲同薑絲清蒸'),
      variant('Black-Bean-Chili Steamed', '豉椒蒸', 'si6 ziu1 zing1', ['fermented black bean', 'red chili', 'garlic'], 'steamed beneath a glossy black-bean, garlic, and chili relish', '鋪豉椒蒜蓉蒸到入味'),
      variant('Pickled-Mustard Supreme-Broth Poached', '酸菜上湯浸', 'syun1 coi3 soeng6 tong1 zam3', ['pickled mustard greens', 'superior stock', 'ginger'], 'poached in clear superior broth with tart pickled mustard greens', '用上湯、酸菜同薑片浸熟'),
      variant('Roast-Garlic Braised', '蒜子炆', 'syun3 zi2 man1', ['roast garlic cloves', 'oyster sauce', 'Shaoxing wine'], 'gently braised with whole roast-garlic cloves in a glossy savoury sauce', '配原粒蒜子同紹酒慢慢炆香')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en}`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'shellfish',
    setting: 'a polished Hong Kong seafood-banquet table with restrained porcelain place settings and no extra dishes in frame',
    vessel: 'one oval white porcelain seafood platter',
    bases: [
      base('King Prawns', '大蝦', 'daai6 haa1', ['whole king prawns'], 'large shell-on king prawns arranged in one neat serving'),
      base('Fresh Scallops', '鮮帶子', 'sin1 daai3 zi2', ['fresh scallops'], 'plump ivory scallops with their natural seared or steamed texture'),
      base('Spiny Lobster', '龍蝦', 'lung4 haa1', ['spiny lobster'], 'one chopped spiny lobster reassembled neatly in its bright-red shell'),
      base('Razor Clams', '聖子', 'sing3 zi2', ['razor clams'], 'opened razor-clam shells holding tender clam meat'),
      base('Mud Crab', '肉蟹', 'juk6 haai5', ['mud crab'], 'one meaty mud crab cracked into banquet-size pieces')
    ],
    variants: [
      variant('Garlic-Vermicelli Steamed', '蒜蓉粉絲蒸', 'syun3 jung4 fan2 si1 zing1', ['glass vermicelli', 'minced garlic', 'scallion'], 'steamed over glass vermicelli with a generous layer of minced garlic', '鋪蒜蓉粉絲蒸熟再灑蔥花'),
      variant('Ginger-Scallion Wok-Seared', '薑蔥炒', 'goeng1 cung1 caau2', ['ginger', 'scallion', 'rice wine'], 'wok-seared with abundant ginger and scallion until aromatic', '用薑蔥同米酒猛火炒香'),
      variant('Black-Bean-Chili Wok-Fried', '豉椒炒', 'si6 ziu1 caau2', ['fermented black bean', 'green chili', 'garlic'], 'wok-fried in a glossy fermented-black-bean and green-chili sauce', '配豆豉、青椒同蒜頭炒香'),
      variant('Supreme-Broth Poached', '上湯浸', 'soeng6 tong1 zam3', ['superior stock', 'ginger', 'Chinese celery'], 'gently poached in clear superior broth with ginger and Chinese celery', '用上湯、薑同唐芹浸熟'),
      variant('Typhoon-Shelter Fried', '避風塘炒', 'bei6 fung1 tong4 caau2', ['fried garlic', 'chili', 'fermented black bean', 'toasted bread crumbs'], 'tossed with the crisp garlic, chili, and black-bean crumbs of typhoon-shelter cooking', '拌勻避風塘蒜香辣椒脆料')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en}`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'double-boiled-soups',
    setting: 'a quiet Hong Kong banquet dining room with a single lidded soup tureen on a clean white tablecloth',
    vessel: 'one open lidded porcelain soup tureen',
    bases: [
      base('Old Cucumber and Pork Rib', '老黃瓜排骨', 'lou5 wong4 gwaa1 paai4 gwat1', ['old cucumber', 'pork ribs', 'dried cuttlefish'], 'clear amber broth with old-cucumber wedges and tender pork ribs'),
      base('Winter Melon and Dried Scallop', '冬瓜瑤柱瘦肉', 'dung1 gwaa1 jiu4 cyu5 sau3 juk6', ['winter melon', 'dried scallop', 'lean pork'], 'clear broth with translucent winter melon and whole dried-scallop strands'),
      base('Lotus Root and Octopus', '蓮藕章魚豬腱', 'lin4 ngau5 zoeng1 jyu4 zyu1 gin3', ['lotus root', 'dried octopus', 'pork shank'], 'deep golden broth with lotus-root rounds, dried octopus, and pork shank'),
      base('Watercress and Pork Shank', '西洋菜豬腱', 'sai1 joeng4 coi3 zyu1 gin3', ['watercress', 'pork shank', 'sweet almonds'], 'clear green-gold broth with softened watercress and pork shank'),
      base('Fish Maw and Chicken', '花膠雞', 'faa1 gaau1 gai1', ['fish maw', 'chicken', 'lean pork'], 'rich clear broth with honey-coloured fish maw and bone-in chicken pieces')
    ],
    variants: [
      variant('Red-Date', '紅棗', 'hung4 zou2', ['red dates'], 'double-boiled slowly with whole red dates for gentle sweetness', '加紅棗慢火燉到清甜'),
      variant('Dried-Fig', '無花果', 'mou4 faa1 gwo2', ['dried figs'], 'double-boiled with dried figs for a mellow fruit sweetness', '加無花果慢火燉出清甜'),
      variant('Codonopsis', '黨參', 'dong2 sam1', ['codonopsis root'], 'double-boiled with codonopsis root in the Cantonese tonic-soup tradition', '配黨參慢火燉成老火湯'),
      variant('Conch', '響螺', 'hoeng2 lo4', ['dried conch'], 'double-boiled with sliced dried conch for a savoury marine depth', '加響螺片慢火燉出鮮味'),
      variant('Cordyceps-Flower', '蟲草花', 'cung4 cou2 faa1', ['cordyceps flower'], 'double-boiled with orange cordyceps flowers in a clear restorative broth', '配蟲草花慢火燉成清湯')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} Double-Boiled ${dishBase.en} Soup`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}燉湯`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping} dan6 tong1`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'seafood-and-delicacy-claypots',
    setting: 'a Hong Kong Cantonese banquet table with one hot claypot on a woven trivet and a restrained white tablecloth',
    vessel: 'one dark-brown Cantonese claypot',
    bases: [
      base('Sea Cucumber', '海參', 'hoi2 sam1', ['sea cucumber'], 'thick glossy sea-cucumber pieces with a springy braised texture'),
      base('Fish Maw', '花膠', 'faa1 gaau1', ['fish maw'], 'honey-gold fish-maw pieces with a soft gelatinous texture'),
      base('Abalone', '鮑魚', 'baau1 jyu4', ['whole abalone'], 'small whole abalone scored lightly and glazed'),
      base('Goose Web', '鵝掌', 'ngo4 zoeng2', ['goose web'], 'braised goose webs arranged neatly in the claypot'),
      base('Grouper Head', '石斑魚頭', 'sek6 baan1 jyu4 tau4', ['grouper head'], 'browned grouper-head pieces with visible collar meat')
    ],
    variants: [
      variant('Ginger-Scallion Sizzling', '薑蔥啫啫', 'goeng1 cung1 ze1 ze1', ['ginger', 'scallion', 'onion'], 'served sizzling with ginger, scallion, and onion', '用薑蔥洋蔥啫到香噴噴'),
      variant('Dried-Scallop Oyster-Sauce', '瑤柱蠔皇', 'jiu4 cyu5 hou4 wong4', ['dried scallop', 'oyster sauce', 'shiitake mushroom'], 'braised in a glossy dried-scallop oyster sauce with shiitake', '配瑤柱、蠔皇汁同北菇炆香'),
      variant('Black-Mushroom Braised', '北菇炆', 'bak1 gu1 man1', ['shiitake mushroom', 'bamboo shoot', 'superior stock'], 'slow-braised with whole shiitake mushrooms and bamboo shoots', '配北菇竹筍慢慢炆到入味'),
      variant('Roast-Garlic Black-Pepper', '蒜子黑椒', 'syun3 zi2 hak1 ziu1', ['roast garlic cloves', 'black pepper', 'onion'], 'finished with whole roast-garlic cloves and a restrained black-pepper sauce', '配原粒蒜子同黑椒汁煮香'),
      variant('Satay-Vermicelli', '沙爹粉絲', 'saa1 de2 fan2 si1', ['glass vermicelli', 'satay sauce', 'onion'], 'served over glass vermicelli in a fragrant Hong Kong satay sauce', '鋪喺粉絲上面配港式沙爹汁')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en} Claypot`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}煲`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping} bou1`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'roast-meats',
    setting: 'a traditional Hong Kong banquet table with one roast-meat platter and restrained porcelain service',
    vessel: 'one large oval white porcelain roast-meat platter',
    bases: [
      base('Roast Goose', '燒鵝', 'siu1 ngo4', ['roast goose'], 'chopped bone-in roast goose with taut mahogany skin'),
      base('Crispy-Skin Chicken', '脆皮雞', 'ceoi3 pei4 gai1', ['whole chicken'], 'neatly chopped chicken with crisp golden skin'),
      base('Roast Pigeon', '燒乳鴿', 'siu1 jyu5 gap3', ['whole pigeon'], 'one small roast pigeon portioned neatly with lacquered skin'),
      base('Barbecue Pork Belly', '叉燒腩', 'caa1 siu1 naam5', ['pork belly'], 'thick slices of red-edged barbecue pork belly'),
      base('Suckling Pig', '乳豬', 'jyu5 zyu1', ['suckling pig'], 'even rectangles of crackling suckling-pig skin with tender meat')
    ],
    variants: [
      variant('Maltose-Lacquered', '麥芽糖脆皮', 'mak6 ngaa4 tong4 ceoi3 pei4', ['maltose glaze', 'five-spice'], 'lacquered with maltose until the skin is crisp and glossy', '掃麥芽糖燒到皮脆亮身'),
      variant('Preserved-Lemon', '鹹檸檬', 'haam4 ning4 mung1', ['preserved salted lemon', 'ginger'], 'served with a savoury preserved-lemon and ginger glaze', '配鹹檸檬同薑汁燒香'),
      variant('Red-Fermented-Bean-Curd', '南乳', 'naam4 jyu5', ['red fermented bean curd', 'rice wine'], 'marinated with red fermented bean curd and rice wine before roasting', '用南乳同米酒醃香再燒'),
      variant('Five-Spice Honey', '五香蜜汁', 'ng5 hoeng1 mat6 zap1', ['honey', 'five-spice'], 'roasted beneath a light honey and five-spice glaze', '掃五香蜜汁燒到香脆'),
      variant('Plum-and-Ginger', '梅子薑汁', 'mui4 zi2 goeng1 zap1', ['salted plum', 'ginger', 'rice vinegar'], 'finished with a balanced salted-plum and ginger glaze', '配梅子薑汁燒到酸香開胃')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en}`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'braised-treasures',
    setting: 'a formal Hong Kong wedding-banquet table with one covered porcelain casserole opened for service',
    vessel: 'one shallow lidded white porcelain casserole',
    bases: [
      base('Whole Abalone', '原隻鮑魚', 'jyun4 zek3 baau1 jyu4', ['whole abalone'], 'small whole abalone with a tender scored surface'),
      base('Sea Cucumber', '海參', 'hoi2 sam1', ['sea cucumber'], 'thick springy sea-cucumber pieces in glossy brown sauce'),
      base('Fish Maw', '花膠', 'faa1 gaau1', ['fish maw'], 'honey-coloured fish maw with a soft gelatinous texture'),
      base('Dried Oyster', '蠔豉', 'hou4 si6', ['dried oyster'], 'plump rehydrated dried oysters glazed in banquet sauce'),
      base('Goose Web', '鵝掌', 'ngo4 zoeng2', ['goose web'], 'slow-braised goose webs arranged in a neat fan')
    ],
    variants: [
      variant('Braised with Shiitake Mushroom', '北菇炆', 'bak1 gu1 man1', ['shiitake mushroom', 'oyster sauce'], 'braised with whole shiitake mushrooms in oyster sauce', '配原隻北菇同蠔油慢慢炆'),
      variant('Braised with Black Moss', '髮菜炆', 'faat3 coi3 man1', ['black moss', 'superior stock'], 'braised with black moss in a glossy superior-stock reduction', '配髮菜同上湯慢慢炆香'),
      variant('Braised with Bamboo Pith', '竹笙炆', 'zuk1 sang1 man1', ['bamboo pith', 'superior stock'], 'braised with delicate bamboo pith in clear superior stock', '配竹笙同上湯炆到入味'),
      variant('Braised with Dried Scallop', '瑤柱炆', 'jiu4 cyu5 man1', ['dried scallop', 'oyster sauce'], 'braised with whole dried scallops in a rich savoury glaze', '配瑤柱同蠔皇汁慢慢炆'),
      variant('Braised with Chestnut', '栗子炆', 'leot6 zi2 man1', ['chestnut', 'ginger'], 'braised with roasted chestnuts and ginger until glossy', '配栗子同薑片炆到香甜')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishBase.en} ${dishVariant.en}`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'banquet-noodles',
    setting: 'a Hong Kong birthday-banquet table with one central noodle platter and restrained white porcelain service',
    vessel: 'one broad white porcelain noodle platter',
    bases: [
      base('E-Fu Noodles', '伊麵', 'ji1 min6', ['e-fu noodles'], 'springy golden e-fu noodles with lightly crisp edges'),
      base('Longevity Noodles', '長壽麵', 'coeng4 sau6 min6', ['wheat longevity noodles'], 'extra-long wheat noodles kept visibly unbroken'),
      base('Rice Vermicelli', '米粉', 'mai5 fan2', ['rice vermicelli'], 'fine rice vermicelli wok-tossed into a loose mound'),
      base('Ho Fun', '河粉', 'ho4 fan2', ['wide rice noodles'], 'wide glossy rice noodles with visible wok-seared edges'),
      base('Silver-Needle Noodles', '銀針粉', 'ngan4 zam1 fan2', ['silver-needle rice noodles'], 'short tapered silver-needle noodles with a springy sheen')
    ],
    variants: [
      variant('Lobster-and-Ginger-Scallion', '薑蔥龍蝦', 'goeng1 cung1 lung4 haa1', ['lobster', 'ginger', 'scallion'], 'tossed with chopped lobster, ginger, and scallion', '配龍蝦、薑同蔥炒香'),
      variant('Crab-Meat-and-Egg-White', '蟹肉蛋白', 'haai5 juk6 daan6 baak6', ['crab meat', 'egg white', 'superior stock'], 'finished with delicate crab meat and silky egg-white ribbons', '配蟹肉同滑蛋白燴香'),
      variant('Dried-Scallop-and-Enoki', '瑤柱金菇', 'jiu4 cyu5 gam1 gu1', ['dried scallop', 'enoki mushroom'], 'tossed with shredded dried scallop and enoki mushrooms', '配瑤柱絲同金菇炒香'),
      variant('Shredded-Roast-Duck', '燒鴨絲', 'siu1 aap3 si1', ['roast duck', 'yellow chives'], 'wok-tossed with shredded roast duck and yellow chives', '配燒鴨絲同韭黃炒香'),
      variant('Mixed-Seafood', '海鮮', 'hoi2 sin1', ['shrimp', 'scallop', 'squid'], 'tossed with shrimp, scallop, and squid in a light banquet sauce', '配蝦、帶子同魷魚炒香')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en}`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'banquet-rice',
    setting: 'a Hong Kong Cantonese banquet table with one central rice dish and an uncluttered white tablecloth',
    vessel: 'one broad white porcelain rice platter or covered rice casserole appropriate to the preparation',
    bases: [
      base('Fried Rice', '炒飯', 'caau2 faan6', ['jasmine rice', 'scallion'], 'separate wok-charred grains of jasmine rice'),
      base('Lotus-Leaf Rice', '荷葉飯', 'ho4 jip6 faan6', ['jasmine rice', 'lotus leaf'], 'fragrant rice opened inside one steamed lotus leaf'),
      base('Claypot Rice', '煲仔飯', 'bou1 zai2 faan6', ['jasmine rice', 'sweet soy sauce'], 'rice cooked in one claypot with a visible crisp golden edge'),
      base('Steamed Rice Bowl', '蒸飯盅', 'zing1 faan6 zung1', ['jasmine rice'], 'one covered rice bowl opened to reveal the topping'),
      base('Glutinous Rice', '糯米飯', 'no6 mai5 faan6', ['glutinous rice'], 'glossy separate grains of savoury glutinous rice')
    ],
    variants: [
      variant('Dried-Scallop-and-Egg-White', '瑤柱蛋白', 'jiu4 cyu5 daan6 baak6', ['dried scallop', 'egg white'], 'finished with shredded dried scallop and silky egg-white ribbons', '配瑤柱絲同滑蛋白'),
      variant('Abalone-and-Shiitake', '鮑魚北菇', 'baau1 jyu4 bak1 gu1', ['abalone', 'shiitake mushroom', 'oyster sauce'], 'topped with sliced abalone and whole shiitake mushrooms', '配鮑魚片同原隻北菇'),
      variant('Preserved-Meat', '臘味', 'laap6 mei6', ['Chinese sausage', 'cured pork belly', 'duck liver sausage'], 'layered with sliced Cantonese preserved meats', '鋪臘腸、臘肉同膶腸'),
      variant('Roast-Duck-and-Taro', '燒鴨芋頭', 'siu1 aap3 wu6 tau4', ['roast duck', 'taro'], 'combined with roast-duck pieces and tender taro', '配燒鴨件同軟腍芋頭'),
      variant('Fujian-Seafood-Gravy', '福建海鮮汁', 'fuk1 gin3 hoi2 sin1 zap1', ['shrimp', 'scallop', 'squid', 'superior stock'], 'covered with a golden Fujian-style seafood gravy', '淋上金黃福建海鮮汁')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en}`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'supreme-broth-noodles',
    setting: 'a refined Hong Kong banquet table with one deep porcelain noodle bowl and no side dishes in frame',
    vessel: 'one deep white porcelain noodle bowl',
    bases: [
      base('Egg Noodles', '蛋麵', 'daan6 min6', ['egg noodles'], 'fine springy yellow egg noodles in clear broth'),
      base('Ho Fun', '河粉', 'ho4 fan2', ['wide rice noodles'], 'silky wide rice noodles folded beneath the broth'),
      base('Rice Vermicelli', '米粉', 'mai5 fan2', ['rice vermicelli'], 'fine white rice vermicelli gathered loosely in the bowl'),
      base('Lai Fun', '瀨粉', 'laai6 fan2', ['thick rice noodles'], 'thick round rice noodles with a smooth glossy surface'),
      base('E-Fu Noodles', '伊麵', 'ji1 min6', ['e-fu noodles'], 'golden e-fu noodles softened in clear broth')
    ],
    variants: [
      variant('Shrimp-Wonton', '鮮蝦雲吞', 'sin1 haa1 wan4 tan1', ['shrimp wontons', 'dried flounder broth'], 'served with plump shrimp wontons in dried-flounder supreme broth', '配鮮蝦雲吞同大地魚上湯'),
      variant('Fish-Maw-and-Shredded-Chicken', '花膠雞絲', 'faa1 gaau1 gai1 si1', ['fish maw', 'shredded chicken', 'superior stock'], 'topped with honey-gold fish maw and fine shredded chicken', '配花膠同雞絲上湯'),
      variant('Abalone-and-Sea-Cucumber', '鮑魚海參', 'baau1 jyu4 hoi2 sam1', ['abalone', 'sea cucumber', 'superior stock'], 'topped with sliced abalone and braised sea cucumber', '配鮑魚片同海參上湯'),
      variant('Roast-Goose', '燒鵝', 'siu1 ngo4', ['roast goose', 'superior stock'], 'served with chopped roast goose and crisp skin kept above the broth', '配燒鵝件同清香上湯'),
      variant('Crab-Claw-and-Scallop', '蟹鉗帶子', 'haai5 kim4 daai3 zi2', ['crab claw', 'scallop', 'superior stock'], 'crowned with one crab claw and plump scallops', '配蟹鉗同帶子上湯')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en} in Supreme Broth`,
      zh: `港式宴席上湯${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 soeng6 tong1 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  },
  {
    category: 'hong-kong-banquet',
    subcategory: 'celebration-dishes',
    setting: 'a festive Hong Kong wedding-banquet table with one ornate but restrained central platter',
    vessel: 'one large white porcelain celebration platter or casserole',
    bases: [
      base('Eight-Treasure Tofu', '八珍豆腐', 'baat3 zan1 dau6 fu6', ['tofu', 'shrimp', 'chicken', 'squid', 'shiitake mushroom'], 'golden tofu with neatly separated shrimp, chicken, squid, and mushroom'),
      base('Seafood Bird’s Nest', '海鮮雀巢', 'hoi2 sin1 zoek3 caau4', ['shrimp', 'scallop', 'squid', 'potato nest'], 'mixed seafood held in one crisp woven potato nest'),
      base('Jade Winter-Melon Ring', '碧綠冬瓜環', 'bik1 luk6 dung1 gwaa1 waan4', ['winter melon', 'shrimp', 'chicken', 'shiitake mushroom'], 'a carved winter-melon ring filled with shrimp, chicken, and mushroom'),
      base('Stuffed Bean-Curd Fortune Purse', '百花腐皮福袋', 'baak3 faa1 fu6 pei4 fuk1 doi6', ['bean curd sheet', 'shrimp paste', 'shiitake mushroom', 'water chestnut'], 'tied bean-curd-sheet purses filled with shrimp and mushroom'),
      base('Golden-Garlic Seafood Basket', '金蒜海鮮籃', 'gam1 syun3 hoi2 sin1 laam4', ['prawns', 'scallop', 'squid', 'garlic', 'taro basket'], 'mixed seafood and golden garlic held in one crisp taro basket')
    ],
    variants: [
      variant('Supreme-Broth Braised', '上湯扒', 'soeng6 tong1 paa4', ['superior stock'], 'gently braised in clear superior stock until glossy', '用上湯輕輕扒到入味'),
      variant('Dried-Scallop-Sauce', '瑤柱汁燴', 'jiu4 cyu5 zap1 wui6', ['dried scallop sauce'], 'finished with a savoury shredded-dried-scallop sauce', '淋上瑤柱汁燴香'),
      variant('XO-Sauce Wok-Fried', 'XO醬炒', 'ik1 si1 ou1 zoeng3 caau2', ['XO sauce', 'scallion'], 'wok-tossed in restrained house XO sauce', '用自家XO醬同蔥花炒香'),
      variant('Oyster-Sauce Baked', '蠔皇焗', 'hou4 wong4 guk6', ['oyster sauce', 'Shaoxing wine'], 'baked briefly beneath a glossy oyster-sauce and Shaoxing-wine glaze', '淋蠔皇汁同紹酒焗香'),
      variant('Lotus-Leaf Steamed', '荷香蒸', 'ho4 hoeng1 zing1', ['lotus leaf'], 'steamed over a fresh lotus leaf for a subtle fragrance', '墊荷葉蒸出清香')
    ],
    compose: (dishBase, dishVariant) => ({
      en: `Hong Kong Banquet ${dishVariant.en} ${dishBase.en}`,
      zh: `港式宴席${dishVariant.zh}${dishBase.zh}`,
      jyutping: `gong2 sik1 jin3 zik6 ${dishVariant.jyutping} ${dishBase.jyutping}`
    })
  }
];

const records = [];
for (const group of groups) {
  for (const dishBase of group.bases) {
    for (const dishVariant of group.variants) {
      const ordinal = 1251 + records.length;
      const id = `hk-dish-${String(ordinal).padStart(4, '0')}`;
      const identity = group.compose(dishBase, dishVariant);
      const slug = slugify(identity.en);
      const ingredients = [...new Set([...dishBase.ingredients, ...dishVariant.ingredients])];
      const ingredientText = ingredients.join(', ');

      records.push({
        id,
        slug,
        name: {
          en: identity.en,
          zhHant: identity.zh
        },
        jyutping: identity.jyutping,
        category: group.category,
        subcategory: group.subcategory,
        description: {
          en: `${identity.en} is a Cantonese banquet dish featuring ${ingredientText}, ${dishVariant.noteEn}.`,
          yue: `${identity.zh}係港式宴席菜，${dishVariant.noteYue}，主角同做法都清楚，唔會端錯隔籬枱。`
        },
        ingredients,
        dietaryTags: dietaryTagsFor(ingredients),
        allergens: allergensFor(ingredients),
        image: {
          path: `images/${id}-${slug}.png`,
          alt: {
            en: `${identity.en}, showing ${dishBase.visual}, served in ${group.vessel}.`,
            yue: `${identity.zh}用${group.vessel}上枱，清楚見到指定主菜同配料。`
          }
        },
        imagePrompt: [
          'Use case: photorealistic-natural',
          'Asset type: native square food catalog photograph for a bundled Hong Kong banquet-dish library',
          `Primary request: an original, culturally accurate photograph of exactly one serving of ${identity.en} (${identity.zh})`,
          `Scene/backdrop: ${group.setting}; warm, believable Hong Kong atmosphere; background softly out of focus`,
          `Subject: ${dishBase.visual}; visibly prepared with ${ingredientText}; ${dishVariant.noteEn}`,
          `Serving vessel: ${group.vessel}, centered and fully visible`,
          'Style/medium: original photorealistic professional food photography with natural edible texture and restrained banquet presentation',
          'Composition/framing: native square 1:1 close three-quarter overhead view; one complete serving centered; generous clean edge padding; no collage',
          'Lighting/mood: warm window light mixed with gentle banquet-room practical light; realistic highlights and soft shadows',
          'Constraints: show only this exact dish and its normal edible garnish; culturally accurate Hong Kong Cantonese presentation; no people; no hands; no text; no lettering; no logos; no watermark',
          'Avoid: extra dishes, duplicate serving vessels, menus, labels, branded packaging, utensils blocking the food, plastic-looking texture, surreal ingredients, fusion restyling'
        ].join('\n')
      });
    }
  }
}

const chocolateOverrides = [
  {
    id: 1260,
    en: 'Banquet Salted Mandarin Dark Chocolate Sesame Ball',
    zh: '宴席鹹柑桔黑巧克力煎堆',
    jyutping: 'jin3 zik6 haam4 gam1 gat1 hak1 haau2 hak1 lik1 zin1 deoi1',
    ingredients: ['glutinous rice flour', 'dark chocolate', 'salted mandarin peel', 'sesame'],
    shape: 'golden sesame-coated glutinous-rice ball'
  },
  {
    id: 1280,
    en: 'Banquet Ginger Milk Chocolate Crystal Dumpling',
    zh: '宴席薑汁奶巧克力水晶餃',
    jyutping: 'jin3 zik6 goeng1 zap1 naai5 haau2 hak1 lik1 seoi2 zing1 gaau2',
    ingredients: ['wheat starch', 'milk chocolate', 'ginger juice', 'coconut milk'],
    shape: 'translucent pleated crystal dumpling'
  },
  {
    id: 1300,
    en: 'Banquet Black Sesame White Chocolate Lotus Puff',
    zh: '宴席黑芝麻白巧克力蓮花酥',
    jyutping: 'jin3 zik6 hak1 zi1 maa4 baak6 haau2 hak1 lik1 lin4 faa1 sou1',
    ingredients: ['wheat pastry', 'white chocolate', 'black sesame', 'butter'],
    shape: 'flaky lotus-shaped baked puff'
  },
  {
    id: 1320,
    en: 'Banquet Red Bean Dark Chocolate Snow-Skin Bao',
    zh: '宴席豆沙黑巧克力冰皮包',
    jyutping: 'jin3 zik6 dau6 saa1 hak1 haau2 hak1 lik1 bing1 pei4 baau1',
    ingredients: ['glutinous rice flour', 'dark chocolate', 'red bean paste', 'coconut milk'],
    shape: 'soft pale snow-skin bao'
  },
  {
    id: 1340,
    en: 'Banquet Yuzu Milk Chocolate Taro Croquette',
    zh: '宴席柚子奶巧克力蜂巢芋角',
    jyutping: 'jin3 zik6 jau2 zi2 naai5 haau2 hak1 lik1 fung1 caau4 wu6 gok3',
    ingredients: ['taro', 'milk chocolate', 'yuzu peel', 'wheat starch'],
    shape: 'crisp honeycomb taro croquette'
  },
  {
    id: 1360,
    en: 'Banquet Osmanthus White Chocolate Rice Roll',
    zh: '宴席桂花白巧克力腸粉',
    jyutping: 'jin3 zik6 gwai3 faa1 baak6 haau2 hak1 lik1 coeng4 fan2',
    ingredients: ['rice flour', 'white chocolate', 'osmanthus syrup', 'coconut cream'],
    shape: 'silky folded rice-noodle roll'
  },
  {
    id: 1380,
    en: 'Banquet Coconut Dark Chocolate Glutinous Rice Ball',
    zh: '宴席椰香黑巧克力糯米糍',
    jyutping: 'jin3 zik6 je4 hoeng1 hak1 haau2 hak1 lik1 no6 mai5 ci4',
    ingredients: ['glutinous rice flour', 'dark chocolate', 'coconut cream', 'desiccated coconut'],
    shape: 'coconut-coated glutinous-rice ball'
  },
  {
    id: 1400,
    en: 'Banquet Espresso Dark Chocolate Custard Bun',
    zh: '宴席特濃咖啡黑巧克力奶皇包',
    jyutping: 'jin3 zik6 dak6 nung4 gaa3 fe1 hak1 haau2 hak1 lik1 naai5 wong4 baau1',
    ingredients: ['wheat flour', 'dark chocolate', 'espresso', 'egg custard'],
    shape: 'soft pleated steamed custard bun'
  },
  {
    id: 1420,
    en: 'Banquet Peanut Milk Chocolate Crispy Wonton',
    zh: '宴席花生奶巧克力脆雲吞',
    jyutping: 'jin3 zik6 faa1 sang1 naai5 haau2 hak1 lik1 ceoi3 wan4 tan1',
    ingredients: ['wheat wonton wrapper', 'milk chocolate', 'peanut butter', 'roasted peanut'],
    shape: 'crisp golden folded wonton'
  },
  {
    id: 1440,
    en: 'Banquet Pandan White Chocolate Sponge Cake',
    zh: '宴席班蘭白巧克力馬拉糕',
    jyutping: 'jin3 zik6 baan1 laan4 baak6 haau2 hak1 lik1 maa5 laai1 gou1',
    ingredients: ['wheat flour', 'egg', 'white chocolate', 'pandan', 'coconut milk'],
    shape: 'steamed green pandan sponge cake'
  },
  {
    id: 1460,
    en: 'Banquet Raspberry Dark Chocolate Almond Puff',
    zh: '宴席紅莓黑巧克力杏仁酥',
    jyutping: 'jin3 zik6 hung4 mui4 hak1 haau2 hak1 lik1 hang6 jan4 sou1',
    ingredients: ['wheat pastry', 'dark chocolate', 'raspberry', 'almond'],
    shape: 'flaky almond-topped baked puff'
  },
  {
    id: 1480,
    en: 'Banquet Five-Spice Milk Chocolate Golden Dumpling',
    zh: '宴席五香奶巧克力黃金餃',
    jyutping: 'jin3 zik6 ng5 hoeng1 naai5 haau2 hak1 lik1 wong4 gam1 gaau2',
    ingredients: ['wheat dumpling wrapper', 'milk chocolate', 'five-spice', 'salted caramel'],
    shape: 'golden crescent-shaped fried dumpling'
  },
  {
    id: 1500,
    en: 'Banquet Aged Tangerine Dark Chocolate Celebration Bao',
    zh: '宴席陳皮黑巧克力賀年包',
    jyutping: 'jin3 zik6 can4 pei4 hak1 haau2 hak1 lik1 ho6 nin4 baau1',
    ingredients: ['wheat flour', 'dark chocolate', 'aged tangerine peel', 'cocoa butter'],
    shape: 'round red-stamped-style celebration bao without any actual lettering'
  }
];

for (const chocolate of chocolateOverrides) {
  const id = `hk-dish-${String(chocolate.id).padStart(4, '0')}`;
  const slug = slugify(chocolate.en);
  records[chocolate.id - 1251] = {
    id,
    slug,
    name: {
      en: chocolate.en,
      zhHant: chocolate.zh
    },
    jyutping: chocolate.jyutping,
    category: 'chocolate-filled-dim-sum',
    subcategory: 'banquet-chocolate-special',
    description: {
      en: `${chocolate.en} is a ${chocolate.shape} containing a distinct enclosed chocolate centre made with ${chocolate.ingredients.join(', ')}.`,
      yue: `${chocolate.zh}係一款${chocolate.shape}，入面真係包住巧克力餡，唔係淋喺面頭交差。`
    },
    ingredients: chocolate.ingredients,
    dietaryTags: ['vegetarian'],
    allergens: allergensFor(chocolate.ingredients),
    image: {
      path: `images/${id}-${slug}.png`,
      alt: {
        en: `${chocolate.en} with one piece opened to show its enclosed chocolate filling.`,
        yue: `${chocolate.zh}切開一件，清楚見到入面包住嘅巧克力餡。`
      }
    },
    imagePrompt: [
      'Use case: photorealistic-natural',
      'Asset type: native square food catalog photograph for a bundled Hong Kong dim-sum library',
      `Primary request: an original, appetizing photograph of exactly one serving of ${chocolate.en} (${chocolate.zh})`,
      'Scene/backdrop: a refined contemporary Hong Kong banquet tabletop with restrained porcelain or bamboo service ware; no other dishes in frame',
      `Subject: several intact pieces plus exactly one naturally opened piece showing a generous enclosed chocolate filling; the exterior must clearly read as a ${chocolate.shape}; visibly feature ${chocolate.ingredients.join(', ')}`,
      'Style/medium: original photorealistic professional food photography with natural edible texture and believable Cantonese banquet presentation',
      'Composition/framing: native square 1:1 close three-quarter overhead view; one complete serving centered; generous clean edge padding; no collage',
      'Lighting/mood: warm window light with gentle banquet-room practical light; crisp detail in both wrapper and molten or creamy chocolate centre',
      'Constraints: chocolate must be inside the dim sum, not merely drizzled on top; show only this exact dish; no people; no hands; no text; no lettering; no logos; no watermark',
      'Avoid: extra desserts, duplicate plates, menus, labels, branded packaging, fake plastic texture, surreal ingredients, writing or decorative characters on the food'
    ].join('\n'),
    chocolateFilled: true
  };
}

const duplicate = (label, values) => {
  const firstIndexByValue = new Map();
  for (const [index, value] of values.entries()) {
    const normalized = label.includes('name') ? value.toLocaleLowerCase('en') : value;
    if (firstIndexByValue.has(normalized)) {
      throw new Error(`Duplicate ${label}: ${value} at indexes ${firstIndexByValue.get(normalized)} and ${index}.`);
    }
    firstIndexByValue.set(normalized, index);
  }
};

if (groups.length !== 10 || records.length !== 250) {
  throw new Error(`Expected ten 25-record groups and 250 records, found ${groups.length} groups and ${records.length} records.`);
}

for (const [index, record] of records.entries()) {
  const ordinal = 1251 + index;
  const expectedId = `hk-dish-${String(ordinal).padStart(4, '0')}`;
  if (record.id !== expectedId) throw new Error(`Record ${index} must use ${expectedId}, found ${record.id}.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error(`${record.id} has an invalid slug.`);
  if (!new RegExp(`^images/${record.id}-[a-z0-9]+(?:-[a-z0-9]+)*\\.png$`).test(record.image.path)) {
    throw new Error(`${record.id} has an invalid image path: ${record.image.path}.`);
  }
  if (!record.image.alt.en.includes(record.name.en) || !record.image.alt.yue.includes(record.name.zhHant)) {
    throw new Error(`${record.id} alt text must include both catalog names.`);
  }
  if (record.imagePrompt.length < 100
    || !/square 1:1/i.test(record.imagePrompt)
    || !/photorealistic/i.test(record.imagePrompt)
    || !/no people/i.test(record.imagePrompt)
    || !/no text/i.test(record.imagePrompt)
    || !/no watermark/i.test(record.imagePrompt)) {
    throw new Error(`${record.id} has an incomplete ImageGen prompt.`);
  }
  const shouldBeChocolate = ordinal % 20 === 0;
  if ((record.chocolateFilled === true) !== shouldBeChocolate) {
    throw new Error(`${record.id} violates the every-twentieth chocolate-filled invariant.`);
  }
  if (shouldBeChocolate) {
    if (!/chocolate/i.test(record.name.en)
      || !/巧克力/u.test(record.name.zhHant)
      || !record.ingredients.some(ingredient => /chocolate|cocoa/i.test(ingredient))
      || !/chocolate/i.test(record.imagePrompt)) {
      throw new Error(`${record.id} has incomplete chocolate metadata.`);
    }
  }
}

duplicate('slug', records.map(record => record.slug));
duplicate('English name', records.map(record => record.name.en));
duplicate('Traditional Chinese name', records.map(record => record.name.zhHant));
duplicate('image path', records.map(record => record.image.path));

const existingPartFiles = (await readdir(catalogPartsRoot))
  .filter(filename => /^part-\d{4}-\d{4}\.json$/.test(filename) && filename !== outputFilename)
  .sort();
const existingRecords = [];
for (const filename of existingPartFiles) {
  const parsed = JSON.parse(await readFile(path.join(catalogPartsRoot, filename), 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`${filename} must contain a JSON array.`);
  existingRecords.push(...parsed);
}

for (const [label, valueOf] of [
  ['ID', record => record.id],
  ['slug', record => record.slug],
  ['English name', record => record.name.en.toLocaleLowerCase('en')],
  ['Traditional Chinese name', record => record.name.zhHant],
  ['image path', record => record.image.path]
]) {
  const ownerByValue = new Map(existingRecords.map(record => [valueOf(record), record.id]));
  for (const record of records) {
    const value = valueOf(record);
    if (ownerByValue.has(value)) {
      throw new Error(`${record.id} duplicates ${label} from ${ownerByValue.get(value)}: ${value}.`);
    }
  }
}

await mkdir(catalogPartsRoot, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`Generated ${records.length} sequential records at ${path.relative(repositoryRoot, outputPath)}.`);
