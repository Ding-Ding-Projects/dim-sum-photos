import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const catalogPartsRoot = path.join(repositoryRoot, 'dim-sum', 'catalog-parts');
const outputPath = path.join(catalogPartsRoot, 'part-1001-1250.json');

const slugify = value => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const parseRows = (text, variant = false) => text
  .trim()
  .split(/\r?\n/u)
  .map(line => {
    const [
      en,
      zh,
      jyutping,
      ingredientText,
      zhIngredientText,
      noteEn,
      noteYue
    ] = line.split('|').map(value => value.trim());
    const parsed = {
      en,
      zh,
      jyutping,
      ingredients: ingredientText.split(';').filter(Boolean),
      zhIngredients: zhIngredientText.split(';').filter(Boolean)
    };
    return variant ? { ...parsed, noteEn, noteYue } : parsed;
  });

const groups = [
  {
    category: 'seafood-dim-sum',
    subcategory: 'steamed-seafood-dumplings',
    presentation: 'a bamboo steamer of neat translucent dumplings, with one dumpling naturally opened enough to identify the filling',
    bases: parseRows(`
Shrimp and Yellow Chive|蝦仁韭黃|haa1 jan4 gau2 wong4|shrimp;yellow chive;wheat starch|蝦仁;韭黃;澄麵
Scallop and Water Chestnut|帶子馬蹄|daai3 zi2 maa5 tai4|scallop;water chestnut;wheat starch|帶子;馬蹄;澄麵
Cuttlefish and Chinese Celery|墨魚唐芹|mak6 jyu4 tong4 kan4|cuttlefish;Chinese celery;wheat starch|墨魚;唐芹;澄麵
Crab Meat and Sweet Corn|蟹肉粟米|haai5 juk6 suk1 mai5|crab meat;sweet corn;wheat starch|蟹肉;粟米;澄麵
Dace and Tangerine Peel|鯪魚陳皮|ling4 jyu4 can4 pei4|dace fish;dried tangerine peel;wheat starch|鯪魚;陳皮;澄麵
    `),
    variants: parseRows(`
Tea-House Crystal|茶樓水晶|caa4 lau4 seoi2 zing1|||pleated in a translucent tea-house wrapper and steamed until glossy|用茶樓水晶皮包好蒸到透亮
Ginger-Scallion|薑蔥|goeng1 cung1|ginger;scallion|薑;蔥|seasoned with fresh ginger and scallion before steaming|加薑蔥調味再蒸熟
Superior-Broth|上湯|soeng6 tong1|superior stock|上湯|moistened with a small amount of superior stock inside the wrapper|餡料加入少量上湯保持鮮嫩
Preserved-Lemon|鹹檸|haam4 ling4|preserved salted lemon|鹹檸檬|brightened with finely minced preserved salted lemon|加入切幼鹹檸檬提鮮
White-Pepper|白胡椒|baak6 wu4 ziu1|white pepper|白胡椒|finished with a gentle Hong Kong white-pepper aroma|用白胡椒帶出港式香氣
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Dumpling`,
      zh: `${variant.zh}${base.zh}餃`,
      jyutping: `${variant.jyutping} ${base.jyutping} gaau2`
    })
  },
  {
    category: 'meat-dim-sum',
    subcategory: 'open-top-siu-mai',
    presentation: 'an authentic bamboo steamer of open-topped siu mai with distinct hand-formed filling and tidy yellow wrappers',
    bases: parseRows(`
Pork and Shiitake|豬肉冬菇|zyu1 juk6 dung1 gu1|minced pork;shiitake mushroom;siu mai wrapper|豬肉;冬菇;燒賣皮
Pork and Shrimp|鮮蝦豬肉|sin1 haa1 zyu1 juk6|minced pork;shrimp;siu mai wrapper|豬肉;鮮蝦;燒賣皮
Beef and Water Chestnut|牛肉馬蹄|ngau4 juk6 maa5 tai4|minced beef;water chestnut;siu mai wrapper|牛肉;馬蹄;燒賣皮
Chicken and Bamboo Shoot|雞肉竹筍|gai1 juk6 zuk1 seon2|minced chicken;bamboo shoot;siu mai wrapper|雞肉;竹筍;燒賣皮
Fish Maw and Pork|魚肚豬肉|jyu4 tou5 zyu1 juk6|fish maw;minced pork;siu mai wrapper|魚肚;豬肉;燒賣皮
    `),
    variants: parseRows(`
Classic Yellow-Wrapper|經典黃皮|ging1 din2 wong4 pei4|||formed with a classic thin yellow wrapper and a clean open top|用經典薄黃皮包成開口燒賣
Black-Truffle|黑松露|hak1 sung1 lou6|black truffle|黑松露|scented lightly with minced black truffle|加入少量黑松露提香
Tangerine-Peel|陳皮|can4 pei4|dried tangerine peel|陳皮|seasoned with finely aged tangerine peel|加入幼切陳皮調味
XO-Sauce|XO醬|ik1 si1 ou1 zoeng3|Hong Kong XO sauce|港式XO醬|topped with a restrained spoonful of Hong Kong XO sauce|面頭加少量港式XO醬
Black-Garlic|黑蒜|hak1 syun3|black garlic|黑蒜|balanced with mellow mashed black garlic|用黑蒜蓉調出柔和香味
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Open-Top Siu Mai`,
      zh: `${variant.zh}${base.zh}開口燒賣`,
      jyutping: `${variant.jyutping} ${base.jyutping} hoi1 hau2 siu1 maai6`
    })
  },
  {
    category: 'rice-noodle-dim-sum',
    subcategory: 'filled-rice-noodle-rolls',
    presentation: 'silky folded rice noodle rolls on a white oval tea-house plate, with the named filling visible at one clean cut end',
    bases: parseRows(`
Char Siu and Chinese Chive|叉燒韭菜|caa1 siu1 gau2 coi3|char siu;Chinese chive;rice noodle sheet|叉燒;韭菜;腸粉皮
Shrimp and Pea Shoot|鮮蝦豆苗|sin1 haa1 dau6 miu4|shrimp;pea shoot;rice noodle sheet|鮮蝦;豆苗;腸粉皮
Beef and Cilantro|牛肉芫茜|ngau4 juk6 jyun4 sai1|minced beef;cilantro;rice noodle sheet|牛肉;芫茜;腸粉皮
Fish Fillet and Ginger|魚片薑絲|jyu4 pin2 goeng1 si1|fish fillet;ginger;rice noodle sheet|魚片;薑絲;腸粉皮
Mushroom and Bamboo Shoot|冬菇竹筍|dung1 gu1 zuk1 seon2|shiitake mushroom;bamboo shoot;rice noodle sheet|冬菇;竹筍;腸粉皮
    `),
    variants: parseRows(`
Sweet-Soy Draped|甜豉油|tim4 si6 jau4|sweet soy sauce|甜豉油|draped with glossy Hong Kong sweet soy immediately before serving|上枱前淋上港式甜豉油
Sesame-Hoisin|麻醬海鮮醬|maa4 zoeng3 hoi2 sin1 zoeng3|sesame sauce;hoisin sauce|麻醬;海鮮醬|served with separate ribbons of sesame and hoisin sauce|淋上麻醬同海鮮醬兩款醬汁
Scallion-Oil|蔥油|cung1 jau4|scallion oil|蔥油|finished with aromatic scallion oil|上枱前淋上香蔥油
Dried-Shrimp-Chili|蝦米辣椒|haa1 mai5 laat6 ziu1|dried shrimp;chili oil|蝦米;辣椒油|topped with a savoury dried-shrimp chili relish|配蝦米辣椒醬提味
First-Draw Soy|頭抽|tau4 cau1|first-draw soy sauce|頭抽|seasoned with a restrained first-draw soy sauce|用少量頭抽帶出米香
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Rice Noodle Roll`,
      zh: `${variant.zh}${base.zh}腸粉`,
      jyutping: `${variant.jyutping} ${base.jyutping} coeng4 fan2`
    })
  },
  {
    category: 'bean-curd-sheet-dim-sum',
    subcategory: 'filled-bean-curd-sheet-parcels',
    presentation: 'compact bean-curd-sheet parcels arranged on a tea-house plate, showing the correct steamed, braised, or crisp texture',
    bases: parseRows(`
Pork Rib and Taro|排骨芋頭|paai4 gwat1 wu6 tau4|pork rib;taro;bean curd sheet|排骨;芋頭;腐皮
Duck and Shiitake|鴨肉冬菇|aap3 juk6 dung1 gu1|duck;shiitake mushroom;bean curd sheet|鴨肉;冬菇;腐皮
Shrimp and Bamboo Shoot|鮮蝦竹筍|sin1 haa1 zuk1 seon2|shrimp;bamboo shoot;bean curd sheet|鮮蝦;竹筍;腐皮
Chicken and Chestnut|雞肉栗子|gai1 juk6 leot6 zi2|chicken;chestnut;bean curd sheet|雞肉;栗子;腐皮
Lotus Root and Peanut|蓮藕花生|lin4 ngau5 faa1 saang1|lotus root;peanut;bean curd sheet|蓮藕;花生;腐皮
    `),
    variants: parseRows(`
Ginger-Scallion Claypot|薑蔥煲|goeng1 cung1 bou1|ginger;scallion|薑;蔥|finished sizzling in a small claypot with ginger and scallion|用薑蔥放入細煲仔煮香
Black-Bean Steamed|豉汁蒸|si6 zap1 zing1|fermented black bean;garlic|豆豉;蒜頭|steamed with fermented black bean and garlic|加豉汁同蒜頭蒸熟
Red-Fermented-Bean-Curd Braised|南乳炆|naam4 jyu5 man1|red fermented bean curd|南乳|slow-braised in a savoury red-fermented-bean-curd sauce|用南乳汁慢慢炆香
Oyster-Sauce Braised|蠔油炆|hou4 jau4 man1|oyster sauce;ginger|蠔油;薑|braised until glossy with oyster sauce and ginger|用蠔油同薑炆到亮身
Salt-and-Pepper Crispy|椒鹽脆炸|ziu1 jim4 ceoi3 zaa3|white pepper;rice flour|白胡椒;粘米粉|fried until blistered and crisp, then finished with salt and white pepper|炸到腐皮起泡香脆再灑椒鹽
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Bean Curd Sheet Parcel`,
      zh: `${variant.zh}${base.zh}腐皮包`,
      jyutping: `${variant.jyutping} ${base.jyutping} fu6 pei4 baau1`
    })
  },
  {
    category: 'baked-dim-sum',
    subcategory: 'savory-tea-house-pastries',
    presentation: 'a small serving of freshly baked Hong Kong tea-house pastries with accurate laminated or shortcrust texture, one piece cut to identify the filling',
    bases: parseRows(`
Roast Duck and Taro|燒鴨芋頭|siu1 aap3 wu6 tau4|roast duck;taro|燒鴨;芋頭
Char Siu and Pineapple|叉燒菠蘿|caa1 siu1 bo1 lo4|char siu;pineapple|叉燒;菠蘿
Curry Beef Brisket|咖喱牛腩|gaa3 lei1 ngau4 naam5|beef brisket;Hong Kong curry;potato|牛腩;港式咖喱;薯仔
Black-Pepper Chicken|黑椒雞肉|hak1 ziu1 gai1 juk6|chicken;black pepper;onion|雞肉;黑椒;洋蔥
Crab Meat and Sweet Corn|蟹肉粟米|haai5 juk6 suk1 mai5|crab meat;sweet corn|蟹肉;粟米
    `),
    variants: parseRows(`
Flaky-Lattice|格仔酥|gaak3 zai2 sou1|laminated wheat pastry;butter|千層酥皮;牛油|sealed under a crisp hand-cut lattice of laminated pastry|用手切格仔千層酥皮封面焗香
Sesame-Shortcrust|芝麻酥皮|zi1 maa4 sou1 pei4|wheat shortcrust;sesame;butter|酥皮;芝麻;牛油|enclosed in a crumbly sesame shortcrust shell|包入芝麻酥皮焗到鬆化
Golden-Puff|黃金酥|wong4 gam1 sou1|puff pastry;egg wash;butter|酥皮;蛋液;牛油|baked as a glossy golden puff with fine laminated layers|掃蛋液焗成金黃千層酥
Scallion-Pastry|蔥香酥|cung1 hoeng1 sou1|wheat pastry;scallion;butter|酥皮;蔥;牛油|baked in a scallion-flecked pastry shell|用蔥香酥皮包好焗香
Charcoal-Pastry|竹炭酥|zuk1 taan3 sou1|wheat pastry;bamboo charcoal;butter|酥皮;竹炭粉;牛油|enclosed in a naturally dark bamboo-charcoal pastry|用竹炭酥皮包好焗到鬆脆
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Tea-House Pastry`,
      zh: `${base.zh}${variant.zh}`,
      jyutping: `${base.jyutping} ${variant.jyutping}`
    })
  },
  {
    category: 'rice-dishes',
    subcategory: 'specialty-claypot-rice',
    presentation: 'one traditional lidded claypot opened to reveal fragrant rice, a caramelized rice crust, and the named topping arranged naturally',
    bases: parseRows(`
Chicken and Dried Scallop|雞粒瑤柱|gai1 nap1 jiu4 cyu5|jasmine rice;chicken;dried scallop|絲苗米;雞粒;瑤柱
Eel and Black Bean|白鱔豉汁|baak6 sin5 si6 zap1|jasmine rice;freshwater eel;fermented black bean|絲苗米;白鱔;豆豉
Pork Rib and Taro|排骨芋頭|paai4 gwat1 wu6 tau4|jasmine rice;pork rib;taro|絲苗米;排骨;芋頭
Preserved Duck and Chestnut|臘鴨栗子|lap6 aap3 leot6 zi2|jasmine rice;preserved duck;chestnut|絲苗米;臘鴨;栗子
Beef Patty and Tangerine Peel|陳皮牛肉餅|can4 pei4 ngau4 juk6 beng2|jasmine rice;minced beef;dried tangerine peel|絲苗米;牛肉餅;陳皮
    `),
    variants: parseRows(`
Crispy-Rice-Crusted|香脆飯焦|hoeng1 ceoi3 faan6 ziu1|||cooked long enough to form an even aromatic golden rice crust|煮到有一圈均勻香脆飯焦
Ginger-Scallion|薑蔥|goeng1 cung1|ginger;scallion|薑;蔥|finished with fresh ginger and scallion|起煲前加薑蔥焗香
Double-Soy|雙豉油|soeng1 si6 jau4|light soy sauce;dark soy sauce|生抽;老抽|seasoned at the table with a balanced light-and-dark soy blend|上枱時淋上生抽老抽雙豉油
Preserved-Olive|欖菜|laam5 coi3|preserved olive vegetable|欖菜|layered with savoury preserved olive vegetable|加入欖菜一齊焗飯
Black-Garlic|黑蒜|hak1 syun3|black garlic|黑蒜|finished with mellow whole cloves of black garlic|加入黑蒜焗出柔和甜香
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Claypot Rice`,
      zh: `${variant.zh}${base.zh}煲仔飯`,
      jyutping: `${variant.jyutping} ${base.jyutping} bou1 zai2 faan6`
    })
  },
  {
    category: 'noodle-dishes',
    subcategory: 'hong-kong-wok-noodles',
    presentation: 'one complete Hong Kong noodle serving with the named noodle shape, protein, vegetables, and sauce all clearly distinguishable',
    bases: parseRows(`
Prawn and Scallop|蝦球帶子|haa1 kau4 daai3 zi2|prawn;scallop|蝦球;帶子
Beef Brisket and Daikon|牛腩蘿蔔|ngau4 naam5 lo4 baak6|beef brisket;daikon|牛腩;蘿蔔
Roast Goose and Gai Lan|燒鵝芥蘭|siu1 ngo4 gaai3 laan4|roast goose;gai lan|燒鵝;芥蘭
Fish Cake and Yellow Chive|魚餅韭黃|jyu4 beng2 gau2 wong4|dace fish cake;yellow chive|鯪魚餅;韭黃
Chicken and Shiitake|雞絲冬菇|gai1 si1 dung1 gu1|shredded chicken;shiitake mushroom|雞絲;冬菇
    `),
    variants: parseRows(`
Supreme-Soy Egg Noodles|豉油皇蛋麵|si6 jau4 wong4 daan6 min6|egg noodles;premium soy sauce;bean sprouts|蛋麵;豉油皇;芽菜|wok-tossed with springy egg noodles and premium soy|用蛋麵同豉油皇猛火兜炒
Black-Pepper Ho Fun|黑椒河粉|hak1 ziu1 ho4 fan2|wide rice noodles;black pepper;onion|河粉;黑椒;洋蔥|wok-fried with wide rice noodles, onion, and black-pepper sauce|用河粉洋蔥同黑椒汁猛火炒香
Satay Rice Vermicelli|沙嗲米粉|saa1 de1 mai5 fan2|rice vermicelli;satay sauce;bell pepper|米粉;沙嗲醬;甜椒|tossed with rice vermicelli in a savoury Hong Kong satay sauce|用米粉同港式沙嗲醬炒勻
Ginger-Scallion E-Fu Noodles|薑蔥伊麵|goeng1 cung1 ji1 min6|E-fu noodles;ginger;scallion|伊麵;薑;蔥|braised with springy E-fu noodles, ginger, and scallion|用伊麵薑蔥炆到入味
Curry Lai Fun|咖喱瀨粉|gaa3 lei1 laai6 fan2|thick rice noodles;Hong Kong curry;bean sprouts|瀨粉;港式咖喱;芽菜|served with thick lai fun in a fragrant Hong Kong curry sauce|用瀨粉配港式咖喱汁上枱
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} with ${base.en}`,
      zh: `${base.zh}${variant.zh}`,
      jyutping: `${base.jyutping} ${variant.jyutping}`
    })
  },
  {
    category: 'cantonese-main-dishes',
    subcategory: 'steamed-family-style-plates',
    presentation: 'one family-style oval plate of the named Cantonese steamed dish, moist and naturally arranged with the characteristic aromatics visible',
    bases: parseRows(`
Pork Patty and Salted Egg|肉餅鹹蛋|juk6 beng2 haam4 daan2|minced pork;salted duck egg;water chestnut|豬肉餅;鹹蛋;馬蹄
Chicken and Dried Lily Bud|雞件金針|gai1 gin6 gam1 zam1|chicken;dried lily bud;wood ear|雞件;金針;木耳
Fish Fillet and Black Bean|魚片豆豉|jyu4 pin2 dau6 si6|fish fillet;fermented black bean;garlic|魚片;豆豉;蒜頭
Beef Patty and Water Chestnut|牛肉餅馬蹄|ngau4 juk6 beng2 maa5 tai4|minced beef;water chestnut;scallion|牛肉餅;馬蹄;蔥
Tofu and Shrimp Paste|豆腐蝦膠|dau6 fu6 haa1 gaau1|soft tofu;shrimp paste;scallion|嫩豆腐;蝦膠;蔥
    `),
    variants: parseRows(`
Lotus-Leaf Steamed|荷葉蒸|ho4 jip6 zing1|lotus leaf|荷葉|steamed over a fresh lotus leaf for a gentle herbal aroma|墊住荷葉蒸出清香
Tangerine-Peel Steamed|陳皮蒸|can4 pei4 zing1|dried tangerine peel|陳皮|steamed with fine shreds of aged tangerine peel|加陳皮絲一齊蒸熟
Pickled-Mustard Steamed|榨菜蒸|zaa3 coi3 zing1|pickled mustard tuber|榨菜|steamed with crisp slivers of pickled mustard tuber|加入榨菜絲一齊蒸
Ginger-Wine Steamed|薑酒蒸|goeng1 zau2 zing1|ginger;Shaoxing wine|薑;紹興酒|steamed with ginger and a restrained splash of Shaoxing wine|用薑同少量紹興酒蒸香
First-Draw-Soy Steamed|頭抽蒸|tau4 cau1 zing1|first-draw soy sauce|頭抽|finished after steaming with aromatic first-draw soy|蒸好先淋上頭抽提鮮
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Cantonese Plate`,
      zh: `${variant.zh}${base.zh}`,
      jyutping: `${variant.jyutping} ${base.jyutping}`
    })
  },
  {
    category: 'cha-chaan-teng-dishes',
    subcategory: 'baked-and-sauced-rice-plates',
    presentation: 'one generous Hong Kong cafe plate or oval baking dish with the named starch, sauce, and topping visibly layered in authentic proportions',
    bases: parseRows(`
Pork Chop and Tomato|豬扒茄汁|zyu1 paa2 ke2 zap1|pork chop;tomato sauce;onion|豬扒;茄汁;洋蔥
Chicken Steak and Cream Sauce|雞扒白汁|gai1 paa2 baak6 zap1|chicken steak;cream sauce;mushroom|雞扒;白汁;蘑菇
Seafood and Sweet Corn|海鮮粟米|hoi2 sin1 suk1 mai5|prawn;scallop;fish fillet;sweet corn|蝦;帶子;魚柳;粟米
Beef Tongue and Onion|牛脷洋蔥|ngau4 lei6 joeng4 cung1|beef tongue;onion;gravy|牛脷;洋蔥;燒汁
Fish Fillet and Spinach|魚柳菠菜|jyu4 lau5 bo1 coi3|fish fillet;spinach;cream sauce|魚柳;菠菜;白汁
    `),
    variants: parseRows(`
Baked Fried Rice|焗炒飯|guk6 caau2 faan6|egg fried rice;cheese|蛋炒飯;芝士|layered over egg fried rice, covered lightly with cheese, and baked until bubbling|鋪喺蛋炒飯上加少量芝士焗到香
Baked Spaghetti|焗意粉|guk6 ji3 fan2|spaghetti;cheese|意粉;芝士|served over spaghetti and baked in an oval cafe dish|鋪喺意粉上放入茶餐廳焗碟焗香
Curry Rice|咖喱飯|gaa3 lei1 faan6|steamed rice;Hong Kong curry|白飯;港式咖喱|served over rice with a glossy Hong Kong curry sauce|配白飯淋上港式咖喱汁
Black-Pepper Rice|黑椒飯|hak1 ziu1 faan6|steamed rice;black pepper sauce|白飯;黑椒汁|served beside rice with a bold onion-black-pepper sauce|配白飯同洋蔥黑椒汁
Portuguese-Sauce Rice|葡汁飯|pou4 zap1 faan6|steamed rice;Hong Kong Portuguese sauce|白飯;港式葡汁|served over rice with a mild coconut-turmeric Portuguese-style sauce|配白飯淋上港式椰香葡汁
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} with ${base.en}`,
      zh: `${base.zh}${variant.zh}`,
      jyutping: `${base.jyutping} ${variant.jyutping}`
    })
  },
  {
    category: 'hong-kong-desserts',
    subcategory: 'cantonese-sweet-soups',
    presentation: 'one refined Chinese dessert bowl of smooth or gently textured tong sui, with the named ingredients visible and no unrelated garnish',
    bases: parseRows(`
Black Sesame and Walnut|黑芝麻核桃|hak1 zi1 maa4 hat6 tou4|black sesame;walnut;rice flour|黑芝麻;核桃;粘米粉
Red Bean and Lotus Seed|紅豆蓮子|hung4 dau6 lin4 zi2|red bean;lotus seed;rock sugar|紅豆;蓮子;冰糖
Almond and Egg White|杏仁蛋白|hang6 jan4 daan6 baak6|Chinese almond;egg white;rock sugar|南杏;蛋白;冰糖
Taro and Sago|芋頭西米|wu6 tau4 sai1 mai5|taro;sago;rock sugar|芋頭;西米;冰糖
Papaya and Snow Fungus|木瓜雪耳|muk6 gwaa1 syut3 ji5|papaya;snow fungus;rock sugar|木瓜;雪耳;冰糖
    `),
    variants: parseRows(`
Ginger-Scented|薑香|goeng1 hoeng1|ginger|薑|simmered gently with fresh ginger for a warm finish|加入鮮薑慢煮出暖香
Osmanthus|桂花|gwai3 faa1|osmanthus|桂花|perfumed with a restrained amount of dried osmanthus|加入少量桂花煮出清香
Coconut-Milk|椰汁|je4 zap1|coconut milk|椰汁|finished with creamy coconut milk|最後拌入椰汁煮到順滑
Red-Date|紅棗|hung4 zou2|red date|紅棗|slow-simmered with red dates for natural sweetness|加入紅棗慢煮出天然甜味
Tangerine-Peel|陳皮|can4 pei4|dried tangerine peel|陳皮|balanced with a small piece of aged tangerine peel|加入一小片陳皮平衡甜味
    `, true),
    compose: (base, variant) => ({
      en: `${variant.en} ${base.en} Sweet Soup`,
      zh: `${variant.zh}${base.zh}糖水`,
      jyutping: `${variant.jyutping} ${base.jyutping} tong4 seoi2`
    })
  }
];

const allergenRules = [
  ['shellfish', /shrimp|prawn|crab meat|scallop|dried shrimp/i],
  ['molluscs', /cuttlefish|oyster sauce/i],
  ['fish', /fish|dace|eel/i],
  ['gluten', /wheat|siu mai wrapper|egg noodles|E-fu noodles|spaghetti|pastry|bun dough|tart shell/i],
  ['eggs', /egg|custard/i],
  ['milk', /milk|butter|cream|cheese/i],
  ['soy', /soy|tofu|bean curd|fermented black bean/i],
  ['sesame', /sesame/i],
  ['peanuts', /peanut/i],
  ['tree nuts', /almond|walnut|hazelnut|pistachio|chestnut/i]
];

const meatAndSeafoodPattern = /pork|char siu|beef|chicken|duck|goose|shrimp|prawn|scallop|crab|cuttlefish|dace|fish|eel|oyster/i;
const animalProductPattern = /pork|char siu|beef|chicken|duck|goose|shrimp|prawn|scallop|crab|cuttlefish|dace|fish|eel|oyster|egg|milk|butter|cream|cheese|honey/i;

const inferDietaryTags = ingredients => {
  const text = ingredients.join(' ');
  const tags = [];
  if (!meatAndSeafoodPattern.test(text)) tags.push('vegetarian');
  if (!animalProductPattern.test(text)) tags.push('vegan');
  return tags;
};

const inferAllergens = ingredients => allergenRules
  .filter(([, pattern]) => ingredients.some(ingredient => pattern.test(ingredient)))
  .map(([allergen]) => allergen);

const records = [];
for (const group of groups) {
  assert.equal(group.bases.length, 5);
  assert.equal(group.variants.length, 5);
  for (const base of group.bases) {
    for (const variant of group.variants) {
      const ordinal = 1001 + records.length;
      const id = `hk-dish-${String(ordinal).padStart(4, '0')}`;
      const name = group.compose(base, variant);
      const ingredients = [...new Set([...base.ingredients, ...variant.ingredients])];
      const zhIngredients = [...new Set([...base.zhIngredients, ...variant.zhIngredients])];
      const slug = slugify(name.en);
      const ingredientText = ingredients.join(', ');

      records.push({
        id,
        slug,
        name: { en: name.en, zhHant: name.zh },
        jyutping: name.jyutping,
        category: group.category,
        subcategory: group.subcategory,
        description: {
          en: `${name.en} combines ${ingredientText}. It is ${variant.noteEn}.`,
          yue: `${name.zh}用${zhIngredients.join('、')}製作，${variant.noteYue}。`
        },
        ingredients,
        dietaryTags: inferDietaryTags(ingredients),
        allergens: inferAllergens(ingredients),
        image: {
          path: `images/${id}-${slug}.png`,
          alt: {
            en: `${name.en} presented as one freshly prepared Hong Kong dish.`,
            yue: `一份新鮮整好嘅${name.zh}，按傳統港式擺法上枱。`
          }
        },
        imagePrompt: [
          'Use case: photorealistic-natural',
          'Asset type: native square Hong Kong food catalog image for built-in ImageGen',
          `Primary request: one authentic serving of ${name.en} (${name.zh})`,
          'Scene/backdrop: warm Hong Kong tea-house, family restaurant, or cha chaan teng tabletop appropriate to the dish, with restrained local ceramic tableware',
          `Subject: the single named dish, visibly featuring ${ingredientText}; ${group.presentation}`,
          'Style/medium: original photorealistic professional food photography with natural edible texture',
          'Composition/framing: square 1:1 close three-quarter overhead food view, one serving centered, full plate or steamer visible, generous edge padding',
          'Lighting/mood: soft warm window light, realistic colour, crisp appetizing detail, gentle natural shadows',
          'Materials/textures: physically accurate wrapper, pastry, rice, noodle, sauce, broth, and ceramic textures appropriate to this exact dish',
          'Constraints: one specified dish only; no people; no hands; no text; no lettering; no logos; no trademark; no watermark',
          'Avoid: duplicate plates, unrelated dishes, menus, labels, packaging, blocked food, fake plastic texture, surreal ingredients'
        ].join('\n')
      });
    }
  }
}

const chocolateOverrides = [
  { id: 1020, en: 'Dark Chocolate Salted Egg Custard Lava Bun', zh: '黑巧克力鹹蛋奶皇流心包', jyutping: 'hak1 haau2 hak1 lik1 haam4 daan2 naai5 wong4 lau4 sam1 baau1', ingredients: ['dark chocolate', 'salted duck egg yolk', 'custard', 'wheat bun dough'], shape: 'soft pleated steamed lava bun' },
  { id: 1040, en: 'Hazelnut Chocolate Sesame Ball', zh: '榛子巧克力煎堆', jyutping: 'zeon1 zi2 haau2 hak1 lik1 zin1 deoi1', ingredients: ['milk chocolate', 'roasted hazelnut', 'glutinous rice flour', 'white sesame'], shape: 'golden sesame-coated glutinous rice ball' },
  { id: 1060, en: 'Yuzu White Chocolate Crystal Dumpling', zh: '柚子白巧克力水晶餃', jyutping: 'jau2 zi2 baak6 haau2 hak1 lik1 seoi2 zing1 gaau2', ingredients: ['white chocolate', 'yuzu zest', 'wheat starch', 'mung bean starch'], shape: 'translucent crescent crystal dumpling' },
  { id: 1080, en: 'Espresso Chocolate Mochi Siu Mai', zh: '特濃咖啡巧克力麻糬燒賣', jyutping: 'dak6 nung4 gaa3 fe1 haau2 hak1 lik1 maa4 ci4 siu1 maai6', ingredients: ['dark chocolate', 'espresso', 'glutinous rice flour', 'wheat siu mai wrapper'], shape: 'open-topped mochi siu mai' },
  { id: 1100, en: 'Raspberry Chocolate Honeycomb Taro Croquette', zh: '紅莓巧克力蜂巢芋角', jyutping: 'hung4 mui4 haau2 hak1 lik1 fung1 caau4 wu6 gok3', ingredients: ['dark chocolate', 'raspberry', 'taro', 'wheat starch'], shape: 'crisp honeycomb taro croquette' },
  { id: 1120, en: 'Black Sesame Chocolate Sweet Rice Noodle Roll', zh: '黑芝麻巧克力甜腸粉', jyutping: 'hak1 zi1 maa4 haau2 hak1 lik1 tim4 coeng4 fan2', ingredients: ['dark chocolate', 'black sesame paste', 'rice flour sheet'], shape: 'silky rolled sweet rice noodle' },
  { id: 1140, en: 'Coconut Chocolate Lotus Leaf Sticky Rice Parcel', zh: '椰香巧克力荷葉糯米包', jyutping: 'je4 hoeng1 haau2 hak1 lik1 ho4 jip6 no6 mai5 baau1', ingredients: ['dark chocolate', 'coconut cream', 'glutinous rice', 'lotus leaf'], shape: 'small tied lotus-leaf sticky-rice parcel' },
  { id: 1160, en: 'Pistachio Matcha White Chocolate Lava Bun', zh: '開心果抹茶白巧克力流心包', jyutping: 'hoi1 sam1 gwo2 mut3 caa4 baak6 haau2 hak1 lik1 lau4 sam1 baau1', ingredients: ['white chocolate', 'pistachio', 'matcha', 'wheat bun dough'], shape: 'soft green steamed lava bun' },
  { id: 1180, en: 'Peanut Butter Chocolate Crispy Wonton', zh: '花生醬巧克力脆雲吞', jyutping: 'faa1 saang1 zoeng3 haau2 hak1 lik1 ceoi3 wan4 tan1', ingredients: ['milk chocolate', 'peanut butter', 'wheat wonton wrapper'], shape: 'flower-shaped crisp fried wonton' },
  { id: 1200, en: 'Orange Dark Chocolate Egg Tart', zh: '香橙黑巧克力蛋撻', jyutping: 'hoeng1 caang2 hak1 haau2 hak1 lik1 daan6 taat1', ingredients: ['dark chocolate', 'candied orange peel', 'egg custard', 'wheat tart shell', 'butter'], shape: 'fluted Hong Kong egg tart' },
  { id: 1220, en: 'Rose Milk Chocolate Snow-Skin Mochi', zh: '玫瑰奶巧克力冰皮糯米糍', jyutping: 'mui4 gwai3 naai5 haau2 hak1 lik1 bing1 pei4 no6 mai5 ci4', ingredients: ['milk chocolate', 'rose petal', 'glutinous rice flour'], shape: 'pale pink round snow-skin mochi' },
  { id: 1240, en: 'Five-Spice Chocolate Pineapple Bun', zh: '五香巧克力菠蘿包', jyutping: 'ng5 hoeng1 haau2 hak1 lik1 bo1 lo4 baau1', ingredients: ['dark chocolate', 'five-spice', 'wheat bun dough', 'butter', 'egg'], shape: 'miniature crackle-topped pineapple bun' }
];

for (const chocolate of chocolateOverrides) {
  const id = `hk-dish-${String(chocolate.id).padStart(4, '0')}`;
  const slug = slugify(chocolate.en);
  records[chocolate.id - 1001] = {
    id,
    slug,
    name: { en: chocolate.en, zhHant: chocolate.zh },
    jyutping: chocolate.jyutping,
    category: 'chocolate-filled-dim-sum',
    subcategory: 'modern-hong-kong-chocolate-dim-sum',
    description: {
      en: `${chocolate.en} is a ${chocolate.shape} made with ${chocolate.ingredients.join(', ')} and a generous chocolate filling fully enclosed inside.`,
      yue: `${chocolate.zh}係一款${chocolate.shape}，入面完整包住巧克力餡，切開先見到個流心，唔係淨係喺面頭淋醬。`
    },
    ingredients: chocolate.ingredients,
    dietaryTags: inferDietaryTags(chocolate.ingredients),
    allergens: inferAllergens(chocolate.ingredients),
    chocolateFilled: true,
    image: {
      path: `images/${id}-${slug}.png`,
      alt: {
        en: `${chocolate.en} with one piece opened to show its enclosed chocolate filling.`,
        yue: `${chocolate.zh}切開一件，清楚見到完整包喺入面嘅巧克力餡。`
      }
    },
    imagePrompt: [
      'Use case: photorealistic-natural',
      'Asset type: native square Hong Kong dim-sum catalog image for built-in ImageGen',
      `Primary request: one authentic serving of ${chocolate.en} (${chocolate.zh})`,
      'Scene/backdrop: warm contemporary Hong Kong tea-house tabletop with restrained ceramic tableware',
      `Subject: several intact pieces plus exactly one naturally opened piece showing a generous chocolate filling fully inside; the exterior must clearly read as a ${chocolate.shape}; visibly feature ${chocolate.ingredients.join(', ')}`,
      'Style/medium: original photorealistic professional food photography with natural edible texture',
      'Composition/framing: square 1:1 close three-quarter overhead food view, one serving centered, full plate or steamer visible, generous edge padding',
      'Lighting/mood: soft warm window light, realistic colour, crisp detail in both the wrapper and the chocolate centre',
      'Materials/textures: physically accurate wrapper or pastry, moist enclosed chocolate filling, glazed ceramic, and subtle wood grain',
      'Constraints: chocolate must be fully inside the dim sum rather than merely drizzled on top; one specified dish only; no people; no hands; no text; no lettering; no logos; no trademark; no watermark',
      'Avoid: duplicate plates, unrelated desserts, menus, labels, packaging, fake plastic texture, surreal ingredients'
    ].join('\n')
  };
}

assert.equal(records.length, 250, `Expected 250 records, found ${records.length}.`);
assert.equal(records[0].id, 'hk-dish-1001');
assert.equal(records.at(-1).id, 'hk-dish-1250');

const localUniqueFields = [
  ['ID', record => record.id],
  ['slug', record => record.slug],
  ['English name', record => record.name.en.toLocaleLowerCase('en')],
  ['Traditional Chinese name', record => record.name.zhHant],
  ['image path', record => record.image.path]
];

for (const [label, select] of localUniqueFields) {
  const seen = new Set();
  for (const record of records) {
    const value = select(record);
    assert.ok(!seen.has(value), `Duplicate ${label} in generated range: ${value}`);
    seen.add(value);
  }
}

for (const [index, record] of records.entries()) {
  const numericId = 1001 + index;
  assert.equal(record.id, `hk-dish-${String(numericId).padStart(4, '0')}`, `Non-sequential ID at position ${index}.`);
  assert.match(record.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
  assert.ok(record.name.en.length >= 2 && /[\u3400-\u9fff]/u.test(record.name.zhHant));
  assert.ok(record.jyutping.length >= 2);
  assert.ok(record.description.en.length >= 8 && record.description.yue.length >= 4);
  assert.ok(record.ingredients.length > 0);
  assert.ok(Array.isArray(record.dietaryTags) && Array.isArray(record.allergens));
  assert.equal(record.image.path, `images/${record.id}-${record.slug}.png`);
  assert.ok(record.image.alt.en.includes(record.name.en));
  assert.ok(record.image.alt.yue.includes(record.name.zhHant));
  assert.match(record.imagePrompt, /square 1:1/i);
  assert.match(record.imagePrompt, /photorealistic/i);
  assert.match(record.imagePrompt, /no people/i);
  assert.match(record.imagePrompt, /no text/i);
  assert.match(record.imagePrompt, /no watermark/i);

  const shouldBeChocolateFilled = numericId % 20 === 0;
  assert.equal(record.chocolateFilled === true, shouldBeChocolateFilled, `${record.id} violates the chocolate schedule.`);
  if (shouldBeChocolateFilled) {
    assert.match(record.name.en, /chocolate/i);
    assert.match(record.name.zhHant, /巧克力/u);
    assert.ok(record.ingredients.some(ingredient => /chocolate|cocoa|cacao/i.test(ingredient)));
    assert.match(record.imagePrompt, /chocolate filling fully inside/i);
  } else {
    assert.ok(!Object.hasOwn(record, 'chocolateFilled'), `${record.id} must omit chocolateFilled.`);
  }
}

const existingPartFiles = (await readdir(catalogPartsRoot))
  .filter(file => file.endsWith('.json') && file !== path.basename(outputPath))
  .sort();
const existingRecords = [];
for (const file of existingPartFiles) {
  const part = JSON.parse(await readFile(path.join(catalogPartsRoot, file), 'utf8'));
  assert.ok(Array.isArray(part), `${file} must contain an array.`);
  existingRecords.push(...part);
}

for (const [label, select] of localUniqueFields) {
  const existingValues = new Map(existingRecords.map(record => [select(record), record.id]));
  for (const record of records) {
    const value = select(record);
    assert.ok(
      !existingValues.has(value),
      `${record.id} duplicates existing ${label} ${value} from ${existingValues.get(value)}.`
    );
  }
}

await mkdir(catalogPartsRoot, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
console.log(
  `Generated ${records.length} records at ${path.relative(repositoryRoot, outputPath)}; `
  + `checked against ${existingRecords.length} existing records from ${existingPartFiles.length} parts.`
);
