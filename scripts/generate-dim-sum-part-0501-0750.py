import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dim-sum" / "catalog-parts" / "part-0501-0750.json"
JYUTPING_BY_OFFSET = ["gaa3 lei1 jyu4 daan2","gaai1 tau4 jyu4 juk6 siu1 maai2","si6 jau4 lou5 seoi2 mak6 jyu4","laat6 zap1 jyu4 daan2","lo4 baak6 ngau4 zaap6","gaa3 lei1 jau4 jyu2","ceoi3 zaa3 cau3 dau6 fu6","zin1 joeng6 saam1 bou2","jyun4 mei6 gai1 daan6 zai2","hung4 dau2 gai1 daan6 zai2","zyu1 gu1 lik1 gai1 daan6 zai2","mut3 caa4 gai1 daan6 zai2","mak6 ngaa4 tong2 gaap3 beng2","lung4 sou1 tong2","tong4 caau2 leot6 zi2","ngau4 jau4 suk1 mai5 bui1","jim4 guk6 am1 ceon1 daan2","taan3 haau1 jau4 jyu2 gon1","hoeng1 gong2 gaai1 tau4 faa1 sang1 no6 mai5 ci4","haau2 haak1 lik6 je4 si1 no6 mai5 ci4","hoeng1 gong2 gaai1 tau4 hung4 dau2 but6 zai2 gou1","hoeng1 gong2 gaai1 tau4 baak6 tong4 gou1","doi6 zai2 laang5 min6","gaai1 bin1 coeng2 fan2","gaa3 lei1 zyu1 pei4","daai6 paai2 dong3 sik1 gon1 caau2 ngau4 ho2","daai6 paai2 dong3 sik1 si6 ziu1 caau2 hin2","daai6 paai2 dong3 sik1 bei6 fung1 tong4 caau2 haai5","daai6 paai2 dong3 sik1 ziu1 jim4 sin1 jau4","gong2 sik1 gu4 lu4 juk6","fu6 jyu5 caau2 tung1 coi3","leng4 jyu2 kau4 caau2 gaai3 laan2","waat6 daan2 haa1 jan4","daai6 paai2 dong3 sik1 si6 jau4 wong4 zin1 haa1","hak1 ziu1 ngau4 lau5 nap1","daai6 paai2 dong3 sik1 ziu1 jim4 zyu1 paa2","daai6 paai2 dong3 sik1 ceoi3 pei2 zaa3 daai6 coeng2","ciu4 zau1 hou4 beng2","daai6 paai2 dong3 sik1 si6 ziu1 caau2 sing3 zi2","haau2 haak1 lik6 lau4 sam1 fung1 caau4 wu6 gok2","goeng1 cung1 jyu4 tau4 bou1","haam4 jyu2 gai1 nap1 dau6 fu6 bou1","lo4 baak6 ngau4 naam5 bou1","daai6 paai2 dong3 bou1 zai2 haam4 jyu2 ke2 zi2 bou1","saa1 de1 hoi2 sin1 fan2 si1 bou1","soeng6 tong1 faa1 diu1 zam3 hin2","syun3 jung4 fan2 si1 zing1 sin3 bui3","syun3 hoeng1 ceoi3 pei2 gai1","daai6 paai2 dong3 sik1 ziu1 jim4 dau6 fu6","haa1 zoeng3 zing1 zyu1 naam5","caa4 gei3 guk6 zyu1 paa2 faan6","caa4 gei3 guk6 hoi2 sin1 faan6","pou4 zap1 guk6 gai1 faan6","guk6 ngau4 lei6 ji3 fan2","seoi6 si6 gai1 jik6 faan6","faan1 ke2 ngau4 juk6 faan6","suk1 mai5 zap1 jyu4 lau5 faan6","hak1 ziu1 zyu1 paa2 faan6","caa4 gei3 gaa3 lei1 ngau4 naam5 faan6","haau2 haak1 lik6 lau4 sam1 zin1 deoi1","caa4 gei3 joeng4 zau1 caau2 faan6","gong2 sik1 fuk1 gin3 caau2 faan6","caa4 gei3 haam4 jyu2 gai1 nap1 caau2 faan6","bo1 lo4 gai1 nap1 caau2 faan6","caa4 gei3 sing1 zau1 caau2 mai5","haa6 mun4 caau2 mai5","caa4 gei3 si6 jau4 wong4 caau2 min6","ngau4 naam5 wan4 tan1 min6","caa4 gei3 saa1 de1 ngau4 juk6 gung1 zai2 min6","caan1 juk6 zin1 daan2 gung1 zai2 min6","sin1 ke2 tung1 fan2","fo2 teoi2 tung1 fan2","lo4 sung3 tong1 ngau4 juk6 tung1 fan2","caa4 gei3 zoeng3 caau2 coeng2 fan2","waat6 daan2 caa1 siu1 faan6","gong2 sik1 sai1 do1 si2","faa1 sang1 zoeng3 sai1 do1 si2","gaa3 jaang1 sai1 do1 si2","o1 waa4 tin4 sai1 do1 si2","haau2 haak1 lik6 lau4 sam1 gai1 daan6 zai2","caan1 juk6 daan2 zi6","fo2 teoi2 daan2 zi6","gung1 si1 saam1 man4 zi6","jyu4 lau5 baau1","bo1 lo4 jau4","caau2 daan2 do1 si2","naai5 zoeng3 do1 si2","naai5 jau4 do1 si2","saa1 tong4 ngau4 jau4 do1 si2","zyu1 paa2 baau1","saa1 de1 ngau4 juk6 baau1","saa1 de1 ngau4 juk6 min6 pui3 zin1 daan2","gong2 sik1 cyun4 jat6 zou2 caan1","faa1 sang1 zoeng3 hau5 do1 si2","hak1 zi1 maa4 sai1 do1 si2","faan1 ke2 daan2 zi6","tan1 naa4 jyu2 saam1 man4 zi6","saa1 din1 jyu2 saam1 man4 zi6","caan1 juk6 ngau4 gok3 baau1","haau2 haak1 lik6 lau4 sam1 maa5 laai1 gou1","gong2 sik1 beng2 dim3 bo1 lo4 baau1","gong2 sik1 beng2 dim3 gai1 mei5 baau1","mak6 sai1 go1 baau1","gong2 sik1 beng2 dim3 coeng2 zai2 baau1","fo2 teoi2 daan2 baau1","tan1 naa4 jyu2 saa1 leot2 baau1","je4 taat1","gong2 sik1 beng2 dim3 sou1 pei2 daan6 taat1","ngau4 jau4 pei4 daan6 taat1","zi2 baau1 daan6 gou1","wan6 nei1 laa2 seoi6 si6 gyun2","gaa3 fe1 seoi6 si6 gyun2","hak1 zi1 maa4 seoi6 si6 gyun2","ngau4 jau4 gei6 lim1 gok3","gong2 sik1 beng2 dim3 lou5 po4 beng2","lou5 gung1 beng2","pei4 daan2 sou1","hung4 dau2 sou1","gong2 sik1 beng2 dim3 lin4 jung4 sou1","haau2 haak1 lik6 lau4 sam1 daan2 wong2 sou1","gong2 sik1 beng2 dim3 hap6 tou4 sou1","gong2 sik1 beng2 dim3 hang6 jan4 beng2","zi1 maa4 ceoi3 beng2","wu4 dip2 sou1","gong2 sik1 saa1 kei4 maa5","hoeng1 gong2 tim4 ban2 pou3 joeng4 zi1 gam1 lou6","hoeng1 gong2 tong4 seoi2 pou2 zi1 maa4 wu2","hoeng1 gong2 tong4 seoi2 pou2 hap6 tou4 wu4","daan2 baak2 hang6 jan4 caa4","hoeng1 gong2 tong4 seoi2 pou2 can4 pei4 hung4 dau6 saa1","hoeng1 gong2 tong4 seoi2 pou2 hoi2 daai3 luk6 dau6 saa1","goeng1 zap1 faan1 syu2 tong4 seoi2","je4 zap1 wu6 tau2 sai1 mai5 lou6","muk6 gwaa1 syut3 ji5 tong4 seoi2","lin4 zi2 baak3 hap6 tong4 seoi2","je4 zap1 zi2 mai5 lou6","gong2 sik1 dau6 fu6 faa1","hoeng1 gong2 tong4 seoi2 pou2 goeng1 zap1 zong6 naai5","soeng1 pei4 naai5","haau2 haak1 lik6 goeng1 zap1 naai5 no6 mai5 ci4","gong2 sik1 mong1 gwo2 bou3 din1","sap6 gwo2 loeng4 fan2","mong1 gwo2 sai1 mai5 loeng4 fan2","hoeng1 gong2 tong4 seoi2 pou2 je4 zap1 sai1 mai5 lou6","hak1 zi1 maa4 tong1 jyun2","faa1 sang1 tong1 jyun2","fu6 zuk1 gai1 daan2 tong4 seoi2","syut3 ji5 dan6 syut3 lei4","baak6 gwo2 ji3 mai5 fu6 zuk1 tong4 seoi2","song1 gei3 sang1 lin4 zi2 daan2 caa4","hoeng1 gong2 jing3 zit3 hoeng1 zin1 lo4 baak6 gou1","hoeng1 gong2 jing3 zit3 hoeng1 zin1 wu6 tau2 gou1","hoeng1 gong2 jing3 zit3 maa5 tai2 gou1","hung4 tong4 nin4 gou1","je4 zap1 nin4 gou1","hoeng1 gong2 jing3 zit3 hung4 zou2 gou1","cyun4 tung2 faat3 gou1","hoeng1 gong2 jing3 zit3 zin1 deoi1","siu3 hau2 zou2","haau2 haak1 lik6 ho6 nin4 jau4 gok3","faa1 sang1 gok3 zai2","ho4 jip6 faan6","haam4 juk6 daan2 wong2 zung2","gaan2 seoi2 zung2","dau6 saa1 gaan2 seoi2 zung2","soeng1 wong4 baak6 lin4 jung4 jyut6 beng2","can4 pei4 dau6 saa1 jyut6 beng2","ng5 jan4 jyut6 beng2","mong1 gwo2 bing1 pei2 jyut6 beng2","mai4 nei5 lau4 sam1 naai5 wong4 jyut6 beng2","hung4 dau6 saa1 tong1 jyun2","leoi4 saa1 tong1 jyun2","hoeng1 gong2 zit3 hing3 gong2 sik1 pun4 coi3","faa3 pei4 jyu5 zyu1","faat3 coi3 hou4 si2","gong2 sik1 naai5 caa4","jyun1 joeng1","dung3 ning2 caa4","ning4 mung1 seoi2","haau2 haak1 lik6 lau4 sam1 but6 zai2 gou1","gong2 sik1 hung4 dau2 bing1","haak1 ngau2","haam4 ning2 cat1","dung3 ning2 lok6","jit6 ning2 lok6 bou1 goeng1","ning2 ban1","hou2 laap6 hak1","o1 waa4 tin4","caa4 gei3 jit6 zyu1 gu1 lik1","gong2 sik1 hang6 soeng1","sin1 dau6 zoeng1","sin1 zaa3 ze3 zap1","dung1 gwaa1 caa4","guk1 faa1 caa4","syun1 mui4 tong1","sai1 joeng4 coi3 mat6","bo1 lo4 bing1","loeng4 fan2 syut3 gou1 bing1","haam4 gam1 gat1 mat6","haau2 haak1 lik6 lau4 sam1 fei1 lam2 gyun2","saan1 zaa1 beng2","ding1 ding1 tong2","mak6 ngaa4 tong2 beng2","je4 zi2 tong4","faa1 sang1 tong4","zi1 maa4 tong4","lou5 goeng1 tong4","syun1 waa3 mui4","gam1 cou2 laam2","can4 pei4 mui2","ning2 zap1 goeng1","jau4 jyu2 si1","jyu4 pei4 faa1 sang1","naam4 jyu5 faa1 sang1","tong4 waan4","ngau4 ji5 zai2","hoeng1 ceoi3 maa4 faa1","mai4 nei5 gai1 daan6 beng2","cat1 coi2 tong4 zyu1 beng2","haau2 haak1 lik6 je4 si1 syut3 kau4","hak1 zi1 maa4 fei1 lam2 gyun2","tong4 bat1 lat1","wong4 tong4 but6 zai2 gou1","no6 mai5 joeng6 gai1 jik6","ceoi3 zaa3 jyu2 pei4","ming4 lou4 siu1 ngo2","hoeng1 gong2 siu1 mei2 dim3 mat6 zap1 caa1 siu1","hoeng1 gong2 siu1 mei2 dim3 ceoi3 pei2 siu1 juk6","hoeng1 gong2 siu1 mei2 dim3 si6 jau4 gai1","hoeng1 gong2 siu1 mei2 dim3 baak6 cit3 gai1","ming4 lou4 siu1 aap3","siu1 mei2 saam1 bou2 faan6","siu1 mei2 sei3 bou2 faan6","hoeng1 gong2 bou1 zai2 faan6 dim3 laap6 mei2 bou1 zai2 faan6","hoeng1 gong2 bou1 zai2 faan6 dim3 bak1 gu1 waat6 gai1 bou1 zai2 faan6","hoeng1 gong2 bou1 zai2 faan6 dim3 si6 zap1 paai4 gwat1 bou1 zai2 faan6","wong4 sin5 bou1 zai2 faan6","haam4 daan2 ngau4 juk6 beng2 bou1 zai2 faan6","hoeng1 gong2 bou1 zai2 faan6 dim3 haam4 jyu2 juk6 beng2 bou1 zai2 faan6","haau2 haak1 lik6 lau4 sam1 mai4 nei5 jyut6 beng2","hoeng1 gong2 zuk1 dim3 zyu1 jeon2 zuk1","waat6 ngau2 zuk1","hoeng1 gong2 zuk1 dim3 jyu4 naam5 zuk1","hoeng1 gong2 zuk1 dim3 pei4 daan2 sau3 juk6 zuk1","gong2 sik1 jau4 zaa3 gwai2","hoeng1 gong2 gaai1 tau4 zaa3 loeng2","cyu5 hau4 ngau4 naam5 min6","gong2 sik1 jyu4 daan2 min6","caa4 gei3 siu1 ngo2 faan6","caa1 siu1 siu1 juk6 faan6"]


DATA = r"""
Curry Fish Balls|咖喱魚蛋|Street Food|Street Snack|fish balls,curry sauce,radish|pescatarian|golden fish balls and radish pieces in thick curry sauce served in a paper cup|a stainless-steel Hong Kong street-food counter
Street-Style Fish Siu Mai|街頭魚肉燒賣|Street Food|Street Snack|fish paste,wheat wrappers,soy sauce,chilli oil|pescatarian|yellow open-topped fish siu mai in a shallow paper tray with soy sauce and chilli oil|a stainless-steel Hong Kong street-food counter
Soy-Braised Cuttlefish|豉油滷水墨魚|Street Food|Street Snack|cuttlefish,soy sauce,star anise,ginger|pescatarian|glossy sliced cuttlefish tentacles in dark aromatic master stock|a stainless-steel Hong Kong street-food counter
Chilli Fish Balls|辣汁魚蛋|Street Food|Street Snack|fish balls,chilli sauce,garlic,soy sauce|pescatarian|springy fish balls coated in a bright savoury chilli sauce|a stainless-steel Hong Kong street-food counter
Braised Beef Offal|蘿蔔牛雜|Street Food|Street Snack|beef tripe,beef intestine,beef lung,radish,chu hou sauce|meat|mixed beef offal and radish cut into bite-size pieces in a rich brown broth|a stainless-steel Hong Kong street-food counter
Curry Squid|咖喱魷魚|Street Food|Street Snack|squid,curry sauce,onion,radish|pescatarian|scored squid pieces and radish bathed in fragrant yellow curry|a stainless-steel Hong Kong street-food counter
Crisp Fried Stinky Tofu|脆炸臭豆腐|Street Food|Street Snack|fermented tofu,wheat flour,chilli sauce,hoisin sauce|vegan|deep-fried tofu cubes with a craggy golden crust and two sauces on the side|a tiled Hong Kong street-food stall
Pan-Fried Stuffed Three Treasures|煎釀三寶|Street Food|Street Snack|eggplant,green pepper,tofu,fish paste,soy sauce|pescatarian|fish-paste-stuffed eggplant green pepper and tofu seared in a shallow metal tray|a tiled Hong Kong street-food stall
Classic Egg Waffles|原味雞蛋仔|Street Food|Street Snack|wheat flour,egg,evaporated milk,sugar|vegetarian|a freshly baked bubble waffle with crisp round shells and a tender centre|a compact Hong Kong egg-waffle stall
Red Bean Egg Waffles|紅豆雞蛋仔|Street Food|Street Snack|wheat flour,egg,evaporated milk,red beans,sugar|vegetarian|a bubble waffle studded with soft sweetened red beans|a compact Hong Kong egg-waffle stall
Chocolate Egg Waffles|朱古力雞蛋仔|Street Food|Street Snack|wheat flour,egg,milk,cocoa,sugar|vegetarian|a cocoa-brown bubble waffle with evenly formed crisp bubbles|a compact Hong Kong egg-waffle stall
Matcha Egg Waffles|抹茶雞蛋仔|Street Food|Street Snack|wheat flour,egg,milk,matcha,sugar|vegetarian|a pale green matcha bubble waffle with crisp rounded cells|a compact Hong Kong egg-waffle stall
Maltose Cracker Sandwich|麥芽糖夾餅|Street Food|Street Snack|maltose syrup,plain crackers|vegan|two plain square crackers sandwiching a thick amber ribbon of maltose|a nostalgic Hong Kong street-snack cart
Dragon Beard Candy|龍鬚糖|Street Food|Street Snack|maltose,peanut,sesame,coconut|vegetarian|delicate white sugar threads wrapped around a crumbly nutty filling|a nostalgic Hong Kong street-snack cart
Sugar-Roasted Chestnuts|糖炒栗子|Street Food|Street Snack|chestnuts,sugar|vegan|split glossy chestnuts nestled among dark roasting pebbles in a paper bag|a nostalgic Hong Kong street-snack cart
Butter Corn Cup|牛油粟米杯|Street Food|Street Snack|sweet corn,butter,salt|vegetarian|steaming yellow corn kernels glossed with melted butter in a paper cup|a compact Hong Kong street-food kiosk
Salt-Baked Quail Eggs|鹽焗鵪鶉蛋|Street Food|Street Snack|quail eggs,coarse salt,five-spice|vegetarian|speckled quail eggs partially peeled and nestled in warm coarse salt|a nostalgic Hong Kong street-snack cart
Grilled Dried Squid|炭烤魷魚乾|Street Food|Street Snack|dried squid,soy sauce,maltose|pescatarian|flattened dried squid with curled edges and charcoal grill marks|a compact Hong Kong night-market grill
Peanut Glutinous Rice Dumpling|花生糯米糍|Street Food|Street Snack|glutinous rice flour,peanut,sugar,coconut|vegetarian|soft white rice dumplings rolled in crushed peanuts and coconut|a nostalgic Hong Kong street-snack cart
Chocolate Coconut Mochi|巧克力椰絲糯米糍|Street Food|Street Snack|glutinous rice flour,dark chocolate ganache,coconut,sugar|vegetarian|snowy coconut-coated mochi cut open to reveal a smooth dark-chocolate centre|a nostalgic Hong Kong street-snack cart
Red Bean Put Chai Ko|紅豆砵仔糕|Street Food|Street Snack|rice flour,wheat starch,red beans,brown sugar|vegan|an amber steamed pudding set in a tiny porcelain bowl and dotted with red beans|a nostalgic Hong Kong street-snack cart
White Sugar Sponge Cake|白糖糕|Street Food|Street Snack|rice flour,sugar,yeast|vegan|a white triangular steamed cake with airy honeycomb holes|a nostalgic Hong Kong street-snack cart
Bagged Cold Noodles|袋仔冷麵|Street Food|Street Snack|wheat noodles,sesame sauce,soy sauce,chilli oil|vegan|springy cold noodles tossed in sauces inside a clear unlabelled food bag|a Hong Kong school-side snack stall
Street-Style Rice Noodle Rolls|街邊腸粉|Street Food|Street Snack|rice noodle rolls,sesame sauce,sweet soy sauce,hoisin sauce|vegan|plain silky rice noodle rolls cut into short pieces and striped with three sauces|a stainless-steel Hong Kong street-food counter
Curry Pig Skin|咖喱豬皮|Street Food|Street Snack|pig skin,curry sauce,radish,onion|meat|honeycombed pieces of pig skin and radish simmered in golden curry|a stainless-steel Hong Kong street-food counter
Dry-Fried Beef Ho Fun|乾炒牛河|Dai Pai Dong|Wok-Fried Dish|wide rice noodles,beef,bean sprouts,soy sauce,spring onion|meat|wok-charred wide rice noodles tangled with sliced beef bean sprouts and chives|a worn marble-top table at a Hong Kong dai pai dong
Black Bean Chilli Clams|豉椒炒蜆|Dai Pai Dong|Wok-Fried Dish|clams,fermented black beans,green pepper,garlic|pescatarian|opened clams glossed with black-bean sauce and green pepper pieces|a worn marble-top table at a Hong Kong dai pai dong
Typhoon Shelter Crab|避風塘炒蟹|Dai Pai Dong|Wok-Fried Dish|crab,garlic,chilli,fermented black beans,breadcrumbs|pescatarian|cracked crab pieces buried in a generous mound of crisp fried garlic and chilli crumbs|a worn marble-top table at a Hong Kong dai pai dong
Salt and Pepper Squid|椒鹽鮮魷|Dai Pai Dong|Wok-Fried Dish|squid,wheat flour,garlic,chilli,spring onion|pescatarian|lightly battered squid curls tossed with crisp garlic chilli and spring onion|a worn marble-top table at a Hong Kong dai pai dong
Hong Kong Sweet and Sour Pork|港式咕嚕肉|Dai Pai Dong|Wok-Fried Dish|pork shoulder,wheat flour,pineapple,bell pepper,sweet and sour sauce|meat|crisp pork chunks with pineapple and peppers in a translucent red-orange glaze|a worn marble-top table at a Hong Kong dai pai dong
Fermented Bean Curd Water Spinach|腐乳炒通菜|Dai Pai Dong|Wok-Fried Dish|water spinach,fermented bean curd,garlic,chilli|vegan|bright green water spinach quickly wok-fried with garlic and a pale fermented-bean-curd coating|a worn marble-top table at a Hong Kong dai pai dong
Dace Fish Balls with Chinese Broccoli|鯪魚球炒芥蘭|Dai Pai Dong|Wok-Fried Dish|dace fish paste,Chinese broccoli,ginger,soy sauce|pescatarian|bouncy golden dace balls tossed with glossy stems of Chinese broccoli|a worn marble-top table at a Hong Kong dai pai dong
Scrambled Eggs with Shrimp|滑蛋蝦仁|Dai Pai Dong|Wok-Fried Dish|egg,shrimp,spring onion,sesame oil|pescatarian|soft barely set folds of scrambled egg holding plump pink shrimp|a worn marble-top table at a Hong Kong dai pai dong
Soy Sauce King Prawns|豉油王煎蝦|Dai Pai Dong|Wok-Fried Dish|whole prawns,soy sauce,sugar,spring onion|pescatarian|shell-on prawns seared until red and lacquered with a dark soy glaze|a worn marble-top table at a Hong Kong dai pai dong
Black Pepper Beef Cubes|黑椒牛柳粒|Dai Pai Dong|Wok-Fried Dish|beef tenderloin,black pepper,onion,soy sauce|meat|seared beef cubes and onion petals coated in coarse black-pepper sauce|a worn marble-top table at a Hong Kong dai pai dong
Salt and Pepper Pork Chops|椒鹽豬扒|Dai Pai Dong|Wok-Fried Dish|pork chops,wheat flour,garlic,chilli,five-spice|meat|crisp bone-in pork chop pieces scattered with fried garlic and chilli|a worn marble-top table at a Hong Kong dai pai dong
Crispy Fried Pork Intestine|脆皮炸大腸|Dai Pai Dong|Wok-Fried Dish|pork intestine,maltose,rice vinegar|meat|even rings of pork intestine fried to a mahogany crackling exterior|a worn marble-top table at a Hong Kong dai pai dong
Chiu Chow Oyster Omelette|潮州蠔餅|Dai Pai Dong|Wok-Fried Dish|small oysters,egg,sweet potato starch,coriander|pescatarian|a lacy crisp-edged omelette packed with small oysters and coriander|a worn marble-top table at a Hong Kong dai pai dong
Black Bean Razor Clams|豉椒炒聖子|Dai Pai Dong|Wok-Fried Dish|razor clams,fermented black beans,bell pepper,garlic|pescatarian|long razor clam shells topped with black beans peppers and glossy sauce|a worn marble-top table at a Hong Kong dai pai dong
Chocolate Lava Taro Puffs|巧克力流心蜂巢芋角|Street Food|Street Snack|taro,wheat starch,dark chocolate ganache,vegetable oil|vegetarian|crisp lacy taro puffs with one broken open to reveal a molten dark-chocolate centre|a nostalgic Hong Kong street-snack cart
Ginger Scallion Fish Head Claypot|薑蔥魚頭煲|Dai Pai Dong|Claypot Dish|fish head,ginger,spring onion,soy sauce|pescatarian|browned fish-head pieces sizzling with abundant ginger and spring onion in a claypot|a worn marble-top table at a Hong Kong dai pai dong
Salted Fish Chicken Tofu Claypot|鹹魚雞粒豆腐煲|Dai Pai Dong|Claypot Dish|chicken,salted fish,tofu,ginger,spring onion|meat|golden tofu cubes chicken pieces and salted fish bubbling in a brown claypot sauce|a worn marble-top table at a Hong Kong dai pai dong
Radish Beef Brisket Claypot|蘿蔔牛腩煲|Dai Pai Dong|Claypot Dish|beef brisket,radish,chu hou sauce,star anise|meat|fork-tender beef brisket and translucent radish simmering in a rich claypot gravy|a worn marble-top table at a Hong Kong dai pai dong
Salted Fish Eggplant Claypot|鹹魚茄子煲|Dai Pai Dong|Claypot Dish|eggplant,salted fish,minced pork,garlic,chilli|meat|silky purple eggplant strips minced pork and salted fish in a bubbling claypot|a worn marble-top table at a Hong Kong dai pai dong
Satay Vermicelli Seafood Claypot|沙爹海鮮粉絲煲|Dai Pai Dong|Claypot Dish|glass noodles,shrimp,squid,satay sauce,onion|pescatarian|glass noodles tangled with shrimp and squid in a fragrant satay claypot|a worn marble-top table at a Hong Kong dai pai dong
Clams in Supreme Broth and Shaoxing Wine|上湯花雕浸蜆|Dai Pai Dong|Claypot Dish|clams,Shaoxing wine,ginger,spring onion,chicken broth|pescatarian|opened clams in a clear steaming broth perfumed with ginger and Chinese wine|a worn marble-top table at a Hong Kong dai pai dong
Garlic Vermicelli Steamed Scallops|蒜蓉粉絲蒸扇貝|Dai Pai Dong|Claypot Dish|scallops,glass noodles,garlic,soy sauce,spring onion|pescatarian|scallops in their shells topped with coils of vermicelli and minced garlic|a worn marble-top table at a Hong Kong dai pai dong
Crispy Garlic Chicken|蒜香脆皮雞|Dai Pai Dong|Wok-Fried Dish|chicken,garlic,soy sauce,five-spice|meat|chopped bone-in chicken with taut golden skin under a mound of fried garlic|a worn marble-top table at a Hong Kong dai pai dong
Salt and Pepper Tofu|椒鹽豆腐|Dai Pai Dong|Wok-Fried Dish|tofu,cornstarch,garlic,chilli,spring onion|vegan|crisp golden tofu cubes scattered with fried garlic chilli and spring onion|a worn marble-top table at a Hong Kong dai pai dong
Shrimp Paste Pork Belly|蝦醬蒸豬腩|Dai Pai Dong|Claypot Dish|pork belly,shrimp paste,ginger,sugar|meat|thin pork-belly slices steamed with a savoury shrimp-paste glaze and ginger|a worn marble-top table at a Hong Kong dai pai dong
Baked Pork Chop Rice|焗豬扒飯|Cha Chaan Teng|Rice Plate|pork chop,rice,tomato sauce,cheese,onion|meat|a pork chop over rice under tangy tomato sauce and browned melted cheese|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Baked Seafood Rice|焗海鮮飯|Cha Chaan Teng|Rice Plate|rice,shrimp,squid,fish fillet,cream sauce,cheese|pescatarian|mixed seafood and rice under bubbling white sauce and a bronzed cheese crust|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Portuguese Baked Chicken Rice|葡汁焗雞飯|Cha Chaan Teng|Rice Plate|chicken,rice,coconut milk,curry powder,potato|meat|chicken and potato over rice in a mild golden coconut Portuguese-style sauce|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Baked Ox Tongue Spaghetti|焗牛脷意粉|Cha Chaan Teng|Rice Plate|ox tongue,spaghetti,tomato sauce,cheese|meat|sliced ox tongue on spaghetti beneath tomato sauce and browned cheese|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Swiss Chicken Wings Rice|瑞士雞翼飯|Cha Chaan Teng|Rice Plate|chicken wings,rice,soy sauce,star anise,rock sugar|meat|dark glossy soy-braised chicken wings arranged beside steamed rice|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Tomato Beef Rice|番茄牛肉飯|Cha Chaan Teng|Rice Plate|beef,tomato,onion,rice,egg|meat|tender beef slices and soft tomato wedges in a red sauce over rice|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Sweetcorn Fish Fillet Rice|粟米汁魚柳飯|Cha Chaan Teng|Rice Plate|fish fillet,sweet corn,rice,egg,stock|pescatarian|fried white-fish fillet and rice covered with thick pale-yellow sweetcorn sauce|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Black Pepper Pork Chop Rice|黑椒豬扒飯|Cha Chaan Teng|Rice Plate|pork chop,rice,black pepper,onion,soy sauce|meat|pan-fried pork chop and rice drenched with onion-rich black-pepper gravy|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Curry Beef Brisket Rice|咖喱牛腩飯|Cha Chaan Teng|Rice Plate|beef brisket,rice,curry sauce,potato,onion|meat|chunks of beef brisket and potato in thick yellow curry beside steamed rice|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Chocolate-Filled Sesame Balls|巧克力流心煎堆|Festival Food|Festival Pastry|glutinous rice flour,dark chocolate ganache,sesame,sugar|vegetarian|golden sesame-coated rice balls with one split to show a thick dark-chocolate filling|a red-accented family table during a Hong Kong Lunar New Year gathering
Yangzhou Fried Rice|揚州炒飯|Cha Chaan Teng|Fried Rice|rice,char siu,shrimp,egg,peas|meat|golden fried rice evenly mixed with diced char siu shrimp egg and peas|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Hong Kong Fujian Fried Rice|港式福建炒飯|Cha Chaan Teng|Fried Rice|fried rice,shrimp,chicken,mushroom,egg gravy|meat|egg fried rice covered with a glossy seafood chicken and mushroom gravy|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Salted Fish Chicken Fried Rice|鹹魚雞粒炒飯|Cha Chaan Teng|Fried Rice|rice,chicken,salted fish,egg,lettuce|meat|dry fried rice studded with chicken cubes fragrant salted fish egg and lettuce|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Pineapple Chicken Fried Rice|菠蘿雞粒炒飯|Cha Chaan Teng|Fried Rice|rice,chicken,pineapple,egg,peas|meat|golden fried rice dotted with chicken pineapple chunks egg and peas|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Singapore-Style Fried Vermicelli|星洲炒米|Cha Chaan Teng|Noodle Plate|rice vermicelli,char siu,shrimp,egg,curry powder|meat|yellow curry-seasoned vermicelli tossed with char siu shrimp and egg strips|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Xiamen-Style Fried Vermicelli|廈門炒米|Cha Chaan Teng|Noodle Plate|rice vermicelli,char siu,shrimp,cabbage,sweet and sour sauce|meat|reddish tangy fried vermicelli with char siu shrimp and shredded cabbage|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Soy Sauce King Chow Mein|豉油皇炒麵|Cha Chaan Teng|Noodle Plate|egg noodles,soy sauce,bean sprouts,spring onion,onion|vegetarian|thin egg noodles wok-fried dark and glossy with bean sprouts and spring onion|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Beef Brisket Wonton Noodles|牛腩雲吞麵|Cha Chaan Teng|Noodle Plate|egg noodles,beef brisket,shrimp wontons,broth,Chinese chives|meat|springy noodles in clear broth with braised brisket and plump shrimp wontons|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Satay Beef Instant Noodles|沙爹牛肉公仔麵|Cha Chaan Teng|Macaroni and Instant Noodles|instant noodles,beef,satay sauce,onion,broth|meat|curly instant noodles in broth topped with tender satay beef and onions|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Luncheon Meat and Fried Egg Instant Noodles|餐肉煎蛋公仔麵|Cha Chaan Teng|Macaroni and Instant Noodles|instant noodles,luncheon meat,egg,broth,spring onion|meat|curly soup noodles topped with two seared luncheon-meat slices and a fried egg|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Tomato Macaroni Soup|鮮茄通粉|Cha Chaan Teng|Macaroni and Instant Noodles|macaroni,tomato,onion,broth,spring onion|vegan|elbow macaroni in a bright fresh-tomato broth with softened tomato wedges|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Ham Macaroni Soup|火腿通粉|Cha Chaan Teng|Macaroni and Instant Noodles|macaroni,ham,chicken broth,spring onion|meat|elbow macaroni in clear broth topped with neat pink ham strips|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Borscht Beef Macaroni|羅宋湯牛肉通粉|Cha Chaan Teng|Macaroni and Instant Noodles|macaroni,beef,tomato,cabbage,carrot|meat|macaroni and sliced beef in Hong Kong-style red borscht with cabbage and carrot|a green-edged table inside a nostalgic Hong Kong cha chaan teng
XO Sauce Fried Rice Noodle Rolls|XO醬炒腸粉|Cha Chaan Teng|Noodle Plate|rice noodle rolls,XO sauce,bean sprouts,spring onion|pescatarian|seared rice-noodle-roll pieces tossed with savoury XO sauce and bean sprouts|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Scrambled Egg Char Siu Rice|滑蛋叉燒飯|Cha Chaan Teng|Rice Plate|char siu,egg,rice,spring onion,soy sauce|meat|slices of red-edged char siu and silky scrambled egg blanketing steamed rice|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Hong Kong French Toast|港式西多士|Cha Chaan Teng|Toast and Sandwich|white bread,egg,peanut butter,butter,golden syrup|vegetarian|a thick deep-fried toast sandwich with crisp edges butter melting on top and syrup alongside|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Peanut Butter French Toast|花生醬西多士|Cha Chaan Teng|Toast and Sandwich|white bread,egg,peanut butter,butter,condensed milk|vegetarian|golden French toast revealing a generous warm peanut-butter centre|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Kaya French Toast|咖央西多士|Cha Chaan Teng|Toast and Sandwich|white bread,egg,kaya coconut jam,butter,condensed milk|vegetarian|thick golden French toast with fragrant green-tinted kaya between the slices|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Ovaltine French Toast|阿華田西多士|Cha Chaan Teng|Toast and Sandwich|white bread,egg,ovaltine spread,butter,condensed milk|vegetarian|crisp French toast filled and dusted with malted chocolate drink powder|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Chocolate-Filled Egg Waffle Bites|巧克力流心雞蛋仔|Street Food|Street Snack|wheat flour,egg,milk,dark chocolate ganache,sugar|vegetarian|individual crisp egg-waffle bubbles with one opened to show a glossy chocolate centre|a compact Hong Kong egg-waffle stall
Luncheon Meat and Egg Sandwich|餐肉蛋治|Cha Chaan Teng|Toast and Sandwich|white bread,luncheon meat,egg,butter|meat|triangular soft-bread sandwich with seared luncheon meat and folded egg|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Ham and Egg Sandwich|火腿蛋治|Cha Chaan Teng|Toast and Sandwich|white bread,ham,egg,butter|meat|neatly cut soft-bread sandwich layered with pink ham and fluffy egg|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Hong Kong Club Sandwich|公司三文治|Cha Chaan Teng|Toast and Sandwich|toast,chicken,ham,egg,tomato,lettuce,mayonnaise|meat|a tall toasted triple-decker sandwich cut into four triangles and secured with plain picks|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Fish Fillet Bun|魚柳包|Cha Chaan Teng|Toast and Sandwich|breaded fish fillet,soft bun,lettuce,mayonnaise|pescatarian|a crisp rectangular fish fillet tucked into a soft bun with lettuce|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Pineapple Bun with Butter|菠蘿油|Cha Chaan Teng|Toast and Sandwich|pineapple bun,cold butter|vegetarian|a crackle-topped pineapple bun split around a thick cold slab of butter|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Scrambled Eggs on Toast|炒蛋多士|Cha Chaan Teng|Toast and Sandwich|white toast,egg,butter|vegetarian|soft glossy scrambled eggs piled over two golden buttered toast rectangles|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Condensed Milk and Peanut Butter Toast|奶醬多士|Cha Chaan Teng|Toast and Sandwich|white toast,peanut butter,condensed milk|vegetarian|crisp toast triangles spread with peanut butter and striped with condensed milk|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Butter and Condensed Milk Toast|奶油多士|Cha Chaan Teng|Toast and Sandwich|white toast,butter,condensed milk|vegetarian|golden toast spread with melting butter and a glossy condensed-milk drizzle|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Butter and Sugar Toast|砂糖牛油多士|Cha Chaan Teng|Toast and Sandwich|white toast,butter,granulated sugar|vegetarian|crisp toast evenly spread with butter and sparkling granulated sugar|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Pork Chop Bun|豬扒包|Cha Chaan Teng|Toast and Sandwich|pork chop,crusty bun,onion,tomato,mayonnaise|meat|a bone-free seared pork chop tucked into a crusty split bun with onion|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Satay Beef Bun|沙爹牛肉包|Cha Chaan Teng|Toast and Sandwich|beef,soft bun,satay sauce,onion|meat|tender satay-coated beef and onions spilling from a soft oblong bun|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Satay Beef Noodles Breakfast Set|沙爹牛肉麵配煎蛋|Cha Chaan Teng|Macaroni and Instant Noodles|instant noodles,satay beef,fried eggs,broth|meat|a bowl of satay beef instant noodles served with two fried eggs on the same tray|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Cha Chaan Teng All-Day Breakfast|港式全日早餐|Cha Chaan Teng|Toast and Sandwich|toast,sausages,bacon,fried eggs,baked beans|meat|a compartmentalised plate of toast sausages bacon eggs and baked beans|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Thick Peanut Butter Toast|花生醬厚多士|Cha Chaan Teng|Toast and Sandwich|thick white toast,peanut butter,butter|vegetarian|an extra-thick toast slab with deeply browned edges and a smooth peanut-butter layer|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Black Sesame French Toast|黑芝麻西多士|Cha Chaan Teng|Toast and Sandwich|white bread,egg,black sesame paste,butter,condensed milk|vegetarian|deep-fried French toast with a dark fragrant sesame filling visible at the cut edge|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Tomato and Egg Sandwich|番茄蛋治|Cha Chaan Teng|Toast and Sandwich|white bread,tomato,egg,butter|vegetarian|soft bread triangles filled with fluffy egg and fresh red tomato slices|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Tuna Sandwich|吞拿魚三文治|Cha Chaan Teng|Toast and Sandwich|white bread,tuna,mayonnaise,cucumber|pescatarian|neat triangular sandwiches filled with tuna mayonnaise and thin cucumber|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Sardine Sandwich|沙甸魚三文治|Cha Chaan Teng|Toast and Sandwich|white bread,sardines,tomato sauce,onion|pescatarian|soft-bread triangles containing sardines in tomato sauce and thin onion|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Luncheon Meat Croissant|餐肉牛角包|Cha Chaan Teng|Toast and Sandwich|croissant,luncheon meat,butter|meat|a flaky croissant split around two crisp-edged luncheon-meat slices|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Chocolate Lava Ma Lai Go|巧克力流心馬拉糕|Hong Kong Bakery|Bakery Pastry|wheat flour,egg,brown sugar,milk,dark chocolate ganache|vegetarian|a tall steamed brown-sugar sponge cake cut open around a warm dark-chocolate core|a glass-fronted tray in a traditional Hong Kong bakery
Pineapple Bun|菠蘿包|Hong Kong Bakery|Bakery Bun|wheat flour,egg,milk,sugar,butter|vegetarian|a round soft bun crowned with a golden crackled cookie crust|a glass-fronted tray in a traditional Hong Kong bakery
Cocktail Bun|雞尾包|Hong Kong Bakery|Bakery Bun|wheat flour,egg,milk,butter,coconut,sugar|vegetarian|an oblong glossy bun with coconut filling and two pale baked stripes|a glass-fronted tray in a traditional Hong Kong bakery
Mexican Bun|墨西哥包|Hong Kong Bakery|Bakery Bun|wheat flour,egg,milk,butter,sugar|vegetarian|a soft round bun under a smooth golden buttery coffee-bun-style cap|a glass-fronted tray in a traditional Hong Kong bakery
Sausage Bun|腸仔包|Hong Kong Bakery|Bakery Bun|wheat flour,milk,egg,pork sausage|meat|a shiny soft dough braid wrapped neatly around a pink sausage|a glass-fronted tray in a traditional Hong Kong bakery
Ham and Egg Bun|火腿蛋包|Hong Kong Bakery|Bakery Bun|wheat flour,ham,egg,mayonnaise|meat|a boat-shaped soft bun holding folded ham and baked egg|a glass-fronted tray in a traditional Hong Kong bakery
Tuna Mayonnaise Bun|吞拿魚沙律包|Hong Kong Bakery|Bakery Bun|wheat flour,tuna,mayonnaise,sweet corn|pescatarian|a soft oval bun with an open centre of tuna mayonnaise and corn|a glass-fronted tray in a traditional Hong Kong bakery
Coconut Tart|椰撻|Hong Kong Bakery|Bakery Pastry|wheat flour,butter,egg,coconut,sugar|vegetarian|a small fluted tart piled with toasted golden coconut filling|a glass-fronted tray in a traditional Hong Kong bakery
Puff Pastry Egg Tart|酥皮蛋撻|Hong Kong Bakery|Bakery Pastry|wheat flour,butter,egg,milk,sugar|vegetarian|a glossy yellow custard set inside many crisp flaky pastry layers|a glass-fronted tray in a traditional Hong Kong bakery
Shortcrust Egg Tart|牛油皮蛋撻|Hong Kong Bakery|Bakery Pastry|wheat flour,butter,egg,milk,sugar|vegetarian|smooth yellow custard in a neat crumbly pale-gold shortcrust shell|a glass-fronted tray in a traditional Hong Kong bakery
Paper-Wrapped Sponge Cake|紙包蛋糕|Hong Kong Bakery|Bakery Pastry|wheat flour,egg,milk,sugar,vegetable oil|vegetarian|a tall airy sponge cake rising above its crinkled white paper wrapper|a glass-fronted tray in a traditional Hong Kong bakery
Vanilla Swiss Roll|雲呢拿瑞士卷|Hong Kong Bakery|Bakery Pastry|wheat flour,egg,milk,sugar,cream|vegetarian|pale sponge spiralled around a thin white vanilla cream filling|a glass-fronted tray in a traditional Hong Kong bakery
Coffee Swiss Roll|咖啡瑞士卷|Hong Kong Bakery|Bakery Pastry|wheat flour,egg,milk,sugar,coffee cream|vegetarian|light-brown coffee sponge spiralled around a smooth cream filling|a glass-fronted tray in a traditional Hong Kong bakery
Black Sesame Swiss Roll|黑芝麻瑞士卷|Hong Kong Bakery|Bakery Pastry|wheat flour,egg,milk,sugar,black sesame cream|vegetarian|soft grey sesame-flecked sponge rolled around contrasting pale cream|a glass-fronted tray in a traditional Hong Kong bakery
Cream Horn|牛油忌廉角|Hong Kong Bakery|Bakery Pastry|puff pastry,butter,cream,sugar|vegetarian|a crisp spiral pastry horn piped full of pale buttercream|a glass-fronted tray in a traditional Hong Kong bakery
Wife Cake|老婆餅|Hong Kong Bakery|Bakery Pastry|wheat flour,lard,winter melon,sesame,sugar|meat|a flat round flaky pastry with a translucent winter-melon filling visible at the cut edge|a glass-fronted tray in a traditional Hong Kong bakery
Husband Cake|老公餅|Hong Kong Bakery|Bakery Pastry|wheat flour,lard,minced pork,sesame,five-spice|meat|a savoury flat flaky pastry with a peppery pork and sesame filling|a glass-fronted tray in a traditional Hong Kong bakery
Century Egg Pastry|皮蛋酥|Hong Kong Bakery|Bakery Pastry|wheat flour,lard,century egg,pickled ginger,lotus seed paste|meat|a flaky round pastry cut to reveal century egg pickled ginger and pale lotus paste|a glass-fronted tray in a traditional Hong Kong bakery
Red Bean Puff Pastry|紅豆酥|Hong Kong Bakery|Bakery Pastry|wheat flour,butter,red bean paste,egg|vegetarian|a golden layered pastry filled with smooth dark-red bean paste|a glass-fronted tray in a traditional Hong Kong bakery
Lotus Seed Puff Pastry|蓮蓉酥|Hong Kong Bakery|Bakery Pastry|wheat flour,butter,lotus seed paste,egg|vegetarian|a petite golden pastry with pale smooth lotus-seed filling|a glass-fronted tray in a traditional Hong Kong bakery
Chocolate Lava Egg Yolk Pastry|巧克力流心蛋黃酥|Hong Kong Bakery|Bakery Pastry|wheat flour,butter,salted egg yolk,dark chocolate ganache|vegetarian|a flaky round pastry halved to show salted egg yolk surrounded by molten dark chocolate|a glass-fronted tray in a traditional Hong Kong bakery
Walnut Cookie|合桃酥|Hong Kong Bakery|Bakery Pastry|wheat flour,walnut,lard,egg,sugar|meat|a rustic cracked golden cookie topped with a walnut half|a glass-fronted tray in a traditional Hong Kong bakery
Almond Cookie|杏仁餅|Hong Kong Bakery|Bakery Pastry|mung bean flour,almond,sugar,vegetable oil|vegan|a pale crumbly pressed cookie stamped with a simple geometric mould pattern|a glass-fronted tray in a traditional Hong Kong bakery
Sesame Cookie|芝麻脆餅|Hong Kong Bakery|Bakery Pastry|wheat flour,sesame,egg,butter,sugar|vegetarian|thin crisp golden cookies densely speckled with black and white sesame|a glass-fronted tray in a traditional Hong Kong bakery
Butterfly Puff Pastry|蝴蝶酥|Hong Kong Bakery|Bakery Pastry|wheat flour,butter,sugar|vegetarian|a caramelised heart-shaped laminated pastry with symmetrical crisp coils|a glass-fronted tray in a traditional Hong Kong bakery
Hong Kong Sachima|港式沙琪瑪|Hong Kong Bakery|Bakery Pastry|wheat flour,egg,maltose,sesame|vegetarian|an airy rectangular block of fried dough strands bound with glossy maltose|a glass-fronted tray in a traditional Hong Kong bakery
Mango Pomelo Sago|楊枝甘露|Hong Kong Dessert|Chilled Dessert|mango,pomelo,sago,coconut milk,evaporated milk|vegetarian|a chilled golden mango cream with sago pearls pomelo sacs and mango cubes|a marble table inside a warm Hong Kong dessert shop
Black Sesame Sweet Soup|芝麻糊|Hong Kong Dessert|Sweet Soup|black sesame,rice,sugar|vegan|a smooth thick charcoal-black sesame soup in a small porcelain bowl|a marble table inside a warm Hong Kong dessert shop
Walnut Sweet Soup|合桃糊|Hong Kong Dessert|Sweet Soup|walnut,rice,sugar|vegan|a smooth tan walnut soup with a naturally glossy surface|a marble table inside a warm Hong Kong dessert shop
Egg White Almond Tea|蛋白杏仁茶|Hong Kong Dessert|Sweet Soup|almond,egg white,rice,sugar|vegetarian|silky ivory almond tea threaded with delicate ribbons of egg white|a marble table inside a warm Hong Kong dessert shop
Red Bean Sweet Soup|陳皮紅豆沙|Hong Kong Dessert|Sweet Soup|red beans,dried tangerine peel,sugar|vegan|a thick burgundy red-bean soup with softened beans and a curl of tangerine peel|a marble table inside a warm Hong Kong dessert shop
Mung Bean Sweet Soup|海帶綠豆沙|Hong Kong Dessert|Sweet Soup|mung beans,dried kelp,sugar|vegan|a pale green mung-bean soup with slender dark kelp strips|a marble table inside a warm Hong Kong dessert shop
Sweet Potato Ginger Soup|薑汁番薯糖水|Hong Kong Dessert|Sweet Soup|sweet potato,ginger,brown sugar,water|vegan|golden sweet-potato chunks in a clear amber ginger syrup|a marble table inside a warm Hong Kong dessert shop
Coconut Taro Sago|椰汁芋頭西米露|Hong Kong Dessert|Sweet Soup|taro,sago,coconut milk,sugar|vegan|lavender taro cubes and translucent sago pearls in creamy coconut milk|a marble table inside a warm Hong Kong dessert shop
Papaya Snow Fungus Sweet Soup|木瓜雪耳糖水|Hong Kong Dessert|Sweet Soup|papaya,snow fungus,rock sugar,apricot kernels|vegan|orange papaya cubes and ruffled translucent snow fungus in a clear syrup|a marble table inside a warm Hong Kong dessert shop
Lotus Seed Lily Bulb Sweet Soup|蓮子百合糖水|Hong Kong Dessert|Sweet Soup|lotus seeds,lily bulbs,rock sugar,red dates|vegan|ivory lotus seeds lily petals and red dates in a clear sweet broth|a marble table inside a warm Hong Kong dessert shop
Black Glutinous Rice with Coconut Milk|椰汁紫米露|Hong Kong Dessert|Sweet Soup|black glutinous rice,coconut milk,sugar|vegan|thick purple-black rice pudding finished with a white coconut-milk swirl|a marble table inside a warm Hong Kong dessert shop
Hong Kong Tofu Pudding|港式豆腐花|Hong Kong Dessert|Sweet Soup|silken tofu,brown sugar syrup,ginger|vegan|quivering spooned layers of silken tofu with amber ginger syrup|a marble table inside a warm Hong Kong dessert shop
Ginger Milk Curd|薑汁撞奶|Hong Kong Dessert|Sweet Soup|milk,ginger juice,sugar|vegetarian|a pristine bowl of softly set white milk curd with a delicate skin|a marble table inside a warm Hong Kong dessert shop
Double-Skin Milk Pudding|雙皮奶|Hong Kong Dessert|Sweet Soup|milk,egg white,sugar|vegetarian|smooth white steamed milk pudding with its characteristic thin surface skin|a marble table inside a warm Hong Kong dessert shop
Chocolate Ginger Milk Mochi|巧克力薑汁奶糯米糍|Hong Kong Dessert|Chilled Dessert|glutinous rice flour,milk,ginger,dark chocolate ganache|vegetarian|pale ginger-milk mochi dusted with starch and cut open to show a dark chocolate filling|a marble table inside a warm Hong Kong dessert shop
Hong Kong Mango Pudding|港式芒果布甸|Hong Kong Dessert|Chilled Dessert|mango,milk,cream,sugar,gelatin|vegetarian|a glossy golden mango pudding mould garnished only with fresh mango dice|a marble table inside a warm Hong Kong dessert shop
Mixed Fruit Grass Jelly|什果涼粉|Hong Kong Dessert|Chilled Dessert|grass jelly,mango,watermelon,papaya,sugar syrup|vegan|black grass-jelly cubes surrounded by colourful fresh fruit pieces and crushed ice|a marble table inside a warm Hong Kong dessert shop
Mango Sago Grass Jelly|芒果西米涼粉|Hong Kong Dessert|Chilled Dessert|mango,sago,grass jelly,coconut milk|vegan|mango cubes clear sago and black grass jelly layered in coconut milk|a marble table inside a warm Hong Kong dessert shop
Coconut Milk Sago|椰汁西米露|Hong Kong Dessert|Sweet Soup|sago,coconut milk,sugar|vegan|translucent pearl sago suspended evenly in snowy coconut milk|a marble table inside a warm Hong Kong dessert shop
Black Sesame Tong Yuen|黑芝麻湯圓|Hong Kong Dessert|Sweet Soup|glutinous rice flour,black sesame,sugar,ginger syrup|vegan|round white rice dumplings in amber ginger syrup with one cut open to show sesame filling|a marble table inside a warm Hong Kong dessert shop
Peanut Tong Yuen|花生湯圓|Hong Kong Dessert|Sweet Soup|glutinous rice flour,peanut,sugar,ginger syrup|vegan|round rice dumplings in clear ginger syrup with one cut open to show peanut filling|a marble table inside a warm Hong Kong dessert shop
Bean Curd Sheet and Egg Sweet Soup|腐竹雞蛋糖水|Hong Kong Dessert|Sweet Soup|bean curd sheet,egg,rock sugar,ginkgo nuts|vegetarian|pale silky bean-curd-sheet soup with soft ribbons of egg and ginkgo nuts|a marble table inside a warm Hong Kong dessert shop
Snow Fungus Stewed Pear|雪耳燉雪梨|Hong Kong Dessert|Sweet Soup|Asian pear,snow fungus,rock sugar,goji berries|vegan|a halved tender pear with translucent snow fungus in clear syrup|a marble table inside a warm Hong Kong dessert shop
Ginkgo Barley Bean Curd Sweet Soup|白果薏米腐竹糖水|Hong Kong Dessert|Sweet Soup|ginkgo nuts,pearl barley,bean curd sheet,rock sugar|vegan|creamy pale sweet soup dotted with yellow ginkgo nuts and pearl barley|a marble table inside a warm Hong Kong dessert shop
Mulberry Mistletoe Lotus Seed Egg Tea|桑寄生蓮子蛋茶|Hong Kong Dessert|Sweet Soup|mulberry mistletoe,lotus seeds,hard-boiled egg,brown sugar|vegetarian|dark herbal sweet tea holding lotus seeds and a whole peeled egg|a marble table inside a warm Hong Kong dessert shop
Pan-Fried Turnip Cake|香煎蘿蔔糕|Festival Food|Festival Cake|rice flour,radish,Chinese sausage,dried shrimp,shiitake mushroom|meat|rectangular turnip-cake slices pan-fried golden with visible sausage and shrimp flecks|a red-accented family table during a Hong Kong Lunar New Year gathering
Pan-Fried Taro Cake|香煎芋頭糕|Festival Food|Festival Cake|taro,rice flour,Chinese sausage,dried shrimp,shiitake mushroom|meat|purple-flecked taro-cake rectangles with crisp browned surfaces|a red-accented family table during a Hong Kong Lunar New Year gathering
Water Chestnut Cake|馬蹄糕|Festival Food|Festival Cake|water chestnut flour,water chestnuts,brown sugar|vegan|translucent amber cake slices containing crisp white water-chestnut pieces|a red-accented family table during a Hong Kong Lunar New Year gathering
Brown Sugar New Year Cake|紅糖年糕|Festival Food|Festival Cake|glutinous rice flour,brown sugar,water|vegan|a glossy caramel-brown steamed rice cake cut into thick soft slices|a red-accented family table during a Hong Kong Lunar New Year gathering
Coconut New Year Cake|椰汁年糕|Festival Food|Festival Cake|glutinous rice flour,coconut milk,sugar|vegan|smooth white coconut rice cake with clean translucent slices|a red-accented family table during a Hong Kong Lunar New Year gathering
Red Date Steamed Cake|紅棗糕|Festival Food|Festival Cake|red dates,rice flour,brown sugar,water|vegan|deep reddish-brown steamed cake slices with a moist glossy crumb|a red-accented family table during a Hong Kong Lunar New Year gathering
Steamed Prosperity Cake|傳統發糕|Festival Food|Festival Cake|rice flour,brown sugar,yeast|vegan|a tall brown steamed cake split naturally into a flower-like top|a red-accented family table during a Hong Kong Lunar New Year gathering
Sesame Balls|煎堆|Festival Food|Festival Pastry|glutinous rice flour,red bean paste,sesame,sugar|vegan|round hollow golden rice balls fully coated in white sesame seeds|a red-accented family table during a Hong Kong Lunar New Year gathering
Laughing Sesame Cookies|笑口棗|Festival Food|Festival Pastry|wheat flour,egg,sesame,sugar|vegetarian|small round fried cookies split open like smiles and dotted with sesame|a red-accented family table during a Hong Kong Lunar New Year gathering
Chocolate-Filled New Year Oil Horns|巧克力賀年油角|Festival Food|Festival Pastry|wheat flour,dark chocolate ganache,peanut,sesame|vegetarian|golden crimped crescent pastries with one opened to reveal chocolate peanut filling|a red-accented family table during a Hong Kong Lunar New Year gathering
Peanut Puff Pastries|花生角仔|Festival Food|Festival Pastry|wheat flour,peanut,sugar,sesame|vegan|small puffed triangular pastries filled with crushed peanuts and sugar|a red-accented family table during a Hong Kong Lunar New Year gathering
Lotus Leaf Festive Rice|荷葉飯|Festival Food|Festival Savoury Dish|glutinous rice,chicken,Chinese sausage,shiitake mushroom,lotus leaf|meat|seasoned glutinous rice with chicken sausage and mushrooms opened inside a lotus leaf|a round banquet table at a Hong Kong festive gathering
Pork and Salted Egg Yolk Rice Dumpling|咸肉蛋黃糉|Festival Food|Festival Savoury Dish|glutinous rice,pork belly,salted egg yolk,mung beans,bamboo leaf|meat|a leaf-wrapped triangular dumpling cut open to show pork golden yolk and mung beans|a family table during Hong Kong Dragon Boat Festival
Alkaline Rice Dumpling|鹼水糉|Festival Food|Festival Cake|glutinous rice,alkaline water,bamboo leaf,golden syrup|vegan|a translucent golden triangular rice dumpling unwrapped beside a small pool of syrup|a family table during Hong Kong Dragon Boat Festival
Red Bean Alkaline Rice Dumpling|豆沙鹼水糉|Festival Food|Festival Cake|glutinous rice,red bean paste,alkaline water,bamboo leaf|vegan|a golden translucent rice dumpling cut to reveal dark red-bean filling|a family table during Hong Kong Dragon Boat Festival
Double-Yolk White Lotus Mooncake|雙黃白蓮蓉月餅|Festival Food|Festival Pastry|wheat flour,white lotus seed paste,salted egg yolks,golden syrup|vegetarian|a patterned baked mooncake cut open to show two intact orange yolks in pale lotus paste|a moonlit family table during Hong Kong Mid-Autumn Festival
Mandarin Peel Red Bean Mooncake|陳皮豆沙月餅|Festival Food|Festival Pastry|wheat flour,red bean paste,dried tangerine peel,golden syrup|vegan|a baked mooncake with a dark smooth bean filling flecked by fragrant citrus peel|a moonlit family table during Hong Kong Mid-Autumn Festival
Five-Nut Mooncake|五仁月餅|Festival Food|Festival Pastry|wheat flour,walnut,almond,sesame,pumpkin seeds,golden syrup|vegan|a baked mooncake cut to reveal a colourful densely packed mixed-nut centre|a moonlit family table during Hong Kong Mid-Autumn Festival
Mango Snow-Skin Mooncake|芒果冰皮月餅|Festival Food|Festival Pastry|glutinous rice flour,mango,coconut milk,sugar|vegan|a pale-yellow unbaked mooncake with soft snow-skin and bright mango filling|a moonlit family table during Hong Kong Mid-Autumn Festival
Mini Lava Custard Mooncake|迷你流心奶黃月餅|Festival Food|Festival Pastry|wheat flour,egg yolk,milk,butter,sugar|vegetarian|a small golden mooncake split to release a thick flowing salted-custard centre|a moonlit family table during Hong Kong Mid-Autumn Festival
Tong Yuen in Red Bean Soup|紅豆沙湯圓|Festival Food|Festival Cake|red beans,glutinous rice flour,black sesame,brown sugar|vegan|white filled rice balls floating in a thick burgundy red-bean soup|a family table during a Hong Kong Lantern Festival gathering
Ground Peanut Coated Tong Yuen|擂沙湯圓|Festival Food|Festival Cake|glutinous rice flour,black sesame,peanut,sugar|vegan|soft filled rice balls served dry under a generous sandy peanut coating|a family table during a Hong Kong Lantern Festival gathering
Hong Kong Poon Choi|港式盆菜|Festival Food|Festival Savoury Dish|prawns,roast pork,chicken,fish balls,radish,tofu|meat|a large traditional basin with seafood roast meats radish and tofu arranged in distinct layers|a round village-banquet table at a Hong Kong festive gathering
Crispy Roast Suckling Pig|化皮乳豬|Festival Food|Festival Savoury Dish|suckling pig,five-spice,maltose,rice vinegar|meat|precisely chopped suckling pig pieces displaying blistered amber crackling|a round banquet table at a Hong Kong festive gathering
Black Moss and Dried Oysters|發菜蠔豉|Festival Food|Festival Savoury Dish|black moss,dried oysters,shiitake mushroom,oyster sauce|pescatarian|glossy braised dried oysters mushrooms and black moss arranged on a porcelain plate|a red-accented family table during a Hong Kong Lunar New Year gathering
Hong Kong Milk Tea|港式奶茶|Hong Kong Drinks|Cha Chaan Teng Drink|black tea,evaporated milk,sugar|vegetarian|strong copper-brown milk tea in a thick white ceramic cup and saucer|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Yuenyeung Coffee Tea|鴛鴦|Hong Kong Drinks|Cha Chaan Teng Drink|black tea,coffee,evaporated milk,sugar|vegetarian|a smooth tan coffee-and-tea drink in a heavy ribbed glass|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Iced Lemon Tea|凍檸茶|Hong Kong Drinks|Cha Chaan Teng Drink|black tea,lemon,sugar,ice|vegan|amber iced tea in a tall glass packed with fresh lemon slices and a plain stirrer|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Lemon Water|檸檬水|Hong Kong Drinks|Cha Chaan Teng Drink|lemon,water,sugar,ice|vegan|clear iced water in a tall glass with several crushed lemon slices|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Chocolate Lava Put Chai Ko|巧克力流心砵仔糕|Street Food|Street Snack|rice flour,wheat starch,brown sugar,dark chocolate ganache|vegetarian|an amber steamed pudding released from its tiny bowl and cut to reveal molten chocolate|a nostalgic Hong Kong street-snack cart
Hong Kong Red Bean Ice|港式紅豆冰|Hong Kong Drinks|Cha Chaan Teng Drink|sweetened red beans,evaporated milk,sugar syrup,crushed ice|vegetarian|a tall glass layered with red beans crushed ice and milky syrup|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Black Cow Ice Cream Cola|黑牛|Hong Kong Drinks|Cha Chaan Teng Drink|cola,vanilla ice cream,ice|vegetarian|dark fizzy cola crowned with a round scoop of vanilla ice cream in a tall glass|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Salted Lime Lemon-Lime Soda|鹹檸七|Hong Kong Drinks|Cha Chaan Teng Drink|preserved lime,lemon-lime soda,ice|vegan|clear sparkling soda with a crushed whole salted lime and abundant ice|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Iced Lemon Cola|凍檸樂|Hong Kong Drinks|Cha Chaan Teng Drink|cola,lemon,ice|vegan|dark iced cola packed with bright yellow lemon slices|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Hot Lemon Ginger Cola|熱檸樂煲薑|Hong Kong Drinks|Cha Chaan Teng Drink|cola,lemon,ginger|vegan|steaming dark cola in a glass mug with lemon wheels and ginger slices|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Lemon Blackcurrant Drink|檸賓|Hong Kong Drinks|Cha Chaan Teng Drink|blackcurrant cordial,lemon,water,ice|vegan|deep purple iced blackcurrant drink with several fresh lemon slices|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Malted Milk Drink|好立克|Hong Kong Drinks|Cha Chaan Teng Drink|malted barley,milk,sugar|vegetarian|a creamy beige malted drink in a plain thick ceramic mug|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Malted Chocolate Drink|阿華田|Hong Kong Drinks|Cha Chaan Teng Drink|malted barley,cocoa,milk,sugar|vegetarian|a warm light-brown malted chocolate drink in a plain ceramic cup|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Cha Chaan Teng Hot Chocolate|茶記熱朱古力|Hong Kong Drinks|Cha Chaan Teng Drink|cocoa,milk,sugar|vegetarian|a simple steaming cocoa drink with a smooth dark-brown surface and no foam art|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Hong Kong Almond Drink|港式杏霜|Hong Kong Drinks|Cha Chaan Teng Drink|almond powder,milk,sugar|vegetarian|an opaque ivory almond drink in a small heavy glass mug|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Fresh Soy Milk|鮮豆漿|Hong Kong Drinks|Herbal and Traditional Drink|soybeans,water,sugar|vegan|pale fresh soy milk in a plain glass with tiny natural bubbles at the rim|a marble table inside a traditional Hong Kong soybean shop
Fresh Sugarcane Juice|鮮榨蔗汁|Hong Kong Drinks|Herbal and Traditional Drink|sugarcane juice,ice|vegan|cloudy pale-green freshly pressed sugarcane juice in a tall unlabelled glass|a stainless-steel counter at a traditional Hong Kong juice stall
Winter Melon Tea|冬瓜茶|Hong Kong Drinks|Herbal and Traditional Drink|winter melon,brown sugar,water|vegan|translucent deep-amber winter-melon tea over ice in a plain glass|a marble table inside a traditional Hong Kong herbal-tea shop
Chrysanthemum Tea|菊花茶|Hong Kong Drinks|Herbal and Traditional Drink|chrysanthemum flowers,rock sugar,water|vegan|clear pale-gold tea with a few rehydrated chrysanthemum flowers in a glass cup|a marble table inside a traditional Hong Kong herbal-tea shop
Sour Plum Drink|酸梅湯|Hong Kong Drinks|Herbal and Traditional Drink|smoked plums,hawthorn,dried tangerine peel,rock sugar|vegan|clear reddish-brown iced sour-plum drink in a simple glass tumbler|a marble table inside a traditional Hong Kong herbal-tea shop
Watercress Honey Drink|西洋菜蜜|Hong Kong Drinks|Herbal and Traditional Drink|watercress,honey,water|vegan|clear amber watercress-and-honey drink in a tall glass with ice|a marble table inside a traditional Hong Kong herbal-tea shop
Pineapple Ice Drink|菠蘿冰|Hong Kong Drinks|Cha Chaan Teng Drink|pineapple chunks,sugar syrup,crushed ice,water|vegan|a tall glass of crushed ice and syrup with abundant golden pineapple chunks|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Grass Jelly Ice Cream Float|涼粉雪糕冰|Hong Kong Drinks|Cha Chaan Teng Drink|grass jelly,vanilla ice cream,sugar syrup,crushed ice|vegetarian|black grass-jelly cubes and crushed ice topped with one vanilla ice-cream scoop|a green-edged table inside a nostalgic Hong Kong cha chaan teng
Salted Kumquat Honey|鹹金桔蜜|Hong Kong Drinks|Herbal and Traditional Drink|preserved kumquat,honey,warm water|vegan|golden honey drink with a softened whole preserved kumquat in a glass mug|a marble table inside a traditional Hong Kong herbal-tea shop
Chocolate-Filled Black Sesame Rolls|巧克力流心菲林卷|Hong Kong Dessert|Chilled Dessert|black sesame,rice flour,dark chocolate ganache,sugar|vegetarian|glossy black sesame sheets rolled around a visible ribbon of dark chocolate filling|a marble table inside a warm Hong Kong dessert shop
Haw Flake Discs|山楂餅|Nostalgic Hong Kong|Nostalgic Candy|hawthorn fruit,sugar|vegan|thin rust-red haw flakes stacked into neat coin-shaped discs without branded wrapping|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Ding Ding Maltose Candy|叮叮糖|Nostalgic Hong Kong|Nostalgic Candy|maltose,sugar,sesame|vegan|irregular ivory maltose shards freshly chipped from a large brittle slab|a nostalgic Hong Kong candy hawker cart
Maltose Lollipop|麥芽糖餅|Nostalgic Hong Kong|Nostalgic Candy|maltose,sugar|vegan|a translucent amber maltose disc set on a plain wooden stick|a nostalgic Hong Kong candy hawker cart
Coconut Candy Cubes|椰子糖|Nostalgic Hong Kong|Nostalgic Candy|coconut,coconut milk,sugar|vegan|small dense coconut candy cubes with snowy fibrous cut surfaces|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Peanut Brittle|花生糖|Nostalgic Hong Kong|Nostalgic Candy|peanut,maltose,sugar|vegan|amber brittle rectangles densely packed with roasted peanut halves|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Sesame Brittle|芝麻糖|Nostalgic Hong Kong|Nostalgic Candy|sesame,maltose,sugar|vegan|thin crisp rectangles packed edge to edge with white and black sesame|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Old Ginger Candy|老薑糖|Nostalgic Hong Kong|Nostalgic Candy|ginger,sugar,maltose|vegan|golden chewy ginger-candy pieces dusted lightly with fine sugar|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Preserved Sour Plums|酸話梅|Nostalgic Hong Kong|Nostalgic Candy|plums,salt,sugar,liquorice|vegan|wrinkled dark preserved plums heaped in a small plain glass jar|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Liquorice Olives|甘草欖|Nostalgic Hong Kong|Nostalgic Candy|Chinese olives,liquorice,salt,sugar|vegan|olive-shaped dark-green preserved fruit with a dry seasoned surface|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Mandarin Peel Plums|陳皮梅|Nostalgic Hong Kong|Nostalgic Candy|plums,dried tangerine peel,salt,sugar|vegan|small brown preserved plums coated with fine aromatic citrus-peel crumbs|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Preserved Lemon Ginger|檸汁薑|Nostalgic Hong Kong|Nostalgic Candy|young ginger,lemon juice,sugar,salt|vegan|thin pale-yellow ginger slices preserved in a glossy citrus syrup|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Dried Shredded Squid|魷魚絲|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|dried squid,sugar,soy sauce|pescatarian|pale fibrous squid shreds loosely piled in an unlabelled paper pouch|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Fish-Skin Peanuts|魚皮花生|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|peanut,wheat flour,dried fish powder,sugar|pescatarian|round peanuts enclosed in crisp glossy brown fish-seasoned shells|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Red Bean Curd Peanuts|南乳花生|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|peanut,fermented red bean curd,salt,sugar|vegan|roasted peanuts evenly coated with a dry brick-red fermented-bean-curd seasoning|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Crispy Sugar Rings|糖環|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|rice flour,wheat flour,sugar,vegetable oil|vegan|delicate lattice-patterned fried rings with a pale crisp sugar glaze|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Ox-Ear Biscuits|牛耳仔|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|wheat flour,fermented bean curd,sugar,sesame|vegan|thin spiral biscuit slices fried crisp with alternating pale and brown bands|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Fried Dough Twists|香脆麻花|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|wheat flour,sugar,sesame,vegetable oil|vegan|slender golden dough ropes twisted tightly and fried crisp|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Mini Egg Biscuits|迷你雞蛋餅|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|wheat flour,egg,sugar,butter|vegetarian|tiny round golden biscuits with domed centres and browned rims|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Iced Gem Biscuits|七彩糖珠餅|Nostalgic Hong Kong|Nostalgic Biscuit and Snack|wheat flour,sugar,egg,royal icing|vegetarian|small round biscuits topped with ridged jewel-like icing in several pastel colours|a speckled counter inside a nostalgic Hong Kong neighbourhood store
Chocolate Coconut Snowballs|巧克力椰絲雪球|Hong Kong Dessert|Chilled Dessert|glutinous rice flour,coconut,dark chocolate ganache,sugar|vegetarian|snowy coconut-coated rice balls with one cut open to expose a firm chocolate centre|a marble table inside a warm Hong Kong dessert shop
Black Sesame Film Rolls|黑芝麻菲林卷|Nostalgic Hong Kong|Chilled Dessert|black sesame,rice flour,sugar,water|vegan|glossy jet-black sesame sheets rolled into loose translucent cylinders|a marble table inside a warm Hong Kong dessert shop
Peanut-Coated Rice Balls|糖不甩|Nostalgic Hong Kong|Sweet Soup|glutinous rice flour,peanut,sesame,sugar|vegan|plain chewy rice balls served dry under crushed peanut sesame and sugar|a marble table inside a warm Hong Kong dessert shop
Plain Brown Sugar Put Chai Ko|黃糖砵仔糕|Nostalgic Hong Kong|Street Snack|rice flour,wheat starch,brown sugar|vegan|a plain translucent amber steamed pudding released from a tiny porcelain bowl|a nostalgic Hong Kong street-snack cart
Glutinous Rice Stuffed Chicken Wing|糯米釀雞翼|Nostalgic Hong Kong|Street Snack|chicken wings,glutinous rice,shiitake mushroom,soy sauce|meat|a boneless grilled chicken wing cut open to reveal seasoned sticky rice|a compact Hong Kong night-market grill
Crispy Fried Fish Skin|脆炸魚皮|Nostalgic Hong Kong|Street Snack|fish skin,vegetable oil,salt|pescatarian|airy curled golden pieces of freshly fried fish skin in a shallow basket|a stainless-steel Hong Kong street-food counter
Cantonese Roast Goose|明爐燒鵝|Roast Meat and Staples|Roast Meat|goose,five-spice,maltose,soy sauce|meat|chopped bone-in goose with lacquered mahogany skin and juicy meat|a tiled counter inside a traditional Hong Kong siu mei shop
Honey-Glazed Char Siu|蜜汁叉燒|Roast Meat and Staples|Roast Meat|pork shoulder,maltose,honey,fermented red bean curd|meat|thick char siu slices with smoky red edges and a glossy honey glaze|a tiled counter inside a traditional Hong Kong siu mei shop
Crispy Roast Pork Belly|脆皮燒肉|Roast Meat and Staples|Roast Meat|pork belly,five-spice,coarse salt,rice vinegar|meat|even pork-belly pieces topped with blistered golden crackling and distinct meat layers|a tiled counter inside a traditional Hong Kong siu mei shop
Soy Sauce Chicken|豉油雞|Roast Meat and Staples|Roast Meat|chicken,soy sauce,star anise,ginger|meat|chopped chicken with smooth amber-brown soy-braised skin|a tiled counter inside a traditional Hong Kong siu mei shop
White-Cut Chicken|白切雞|Roast Meat and Staples|Roast Meat|chicken,ginger,spring onion,sesame oil|meat|neatly chopped poached chicken with pale yellow skin and ginger-scallion dip|a tiled counter inside a traditional Hong Kong siu mei shop
Cantonese Roast Duck|明爐燒鴨|Roast Meat and Staples|Roast Meat|duck,five-spice,maltose,soy sauce|meat|chopped roast duck with crisp reddish-brown skin and bone-in slices|a tiled counter inside a traditional Hong Kong siu mei shop
Three-Treasure Roast Meat Rice|燒味三寶飯|Roast Meat and Staples|Rice Plate|rice,char siu,roast duck,soy sauce chicken,blanched greens|meat|three distinct roast meats fanned over rice with bright green vegetables|a compact table inside a Hong Kong siu mei shop
Four-Treasure Roast Meat Rice|燒味四寶飯|Roast Meat and Staples|Rice Plate|rice,char siu,roast goose,roast pork,soy sauce chicken|meat|four clearly distinct roast meats arranged over steamed rice with savoury juices|a compact table inside a Hong Kong siu mei shop
Preserved Meat Claypot Rice|臘味煲仔飯|Roast Meat and Staples|Claypot Rice|rice,Chinese sausage,liver sausage,cured pork,soy sauce|meat|claypot rice topped with sliced red sausage dark liver sausage and cured pork|a compact table inside a traditional Hong Kong claypot-rice shop
Shiitake Chicken Claypot Rice|北菇滑雞煲仔飯|Roast Meat and Staples|Claypot Rice|rice,chicken,shiitake mushroom,ginger,soy sauce|meat|steamed chicken pieces and whole shiitake mushrooms over rice in a claypot|a compact table inside a traditional Hong Kong claypot-rice shop
Black Bean Spare Rib Claypot Rice|豉汁排骨煲仔飯|Roast Meat and Staples|Claypot Rice|rice,pork spare ribs,fermented black beans,garlic,chilli|meat|small spare-rib pieces and black beans spread across steaming claypot rice|a compact table inside a traditional Hong Kong claypot-rice shop
Fresh Eel Claypot Rice|黃鱔煲仔飯|Roast Meat and Staples|Claypot Rice|rice,freshwater eel,ginger,spring onion,soy sauce|pescatarian|glossy eel strips ginger and spring onion laid over rice in a claypot|a compact table inside a traditional Hong Kong claypot-rice shop
Salted Egg Beef Patty Claypot Rice|鹹蛋牛肉餅煲仔飯|Roast Meat and Staples|Claypot Rice|rice,minced beef,salted egg,water chestnuts,soy sauce|meat|a round steamed beef patty crowned by bright salted egg over claypot rice|a compact table inside a traditional Hong Kong claypot-rice shop
Salted Fish Pork Patty Claypot Rice|鹹魚肉餅煲仔飯|Roast Meat and Staples|Claypot Rice|rice,minced pork,salted fish,ginger,soy sauce|meat|a thick pork patty topped with a fragrant salted-fish piece over claypot rice|a compact table inside a traditional Hong Kong claypot-rice shop
Chocolate Lava Mini Mooncake Bites|巧克力流心迷你月餅|Festival Food|Festival Pastry|wheat flour,cocoa,dark chocolate ganache,butter|vegetarian|petite cocoa mooncakes with one split to release a glossy dark-chocolate centre|a moonlit family table during Hong Kong Mid-Autumn Festival
Pork Liver Congee|豬潤粥|Roast Meat and Staples|Congee|rice,pork liver,ginger,spring onion|meat|smooth white congee with just-cooked tender pork-liver slices ginger and spring onion|a marble table inside a traditional Hong Kong congee shop
Sliced Beef Congee|滑牛粥|Roast Meat and Staples|Congee|rice,beef,ginger,spring onion|meat|silky congee holding velvety thin beef slices and fine ginger|a marble table inside a traditional Hong Kong congee shop
Fish Belly Congee|魚腩粥|Roast Meat and Staples|Congee|rice,fish belly,ginger,spring onion|pescatarian|smooth congee with bone-in white fish-belly pieces ginger and spring onion|a marble table inside a traditional Hong Kong congee shop
Century Egg and Lean Pork Congee|皮蛋瘦肉粥|Roast Meat and Staples|Congee|rice,century egg,lean pork,ginger,spring onion|meat|creamy congee dotted with dark century-egg wedges and shredded lean pork|a marble table inside a traditional Hong Kong congee shop
Hong Kong Fried Dough Sticks|港式油炸鬼|Roast Meat and Staples|Street Snack|wheat flour,yeast,baking soda,vegetable oil|vegan|a pair of long airy golden fried-dough sticks with a crisp blistered surface|a marble table inside a traditional Hong Kong congee shop
Rice Noodle Roll Wrapped Dough Stick|炸兩|Roast Meat and Staples|Street Snack|rice noodle sheet,fried dough stick,sweet soy sauce,sesame sauce|vegan|crisp fried dough enclosed in a silky white rice-noodle sheet and cut into rounds|a marble table inside a traditional Hong Kong congee shop
Braised Beef Brisket Noodles|柱侯牛腩麵|Roast Meat and Staples|Noodle Soup|egg noodles,beef brisket,chu hou sauce,radish,broth|meat|springy noodles and tender brisket with radish in a dark aromatic broth|a marble table inside a traditional Hong Kong noodle shop
Hong Kong Fish Ball Noodles|港式魚蛋麵|Roast Meat and Staples|Noodle Soup|egg noodles,dace fish balls,fish broth,Chinese chives|pescatarian|thin springy noodles in clear broth with round pale dace fish balls|a marble table inside a traditional Hong Kong noodle shop
Roast Goose Rice|燒鵝飯|Roast Meat and Staples|Rice Plate|rice,roast goose,soy sauce,blanched greens|meat|lacquered chopped roast goose laid over rice with bright blanched greens|a compact table inside a Hong Kong siu mei shop
Char Siu and Roast Pork Rice|叉燒燒肉飯|Roast Meat and Staples|Rice Plate|rice,char siu,crispy roast pork,soy sauce,blanched greens|meat|red-edged char siu and crackling-topped roast pork arranged side by side over rice|a compact table inside a Hong Kong siu mei shop
""".strip()


YUE_DESCRIPTIONS = {
    "Street Snack": "{name}係香港街頭小食檔常見嘅小食，通常即叫即整，趁熱食最有風味。",
    "Wok-Fried Dish": "{name}係大牌檔常見嘅鑊氣小菜，通常炒好即刻熱辣辣上枱。",
    "Claypot Dish": "{name}係香港大牌檔常見嘅煲仔小菜，材料會喺熱煲入面煮至入味。",
    "Rice Plate": "{name}係茶餐廳常見嘅碟頭飯，餸菜同白飯會一碟上枱。",
    "Fried Rice": "{name}係香港茶記常見嘅炒飯，米飯會炒至乾身而且粒粒分明。",
    "Noodle Plate": "{name}係香港茶餐廳常見嘅粉麵，通常即叫即炒或者配湯上枱。",
    "Macaroni and Instant Noodles": "{name}係香港茶記常見嘅粉麵早餐，主料會同通粉或者公仔麵一齊上枱。",
    "Toast and Sandwich": "{name}係香港茶餐廳常見嘅多士或三文治，通常即叫即烘或者即叫即煎。",
    "Bakery Bun": "{name}係香港麵包舖常見嘅麵包，出爐後有鬆軟麵包香。",
    "Bakery Pastry": "{name}係香港餅店常見嘅酥餅，外層焗至金黃先出爐。",
    "Sweet Soup": "{name}係香港糖水舖常見嘅甜品，通常按傳統做法煮成一碗。",
    "Chilled Dessert": "{name}係香港甜品舖常見嘅凍甜品，會凍食或者加冰上枱。",
    "Festival Cake": "{name}係香港節慶時常見嘅糕點，按傳統做法蒸製或者煎香。",
    "Festival Pastry": "{name}係香港節慶時常見嘅應節糕餅，通常一家人一齊分享。",
    "Festival Savoury Dish": "{name}係香港節慶聚餐常見嘅傳統菜式，通常多人一齊分享。",
    "Cha Chaan Teng Drink": "{name}係香港茶餐廳常見嘅飲品，會按客人喜好凍飲或者熱飲。",
    "Herbal and Traditional Drink": "{name}係香港涼茶舖或者糖水舖常見嘅傳統飲品。",
    "Nostalgic Candy": "{name}係香港人熟悉嘅懷舊糖果，細細件方便慢慢食。",
    "Nostalgic Biscuit and Snack": "{name}係香港辦館同士多常見嘅懷舊零食，打開包裝就可以食。",
    "Roast Meat": "{name}係香港燒味舖常見嘅燒味，斬件後通常配飯或者淨食。",
    "Claypot Rice": "{name}係香港冬天常見嘅煲仔飯，飯同餸會喺砂煲入面一齊煮熟。",
    "Congee": "{name}係香港粥店常見嘅粥品，米粥煲至綿滑再加入配料。",
    "Noodle Soup": "{name}係香港粉麵店常見嘅湯麵，麵同配料會放喺熱湯入面上枱。",
}


ALLERGEN_RULES = {
    "gluten": ["wheat", "bread", "toast", "bun", "macaroni", "spaghetti", "noodles", "cracker", "biscuit", "soy sauce", "oyster sauce", "hoisin", "maltose wafer", "croissant"],
    "egg": ["egg", "custard", "mayonnaise", "sponge cake"],
    "milk": ["milk", "butter", "cream", "cheese", "custard", "evaporated milk", "condensed milk", "chocolate", "ovaltine", "horlicks"],
    "soy": ["soy", "tofu", "bean curd", "fermented bean curd", "hoisin", "oyster sauce"],
    "fish": ["fish", "salted fish", "dried fish", "fish sauce"],
    "shellfish": ["shrimp", "prawn", "crab", "clam", "oyster", "scallop", "cuttlefish", "squid", "razor clam"],
    "peanuts": ["peanut"],
    "tree-nuts": ["walnut", "almond", "cashew"],
    "sesame": ["sesame"],
}


DIETARY_TAGS = {
    "meat": ["contains-meat"],
    "pescatarian": ["pescatarian"],
    "vegetarian": ["vegetarian"],
    "vegan": ["vegan"],
}


COLLISION_RENAME_IDS = {
    519, 521, 522, 526, 527, 528, 529, 534, 536, 537, 539, 544, 549, 551, 552,
    559, 561, 563, 565, 567, 569, 574, 601, 602, 604, 608, 615, 619, 621, 622,
    626, 627, 628, 630, 631, 638, 644, 651, 652, 653, 656, 658, 673, 727, 728,
    729, 730, 734, 735, 736, 739, 741, 743, 744, 746, 749,
}


NAME_CONTEXTS = {
    "Street Snack": ("Hong Kong Street-Stall", "香港街頭"),
    "Wok-Fried Dish": ("Dai Pai Dong-Style", "大牌檔式"),
    "Claypot Dish": ("Dai Pai Dong Claypot", "大牌檔煲仔"),
    "Rice Plate": ("Cha Chaan Teng", "茶記"),
    "Fried Rice": ("Cha Chaan Teng", "茶記"),
    "Noodle Plate": ("Cha Chaan Teng", "茶記"),
    "Macaroni and Instant Noodles": ("Cha Chaan Teng", "茶記"),
    "Toast and Sandwich": ("Cha Chaan Teng", "茶記"),
    "Bakery Bun": ("Hong Kong Bakery", "港式餅店"),
    "Bakery Pastry": ("Hong Kong Bakery", "港式餅店"),
    "Sweet Soup": ("Hong Kong Dessert-Shop", "香港糖水舖"),
    "Chilled Dessert": ("Hong Kong Dessert-Shop", "香港甜品舖"),
    "Festival Cake": ("Hong Kong Festive", "香港應節"),
    "Festival Pastry": ("Hong Kong Festive", "香港應節"),
    "Festival Savoury Dish": ("Hong Kong Festive", "香港節慶"),
    "Cha Chaan Teng Drink": ("Cha Chaan Teng", "茶記"),
    "Herbal and Traditional Drink": ("Hong Kong Herbal-Shop", "香港涼茶舖"),
    "Nostalgic Candy": ("Old Hong Kong", "老香港"),
    "Nostalgic Biscuit and Snack": ("Old Hong Kong", "老香港"),
    "Roast Meat": ("Hong Kong Siu Mei Shop", "香港燒味店"),
    "Claypot Rice": ("Hong Kong Claypot-Rice Shop", "香港煲仔飯店"),
    "Congee": ("Hong Kong Congee-Shop", "香港粥店"),
    "Noodle Soup": ("Hong Kong Noodle-Shop", "香港粉麵舖"),
}


def slugify(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


def ingredient_phrase(items: list[str]) -> str:
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])}, and {items[-1]}"


def jyutping_for(offset: int) -> str:
    return JYUTPING_BY_OFFSET[offset]


def build() -> list[dict]:
    raw_rows = [line.strip() for line in DATA.splitlines() if line.strip() and not line.lstrip().startswith("#")]
    if len(raw_rows) != 250:
        raise ValueError(f"Expected 250 data rows, found {len(raw_rows)}")

    records = []
    seen_slugs: set[str] = set()
    seen_en: set[str] = set()
    seen_zh: set[str] = set()
    for offset, line in enumerate(raw_rows):
        fields = [field.strip() for field in line.split("|")]
        if len(fields) != 8:
            raise ValueError(f"Row {offset + 1} has {len(fields)} fields: {line}")
        en, zh, category, subcategory, ingredient_csv, diet, presentation, setting = fields
        dish_number = 501 + offset
        if dish_number in COLLISION_RENAME_IDS:
            en_prefix, zh_prefix = NAME_CONTEXTS[subcategory]
            en = f"{en_prefix} {en}"
            zh = f"{zh_prefix}{zh}"
        slug = slugify(en)
        if slug in seen_slugs or en in seen_en or zh in seen_zh:
            raise ValueError(f"Duplicate identity at row {offset + 1}: {en} / {zh} / {slug}")
        seen_slugs.add(slug)
        seen_en.add(en)
        seen_zh.add(zh)

        dish_id = f"hk-dish-{dish_number:04d}"
        ingredients = [item.strip() for item in ingredient_csv.split(",")]
        ingredient_text = ingredient_phrase(ingredients)
        allergy_haystack = " ".join(ingredients).lower()
        allergens = [name for name, needles in ALLERGEN_RULES.items() if any(needle in allergy_haystack for needle in needles)]
        image_path = f"images/{dish_id}-{slug}.png"
        record = {
                "id": dish_id,
                "slug": slug,
                "name": {"en": en, "zhHant": zh},
                "jyutping": jyutping_for(offset),
                "category": category,
                "subcategory": subcategory,
                "description": {
                    "en": f"{en} is a Hong Kong {subcategory.lower()} prepared with {ingredient_text}.",
                    "yue": YUE_DESCRIPTIONS[subcategory].format(name=zh),
                },
                "ingredients": ingredients,
                "dietaryTags": DIETARY_TAGS[diet],
                "allergens": allergens,
                "image": {
                    "path": image_path,
                    "alt": {
                        "en": f"A single serving of {en}, {presentation}.",
                        "yue": f"一份擺喺{setting}嘅{zh}。",
                    },
                },
                "imagePrompt": "\n".join(
                    [
                        "Use case: photorealistic-natural",
                        "Asset type: square food catalog photograph for a bundled Hong Kong dish library",
                        f"Primary request: an original, authentic photograph of exactly one serving of {en} ({zh})",
                        f"Scene/backdrop: {setting}; warm, lived-in Hong Kong atmosphere; background softly out of focus",
                        f"Subject: {presentation}; visibly and accurately prepared with {ingredient_text}",
                        "Style/medium: photorealistic editorial food photography with natural textures and restrained styling",
                        "Composition/framing: square 1:1 close three-quarter overhead view; the single dish or drink centered; no collage and no repeated servings",
                        "Lighting/mood: warm window light mixed with gentle practical light; appetizing but believable colour",
                        "Materials/textures: authentic ceramic, melamine, metal, glass, paper, or bamboo service ware appropriate to the specified dish",
                        "Constraints: show only the specified dish and its normal edible garnish; culturally accurate Hong Kong presentation; no people or hands; no text or lettering; no watermark; no logos, brands, packaging labels, or menu boards",
                        "Avoid: unrelated side dishes, duplicated food, decorative lettering, plastic-looking food, excessive steam, impossible ingredients, fusion restyling",
                    ]
                ),
            }
        if dish_number % 20 == 0:
            record["chocolateFilled"] = True
        records.append(record)
    return records


if __name__ == "__main__":
    catalog = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(catalog)} records to {OUTPUT}")
