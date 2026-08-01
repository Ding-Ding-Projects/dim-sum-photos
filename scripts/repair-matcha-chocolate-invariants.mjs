import fs from 'node:fs';

const files = [
  'dim-sum/catalog-parts/part-3001-3030.json',
  'dim-sum/catalog-parts/part-3031-3060.json',
  'dim-sum/catalog-parts/part-3061-3090.json',
  'dim-sum/catalog-parts/part-3091-3120.json',
  'dim-sum/catalog-parts/part-3121-3150.json'
];

for (const filename of files) {
  const dishes = JSON.parse(fs.readFileSync(filename, 'utf8'));
  for (const dish of dishes) {
    const number = Number(dish.id.slice(-4));
    if (number >= 3001 && number <= 4000 && number % 20 === 0) {
      dish.ingredients = [...new Set([...dish.ingredients, 'chocolate'])];
      dish.description.en += ' with chocolate and matcha.';
      dish.description.yue += '，加上朱古力同抹茶。';
      dish.imagePrompt += ' Include chocolate and matcha clearly as part of the filling, sauce, dough, or flavour.';
      dish.chocolateFilled = true;
    }
  }
  fs.writeFileSync(filename, `${JSON.stringify(dishes, null, 2)}\n`, 'utf8');
}

console.log('Repaired twentieth-record chocolate invariants through hk-dish-3140.');
