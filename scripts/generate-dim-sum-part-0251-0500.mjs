import fs from 'node:fs';
import path from 'node:path';

// Deterministically generates the 250 catalog records owned by IDs 0251–0500.

const outPath = path.resolve('dim-sum/catalog-parts/part-0251-0500.json');
const dishes = [];

function parseRows(text) {
  return text.trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [en, zhHant, jyutping, ingredientText] = line.split('|');
    if (!ingredientText) throw new Error(`Malformed dish row: ${line}`);
    return { en, zhHant, jyutping, ingredients: ingredientText.split(';') };
  });
}

function slugify(value) {
  return value.toLowerCase()
    .replace(/&/g, ' and ')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferAllergens(dish) {
  const text = `${dish.en} ${dish.ingredients.join(' ')}`.toLowerCase();
  const out = [];
  const add = (value) => { if (!out.includes(value)) out.push(value); };
  if (/soy|black bean|chu hou|hoisin|fermented bean curd|red fermented tofu|preserved bean curd|tofu|bean sauce/.test(text)) add('soy');
  if (/soy sauce|chu hou|hoisin|oyster sauce|noodle|wonton|e-fu|instant noodle|wheat|gluten|flour|batter/.test(text)) add('wheat');
  if (/oyster|prawn|shrimp|crab|scallop|clam|razor clam|lobster|dried scallop|abalone|octopus|squid|cuttlefish/.test(text)) add('shellfish');
  if (/fish|eel|whitebait|dace|croaker|pomfret|grouper|garoupa|sea bass|threadfin|mud carp|salted fish|fish maw|fish head|fish ball|shrimp roe/.test(text)) add('fish');
  if (/egg/.test(text)) add('egg');
  if (/cashew/.test(text)) add('tree-nuts');
  if (/sesame/.test(text)) add('sesame');
  if (/peanut|satay/.test(text)) add('peanuts');
  if (/milk|cheese|cream/.test(text)) add('milk');
  return out.sort();
}

function inferDietaryTags(dish) {
  const text = `${dish.en} ${dish.ingredients.join(' ')}`.toLowerCase();
  const out = [];
  const add = (value) => { if (!out.includes(value)) out.push(value); };
  if (/pork|char siu|spare rib|pork rib|pork belly|pork chop|pork trotter|pork knuckle|pork intestine|pork liver|pork lung|roast pork|suckling pig|chinese sausage|preserved meat/.test(text)) add('contains-pork');
  if (/beef|ox/.test(text)) add('contains-beef');
  if (/chicken|duck|goose|pigeon|quail/.test(text)) add('contains-poultry');
  if (/lamb/.test(text)) add('contains-lamb');
  if (/frog/.test(text)) add('contains-frog');
  if (/snake/.test(text)) add('contains-reptile');
  if (/fish|eel|whitebait|dace|croaker|pomfret|grouper|garoupa|sea bass|threadfin|mud carp|salted fish|fish maw|fish head|fish ball|shrimp roe/.test(text)) add('contains-fish');
  if (/oyster|prawn|shrimp|crab|scallop|clam|razor clam|lobster|cuttlefish|squid|abalone|octopus/.test(text)) add('contains-shellfish');
  if (/sea cucumber/.test(text)) add('contains-seafood');
  if (out.length === 0) add(/egg/.test(text) ? 'ovo-vegetarian' : 'vegetarian');
  return out.sort();
}

function addGroup({ category, subcategory, yueKind, presentation, rows }) {
  for (const dish of parseRows(rows)) {
    const number = 251 + dishes.length;
    const id = `hk-dish-${String(number).padStart(4, '0')}`;
    const slug = slugify(dish.en);
    const ingredientList = dish.ingredients.length === 1
      ? dish.ingredients[0]
      : `${dish.ingredients.slice(0, -1).join(', ')}, and ${dish.ingredients.at(-1)}`;
    dishes.push({
      id,
      slug,
      name: { en: dish.en, zhHant: dish.zhHant },
      jyutping: dish.jyutping,
      category,
      subcategory,
      description: {
        en: `${dish.en} is a Hong Kong restaurant ${subcategory.toLowerCase()} featuring ${ingredientList}.`,
        yue: `「${dish.zhHant}」係香港餐廳常見嘅${yueKind}，主料配合相應醬汁或配菜炮製後上枱。`,
      },
      ingredients: dish.ingredients,
      dietaryTags: inferDietaryTags(dish),
      allergens: inferAllergens(dish),
      image: {
        path: `images/${id}-${slug}.png`,
        alt: {
          en: `Close catalog photograph of ${dish.en} served on Hong Kong restaurant tableware.`,
          yue: `港式「${dish.zhHant}」用餐廳器皿上枱嘅近鏡菜式相。`,
        },
      },
      imagePrompt: `Use case: photorealistic-natural\nAsset type: square Hong Kong dish catalog image\nPrimary request: ${dish.en} (${dish.zhHant}), prepared as a credible traditional Hong Kong menu dish\nScene/backdrop: warm Hong Kong restaurant wooden tabletop\nSubject: exactly one serving of ${dish.en}, visibly featuring ${ingredientList}, ${presentation}\nStyle/medium: original photorealistic professional food photography\nComposition/framing: square 1:1 composition, close three-quarter overhead view, serving vessel centered and fully visible, appetizing natural proportions\nLighting/mood: warm soft restaurant light, realistic highlights and gentle shadows\nMaterials/textures: accurate cooked textures for every named ingredient, glazed ceramic and subtle wood grain\nConstraints: accurate Hong Kong presentation; one specified dish only; no people; no hands; no text; no logos; no trademark; no watermark; no menu card; no unrelated side dishes`,
    });
  }
}

addGroup({
  category: 'Siu mei and roast meats',
  subcategory: 'Roast and soy-braised meats',
  yueKind: '燒味或滷味',
  presentation: 'neatly chopped or sliced on a white oval ceramic plate with the characteristic glaze and cooking juices visible',
  rows: `
Roast Goose|燒鵝|siu1 ngo4|goose;five-spice marinade;maltose glaze;gai lan
Roast Duck|燒鴨|siu1 aap3|duck;five-spice marinade;maltose glaze;plum sauce
Honey-Glazed Char Siu|蜜汁叉燒|mat6 zap1 caa1 siu1|pork shoulder;honey;maltose;fermented red bean curd
Lean Char Siu|瘦叉燒|sau3 caa1 siu1|lean pork loin;char siu sauce;honey;soy sauce
Half-Fat Half-Lean Char Siu|半肥瘦叉燒|bun3 fei4 sau3 caa1 siu1|marbled pork shoulder;char siu sauce;maltose;soy sauce
Crispy Roast Pork Belly|燒肉|siu1 juk6|pork belly;five-spice salt;rice vinegar;mustard
Suckling Pig Platter|乳豬拼盤|jyu5 zyu1 ping3 pun4|suckling pig;five-spice marinade;crisp skin;hoisin sauce
Soy Sauce Chicken|豉油雞|si6 jau4 gai1|chicken;soy sauce;ginger;star anise
White-Cut Chicken|白切雞|baak6 cit3 gai1|poached chicken;ginger;scallion;sesame oil
Tea-Smoked Chicken|茶燻雞|caa4 fan1 gai1|chicken;tea leaves;rice;five spice
Red Fermented Bean Curd Roast Duck|南乳燒鴨|naam4 jyu5 siu1 aap3|duck;red fermented bean curd;five spice;maltose
Roast Pigeon|紅燒乳鴿|hung4 siu1 jyu5 gap3|young pigeon;soy sauce;maltose;five spice
Crispy Fried Pigeon|脆皮乳鴿|ceoi3 pei4 jyu5 gap3|young pigeon;spiced brine;maltose;frying oil
Five-Spice Beef Shin|五香牛𦟌|ng5 hoeng1 ngau4 zin2|beef shin;five spice;soy sauce;ginger
Soy-Braised Beef Offal|滷水牛雜|lou5 seoi2 ngau4 zaap6|beef tripe;beef intestine;beef lung;master stock
Chiu Chow Soy-Braised Goose Slices|潮州滷水鵝片|ciu4 zau1 lou5 seoi2 ngo4 pin2|goose;Chiu Chow master stock;galangal;soy sauce
Soy-Braised Goose Wing|滷水鵝翼|lou5 seoi2 ngo4 jik6|goose wings;master stock;galangal;soy sauce
Soy-Braised Duck Tongue|滷水鴨舌|lou5 seoi2 aap3 sit6|duck tongues;master stock;star anise;soy sauce
Siu Mei Combination Platter|燒味雙拼|siu1 mei6 soeng1 ping3|char siu;crispy roast pork;mustard;plum sauce
Three-Roast Combination|燒味三拼|siu1 mei6 saam1 ping3|roast goose;char siu;crispy roast pork;gai lan`,
});

addGroup({
  category: 'Pork',
  subcategory: 'Cantonese pork dishes',
  yueKind: '豬肉菜式',
  presentation: 'served as one traditional family-style portion on a white ceramic plate or shallow casserole, with the named sauce and garnish clearly visible',
  rows: `
Sweet and Sour Pork with Pineapple|菠蘿咕嚕肉|bo1 lo4 gu1 lou1 juk6|pork shoulder;pineapple;bell pepper;sweet-and-sour sauce
Pork Chop with Peking Sauce|京都豬扒|ging1 dou1 zyu1 paa2|pork chops;Peking sauce;onion;sesame
Salt and Pepper Pork Chop|椒鹽豬扒|ziu1 jim4 zyu1 paa2|pork chops;garlic;chili;spiced salt
Black Pepper Pork Chop|黑椒豬扒|hak1 ziu1 zyu1 paa2|pork chops;black pepper;onion;soy sauce
Steamed Minced Pork with Salted Fish|鹹魚蒸肉餅|haam4 jyu4 zing1 juk6 beng2|minced pork;Cantonese salted fish;ginger;scallion
Steamed Minced Pork with Preserved Mustard|梅菜蒸肉餅|mui4 coi3 zing1 juk6 beng2|minced pork;preserved mustard greens;soy sauce;ginger
Steamed Minced Pork with Salted Egg|家常鹹蛋蒸肉餅|gaa1 soeng4 haam4 daan2 zing1 juk6 beng2|minced pork;salted duck egg;soy sauce;scallion
Braised Pork Belly with Preserved Mustard|客家梅菜扣肉|haak3 gaa1 mui4 coi3 kau3 juk6|pork belly;preserved mustard greens;dark soy sauce;star anise
Red-Braised Pork Belly|紅燒腩肉|hung4 siu1 naam5 juk6|pork belly;dark soy sauce;rock sugar;star anise
Dongpo Pork|東坡肉|dung1 bo1 juk6|pork belly;Shaoxing wine;soy sauce;rock sugar
Pork Trotter with Fermented Bean Curd|南乳豬手|naam4 jyu5 zyu1 sau2|pork trotter;red fermented bean curd;ginger;rock sugar
Pork Trotter with Ginger and Vinegar|豬腳薑|zyu1 goek3 goeng1|pork trotter;old ginger;sweet black vinegar;eggs
Steamed Pork Ribs with Black Bean Sauce|蒜香豉汁蒸排骨|syun3 hoeng1 si6 zap1 zing1 paai4 gwat1|pork ribs;fermented black beans;garlic;chili
Salt and Pepper Pork Ribs|椒鹽排骨|ziu1 jim4 paai4 gwat1|pork ribs;garlic;chili;spiced salt
Sweet and Sour Spare Ribs|生炒排骨|saang1 caau2 paai4 gwat1|pork spare ribs;bell pepper;onion;sweet-and-sour sauce
Zhenjiang Vinegar Spare Ribs|鎮江骨|zan3 gong1 gwat1|pork spare ribs;Zhenjiang vinegar;rock sugar;ginger
Garlic Spare Ribs|蒜香骨|syun3 hoeng1 gwat1|pork spare ribs;garlic;soy sauce;rice wine
Lemon Pork Ribs|檸檬骨|ning4 mung1 gwat1|pork spare ribs;lemon;honey;soy sauce
Hakka Salted Pork Belly|客家鹹豬肉|haak3 gaa1 haam4 zyu1 juk6|pork belly;five spice;rice wine;garlic
Stir-Fried Pork Neck with XO Sauce|XO醬炒豬頸肉|ik1 sou1 zoeng3 caau2 zyu1 geng2 juk6|pork neck;XO sauce;bell pepper;onion
Steamed Pork Patty with Water Chestnut|馬蹄蒸肉餅|maa5 tai4 zing1 juk6 beng2|minced pork;water chestnut;soy sauce;scallion
Pork Intestine with Pickled Mustard Greens|酸菜炒豬大腸|syun1 coi3 caau2 zyu1 daai6 coeng4|pork intestine;pickled mustard greens;ginger;chili
Crispy Fried Pork Intestine|脆炸大腸|ceoi3 zaa3 daai6 coeng4|pork intestine;maltose;rice vinegar;spiced salt
Pork Liver and Kidney Stir-Fry|爆炒豬潤腰花|baau3 caau2 zyu1 jeon6 jiu1 faa1|pork liver;pork kidney;ginger;scallion
Braised Pork Knuckle with Red Fermented Tofu|南乳炆豬踭|naam4 jyu5 man1 zyu1 zaang1|pork knuckle;red fermented tofu;ginger;rock sugar`,
});

addGroup({
  category: 'Beef',
  subcategory: 'Cantonese beef dishes',
  yueKind: '牛肉菜式',
  presentation: 'served as one glossy wok-fried, braised, or steamed Hong Kong portion on white restaurant tableware, with the named vegetables and sauce visible',
  rows: `
Beef with Black Bean and Peppers|豉椒炒牛肉|si6 ziu1 caau2 ngau4 juk6|sliced beef;fermented black beans;bell pepper;onion
Beef with Oyster Sauce|蠔油牛肉|hou4 jau4 ngau4 juk6|sliced beef;oyster sauce;scallion;ginger
Beef with Bitter Melon|涼瓜炒牛肉|loeng4 gwaa1 caau2 ngau4 juk6|sliced beef;bitter melon;garlic;soy sauce
Beef with Chinese Broccoli|芥蘭炒牛肉|gaai3 laan4 caau2 ngau4 juk6|sliced beef;Chinese broccoli;ginger;oyster sauce
Beef with Ginger and Scallion|薑蔥牛肉|goeng1 cung1 ngau4 juk6|sliced beef;ginger;scallion;soy sauce
Beef with Satay Sauce|沙嗲牛肉|saa1 de1 ngau4 juk6|sliced beef;satay sauce;onion;bell pepper
Black Pepper Beef Tenderloin|黑椒牛柳|hak1 ziu1 ngau4 lau5|beef tenderloin;black pepper;onion;soy sauce
Beef Tenderloin with Peking Sauce|京都牛柳|ging1 dou1 ngau4 lau5|beef tenderloin;Peking sauce;onion;sesame
Crispy Sesame Beef|芝麻脆牛肉|zi1 maa4 ceoi3 ngau4 juk6|beef strips;sesame;light batter;sweet soy glaze
Stir-Fried Beef with Pineapple|菠蘿炒牛肉|bo1 lo4 caau2 ngau4 juk6|sliced beef;pineapple;bell pepper;ginger
Black Pepper Beef Short Ribs|黑椒牛仔骨|hak1 ziu1 ngau4 zai2 gwat1|beef short ribs;black pepper;onion;soy sauce
Honey Pepper Beef Short Ribs|蜜椒牛仔骨|mat6 ziu1 ngau4 zai2 gwat1|beef short ribs;honey;black pepper;bell pepper
Beef Brisket with Chu Hou Sauce and Daikon|柱侯蘿蔔炆牛腩|cyu5 hau4 lo4 baak6 man1 ngau4 naam5|beef brisket;daikon;Chu Hou sauce;star anise
Curry Beef Brisket|咖喱牛腩|gaa3 lei1 ngau4 naam5|beef brisket;Hong Kong curry;potato;onion
Clear-Broth Beef Brisket|清湯牛腩|cing1 tong1 ngau4 naam5|beef brisket;clear beef broth;daikon;scallion
Beef Brisket and Tendon Pot|牛筋腩煲|ngau4 gan1 naam5 bou1|beef brisket;beef tendon;Chu Hou sauce;daikon
Braised Beef Tendon|紅燒牛筋|hung4 siu1 ngau4 gan1|beef tendon;dark soy sauce;rock sugar;ginger
Beef Offal in Chu Hou Sauce|柱侯牛雜|cyu5 hau4 ngau4 zaap6|beef tripe;beef intestine;Chu Hou sauce;daikon
Tomato-Braised Beef|茄汁炆牛肉|ke2 zap1 man1 ngau4 juk6|beef;tomato;onion;soy sauce
Beef with Straw Mushrooms|草菇炒牛肉|cou2 gu1 caau2 ngau4 juk6|sliced beef;straw mushrooms;ginger;oyster sauce
Beef with Cashew Nuts|腰果炒牛肉|jiu1 gwo2 caau2 ngau4 juk6|sliced beef;cashews;bell pepper;celery
Beef with Pickled Mustard Greens|酸菜炒牛肉|syun1 coi3 caau2 ngau4 juk6|sliced beef;pickled mustard greens;ginger;chili
Sizzling Beef Tenderloin|鐵板牛柳|tit3 baan2 ngau4 lau5|beef tenderloin;onion;black pepper;soy sauce
Pan-Fried Minced Beef Patties|香煎牛肉餅|hoeng1 zin1 ngau4 juk6 beng2|minced beef;water chestnut;scallion;soy sauce
Steamed Beef Patty with Tangerine Peel|陳皮蒸牛肉餅|can4 pei4 zing1 ngau4 juk6 beng2|minced beef;dried tangerine peel;water chestnut;soy sauce`,
});

addGroup({
  category: 'Poultry',
  subcategory: 'Chicken and duck dishes',
  yueKind: '雞鴨菜式',
  presentation: 'served as one family-style poultry dish on a white plate or clay casserole, with the named aromatics, sauce, and accompaniments clearly visible',
  rows: `
Ginger Scallion Chicken|薑蔥雞|goeng1 cung1 gai1|chicken;ginger;scallion;soy sauce
Chicken with Black Bean Sauce|豉汁雞球|si6 zap1 gai1 kau4|boneless chicken;fermented black beans;bell pepper;onion
Chicken with Cashew Nuts|腰果雞丁|jiu1 gwo2 gai1 ding1|diced chicken;cashews;celery;bell pepper
Kung Pao Chicken|宮保雞丁|gung1 bou2 gai1 ding1|diced chicken;dried chili;peanuts;scallion
Sweet and Sour Chicken|咕嚕雞球|gu1 lou1 gai1 kau4|boneless chicken;pineapple;bell pepper;sweet-and-sour sauce
Hong Kong Lemon Chicken|西檸煎軟雞|sai1 ning4 zin1 jyun5 gai1|chicken cutlet;lemon sauce;egg;cornstarch
Salt and Pepper Chicken Wings|椒鹽雞翼|ziu1 jim4 gai1 jik6|chicken wings;garlic;chili;spiced salt
Swiss Sauce Chicken Wings|瑞士雞翼|seoi6 si6 gai1 jik6|chicken wings;sweet soy sauce;ginger;star anise
Cola Chicken Wings|可樂雞翼|ho2 lok6 gai1 jik6|chicken wings;cola;soy sauce;ginger
Fermented Bean Curd Chicken Wings|南乳雞翼|naam4 jyu5 gai1 jik6|chicken wings;red fermented bean curd;garlic;rice wine
Steamed Chicken with Black Fungus|雲耳蒸雞|wan4 ji5 zing1 gai1|chicken;black fungus;ginger;scallion
Steamed Chicken with Lily Buds and Black Fungus|金針雲耳蒸雞|gam1 zam1 wan4 ji5 zing1 gai1|chicken;dried lily buds;black fungus;ginger
Sizzling Claypot Chicken|啫啫雞煲|ze1 ze1 gai1 bou1|chicken;ginger;scallion;onion
Sesame Oil Chicken|麻油雞|maa4 jau4 gai1|chicken;sesame oil;ginger;rice wine
Hakka Salt-Baked Chicken|客家鹽焗雞|haak3 gaa1 jim4 guk6 gai1|chicken;coarse salt;sand ginger;scallion oil
Steamed Chicken with Chinese Sausage|臘腸蒸雞|lap6 coeng2 zing1 gai1|chicken;Chinese sausage;shiitake mushrooms;ginger
Braised Duck with Taro|芋頭炆鴨|wu6 tau4 man1 aap3|duck;taro;fermented bean curd;ginger
Eight-Treasure Duck|八寶鴨|baat3 bou2 aap3|whole duck;glutinous rice;lotus seeds;shiitake mushrooms
Duck with Salted Plum Sauce|梅子鴨|mui4 zi2 aap3|duck;salted plums;ginger;rock sugar
Braised Duck with Bitter Melon|涼瓜炆鴨|loeng4 gwaa1 man1 aap3|duck;bitter melon;fermented black beans;garlic`,
});

addGroup({
  category: 'Seafood',
  subcategory: 'Cantonese fish dishes',
  yueKind: '魚鮮菜式',
  presentation: 'presented as one whole steamed or fried fish, a precise fish fillet portion, or a traditional fish casserole as named, on an oval white serving plate',
  rows: `
Steamed Grouper with Ginger and Scallion|清蒸石斑|cing1 zing1 sek6 baan1|whole grouper;ginger;scallion;seasoned soy sauce
Steamed Sea Bass|清蒸鱸魚|cing1 zing1 lou4 jyu4|whole sea bass;ginger;scallion;seasoned soy sauce
Steamed Pomfret with Black Bean Sauce|豉汁蒸䱽魚|si6 zap1 zing1 cong1 jyu4|whole pomfret;fermented black beans;garlic;scallion
Steamed Golden Pomfret|清蒸金䱽|cing1 zing1 gam1 cong1|whole golden pomfret;ginger;scallion;seasoned soy sauce
Steamed Garoupa with Preserved Lemon|鹹檸蒸石斑|haam4 ning4 zing1 sek6 baan1|garoupa;preserved lemon;ginger;scallion
Steamed Fish Head with Black Bean Sauce|豉汁蒸魚頭|si6 zap1 zing1 jyu4 tau4|fish head;fermented black beans;garlic;chili
Steamed Fish Belly with Preserved Mustard|梅菜蒸魚腩|mui4 coi3 zing1 jyu4 naam5|grass carp belly;preserved mustard greens;ginger;soy sauce
Pan-Fried Threadfin with Soy Sauce|醬油煎馬友|zoeng3 jau4 zin1 maa5 jau5|threadfin fish;soy sauce;ginger;scallion
Pan-Fried Pomfret|香煎䱽魚|hoeng1 zin1 cong1 jyu4|whole pomfret;sea salt;ginger;scallion
Deep-Fried Yellow Croaker|酥炸黃花魚|sou1 zaa3 wong4 faa1 jyu4|whole yellow croaker;light flour coating;spiced salt;scallion
Sweet and Sour Whole Fish|松鼠魚|sung1 syu2 jyu4|whole mandarin fish;sweet-and-sour sauce;pine nuts;bell pepper
Grouper Fillet with Sweetcorn Sauce|粟米斑塊|suk1 mai5 baan1 faai3|grouper fillet;sweetcorn;egg;clear stock
Fish Fillet with Black Bean and Peppers|豉椒魚片|si6 ziu1 jyu4 pin2|fish fillet;fermented black beans;bell pepper;onion
Fish Fillet with Chinese Broccoli|芥蘭炒魚片|gaai3 laan4 caau2 jyu4 pin2|fish fillet;Chinese broccoli;ginger;garlic
Fish Fillet with Celery|西芹炒魚片|sai1 kan4 caau2 jyu4 pin2|fish fillet;celery;carrot;ginger
Fish Fillet with Bitter Melon|涼瓜炒魚片|loeng4 gwaa1 caau2 jyu4 pin2|fish fillet;bitter melon;fermented black beans;garlic
Crispy Salt and Pepper Whitebait|香酥椒鹽白飯魚|hoeng1 sou1 ziu1 jim4 baak6 faan6 jyu4|whitebait;light flour coating;garlic;chili
Fried Dace with Salted Black Beans|豆豉鯪魚|dau6 si6 ling4 jyu4|dace fish;fermented black beans;soy oil;ginger
Pan-Fried Dace Fish Cakes with Tangerine Peel|陳皮香煎鯪魚餅|can4 pei4 hoeng1 zin1 ling4 jyu4 beng2|dace fish paste;dried tangerine peel;scallion;water chestnut
Steamed Mud Carp with Black Bean Sauce|豉汁蒸鯇魚|si6 zap1 zing1 waan5 jyu4|mud carp;fermented black beans;garlic;scallion
Steamed Eel with Black Bean Sauce|豉汁蒸白鱔|si6 zap1 zing1 baak6 sin5|freshwater eel;fermented black beans;garlic;chili
Braised Eel with Garlic|蒜子炆白鱔|syun3 zi2 man1 baak6 sin5|freshwater eel;whole garlic cloves;soy sauce;ginger
Salt and Pepper Eel|椒鹽白鱔|ziu1 jim4 baak6 sin5|freshwater eel;light flour coating;garlic;spiced salt
Braised Fish Maw with Shiitake|冬菇炆花膠|dung1 gu1 man1 faa1 gaau1|fish maw;shiitake mushrooms;oyster sauce;ginger
Fish Maw with Sweetcorn Sauce|粟米魚肚羹|suk1 mai5 jyu4 tou5 gang1|fish maw;sweetcorn;egg;clear stock`,
});

addGroup({
  category: 'Seafood',
  subcategory: 'Shellfish and cephalopod dishes',
  yueKind: '海鮮菜式',
  presentation: 'served as a single restaurant portion with shells, tentacles, or medallions naturally arranged and the named wok sauce or steamed garnish clearly visible',
  rows: `
Steamed Garlic Prawns|蒜蓉蒸大蝦|syun3 jung4 zing1 daai6 haa1|whole prawns;garlic;scallion;soy sauce
Salt and Pepper Prawns|椒鹽大蝦|ziu1 jim4 daai6 haa1|whole prawns;garlic;chili;spiced salt
Soy Sauce King Prawns|豉油王煎蝦|si6 jau4 wong4 zin1 haa1|whole prawns;premium soy sauce;scallion;ginger
Typhoon Shelter Prawns|避風塘炒蝦|bei6 fung1 tong4 caau2 haa1|whole prawns;fried garlic;chili;fermented black beans
Prawns with Scrambled Egg|滑蛋炒蝦仁|waat6 daan2 caau2 haa1 jan4|peeled prawns;eggs;scallion;sesame oil
Prawns with Cashew Nuts|腰果蝦仁|jiu1 gwo2 haa1 jan4|peeled prawns;cashews;celery;bell pepper
Prawns with XO Sauce|XO醬炒蝦球|ik1 sou1 zoeng3 caau2 haa1 kau4|peeled prawns;XO sauce;bell pepper;asparagus
Steamed Scallops with Garlic and Vermicelli|蒜蓉粉絲蒸帶子|syun3 jung4 fan2 si1 zing1 daai3 zi2|scallops in shells;garlic;glass vermicelli;scallion
Scallops with Broccoli|西蘭花炒帶子|sai1 laan4 faa1 caau2 daai3 zi2|scallops;broccoli;ginger;garlic
Scallops with Black Bean Sauce|豉汁炒帶子|si6 zap1 caau2 daai3 zi2|scallops;fermented black beans;bell pepper;onion
Steamed Razor Clams with Garlic|蒜蓉蒸聖子|syun3 jung4 zing1 sing3 zi2|razor clams;garlic;glass vermicelli;scallion
Razor Clams with Black Bean and Chili|豉椒炒聖子|si6 ziu1 caau2 sing3 zi2|razor clams;fermented black beans;bell pepper;chili
Clams with Black Bean Sauce|豉椒炒蜆|si6 ziu1 caau2 hin2|clams;fermented black beans;bell pepper;onion
Typhoon Shelter Crab|避風塘炒蟹|bei6 fung1 tong4 caau2 haai5|crab;fried garlic;chili;fermented black beans
Ginger Scallion Crab|薑蔥炒蟹|goeng1 cung1 caau2 haai5|crab;ginger;scallion;rice wine
Steamed Flower Crab|清蒸花蟹|cing1 zing1 faa1 haai5|flower crab;ginger;scallion;rice wine
Salt and Pepper Squid|椒鹽鮮魷|ziu1 jim4 sin1 jau4|squid;garlic;chili;spiced salt
Squid with Black Bean and Peppers|豉椒炒鮮魷|si6 ziu1 caau2 sin1 jau4|squid;fermented black beans;bell pepper;onion
Cuttlefish with Celery|西芹炒花枝|sai1 kan4 caau2 faa1 zi1|cuttlefish;celery;carrot;ginger
Steamed Oysters with Black Bean Sauce|豉汁蒸生蠔|si6 zap1 zing1 saang1 hou4|oysters;fermented black beans;garlic;scallion`,
});

addGroup({
  category: 'Tofu and vegetables',
  subcategory: 'Bean curd and vegetable dishes',
  yueKind: '豆腐或蔬菜菜式',
  presentation: 'served as one colorful family-style vegetable or tofu portion on white ceramic tableware, with natural greens, sauce sheen, and intact ingredient shapes',
  rows: `
Mapo Tofu, Hong Kong Style|港式麻婆豆腐|gong2 sik1 maa4 po4 dau6 fu6|soft tofu;minced pork;chili bean paste;scallion
Braised Tofu with Mushrooms|紅燒豆腐|hung4 siu1 dau6 fu6|fried tofu;shiitake mushrooms;soy sauce;bok choy
Salt and Pepper Tofu|椒鹽豆腐|ziu1 jim4 dau6 fu6|firm tofu;garlic;chili;spiced salt
Steamed Stuffed Tofu|蒸釀豆腐|zing1 joeng6 dau6 fu6|tofu;minced pork;dace fish paste;soy sauce
Hakka Pan-Fried Stuffed Tofu|客家煎釀豆腐|haak3 gaa1 zin1 joeng6 dau6 fu6|tofu;minced pork;salted fish;soy sauce
Tofu with Minced Pork|肉碎扒豆腐|juk6 seoi3 paa4 dau6 fu6|silken tofu;minced pork;soy sauce;scallion
Home-Style Tofu|家常豆腐|gaa1 soeng4 dau6 fu6|fried tofu;wood ear mushrooms;bell pepper;chili bean sauce
Seafood Tofu Pot|海鮮豆腐煲|hoi2 sin1 dau6 fu6 bou1|tofu;prawns;scallops;squid
Buddha's Delight|羅漢齋|lo4 hon3 zaai1|shiitake mushrooms;bamboo shoots;black fungus;fried tofu
Braised Wheat Gluten with Mushrooms|冬菇炆麵筋|dung1 gu1 man1 min6 gan1|wheat gluten;shiitake mushrooms;bamboo shoots;soy sauce
Stir-Fried Gai Lan with Garlic|蒜蓉炒芥蘭|syun3 jung4 caau2 gaai3 laan4|Chinese broccoli;garlic;rice wine;oil
Gai Lan with Oyster Sauce|蠔油芥蘭|hou4 jau4 gaai3 laan4|Chinese broccoli;oyster sauce;ginger;sesame oil
Stir-Fried Choy Sum with Garlic|蒜蓉炒菜心|syun3 jung4 caau2 coi3 sam1|choy sum;garlic;rice wine;oil
Choy Sum with Preserved Bean Curd|南乳菜心|naam4 jyu5 coi3 sam1|choy sum;red fermented bean curd;garlic;rice wine
Water Spinach with Fermented Bean Curd|腐乳通菜|fu6 jyu5 tung1 coi3|water spinach;fermented bean curd;garlic;chili
Water Spinach with Shrimp Paste|蝦醬通菜|haa1 zoeng3 tung1 coi3|water spinach;shrimp paste;garlic;chili
Braised Lettuce with Dried Scallop|瑤柱扒生菜|jiu4 cyu5 paa4 saang1 coi3|Chinese lettuce;dried scallop;superior stock;ginger
Stir-Fried Pea Shoots with Garlic|蒜蓉炒豆苗|syun3 jung4 caau2 dau6 miu4|pea shoots;garlic;rice wine;oil
Yu Xiang Eggplant|魚香茄子|jyu4 hoeng1 ke2 zi2|Chinese eggplant;minced pork;chili bean sauce;garlic
Salted Fish Eggplant Pot|鹹魚茄子煲|haam4 jyu4 ke2 zi2 bou1|Chinese eggplant;Cantonese salted fish;minced pork;ginger`,
});

addGroup({
  category: 'Claypot and banquet',
  subcategory: 'Claypot and banquet dishes',
  yueKind: '煲仔或宴會菜式',
  presentation: 'presented in one traditional dark claypot, lidded winter-melon vessel, or formal banquet platter as appropriate, with the named premium ingredients clearly identifiable',
  rows: `
Claypot Rice with Chinese Sausage|臘腸臘肉煲仔飯|laap6 coeng2 laap6 juk6 bou1 zai2 faan6|jasmine rice;Chinese sausage;preserved pork belly;seasoned soy sauce
Claypot Rice with Chicken and Shiitake|冬菇滑雞煲仔飯|dung1 gu1 waat6 gai1 bou1 zai2 faan6|jasmine rice;chicken;shiitake mushrooms;ginger
Claypot Rice with Black Bean Pork Ribs|豉汁排骨煲仔飯|si6 zap1 paai4 gwat1 bou1 zai2 faan6|jasmine rice;pork ribs;fermented black beans;garlic
Claypot Rice with Salted Fish and Pork Patty|薑香鹹魚肉餅煲仔飯|goeng1 hoeng1 haam4 jyu4 juk6 beng2 bou1 zai2 faan6|jasmine rice;minced pork;Cantonese salted fish;ginger
Claypot Beef Brisket|牛腩煲|ngau4 naam5 bou1|beef brisket;daikon;Chu Hou sauce;star anise
Claypot Lamb Brisket|羊腩煲|joeng4 naam5 bou1|lamb brisket;water chestnut;fermented bean curd;dried tofu skin
Claypot Fish Head with Eggplant|魚頭茄子煲|jyu4 tau4 ke2 zi2 bou1|fish head;Chinese eggplant;fermented black beans;ginger
Claypot Oysters with Roast Pork|火腩生蠔煲|fo2 naam5 saang1 hou4 bou1|oysters;crispy roast pork;ginger;scallion
Claypot Tofu with Eggplant|茄子豆腐煲|ke2 zi2 dau6 fu6 bou1|Chinese eggplant;tofu;shiitake mushrooms;soy sauce
Claypot Vermicelli with Dried Shrimp|蝦乾粉絲煲|haa1 gon1 fan2 si1 bou1|glass vermicelli;dried shrimp;Chinese celery;garlic
Sea Cucumber and Fish Maw Pot|花膠海參煲|faa1 gaau1 hoi2 sam1 bou1|fish maw;sea cucumber;shiitake mushrooms;oyster sauce
Braised Abalone with Shiitake|冬菇炆鮑魚|dung1 gu1 man1 baau1 jyu4|abalone;shiitake mushrooms;oyster sauce;bok choy
Braised Sea Cucumber with Mushrooms|北菇海參|bak1 gu1 hoi2 sam1|sea cucumber;shiitake mushrooms;oyster sauce;bok choy
Braised Goose Web with Mushrooms|北菇炆鵝掌|bak1 gu1 man1 ngo4 zoeng2|goose feet;shiitake mushrooms;oyster sauce;ginger
Braised Pork Knuckle with Lettuce|生菜炆豬手|saang1 coi3 man1 zyu1 sau2|pork knuckle;Chinese lettuce;red fermented bean curd;ginger
Eight-Treasure Winter Melon|八寶冬瓜盅|baat3 bou2 dung1 gwaa1 zung1|whole winter melon;diced chicken;dried scallop;lotus seeds
Glutinous Rice-Stuffed Chicken|糯米釀雞|no6 mai5 joeng6 gai1|whole chicken;glutinous rice;shiitake mushrooms;Chinese sausage
Golden Fried Stuffed Crab Claws|百花炸蟹拑|baak3 faa1 zaa3 haai5 kim4|crab claws;shrimp paste;light batter;sesame
Braised Dried Oysters with Black Moss|髮菜蠔豉|faat3 coi3 hou4 si6|dried oysters;black moss;shiitake mushrooms;oyster sauce
Hong Kong Poon Choi|香港盆菜|hoeng1 gong2 pun4 coi3|roast pork;prawns;daikon;dried oysters`,
});

addGroup({
  category: 'Soup',
  subcategory: 'Cantonese soups and thick soups',
  yueKind: '老火湯或羹',
  presentation: 'served as one steaming portion in a deep white Chinese soup bowl or double-boiled tureen, with a clear view of the characteristic ingredients and broth texture',
  rows: `
Old Cucumber Pork Bone Soup|老黃瓜煲豬骨|lou5 wong4 gwaa1 bou1 zyu1 gwat1|old cucumber;pork bones;red dates;dried scallops
Watercress Pork Rib Soup|西洋菜煲豬骨|sai1 joeng4 coi3 bou1 zyu1 gwat1|watercress;pork ribs;dried figs;sweet almonds
Lotus Root Octopus Pork Soup|蓮藕章魚豬骨湯|lin4 ngau5 zoeng1 jyu4 zyu1 gwat1 tong1|lotus root;dried octopus;pork bones;peanuts
Winter Melon Barley Pork Soup|冬瓜薏米豬骨湯|dung1 gwaa1 ji3 mai5 zyu1 gwat1 tong1|winter melon;pearl barley;pork bones;dried scallop
Carrot Corn Pork Bone Soup|紅蘿蔔粟米豬骨湯|hung4 lo4 baak6 suk1 mai5 zyu1 gwat1 tong1|carrot;sweetcorn;pork bones;dried figs
Chayote Pork Bone Soup|合掌瓜豬骨湯|hap6 zoeng2 gwaa1 zyu1 gwat1 tong1|chayote;pork bones;carrot;dried dates
Dried Vegetable Pork Lung Soup|菜乾豬肺湯|coi3 gon1 zyu1 fai3 tong1|dried bok choy;pork lung;almonds;dried dates
Apple Pear Fig Lean Pork Soup|蘋果雪梨無花果瘦肉湯|ping4 gwo2 syut3 lei4 mou4 faa1 gwo2 sau3 juk6 tong1|apple;Asian pear;dried figs;lean pork
Papaya Fish Tail Soup|木瓜魚尾湯|muk6 gwaa1 jyu4 mei5 tong1|green papaya;fish tail;ginger;tofu
Watercress Snakehead Fish Soup|西洋菜生魚湯|sai1 joeng4 coi3 saang1 jyu4 tong1|watercress;snakehead fish;ginger;dried dates
Fish Head Tofu Soup|魚頭豆腐湯|jyu4 tau4 dau6 fu6 tong1|fish head;tofu;ginger;scallion
West Lake Beef Soup|西湖牛肉羹|sai1 wu4 ngau4 juk6 gang1|minced beef;egg white;cilantro;clear stock
Hot and Sour Soup|酸辣湯|syun1 laat6 tong1|pork;tofu;bamboo shoots;black vinegar
Sweetcorn Chicken Soup|粟米雞茸羹|suk1 mai5 gai1 jung4 gang1|minced chicken;sweetcorn;egg;clear stock
Crab Meat Fish Maw Soup|蟹肉魚肚羹|haai5 juk6 jyu4 tou5 gang1|crab meat;fish maw;egg;superior stock
Dried Scallop Winter Melon Soup|瑤柱冬瓜羹|jiu4 cyu5 dung1 gwaa1 gang1|winter melon;dried scallop;egg white;superior stock
Grand Tutor Five-Snake Soup|太史五蛇羹|taai3 si2 ng5 se4 gang1|snake meat;chicken;shiitake mushrooms;dried citrus peel
Double-Boiled Ginseng Silkie Chicken Soup|花旗參燉竹絲雞|faa1 kei4 sam1 deon6 zuk1 si1 gai1|silkie chicken;American ginseng;goji berries;red dates
Double-Boiled Quail with Chinese Herbs|淮杞燉鵪鶉|waai4 gei2 deon6 am1 ceon1|quail;Chinese yam;goji berries;red dates
Monk Fruit Lean Pork Soup|羅漢果瘦肉湯|lo4 hon3 gwo2 sau3 juk6 tong1|monk fruit;lean pork;dried dates;sweet almonds`,
});

addGroup({
  category: 'Noodles',
  subcategory: 'Hong Kong noodle dishes',
  yueKind: '粉麵菜式',
  presentation: 'served as one authentic noodle bowl or wok-fried noodle plate, with the correct noodle type, broth or gravy, protein, and restrained garnish visible',
  rows: `
Wonton Noodles|雲吞麵|wan4 tan1 min6|egg noodles;shrimp wontons;clear broth;yellow chives
Shrimp Roe Tossed Noodles|蝦子撈麵|haa1 zi2 lou1 min6|egg noodles;dried shrimp roe;oyster sauce;scallion
Beef Brisket Noodles|牛腩麵|ngau4 naam5 min6|egg noodles;braised beef brisket;clear broth;daikon
Beef Offal Noodles|牛雜麵|ngau4 zaap6 min6|egg noodles;beef tripe;beef intestine;master broth
Fish Ball Noodles|魚蛋麵|jyu4 daan2 min6|egg noodles;fish balls;clear broth;scallion
Dace Fish Ball Noodles|鯪魚球麵|ling4 jyu4 kau4 min6|egg noodles;dace fish balls;clear broth;Chinese celery
Roast Goose Lai Fun|燒鵝瀨粉|siu1 ngo4 laai6 fan2|thick rice noodles;roast goose;clear broth;gai lan
Char Siu Soup Noodles|叉燒湯麵|caa1 siu1 tong1 min6|egg noodles;char siu;clear broth;choy sum
Soy Sauce Chicken Noodles|豉油雞麵|si6 jau4 gai1 min6|egg noodles;soy sauce chicken;clear broth;gai lan
Braised Pork Knuckle Noodles|豬手麵|zyu1 sau2 min6|egg noodles;braised pork knuckle;master broth;choy sum
Dry-Fried Beef Ho Fun|乾炒牛河|gon1 caau2 ngau4 ho4|wide rice noodles;sliced beef;bean sprouts;Chinese chives
Beef Ho Fun with Gravy|濕炒牛河|sap1 caau2 ngau4 ho4|wide rice noodles;sliced beef;gai lan;savory gravy
Fish Fillet Ho Fun Soup|魚片湯河|jyu4 pin2 tong1 ho4|wide rice noodles;fish fillet;clear broth;scallion
Singapore Fried Rice Vermicelli|星洲炒米|sing1 zau1 caau2 mai5|rice vermicelli;char siu;prawns;curry powder
Amoy Fried Rice Vermicelli|廈門炒米|haa6 mun4 caau2 mai5|rice vermicelli;pork strips;pickled vegetables;tomato sauce
Fried Rice Vermicelli with Shredded Pork|肉絲炒米|juk6 si1 caau2 mai5|rice vermicelli;shredded pork;bean sprouts;scallion
Soy Sauce Supreme Chow Mein|豉油皇炒麵|si6 jau4 wong4 caau2 min6|egg noodles;premium soy sauce;bean sprouts;Chinese chives
Seafood Crispy Noodles|海鮮炒麵|hoi2 sin1 caau2 min6|crispy egg noodles;prawns;scallops;squid
Beef Crispy Noodles|牛肉炒麵|ngau4 juk6 caau2 min6|crispy egg noodles;sliced beef;gai lan;savory gravy
Shredded Pork Crispy Noodles|肉絲炒麵|juk6 si1 caau2 min6|crispy egg noodles;shredded pork;bean sprouts;savory gravy
Braised E-Fu Noodles|乾燒伊麵|gon1 siu1 ji1 min6|E-fu noodles;shiitake mushrooms;yellow chives;oyster sauce
Crab Meat E-Fu Noodles|蟹肉伊麵|haai5 juk6 ji1 min6|E-fu noodles;crab meat;egg white;scallion
Lobster E-Fu Noodles|龍蝦伊麵|lung4 haa1 ji1 min6|E-fu noodles;lobster;ginger;scallion
Satay Beef Instant Noodles|沙嗲牛肉公仔麵|saa1 de1 ngau4 juk6 gung1 zai2 min6|instant noodles;sliced beef;satay sauce;fried egg
Pork Chop Instant Noodles|豬扒公仔麵|zyu1 paa2 gung1 zai2 min6|instant noodles;pan-fried pork chop;fried egg;choy sum`,
});

addGroup({
  category: 'Rice',
  subcategory: 'Hong Kong rice dishes',
  yueKind: '飯類菜式',
  presentation: 'served as one complete Hong Kong rice meal on a white plate, baked dish, or claypot as named, with the rice texture and principal topping clearly visible',
  rows: `
Char Siu Rice|叉燒飯|caa1 siu1 faan6|steamed jasmine rice;char siu;gai lan;soy sauce
Roast Goose Rice|燒鵝飯|siu1 ngo4 faan6|steamed jasmine rice;roast goose;gai lan;plum sauce
Roast Duck Rice|燒鴨飯|siu1 aap3 faan6|steamed jasmine rice;roast duck;gai lan;plum sauce
Crispy Roast Pork Rice|燒肉飯|siu1 juk6 faan6|steamed jasmine rice;crispy roast pork;gai lan;mustard
Soy Sauce Chicken Rice|豉油雞飯|si6 jau4 gai1 faan6|steamed jasmine rice;soy sauce chicken;gai lan;ginger oil
White-Cut Chicken Rice|白切雞飯|baak6 cit3 gai1 faan6|steamed jasmine rice;white-cut chicken;gai lan;ginger scallion oil
Two-Choice Siu Mei Rice|燒味雙拼飯|siu1 mei6 soeng1 ping3 faan6|steamed jasmine rice;char siu;roast duck;gai lan
Beef Brisket Rice|牛腩飯|ngau4 naam5 faan6|steamed jasmine rice;braised beef brisket;daikon;Chu Hou sauce
Curry Beef Brisket Rice|咖喱牛腩飯|gaa3 lei1 ngau4 naam5 faan6|steamed jasmine rice;beef brisket;Hong Kong curry;potato
Pan-Fried Pork Chop Rice|豬扒飯|zyu1 paa2 faan6|steamed jasmine rice;pan-fried pork chop;onion gravy;choy sum
Baked Pork Chop Rice|焗豬扒飯|guk6 zyu1 paa2 faan6|fried rice;pork chop;tomato sauce;cheese
Baked Seafood Rice|焗海鮮飯|guk6 hoi2 sin1 faan6|fried rice;prawns;scallops;creamy white sauce
Baked Portuguese Chicken Rice|葡國雞焗飯|pou4 gwok3 gai1 guk6 faan6|fried rice;chicken;potato;coconut curry sauce
Yangzhou Fried Rice|揚州炒飯|joeng4 zau1 caau2 faan6|rice;char siu;prawns;egg
Salted Fish and Chicken Fried Rice|鹹魚雞粒炒飯|haam4 jyu4 gai1 nap1 caau2 faan6|rice;diced chicken;Cantonese salted fish;egg
Fujian Fried Rice|福建炒飯|fuk1 gin3 caau2 faan6|egg fried rice;prawns;chicken;shiitake gravy
Pineapple Seafood Fried Rice|菠蘿海鮮炒飯|bo1 lo4 hoi2 sin1 caau2 faan6|rice;pineapple;prawns;scallops
Diced Beef Fried Rice|生炒牛肉飯|saang1 caau2 ngau4 juk6 faan6|rice;minced beef;egg;scallion
Shrimp Fried Rice|蝦仁炒飯|haa1 jan4 caau2 faan6|rice;peeled prawns;egg;scallion
Golden Egg Fried Rice|黃金炒飯|wong4 gam1 caau2 faan6|rice;egg yolk;scallion;white pepper
Claypot Rice with Chicken and Salted Fish|鹹魚雞粒煲仔飯|haam4 jyu4 gai1 nap1 bou1 zai2 faan6|jasmine rice;diced chicken;Cantonese salted fish;ginger
Claypot Rice with Eel|白鱔煲仔飯|baak6 sin5 bou1 zai2 faan6|jasmine rice;freshwater eel;fermented black beans;ginger
Claypot Rice with Frog|田雞煲仔飯|tin4 gai1 bou1 zai2 faan6|jasmine rice;frog legs;ginger;scallion
Claypot Rice with Preserved Duck and Sausage|臘鴨臘腸煲仔飯|lap6 aap3 lap6 coeng2 bou1 zai2 faan6|jasmine rice;preserved duck;Chinese sausage;seasoned soy sauce
Claypot Rice with Pork Ribs and Chicken Feet|排骨鳳爪煲仔飯|paai4 gwat1 fung6 zaau2 bou1 zai2 faan6|jasmine rice;pork ribs;chicken feet;fermented black beans
Steamed Pork Patty Rice|肉餅蒸飯|juk6 beng2 zing1 faan6|jasmine rice;minced pork;water chestnut;soy sauce
Steamed Beef Patty Rice|牛肉餅蒸飯|ngau4 juk6 beng2 zing1 faan6|jasmine rice;minced beef;dried tangerine peel;soy sauce
Tomato Beef over Rice|茄牛飯|ke2 ngau4 faan6|steamed jasmine rice;sliced beef;tomato;onion
Fish Fillet Rice with Sweetcorn Sauce|粟米魚塊飯|suk1 mai5 jyu4 faai3 faan6|steamed jasmine rice;fish fillet;sweetcorn;egg
Minced Beef and Raw Egg Rice|窩蛋免治牛肉飯|wo1 daan2 min5 zi6 ngau4 juk6 faan6|steamed jasmine rice;minced beef;raw egg;onion gravy`,
});

const chocolateOverrides = new Map([
  [260, ['Chocolate Lava Egg Tart', '朱古力流心蛋撻', 'zyu1 gu2 lik1 lau4 sam1 daan6 taat1', ['flaky pastry', 'dark chocolate custard', 'egg', 'butter'], 'baked in a fluted tart shell with a glossy molten dark-chocolate center exposed by one clean cut']],
  [280, ['Dark Chocolate Sesame Puff', '黑朱古力芝麻酥', 'hak1 zyu1 gu2 lik1 zi1 maa4 sou1', ['layered pastry', 'dark chocolate ganache', 'black sesame', 'butter'], 'baked as a round laminated puff with black-sesame flecks and a clearly visible dark-chocolate filling']],
  [300, ['Hazelnut Chocolate Crispy Roll', '榛子朱古力脆卷', 'zeon1 zi2 zyu1 gu2 lik1 ceoi3 gyun2', ['wheat wrapper', 'milk chocolate', 'roasted hazelnuts', 'egg wash'], 'fried as slender crisp golden rolls, one opened to reveal a hazelnut-chocolate praline center']],
  [320, ['Salted Caramel Chocolate Puff', '海鹽焦糖朱古力酥', 'hoi2 jim4 ziu1 tong4 zyu1 gu2 lik1 sou1', ['puff pastry', 'dark chocolate', 'salted caramel', 'butter'], 'baked as small domed puffs with delicate laminated layers and one split open to show separate chocolate and caramel ribbons']],
  [340, ['Matcha Chocolate Spring Roll', '抹茶朱古力春卷', 'mut3 caa4 zyu1 gu2 lik1 ceon1 gyun2', ['spring roll wrappers', 'dark chocolate', 'matcha', 'butter'], 'fried as narrow golden spring rolls dusted lightly with matcha, one broken open to reveal molten chocolate']],
  [360, ['Chocolate Almond Butterfly Puff', '朱古力杏仁蝴蝶酥', 'zyu1 gu2 lik1 hang6 jan4 wu4 dip6 sou1', ['puff pastry', 'dark chocolate', 'sliced almonds', 'butter'], 'baked in butterfly-shaped laminated layers with toasted almond edges and a concealed chocolate seam visible in one cut piece']],
  [380, ['Orange Chocolate Fried Parcel', '香橙朱古力炸角', 'hoeng1 caang2 zyu1 gu2 lik1 zaa3 gok3', ['wheat pastry', 'dark chocolate', 'candied orange peel', 'egg wash'], 'fried as triangular blistered pastry parcels, one opened to show dark chocolate studded with fine orange peel']],
  [400, ['Peanut Chocolate Sesame Puff', '花生朱古力芝麻球', 'faa1 saang1 zyu1 gu2 lik1 zi1 maa4 kau4', ['glutinous rice dough', 'milk chocolate', 'roasted peanuts', 'white sesame'], 'fried as round sesame-coated puffs with a crisp shell and one cut open to reveal peanut-chocolate filling']],
  [420, ['Coconut Chocolate Puff', '椰香朱古力酥', 'je4 hoeng1 zyu1 gu2 lik1 sou1', ['shortcrust pastry', 'dark chocolate', 'toasted coconut', 'butter'], 'baked as oval golden puffs with a toasted-coconut crust and a thick chocolate-coconut filling visible in one half']],
  [440, ['Coffee Chocolate Crispy Pillow', '咖啡朱古力脆枕', 'gaa3 fe1 zyu1 gu2 lik1 ceoi3 zam2', ['wheat pastry', 'dark chocolate', 'espresso', 'butter'], 'fried as compact pillow-shaped parcels with bubbled crisp surfaces and an espresso-dark-chocolate center shown in one opened parcel']],
  [460, ['Raspberry Chocolate Fried Wonton', '紅莓朱古力炸雲吞', 'hung4 mui4 zyu1 gu2 lik1 zaa3 wan4 tan1', ['wonton wrappers', 'dark chocolate', 'raspberries', 'egg wash'], 'fried as flower-like wonton parcels, one opened to reveal distinct dark chocolate and bright raspberry filling']],
  [480, ['Black Sesame Chocolate Pinwheel', '黑芝麻朱古力酥卷', 'hak1 zi1 maa4 zyu1 gu2 lik1 sou1 gyun2', ['puff pastry', 'dark chocolate', 'black sesame paste', 'butter'], 'baked as tight pinwheel pastries with alternating black-sesame and chocolate spirals visible across the cut faces']],
  [500, ['White Chocolate Custard Puff', '白朱古力奶皇酥', 'baak6 zyu1 gu2 lik1 naai5 wong4 sou1', ['puff pastry', 'white chocolate', 'Cantonese custard', 'egg'], 'baked as flower-topped golden puffs with one opened to reveal pale white-chocolate custard filling']],
]);

for (const [number, [en, zhHant, jyutping, ingredients, presentation]] of chocolateOverrides) {
  const index = number - 251;
  const id = `hk-dish-${String(number).padStart(4, '0')}`;
  const slug = slugify(en);
  const ingredientList = `${ingredients.slice(0, -1).join(', ')}, and ${ingredients.at(-1)}`;
  const base = { en, zhHant, jyutping, ingredients };
  dishes[index] = {
    id,
    slug,
    name: { en, zhHant },
    jyutping,
    category: 'Chocolate dim sum',
    subcategory: 'Baked and fried chocolate pastries',
    description: {
      en: `${en} is a chocolate-filled Hong Kong dim sum pastry made with ${ingredientList}.`,
      yue: `「${zhHant}」係朱古力餡港式點心，以焗製或炸製酥皮包住獨特餡料。`,
    },
    ingredients,
    dietaryTags: inferDietaryTags(base),
    allergens: inferAllergens(base),
    chocolateFilled: true,
    image: {
      path: `images/${id}-${slug}.png`,
      alt: {
        en: `Close catalog photograph of chocolate-filled ${en} served on Hong Kong restaurant tableware.`,
        yue: `朱古力餡「${zhHant}」用港式餐廳器皿上枱嘅近鏡點心相。`,
      },
    },
    imagePrompt: `Use case: photorealistic-natural\nAsset type: square Hong Kong dim sum catalog image\nPrimary request: ${en} (${zhHant}), a unique chocolate-filled baked or fried Hong Kong dim sum pastry\nScene/backdrop: warm Hong Kong restaurant wooden tabletop\nSubject: exactly one bamboo-steamer-sized serving of ${en}, visibly featuring ${ingredientList}, ${presentation}\nStyle/medium: original photorealistic professional food photography\nComposition/framing: square 1:1 composition, close three-quarter overhead view, one small white ceramic plate centered and fully visible, appetizing natural proportions\nLighting/mood: warm soft restaurant light, realistic highlights and gentle shadows\nMaterials/textures: accurate crisp pastry layers or fried shell, clearly visible chocolate filling, glazed ceramic and subtle wood grain\nConstraints: visibly chocolate-filled; accurate distinct pastry shape and filling; one specified dish only; no people; no hands; no text; no logos; no trademark; no watermark; no menu card; no unrelated side dishes`,
  };
}

if (dishes.length !== 250) throw new Error(`Expected 250 dishes, found ${dishes.length}`);
const ids = new Set(dishes.map((dish) => dish.id));
const slugs = new Set(dishes.map((dish) => dish.slug));
const englishNames = new Set(dishes.map((dish) => dish.name.en));
const chineseNames = new Set(dishes.map((dish) => dish.name.zhHant));
if ([ids, slugs, englishNames, chineseNames].some((set) => set.size !== 250)) {
  throw new Error('Duplicate ID, slug, English name, or Traditional Chinese name detected');
}
fs.writeFileSync(outPath, `${JSON.stringify(dishes, null, 2)}\n`, 'utf8');
console.log(`Wrote ${dishes.length} dishes to ${outPath}`);
