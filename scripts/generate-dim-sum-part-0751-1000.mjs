import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const outputPath = path.join(repositoryRoot, 'dim-sum', 'catalog-parts', 'part-0751-1000.json');

const slugify = value => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const allergenRules = [
  ['soy', /soy|tofu|bean curd|fermented bean curd/i],
  ['gluten', /wheat|bun|pastry|spring roll|e-fu|noodle/i],
  ['sesame', /sesame/i],
  ['tree nuts', /pine nut|cashew|walnut|almond/i]
];

const groups = [
  {
    category: 'vegetarian-dim-sum',
    subcategory: 'steamed-dumplings',
    bases: [
      { en: 'Chive and Water Chestnut', zh: '韭菜馬蹄', jyutping: 'gau2 coi3 maa5 tai4', ingredients: ['Chinese chives', 'water chestnut', 'mung bean starch'], zhIngredients: ['韭菜', '馬蹄', '澄麵'] },
      { en: 'Spinach and Bamboo Shoot', zh: '菠菜竹筍', jyutping: 'bo1 coi3 zuk1 seon2', ingredients: ['spinach', 'bamboo shoot', 'mung bean starch'], zhIngredients: ['菠菜', '竹筍', '澄麵'] },
      { en: 'Pumpkin and Pine Nut', zh: '南瓜松子', jyutping: 'naam4 gwaa1 cung4 zi2', ingredients: ['pumpkin', 'pine nut', 'mung bean starch'], zhIngredients: ['南瓜', '松子', '澄麵'] },
      { en: 'Beetroot and Lotus Root', zh: '紅菜頭蓮藕', jyutping: 'hung4 coi3 tau4 lin4 ngau5', ingredients: ['beetroot', 'lotus root', 'mung bean starch'], zhIngredients: ['紅菜頭', '蓮藕', '澄麵'] },
      { en: 'Pea Shoot and Shiitake', zh: '豆苗冬菇', jyutping: 'dau6 miu4 dung1 gu1', ingredients: ['pea shoots', 'shiitake mushroom', 'mung bean starch'], zhIngredients: ['豆苗', '冬菇', '澄麵'] }
    ],
    variants: [
      { en: 'Classic Crystal', zh: '水晶', jyutping: 'seoi2 zing1', ingredients: [], zhIngredients: [], noteEn: 'a translucent steamed wrapper', noteYue: '用透薄水晶皮蒸熟' },
      { en: 'Black Truffle Crystal', zh: '黑松露水晶', jyutping: 'hak1 sung1 lou6 seoi2 zing1', ingredients: ['black truffle'], zhIngredients: ['黑松露'], noteEn: 'a translucent wrapper scented with black truffle', noteYue: '加黑松露香氣再用水晶皮蒸熟' },
      { en: 'Ginger Sesame Crystal', zh: '薑香芝麻水晶', jyutping: 'goeng1 hoeng1 zi1 maa4 seoi2 zing1', ingredients: ['ginger', 'sesame oil'], zhIngredients: ['薑', '芝麻油'], noteEn: 'a ginger-sesame seasoned translucent wrapper', noteYue: '以薑同芝麻油調味再蒸熟' },
      { en: 'Preserved Olive Crystal', zh: '欖菜水晶', jyutping: 'laam5 coi3 seoi2 zing1', ingredients: ['preserved olive vegetable'], zhIngredients: ['欖菜'], noteEn: 'a savoury preserved-olive accent under a translucent wrapper', noteYue: '加入欖菜提鮮再用水晶皮蒸熟' },
      { en: 'White Pepper Crystal', zh: '白胡椒水晶', jyutping: 'baak6 wu4 ziu1 seoi2 zing1', ingredients: ['white pepper'], zhIngredients: ['白胡椒'], noteEn: 'a gentle white-pepper finish under a translucent wrapper', noteYue: '以白胡椒提香再用水晶皮蒸熟' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en} Dumpling`, zh: `${variant.zh}${base.zh}餃`, jyutping: `${variant.jyutping} ${base.jyutping} gaau2` })
  },
  {
    category: 'vegetarian-dim-sum',
    subcategory: 'steamed-buns',
    bases: [
      { en: 'Barbecue King Oyster Mushroom', zh: '素叉燒杏鮑菇', jyutping: 'sou3 caa1 siu1 hang6 baau1 gu1', ingredients: ['king oyster mushroom', 'vegetarian char siu sauce'], zhIngredients: ['杏鮑菇', '素叉燒醬'] },
      { en: 'Curry Potato', zh: '咖喱薯仔', jyutping: 'gaa3 lei1 syu4 zai2', ingredients: ['potato', 'Hong Kong curry spice'], zhIngredients: ['薯仔', '港式咖喱'] },
      { en: 'Ginger Sesame Tofu', zh: '薑香芝麻豆腐', jyutping: 'goeng1 hoeng1 zi1 maa4 dau6 fu6', ingredients: ['firm tofu', 'ginger', 'sesame oil'], zhIngredients: ['豆腐', '薑', '芝麻油'] },
      { en: 'Sweet Corn and Cabbage', zh: '粟米椰菜', jyutping: 'suk1 mai5 je4 coi3', ingredients: ['sweet corn', 'cabbage'], zhIngredients: ['粟米', '椰菜'] },
      { en: 'Taro and Ginkgo', zh: '芋頭白果', jyutping: 'wu6 tau4 baak6 gwo2', ingredients: ['taro', 'ginkgo nut'], zhIngredients: ['芋頭', '白果'] }
    ],
    variants: [
      { en: 'Classic White', zh: '白麵', jyutping: 'baak6 min6', ingredients: ['wheat flour'], zhIngredients: ['麵粉'], noteEn: 'a fluffy classic white steamed bun', noteYue: '用鬆軟白麵包皮蒸起' },
      { en: 'Whole-Wheat', zh: '全麥', jyutping: 'cyun4 mak6', ingredients: ['whole-wheat flour'], zhIngredients: ['全麥麵粉'], noteEn: 'a nutty whole-wheat steamed bun', noteYue: '用全麥包皮蒸起' },
      { en: 'Pumpkin', zh: '南瓜皮', jyutping: 'naam4 gwaa1 pei4', ingredients: ['wheat flour', 'pumpkin puree'], zhIngredients: ['麵粉', '南瓜蓉'], noteEn: 'a golden pumpkin steamed bun', noteYue: '用南瓜包皮蒸起' },
      { en: 'Beetroot', zh: '紅菜頭皮', jyutping: 'hung4 coi3 tau4 pei4', ingredients: ['wheat flour', 'beetroot puree'], zhIngredients: ['麵粉', '紅菜頭蓉'], noteEn: 'a naturally pink beetroot steamed bun', noteYue: '用紅菜頭包皮蒸起' },
      { en: 'Charcoal', zh: '竹炭', jyutping: 'zuk1 taan3', ingredients: ['wheat flour', 'bamboo charcoal'], zhIngredients: ['麵粉', '竹炭粉'], noteEn: 'a charcoal-tinted steamed bun', noteYue: '用竹炭包皮蒸起' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en} Steamed Bun`, zh: `${variant.zh}${base.zh}包`, jyutping: `${variant.jyutping} ${base.jyutping} baau1` })
  },
  {
    category: 'vegetarian-dim-sum',
    subcategory: 'crispy-pastries',
    bases: [
      { en: 'Mixed Mushroom', zh: '雜菌', jyutping: 'zaap6 kwan2', ingredients: ['shiitake mushroom', 'king oyster mushroom', 'wood ear'], zhIngredients: ['冬菇', '杏鮑菇', '木耳'] },
      { en: 'Chive and Tofu', zh: '韭菜豆腐', jyutping: 'gau2 coi3 dau6 fu6', ingredients: ['Chinese chives', 'firm tofu'], zhIngredients: ['韭菜', '豆腐'] },
      { en: 'Pumpkin and Cashew', zh: '南瓜腰果', jyutping: 'naam4 gwaa1 jiu1 gwo2', ingredients: ['pumpkin', 'cashew'], zhIngredients: ['南瓜', '腰果'] },
      { en: 'Lotus Root and Snow Pea', zh: '蓮藕荷蘭豆', jyutping: 'lin4 ngau5 ho4 laan4 dau6', ingredients: ['lotus root', 'snow pea'], zhIngredients: ['蓮藕', '荷蘭豆'] },
      { en: 'Curried Potato and Pea', zh: '咖喱薯仔青豆', jyutping: 'gaa3 lei1 syu4 zai2 ceng1 dau6', ingredients: ['potato', 'green pea', 'Hong Kong curry spice'], zhIngredients: ['薯仔', '青豆', '港式咖喱'] }
    ],
    variants: [
      { en: 'Pan-Fried Dumpling', zh: '生煎餃', jyutping: 'saang1 zin1 gaau2', ingredients: ['wheat dumpling wrapper'], zhIngredients: ['麵粉餃皮'], noteEn: 'sealed in a wheat wrapper and pan-fried until crisp underneath', noteYue: '包入麵皮煎到脆底' },
      { en: 'Baked Puff', zh: '焗酥', jyutping: 'guk6 sou1', ingredients: ['wheat pastry'], zhIngredients: ['酥皮'], noteEn: 'enclosed in flaky pastry and baked', noteYue: '包入酥皮焗香' },
      { en: 'Crispy Spring Roll', zh: '脆春卷', jyutping: 'ceoi3 ceon1 gyun2', ingredients: ['wheat spring-roll wrapper'], zhIngredients: ['春卷皮'], noteEn: 'rolled in a thin wrapper and fried crisp', noteYue: '捲入春卷皮炸到香脆' },
      { en: 'Sesame Pastry', zh: '芝麻酥', jyutping: 'zi1 maa4 sou1', ingredients: ['wheat pastry', 'sesame'], zhIngredients: ['酥皮', '芝麻'], noteEn: 'baked in a sesame-flecked pastry shell', noteYue: '包入芝麻酥皮焗香' },
      { en: 'Crispy Rice-Paper Parcel', zh: '脆米紙包', jyutping: 'ceoi3 mai5 zi2 baau1', ingredients: ['rice paper'], zhIngredients: ['米紙'], noteEn: 'wrapped in rice paper and fried into a light crisp parcel', noteYue: '用米紙包好炸到輕脆' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} with ${base.en} Filling`, zh: `${base.zh}${variant.zh}`, jyutping: `${base.jyutping} ${variant.jyutping}` })
  },
  {
    category: 'vegetarian-main-dishes',
    subcategory: 'tofu',
    bases: [
      { en: 'Silken Tofu', zh: '滑豆腐', jyutping: 'waat6 dau6 fu6', ingredients: ['silken tofu'], zhIngredients: ['滑豆腐'] },
      { en: 'Stuffed Tofu', zh: '釀豆腐', jyutping: 'joeng6 dau6 fu6', ingredients: ['firm tofu', 'shiitake mushroom', 'water chestnut'], zhIngredients: ['豆腐', '冬菇', '馬蹄'] },
      { en: 'Crispy Tofu', zh: '脆豆腐', jyutping: 'ceoi3 dau6 fu6', ingredients: ['firm tofu', 'rice flour'], zhIngredients: ['豆腐', '粘米粉'] },
      { en: 'Braised Tofu', zh: '炆豆腐', jyutping: 'man1 dau6 fu6', ingredients: ['firm tofu', 'vegetable stock'], zhIngredients: ['豆腐', '菜湯'] },
      { en: 'Steamed Tofu', zh: '蒸豆腐', jyutping: 'zing1 dau6 fu6', ingredients: ['soft tofu'], zhIngredients: ['嫩豆腐'] }
    ],
    variants: [
      { en: 'Scallion Soy', zh: '蔥油豉油', jyutping: 'cung1 jau4 si6 jau4', ingredients: ['scallion', 'light soy sauce'], zhIngredients: ['蔥', '豉油'], noteEn: 'finished with aromatic scallion oil and light soy', noteYue: '淋上蔥油同豉油' },
      { en: 'Black Bean', zh: '豉汁', jyutping: 'si6 zap1', ingredients: ['fermented black bean', 'garlic'], zhIngredients: ['豆豉', '蒜頭'], noteEn: 'seasoned with fermented black bean and garlic', noteYue: '用豆豉同蒜頭調味' },
      { en: 'Salted Lemon', zh: '鹹檸檬', jyutping: 'haam4 ning4 mung1', ingredients: ['salted lemon', 'ginger'], zhIngredients: ['鹹檸檬', '薑'], noteEn: 'brightened with preserved salted lemon and ginger', noteYue: '加入鹹檸檬同薑提味' },
      { en: 'Ginger Mushroom', zh: '薑汁雜菌', jyutping: 'goeng1 zap1 zaap6 kwan2', ingredients: ['ginger', 'mixed mushroom'], zhIngredients: ['薑', '雜菌'], noteEn: 'served with ginger-scented mixed mushrooms', noteYue: '配薑汁雜菌' },
      { en: 'Sweet-and-Sour Pineapple', zh: '菠蘿咕嚕', jyutping: 'bo1 lo4 gu1 lou1', ingredients: ['pineapple', 'sweet-and-sour sauce'], zhIngredients: ['菠蘿', '咕嚕汁'], noteEn: 'coated in a balanced pineapple sweet-and-sour sauce', noteYue: '拌勻菠蘿咕嚕汁' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en}`, zh: `${variant.zh}${base.zh}`, jyutping: `${variant.jyutping} ${base.jyutping}` })
  },
  {
    category: 'vegetarian-main-dishes',
    subcategory: 'bean-curd-sheet-rolls',
    bases: [
      { en: 'Mushroom and Bamboo Shoot', zh: '冬菇竹筍', jyutping: 'dung1 gu1 zuk1 seon2', ingredients: ['shiitake mushroom', 'bamboo shoot', 'bean curd sheet'], zhIngredients: ['冬菇', '竹筍', '腐皮'] },
      { en: 'Lotus Root and Carrot', zh: '蓮藕甘筍', jyutping: 'lin4 ngau5 gam1 seon2', ingredients: ['lotus root', 'carrot', 'bean curd sheet'], zhIngredients: ['蓮藕', '甘筍', '腐皮'] },
      { en: 'Taro and Ginkgo', zh: '芋頭白果', jyutping: 'wu6 tau4 baak6 gwo2', ingredients: ['taro', 'ginkgo nut', 'bean curd sheet'], zhIngredients: ['芋頭', '白果', '腐皮'] },
      { en: 'Water Chestnut and Celery', zh: '馬蹄西芹', jyutping: 'maa5 tai4 sai1 kan4', ingredients: ['water chestnut', 'Chinese celery', 'bean curd sheet'], zhIngredients: ['馬蹄', '西芹', '腐皮'] },
      { en: 'Snow Pea and Wood Ear', zh: '荷蘭豆木耳', jyutping: 'ho4 laan4 dau6 muk6 ji5', ingredients: ['snow pea', 'wood ear', 'bean curd sheet'], zhIngredients: ['荷蘭豆', '木耳', '腐皮'] }
    ],
    variants: [
      { en: 'Steamed Ginger', zh: '薑汁蒸', jyutping: 'goeng1 zap1 zing1', ingredients: ['ginger'], zhIngredients: ['薑'], noteEn: 'steamed gently with fresh ginger', noteYue: '加薑汁蒸到軟滑' },
      { en: 'Red-Fermented Bean Curd Braised', zh: '南乳炆', jyutping: 'naam4 jyu5 man1', ingredients: ['red fermented bean curd'], zhIngredients: ['南乳'], noteEn: 'braised in a savoury red-fermented-bean-curd sauce', noteYue: '用南乳汁慢慢炆香' },
      { en: 'Salt-and-Pepper Crispy', zh: '椒鹽脆炸', jyutping: 'ziu1 jim4 ceoi3 zaa3', ingredients: ['white pepper', 'rice flour'], zhIngredients: ['白胡椒', '粘米粉'], noteEn: 'fried crisp with a salt-and-pepper finish', noteYue: '炸脆再灑椒鹽' },
      { en: 'Ginger Claypot', zh: '薑蔥煲', jyutping: 'goeng1 cung1 bou1', ingredients: ['ginger', 'scallion'], zhIngredients: ['薑', '蔥'], noteEn: 'finished hot in a claypot with ginger and scallion', noteYue: '用薑蔥放入煲仔煮香' },
      { en: 'Black Bean Steamed', zh: '豉汁蒸', jyutping: 'si6 zap1 zing1', ingredients: ['fermented black bean', 'garlic'], zhIngredients: ['豆豉', '蒜頭'], noteEn: 'steamed with fermented black bean and garlic', noteYue: '加豉汁同蒜頭蒸熟' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en} Bean Curd Sheet Roll`, zh: `${variant.zh}${base.zh}腐皮卷`, jyutping: `${variant.jyutping} ${base.jyutping} fu6 pei4 gyun2` })
  },
  {
    category: 'vegetarian-main-dishes',
    subcategory: 'seasonal-vegetables',
    bases: [
      { en: 'Gai Lan', zh: '芥蘭', jyutping: 'gaai3 laan4', ingredients: ['Chinese broccoli'], zhIngredients: ['芥蘭'] },
      { en: 'Choy Sum', zh: '菜心', jyutping: 'coi3 sam1', ingredients: ['choy sum'], zhIngredients: ['菜心'] },
      { en: 'Pea Shoots', zh: '豆苗', jyutping: 'dau6 miu4', ingredients: ['pea shoots'], zhIngredients: ['豆苗'] },
      { en: 'Water Spinach', zh: '通菜', jyutping: 'tung1 coi3', ingredients: ['water spinach'], zhIngredients: ['通菜'] },
      { en: 'Baby Bok Choy', zh: '白菜苗', jyutping: 'baak6 coi3 miu4', ingredients: ['baby bok choy'], zhIngredients: ['白菜苗'] }
    ],
    variants: [
      { en: 'Garlic-Fried', zh: '蒜蓉炒', jyutping: 'syun3 jung4 caau2', ingredients: ['garlic'], zhIngredients: ['蒜蓉'], noteEn: 'quickly wok-fried with minced garlic', noteYue: '用蒜蓉猛火炒香' },
      { en: 'Fermented Bean Curd', zh: '腐乳', jyutping: 'fu6 jyu5', ingredients: ['fermented bean curd'], zhIngredients: ['腐乳'], noteEn: 'wok-fried with a savoury fermented-bean-curd sauce', noteYue: '用腐乳汁炒香' },
      { en: 'Ginger-Braised', zh: '薑汁燴', jyutping: 'goeng1 zap1 wui6', ingredients: ['ginger', 'vegetable stock'], zhIngredients: ['薑', '菜湯'], noteEn: 'lightly braised in ginger vegetable stock', noteYue: '用薑汁菜湯輕輕燴熟' },
      { en: 'Preserved Olive', zh: '欖菜炒', jyutping: 'laam5 coi3 caau2', ingredients: ['preserved olive vegetable'], zhIngredients: ['欖菜'], noteEn: 'wok-fried with savoury preserved olive vegetable', noteYue: '加欖菜猛火炒香' },
      { en: 'Three-Mushroom', zh: '三菇扒', jyutping: 'saam1 gu1 paa4', ingredients: ['shiitake mushroom', 'straw mushroom', 'shimeji mushroom'], zhIngredients: ['冬菇', '草菇', '鴻喜菇'], noteEn: 'served under a glossy three-mushroom vegetable sauce', noteYue: '配三菇菜汁扒好' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en}`, zh: `${variant.zh}${base.zh}`, jyutping: `${variant.jyutping} ${base.jyutping}` })
  },
  {
    category: 'vegetarian-main-dishes',
    subcategory: 'mushrooms',
    bases: [
      { en: 'King Oyster Mushroom', zh: '杏鮑菇', jyutping: 'hang6 baau1 gu1', ingredients: ['king oyster mushroom'], zhIngredients: ['杏鮑菇'] },
      { en: 'Shiitake Mushroom', zh: '冬菇', jyutping: 'dung1 gu1', ingredients: ['shiitake mushroom'], zhIngredients: ['冬菇'] },
      { en: 'Straw Mushroom', zh: '草菇', jyutping: 'cou2 gu1', ingredients: ['straw mushroom'], zhIngredients: ['草菇'] },
      { en: 'Shimeji Mushroom', zh: '鴻喜菇', jyutping: 'hung4 hei2 gu1', ingredients: ['shimeji mushroom'], zhIngredients: ['鴻喜菇'] },
      { en: 'Wood Ear Mushroom', zh: '木耳', jyutping: 'muk6 ji5', ingredients: ['wood ear mushroom'], zhIngredients: ['木耳'] }
    ],
    variants: [
      { en: 'Black Pepper', zh: '黑椒', jyutping: 'hak1 ziu1', ingredients: ['black pepper', 'onion'], zhIngredients: ['黑椒', '洋蔥'], noteEn: 'seared with onion in a Hong Kong black-pepper sauce', noteYue: '配洋蔥同港式黑椒汁炒香' },
      { en: 'Ginger Scallion', zh: '薑蔥', jyutping: 'goeng1 cung1', ingredients: ['ginger', 'scallion'], zhIngredients: ['薑', '蔥'], noteEn: 'wok-tossed with ginger and scallion', noteYue: '用薑蔥猛火兜炒' },
      { en: 'Vegan XO-Style', zh: '素XO醬', jyutping: 'sou3 ik1 si1 ou1 zoeng3', ingredients: ['dried shiitake', 'chili', 'soybean'], zhIngredients: ['冬菇乾', '辣椒', '黃豆'], noteEn: 'tossed in a house vegan XO-style mushroom relish', noteYue: '拌入素XO醬炒香' },
      { en: 'Claypot', zh: '啫啫煲', jyutping: 'ze1 ze1 bou1', ingredients: ['ginger', 'scallion', 'light soy sauce'], zhIngredients: ['薑', '蔥', '豉油'], noteEn: 'served sizzling in a claypot with ginger and scallion', noteYue: '用薑蔥放入啫啫煲煮香' },
      { en: 'Sweet Soy Glazed', zh: '甜豉油燒', jyutping: 'tim4 si6 jau4 siu1', ingredients: ['sweet soy glaze'], zhIngredients: ['甜豉油'], noteEn: 'lacquered with a light sweet-soy glaze', noteYue: '掃上甜豉油燒到亮身' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en}`, zh: `${variant.zh}${base.zh}`, jyutping: `${variant.jyutping} ${base.jyutping}` })
  },
  {
    category: 'vegetarian-staples',
    subcategory: 'rice-noodles-and-congee',
    bases: [
      { en: 'Fried Rice', zh: '炒飯', jyutping: 'caau2 faan6', ingredients: ['cooked rice', 'scallion'], zhIngredients: ['白飯', '蔥'] },
      { en: 'Claypot Rice', zh: '煲仔飯', jyutping: 'bou1 zai2 faan6', ingredients: ['jasmine rice', 'light soy sauce'], zhIngredients: ['絲苗米', '豉油'] },
      { en: 'Rice Congee', zh: '粥', jyutping: 'zuk1', ingredients: ['rice', 'vegetable stock'], zhIngredients: ['白米', '菜湯'] },
      { en: 'Rice Noodles', zh: '河粉', jyutping: 'ho4 fan2', ingredients: ['rice noodles'], zhIngredients: ['河粉'] },
      { en: 'E-Fu Noodles', zh: '伊麵', jyutping: 'ji1 min6', ingredients: ['e-fu noodles'], zhIngredients: ['伊麵'] }
    ],
    variants: [
      { en: 'Mixed Mushroom', zh: '雜菌', jyutping: 'zaap6 kwan2', ingredients: ['shiitake mushroom', 'king oyster mushroom'], zhIngredients: ['冬菇', '杏鮑菇'], noteEn: 'layered with wok-cooked mixed mushrooms', noteYue: '配炒香雜菌' },
      { en: 'Preserved Olive and Green Bean', zh: '欖菜四季豆', jyutping: 'laam5 coi3 sei3 gwai3 dau6', ingredients: ['preserved olive vegetable', 'green bean'], zhIngredients: ['欖菜', '四季豆'], noteEn: 'seasoned with preserved olive vegetable and green beans', noteYue: '加入欖菜同四季豆' },
      { en: 'Pumpkin and Chestnut', zh: '南瓜栗子', jyutping: 'naam4 gwaa1 leot6 zi2', ingredients: ['pumpkin', 'chestnut'], zhIngredients: ['南瓜', '栗子'], noteEn: 'finished with sweet pumpkin and roasted chestnut', noteYue: '配南瓜同栗子煮香' },
      { en: 'Black Bean Tofu', zh: '豉汁豆腐', jyutping: 'si6 zap1 dau6 fu6', ingredients: ['firm tofu', 'fermented black bean'], zhIngredients: ['豆腐', '豆豉'], noteEn: 'topped with tofu in fermented black-bean sauce', noteYue: '配豉汁豆腐' },
      { en: 'Seasonal Greens', zh: '時菜', jyutping: 'si4 coi3', ingredients: ['seasonal Chinese greens'], zhIngredients: ['時菜'], noteEn: 'served with freshly wok-cooked seasonal greens', noteYue: '配新鮮時菜' }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en}`, zh: `${variant.zh}${base.zh}`, jyutping: `${variant.jyutping} ${base.jyutping}` })
  },
  {
    category: 'plant-based-hong-kong-classics',
    subcategory: 'cafe-and-roast-inspired',
    bases: [
      { en: 'Plant-Based Char Siu', zh: '植物叉燒', jyutping: 'zik6 mat6 caa1 siu1', ingredients: ['wheat gluten', 'vegetarian char siu glaze'], zhIngredients: ['麵筋', '素叉燒醬'] },
      { en: 'Crispy Bean-Curd Roast Goose', zh: '脆皮素燒鵝', jyutping: 'ceoi3 pei4 sou3 siu1 ngo4', ingredients: ['bean curd sheet', 'shiitake mushroom'], zhIngredients: ['腐皮', '冬菇'] },
      { en: 'Konjac Fish Fillet', zh: '蒟蒻素魚柳', jyutping: 'geoi2 joek6 sou3 jyu4 lau5', ingredients: ['konjac', 'seaweed'], zhIngredients: ['蒟蒻', '紫菜'] },
      { en: 'Plant-Based Curry Beef', zh: '植物咖喱牛肉', jyutping: 'zik6 mat6 gaa3 lei1 ngau4 juk6', ingredients: ['plant-based protein', 'Hong Kong curry sauce'], zhIngredients: ['植物蛋白', '港式咖喱'] },
      { en: 'Plant-Based Sweet-and-Sour Pork', zh: '植物咕嚕肉', jyutping: 'zik6 mat6 gu1 lou1 juk6', ingredients: ['plant-based protein', 'pineapple', 'sweet-and-sour sauce'], zhIngredients: ['植物蛋白', '菠蘿', '咕嚕汁'] }
    ],
    variants: [
      { en: 'Rice Plate', zh: '碟頭飯', jyutping: 'dip6 tau4 faan6', ingredients: ['steamed rice', 'seasonal greens'], zhIngredients: ['白飯', '時菜'], noteEn: 'served as a Hong Kong rice plate with seasonal greens', noteYue: '配白飯同時菜做成港式碟頭飯' },
      { en: 'Noodle Soup', zh: '湯麵', jyutping: 'tong1 min6', ingredients: ['wheat noodles', 'vegetable broth'], zhIngredients: ['麵', '菜湯'], noteEn: 'served over noodles in a clear vegetable broth', noteYue: '配清菜湯同麵' },
      { en: 'Lo Mein', zh: '撈麵', jyutping: 'lou1 min6', ingredients: ['wheat noodles', 'scallion oil'], zhIngredients: ['麵', '蔥油'], noteEn: 'served over dry-tossed noodles with scallion oil', noteYue: '配蔥油撈麵' },
      { en: 'Baked Rice', zh: '焗飯', jyutping: 'guk6 faan6', ingredients: ['rice', 'tomato sauce', 'plant-based cheese'], zhIngredients: ['白飯', '茄汁', '植物芝士'], noteEn: 'baked over rice with Hong Kong café tomato sauce', noteYue: '鋪上茄汁焗飯' },
      { en: 'Claypot', zh: '煲仔', jyutping: 'bou1 zai2', ingredients: ['jasmine rice', 'sweet soy sauce'], zhIngredients: ['絲苗米', '甜豉油'], noteEn: 'cooked over rice in a claypot with a crisp bottom', noteYue: '放入煲仔煮出飯焦' }
    ],
    compose: (base, variant) => ({ en: `${base.en} ${variant.en}`, zh: `${base.zh}${variant.zh}`, jyutping: `${base.jyutping} ${variant.jyutping}` })
  },
  {
    category: 'contemporary-hong-kong-small-plates',
    subcategory: 'modern-vegetables',
    bases: [
      { en: 'Turnip', zh: '蘿蔔', jyutping: 'lo4 baak6', ingredients: ['turnip'], zhIngredients: ['蘿蔔'] },
      { en: 'Lotus Root', zh: '蓮藕', jyutping: 'lin4 ngau5', ingredients: ['lotus root'], zhIngredients: ['蓮藕'] },
      { en: 'Eggplant', zh: '茄子', jyutping: 'ke4 zi2', ingredients: ['Chinese eggplant'], zhIngredients: ['茄子'] },
      { en: 'Cauliflower', zh: '椰菜花', jyutping: 'je4 coi3 faa1', ingredients: ['cauliflower'], zhIngredients: ['椰菜花'] },
      { en: 'Okra', zh: '秋葵', jyutping: 'cau1 kwai4', ingredients: ['okra'], zhIngredients: ['秋葵'] }
    ],
    variants: [
      { en: 'Typhoon-Shelter', zh: '避風塘', jyutping: 'bei6 fung1 tong4', ingredients: ['fried garlic', 'chili', 'bread crumbs'], zhIngredients: ['炸蒜', '辣椒', '麵包糠'], noteEn: 'tossed with the toasted garlic and chili crumbs of typhoon-shelter cooking', noteYue: '拌勻避風塘蒜香辣椒料' },
      { en: 'Salt-and-Pepper', zh: '椒鹽', jyutping: 'ziu1 jim4', ingredients: ['white pepper', 'scallion'], zhIngredients: ['白胡椒', '蔥'], noteEn: 'fried crisp and finished with salt, white pepper, and scallion', noteYue: '炸脆再灑椒鹽同蔥花' },
      { en: 'Black Garlic', zh: '黑蒜', jyutping: 'hak1 syun3', ingredients: ['black garlic', 'light soy sauce'], zhIngredients: ['黑蒜', '豉油'], noteEn: 'glazed with mellow black garlic and light soy', noteYue: '用黑蒜同豉油燒香' },
      { en: 'Fermented Chili', zh: '發酵辣椒', jyutping: 'faat3 haau3 laat6 ziu1', ingredients: ['fermented chili', 'garlic'], zhIngredients: ['發酵辣椒', '蒜頭'], noteEn: 'wok-tossed with fermented chili and garlic', noteYue: '用發酵辣椒同蒜頭炒香' },
      { en: 'Yuzu Honey', zh: '柚子蜜', jyutping: 'jau2 zi2 mat6', ingredients: ['yuzu', 'honey'], zhIngredients: ['柚子', '蜜糖'], noteEn: 'lacquered with a bright yuzu-honey glaze', noteYue: '掃上柚子蜜燒到亮身', vegetarianOnly: true }
    ],
    compose: (base, variant) => ({ en: `${variant.en} ${base.en}`, zh: `${variant.zh}${base.zh}`, jyutping: `${variant.jyutping} ${base.jyutping}` })
  }
];

const records = [];
for (const group of groups) {
  for (const base of group.bases) {
    for (const variant of group.variants) {
      const ordinal = 751 + records.length;
      const id = `hk-dish-${String(ordinal).padStart(4, '0')}`;
      const name = group.compose(base, variant);
      const ingredients = [...new Set([...base.ingredients, ...variant.ingredients])];
      const zhIngredients = [...new Set([...base.zhIngredients, ...variant.zhIngredients])];
      const allergens = allergenRules
        .filter(([, pattern]) => ingredients.some(ingredient => pattern.test(ingredient)))
        .map(([allergen]) => allergen);
      const slug = slugify(name.en);
      const dietaryTags = variant.vegetarianOnly ? ['vegetarian'] : ['vegetarian', 'vegan'];
      const ingredientText = ingredients.join(', ');

      records.push({
        id,
        slug,
        name: { en: name.en, zhHant: name.zh },
        jyutping: name.jyutping,
        category: group.category,
        subcategory: group.subcategory,
        description: {
          en: `${name.en} combines ${ingredientText} in ${variant.noteEn}.`,
          yue: `${name.zh}用${zhIngredients.join('、')}製作，${variant.noteYue}，味道同做法都寫到明，唔使靠個名估餐飽。`
        },
        ingredients,
        dietaryTags,
        allergens,
        image: {
          path: `images/${id}-${slug}.png`,
          alt: {
            en: `${name.en} presented as one freshly prepared Hong Kong dish on a ceramic plate.`,
            yue: `一碟新鮮整好嘅${name.zh}，用陶瓷碟上枱。`
          }
        },
        imagePrompt: [
          'Use case: product-mockup',
          'Asset type: square catalog image for an offline Hong Kong dish index',
          `Primary request: one authentic serving of ${name.en} (${name.zh})`,
          'Scene/backdrop: warm Hong Kong tea-house or neighbourhood restaurant tabletop with restrained ceramic tableware',
          `Subject: the single named dish, visibly featuring ${ingredientText}; present the preparation accurately and appetizingly`,
          'Style/medium: original photorealistic food photography with natural texture',
          'Composition/framing: square close three-quarter food view, one serving centered, generous edge padding',
          'Lighting/mood: soft window light, warm but natural colour, crisp edible detail',
          'Constraints: show only this exact dish and its normal garnish; no people; no text; no logos; no watermark',
          'Avoid: duplicate plates, unrelated dishes, menus, labels, packaging, hands, utensils blocking the food, surreal ingredients'
        ].join('\n')
      });
    }
  }
}

// Later catalog ranges yield to lower numeric IDs whenever a bilingual identity
// would otherwise repeat. Keep the preparation intact while making the exact
// catalog name, slug, image path, alt text, description, and prompt distinct.
const uniquenessOverrides = [
  { id: 876, en: 'Tea-House Garlic-Fried Gai Lan', zh: '茶樓蒜蓉炒芥蘭', jyutping: 'caa4 lau4 syun3 jung4 caau2 gaai3 laan4' },
  { id: 881, en: 'Neighbourhood Garlic-Fried Choy Sum', zh: '街坊蒜蓉炒菜心', jyutping: 'gaai1 fong1 syun3 jung4 caau2 coi3 sam1' },
  { id: 886, en: 'Market-Fresh Garlic-Fried Pea Shoots', zh: '鮮市蒜蓉炒豆苗', jyutping: 'sin1 si5 syun3 jung4 caau2 dau6 miu4' },
  { id: 892, en: 'Red Fermented Bean Curd Water Spinach', zh: '紅腐乳炒通菜', jyutping: 'hung4 fu6 jyu5 caau2 tung1 coi3' }
];

for (const identity of uniquenessOverrides) {
  const record = records[identity.id - 751];
  const previousEn = record.name.en;
  const previousZh = record.name.zhHant;
  record.name = { en: identity.en, zhHant: identity.zh };
  record.jyutping = identity.jyutping;
  record.slug = slugify(identity.en);
  record.description.en = record.description.en.replace(previousEn, identity.en);
  record.description.yue = record.description.yue.replace(previousZh, identity.zh);
  record.image.path = `images/${record.id}-${record.slug}.png`;
  record.image.alt.en = record.image.alt.en.replace(previousEn, identity.en);
  record.image.alt.yue = record.image.alt.yue.replace(previousZh, identity.zh);
  record.imagePrompt = record.imagePrompt
    .replace(previousEn, identity.en)
    .replace(previousZh, identity.zh);
}

const chocolateOverrides = [
  { id: 760, en: 'Dark Chocolate Black Sesame Xiao Long Bao', zh: '黑巧克力黑芝麻小籠包', jyutping: 'hak1 haau2 hak1 lik1 hak1 zi1 maa4 siu2 lung4 baau1', ingredients: ['dark chocolate', 'black sesame', 'wheat dumpling wrapper'], shape: 'delicate pleated xiao long bao' },
  { id: 780, en: 'Salted Caramel Chocolate Crystal Dumpling', zh: '海鹽焦糖巧克力水晶餃', jyutping: 'hoi2 jim4 ziu1 tong4 haau2 hak1 lik1 seoi2 zing1 gaau2', ingredients: ['dark chocolate', 'salted caramel', 'mung bean starch wrapper'], shape: 'translucent crystal dumpling' },
  { id: 800, en: 'Matcha White Chocolate Lava Bun', zh: '抹茶白巧克力流心包', jyutping: 'mut3 caa4 baak6 haau2 hak1 lik1 lau4 sam1 baau1', ingredients: ['white chocolate', 'matcha', 'wheat flour'], shape: 'soft green steamed lava bun' },
  { id: 820, en: 'Hazelnut Chocolate Taro Croquette', zh: '榛子巧克力芋角', jyutping: 'zeon1 zi2 haau2 hak1 lik1 wu6 gok3', ingredients: ['milk chocolate', 'hazelnut', 'taro', 'wheat starch'], shape: 'honeycomb taro croquette' },
  { id: 840, en: 'Chili Dark Chocolate Bean Curd Purse', zh: '辣椒黑巧克力腐皮袋', jyutping: 'laat6 ziu1 hak1 haau2 hak1 lik1 fu6 pei4 doi6', ingredients: ['dark chocolate', 'mild chili', 'bean curd sheet'], shape: 'crisp tied bean-curd-sheet purse' },
  { id: 860, en: 'Orange Chocolate Mochi Siu Mai', zh: '香橙巧克力麻糬燒賣', jyutping: 'hoeng1 caang2 haau2 hak1 lik1 maa4 ci4 siu1 maai6', ingredients: ['dark chocolate', 'orange zest', 'glutinous rice flour'], shape: 'open-topped mochi siu mai' },
  { id: 880, en: 'Espresso Chocolate Rice Roll', zh: '特濃咖啡巧克力腸粉', jyutping: 'dak6 nung4 gaa3 fe1 haau2 hak1 lik1 coeng4 fan2', ingredients: ['dark chocolate', 'espresso', 'rice flour sheet'], shape: 'silky rolled rice noodle' },
  { id: 900, en: 'Raspberry Chocolate Lotus Leaf Parcel', zh: '紅莓巧克力荷葉包', jyutping: 'hung4 mui4 haau2 hak1 lik1 ho4 jip6 baau1', ingredients: ['dark chocolate', 'raspberry', 'glutinous rice', 'lotus leaf'], shape: 'small lotus-leaf parcel' },
  { id: 920, en: 'Peanut Butter Chocolate Glutinous Rice Dumpling', zh: '花生醬巧克力糯米糍', jyutping: 'faa1 sang1 zoeng3 haau2 hak1 lik1 no6 mai5 ci4', ingredients: ['milk chocolate', 'peanut butter', 'glutinous rice flour'], shape: 'round glutinous-rice dumpling' },
  { id: 940, en: 'Coconut Chocolate Custard Sponge Cake', zh: '椰香巧克力流心馬拉糕', jyutping: 'je4 hoeng1 haau2 hak1 lik1 lau4 sam1 maa5 laai1 gou1', ingredients: ['dark chocolate', 'coconut cream', 'egg', 'wheat flour'], shape: 'steamed layered sponge cake' },
  { id: 960, en: 'Rose Chocolate Snow-Skin Dumpling', zh: '玫瑰巧克力冰皮餃', jyutping: 'mui4 gwai3 haau2 hak1 lik1 bing1 pei4 gaau2', ingredients: ['white chocolate', 'rose', 'glutinous rice flour'], shape: 'pale pink snow-skin dumpling' },
  { id: 980, en: 'Yuzu White Chocolate Sesame Ball', zh: '柚子白巧克力煎堆', jyutping: 'jau2 zi2 baak6 haau2 hak1 lik1 zin1 deoi1', ingredients: ['white chocolate', 'yuzu', 'glutinous rice flour', 'sesame'], shape: 'golden sesame-coated glutinous rice ball' },
  { id: 1000, en: 'Five-Spice Chocolate Golden Bun', zh: '五香巧克力黃金包', jyutping: 'ng5 hoeng1 haau2 hak1 lik1 wong4 gam1 baau1', ingredients: ['dark chocolate', 'five-spice', 'wheat flour', 'egg yolk'], shape: 'golden steamed celebration bun' }
];

for (const chocolate of chocolateOverrides) {
  const id = `hk-dish-${String(chocolate.id).padStart(4, '0')}`;
  const slug = slugify(chocolate.en);
  const allergens = allergenRules
    .filter(([, pattern]) => chocolate.ingredients.some(ingredient => pattern.test(ingredient)))
    .map(([allergen]) => allergen);
  records[chocolate.id - 751] = {
    id,
    slug,
    name: { en: chocolate.en, zhHant: chocolate.zh },
    jyutping: chocolate.jyutping,
    category: 'chocolate-filled-dim-sum',
    subcategory: 'modern-chocolate-fusion',
    description: {
      en: `${chocolate.en} is a ${chocolate.shape} made with ${chocolate.ingredients.join(', ')} and a clearly enclosed chocolate centre.`,
      yue: `${chocolate.zh}係一款${chocolate.shape}，入面真係包住巧克力餡，唔係喺面頭灑兩粒可可粉就扮完成任務。`
    },
    ingredients: chocolate.ingredients,
    dietaryTags: ['vegetarian'],
    allergens,
    image: {
      path: `images/${id}-${slug}.png`,
      alt: {
        en: `${chocolate.en} with one piece opened to show its chocolate filling.`,
        yue: `${chocolate.zh}切開一件，清楚見到入面嘅巧克力餡。`
      }
    },
    imagePrompt: [
      'Use case: product-mockup',
      'Asset type: native square catalog image for an offline Hong Kong dim-sum index',
      `Primary request: one authentic serving of ${chocolate.en} (${chocolate.zh})`,
      'Scene/backdrop: warm contemporary Hong Kong tea-house tabletop with restrained ceramic tableware',
      `Subject: several intact pieces plus exactly one naturally opened piece showing a generous enclosed chocolate filling; the exterior must read clearly as a ${chocolate.shape}; visibly feature ${chocolate.ingredients.join(', ')}`,
      'Style/medium: original photorealistic food photography with natural edible texture',
      'Composition/framing: native square close three-quarter food view, one serving centered, generous edge padding',
      'Lighting/mood: soft window light, warm but natural colour, crisp detail in both wrapper and chocolate centre',
      'Constraints: chocolate must be inside the dim sum rather than merely drizzled on top; show only this exact dish; no people; no text; no logos; no watermark',
      'Avoid: duplicate plates, unrelated desserts, menus, labels, packaging, hands, fake plastic texture, surreal ingredients'
    ].join('\n'),
    chocolateFilled: true
  };
}

if (records.length !== 250 || records.at(-1)?.id !== 'hk-dish-1000') {
  throw new Error(`Expected IDs 0751-1000, generated ${records.length} records ending at ${records.at(-1)?.id}.`);
}

const duplicate = (field, values) => {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${field}: ${value}`);
    seen.add(value);
  }
};
duplicate('slug', records.map(record => record.slug));
duplicate('English name', records.map(record => record.name.en.toLowerCase()));
duplicate('Traditional Chinese name', records.map(record => record.name.zhHant));

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(`Generated ${records.length} records at ${path.relative(repositoryRoot, outputPath)}.`);
