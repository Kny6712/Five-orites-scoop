// scripts/seed-products.ts
// Five-orites Scoop — Firestore Product Seed Script (64 SKUs)
// Compatible with Node.js v26

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, 'serviceAccountKey.json');
const DEFAULT_STOCK = { cup: 50, pint: 30, halfGallon: 20, gallon: 10 };
const PRESERVE_STOCK = process.env.PRESERVE_STOCK === 'true'; 
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const PRICING_MATRIX: Record<number, any> = {
  1: { cup: 65,  pint: 200, halfGallon: 500, gallon: 950 },
  2: { cup: 60,  pint: 190, halfGallon: 480, gallon: 900 },
  3: { cup: 65,  pint: 200, halfGallon: 500, gallon: 950 },
  4: { cup: 65,  pint: 200, halfGallon: 500, gallon: 950 },
  5: { cup: 70,  pint: 210, halfGallon: 520, gallon: 980 },
  6: { cup: 65,  pint: 200, halfGallon: 500, gallon: 950 },
  7: { cup: 70,  pint: 210, halfGallon: 520, gallon: 980 },
  8: { cup: 65,  pint: 200, halfGallon: 500, gallon: 950 },
};

const PRODUCT_CATALOG = [
  // Set 1 · Chocolates
  { setNumber: 1, setName: 'Chocolates', variantName: 'Chocolate Fudge Brownie', description: 'Rich chocolate ice cream swirled with gooey fudge ribbons and loaded with chewy brownie chunks. A chocolate lover\'s dream.' },
  { setNumber: 1, setName: 'Chocolates', variantName: 'Double Dark Chocolate', description: 'Intensely deep dark chocolate base with dark chocolate chips. For those who crave the purest, most serious chocolate experience.' },
  { setNumber: 1, setName: 'Chocolates', variantName: 'Chocolate Therapy', description: 'Velvety chocolate ice cream with chocolate cookies, mini chocolate chips, and a swirl of chocolate fudge. The ultimate comfort scoop.' },
  { setNumber: 1, setName: 'Chocolates', variantName: 'Mexican Chocolate', description: 'Warm cinnamon and a hint of chili spice woven into smooth chocolate ice cream — inspired by traditional Mexican hot chocolate.' },
  { setNumber: 1, setName: 'Chocolates', variantName: 'Phish Food Style', description: 'Chocolate ice cream with fudge fish, marshmallow swirls, and caramel ribbons. A playful and indulgent classic.' },
  { setNumber: 1, setName: 'Chocolates', variantName: 'Rocky Road', description: 'A beloved classic: creamy chocolate ice cream with fluffy marshmallows and crunchy roasted almonds. Timeless and satisfying.' },
  { setNumber: 1, setName: 'Chocolates', variantName: 'Chocolate Peanut Butter Cup', description: 'Smooth peanut butter swirled through chocolate ice cream with chunks of peanut butter cups in every bite.' },
  { setNumber: 1, setName: 'Chocolates', variantName: 'New York Super Fudge Chunk', description: 'Chocolate ice cream packed with white and dark chocolate chunks, walnuts, almonds, and chocolate-covered almonds. No holding back.' },
  // Set 2 · Vanilla
  { setNumber: 2, setName: 'Vanilla', variantName: 'Classic Madagascar Vanilla', description: 'Pure, clean, and elegant — vanilla ice cream made with authentic Madagascar vanilla beans for that floral, warm depth of flavour.' },
  { setNumber: 2, setName: 'Vanilla', variantName: 'Vanilla Bean Supreme', description: 'Extra-generous vanilla bean specks in every spoonful. A premium, custard-style vanilla that stands alone beautifully.' },
  { setNumber: 2, setName: 'Vanilla', variantName: 'French Vanilla Custard', description: 'Richer and creamier than classic vanilla, with an egg-custard base that delivers a silky, velvety texture and deeper flavour.' },
  { setNumber: 2, setName: 'Vanilla', variantName: 'Vanilla Cookie Crumble', description: 'Smooth vanilla ice cream layered with crisp vanilla cookie crumbles for delightful texture in every scoop.' },
  { setNumber: 2, setName: 'Vanilla', variantName: 'Vanilla Caramel Swirl', description: 'Classic vanilla base kissed with golden ribbons of buttery caramel. Simple, sweet, and irresistible.' },
  { setNumber: 2, setName: 'Vanilla', variantName: 'Tahitian Vanilla Bourbon', description: 'An exotic Tahitian vanilla paired with a subtle bourbon extract for a complex, sophisticated adult dessert experience.' },
  { setNumber: 2, setName: 'Vanilla', variantName: 'Vanilla Toffee Crunch', description: 'Creamy vanilla ice cream studded with shards of buttery English toffee for sweet crunch in every bite.' },
  { setNumber: 2, setName: 'Vanilla', variantName: 'Vanilla Honeycomb', description: 'Velvety vanilla with crunchy honeycomb candy pieces that slowly melt into toffee sweetness as you eat.' },
  // Set 3 · Strawberry
  { setNumber: 3, setName: 'Strawberry', variantName: 'Strawberry Cheesecake', description: 'Creamy strawberry ice cream with ribbons of strawberry compote and chunks of graham-crusted cheesecake. Perfectly indulgent.' },
  { setNumber: 3, setName: 'Strawberry', variantName: 'Strawberry Shortcake', description: 'Strawberry ice cream layered with buttery shortcake crumbles and bright strawberry sauce — a summer classic reimagined.' },
  { setNumber: 3, setName: 'Strawberry', variantName: 'Wild Strawberry Swirl', description: 'Intensely fruity wild strawberry ice cream with a bright swirl of strawberry jam bursting with real berry flavour.' },
  { setNumber: 3, setName: 'Strawberry', variantName: 'Strawberry Balsamic', description: 'A sophisticated pairing of sweet strawberry ice cream with a tangy aged balsamic reduction. Elegant and unexpected.' },
  { setNumber: 3, setName: 'Strawberry', variantName: 'Strawberry Fields Forever', description: 'Whole-strawberry pieces suspended in a light, fresh strawberry base — like walking through a strawberry field in every spoonful.' },
  { setNumber: 3, setName: 'Strawberry', variantName: 'Strawberry Yogurt Blend', description: 'A lighter option blending real strawberry with tangy Greek yogurt for a refreshing, health-inspired frozen treat.' },
  { setNumber: 3, setName: 'Strawberry', variantName: 'Strawberry Basil', description: 'Garden-fresh basil infused into smooth strawberry ice cream — a bright and herbaceous flavour pairing that surprises and delights.' },
  { setNumber: 3, setName: 'Strawberry', variantName: 'Strawberry Cream Delight', description: 'Soft and pillowy strawberries-and-cream flavour with swirls of rich white cream throughout a rosy pink base.' },
  // Set 4 · Mango
  { setNumber: 4, setName: 'Mango', variantName: 'Classic Mango Sorbet', description: 'Pure ripe mango, churned into a smooth, dairy-free sorbet. Intensely tropical with natural sweetness and zero distractions.' },
  { setNumber: 4, setName: 'Mango', variantName: 'Mango Graham', description: 'Filipino-inspired layered dessert in ice cream form: sweet mango, crushed graham crackers, and condensed cream swirls.' },
  { setNumber: 4, setName: 'Mango', variantName: 'Mango Sticky Rice', description: 'Creamy mango ice cream with glutinous rice bits and a hint of coconut milk — a Southeast Asian classic frozen for your enjoyment.' },
  { setNumber: 4, setName: 'Mango', variantName: 'Mango Chili Lime', description: 'Sweet Philippine mango with a citrusy lime zing and just enough chili heat. Bold, tropical, and addictively complex.' },
  { setNumber: 4, setName: 'Mango', variantName: 'Mango Coconut Cream', description: 'Luscious mango and velvety coconut cream blended into a tropical paradise — smooth, fragrant, and impossibly good.' },
  { setNumber: 4, setName: 'Mango', variantName: 'Mango Cheesecake', description: 'Tangy cream cheese base with ribbons of ripe mango and a buttery graham cracker crumble for tropical cheesecake vibes.' },
  { setNumber: 4, setName: 'Mango', variantName: 'Mango Tango Twist', description: 'A fiesta of mango sorbet swirled with a tangy mango-tamarind ribbon. Playful, sour, sweet, and absolutely refreshing.' },
  { setNumber: 4, setName: 'Mango', variantName: 'Mango Passionfruit', description: 'Sun-ripe mango meets fragrant passionfruit in a creamy ice cream that tastes like a tropical island sunset.' },
  // Set 5 · Ube
  { setNumber: 5, setName: 'Ube', variantName: 'Classic Ube Halaya', description: 'The original — traditional purple yam ice cream with the unmistakable earthy-sweet flavour of Filipino ube halaya. A national favourite.' },
  { setNumber: 5, setName: 'Ube', variantName: 'Ube Cheese', description: 'Sweet ube ice cream with swirls of salty cream cheese — the iconic Filipino combination that works perfectly every time.' },
  { setNumber: 5, setName: 'Ube', variantName: 'Ube Macapuno', description: 'Velvety ube base loaded with tender strands of macapuno (coconut sport) — a classic Pinoy pairing in frozen form.' },
  { setNumber: 5, setName: 'Ube', variantName: 'Ube Coconut Swirl', description: 'Creamy ube ice cream with a fragrant coconut cream ribbon weaving through every scoop for layered tropical flavour.' },
  { setNumber: 5, setName: 'Ube', variantName: 'Ube Cookies and Cream', description: 'Purple yam meets Oreo — smooth ube ice cream packed with crushed chocolate sandwich cookies for a perfect contrast.' },
  { setNumber: 5, setName: 'Ube', variantName: 'Ube Leche Flan', description: 'Creamy ube ice cream with ribbons of rich caramel-kissed leche flan — two Filipino dessert legends in one scoop.' },
  { setNumber: 5, setName: 'Ube', variantName: 'Ube Pandan Fusion', description: 'An aromatic blend of ube and pandan — two beloved Filipino flavours creating a beautifully fragrant and layered experience.' },
  { setNumber: 5, setName: 'Ube', variantName: 'Ube Halo-Halo Style', description: 'Inspired by the iconic Filipino summer dessert — ube ice cream with kidney beans, nata de coco bits, and pinipig for texture.' },
  // Set 6 · Mint
  { setNumber: 6, setName: 'Mint', variantName: 'Mint Chocolate Chip', description: 'The timeless classic: cool, refreshing mint ice cream with generous dark chocolate chips in every scoop.' },
  { setNumber: 6, setName: 'Mint', variantName: 'Mint Fudge Swirl', description: 'Icy mint base elevated with thick ribbons of warm chocolate fudge creating a perfectly balanced cool-and-rich flavour.' },
  { setNumber: 6, setName: 'Mint', variantName: 'Mint Oreo Crumble', description: 'Cool mint ice cream loaded with crushed Oreo cookies for a cookies-and-cream upgrade with a refreshing minty twist.' },
  { setNumber: 6, setName: 'Mint', variantName: 'Mint Chocolate Cookie', description: 'Minty fresh ice cream with chunky chocolate cookie pieces — like your favourite mint cookie in frozen form.' },
  { setNumber: 6, setName: 'Mint', variantName: 'Peppermint Bark', description: 'Holiday-inspired peppermint ice cream with white and dark chocolate bark shards. Festive, crunchy, and coolly satisfying.' },
  { setNumber: 6, setName: 'Mint', variantName: 'Mint Cheesecake', description: 'Creamy cheesecake base with a burst of cool mint and crushed graham crackers for a chilled, minty cheesecake experience.' },
  { setNumber: 6, setName: 'Mint', variantName: 'Mint Brownie Batter', description: 'Cool mint ice cream with swirls of raw brownie batter and chocolate chips — indulgent, daring, and absolutely delicious.' },
  { setNumber: 6, setName: 'Mint', variantName: 'Mint Coconut Twist', description: 'A tropical spin on mint: cool peppermint paired with creamy coconut for a refreshing and unexpected flavour combination.' },
  // Set 7 · Coffee
  { setNumber: 7, setName: 'Coffee', variantName: 'Classic Coffee Bean', description: 'Pure, robust coffee ice cream with whole roasted coffee beans folded in for an authentic espresso-forward experience.' },
  { setNumber: 7, setName: 'Coffee', variantName: 'Mocha Almond Fudge', description: 'Rich mocha ice cream with crunchy roasted almonds and a thick fudge swirl. Deep, nutty, and intensely satisfying.' },
  { setNumber: 7, setName: 'Coffee', variantName: 'Cappuccino Crunch', description: 'Frothy cappuccino-flavoured ice cream with espresso granules and crunchy cocoa nibs — your morning coffee, in dessert form.' },
  { setNumber: 7, setName: 'Coffee', variantName: 'Coffee Caramel Swirl', description: 'Smooth coffee ice cream with ribbons of buttery salted caramel — a grown-up, cafe-inspired flavour combination.' },
  { setNumber: 7, setName: 'Coffee', variantName: 'Tiramisu Style', description: 'Mascarpone-infused coffee ice cream with espresso-soaked ladyfinger crumbles and a dusting of cocoa. Italy in a cup.' },
  { setNumber: 7, setName: 'Coffee', variantName: 'Coffee Toffee Bar', description: 'Bold espresso ice cream with toffee bar chunks and a caramel ribbon — crunchy, sweet, and deeply caffeinated.' },
  { setNumber: 7, setName: 'Coffee', variantName: 'Vietnamese Coffee', description: 'Inspired by ca phe sua da — a dark drip coffee ice cream swirled with rich condensed milk for that signature sweetness.' },
  { setNumber: 7, setName: 'Coffee', variantName: 'Coffee Chocolate Chip', description: 'Classic coffee ice cream studded with dark chocolate chips — a simple yet perfect flavour pairing for any time of day.' },
  // Set 8 · Cookies & Cream
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Classic Cookies and Cream', description: 'The all-time favourite: creamy vanilla ice cream generously packed with crushed chocolate sandwich cookies.' },
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Double Stuffed Cookie', description: 'Extra cream filling from double-stuffed cookies swirled into vanilla ice cream — for those who always eat the filling first.' },
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Cookie Butter Swirl', description: 'Vanilla ice cream ribboned with creamy Belgian cookie butter (speculoos) and crushed spiced biscuit pieces.' },
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Cookies and Caramel', description: 'Classic cookies and cream upgraded with a golden caramel swirl for a sweet, salty, and crunchy triple-threat.' },
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Chocolate Chip Cookie Dough', description: 'Vanilla ice cream with edible chocolate chip cookie dough chunks — because cookie dough is always better than the baked version.' },
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Birthday Cake Cookie', description: 'Funfetti cake-flavoured ice cream with birthday cake cookie pieces and rainbow sprinkles. Every day is a celebration.' },
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Cookies and Cream Fudge', description: 'Cookies-and-cream ice cream with a thick fudge ribbon layered throughout for extra chocolate richness in every bite.' },
  { setNumber: 8, setName: 'Cookies & Cream', variantName: 'Peanut Butter Cookie Crunch', description: 'Peanut butter ice cream base loaded with peanut butter cookie crumbles and chocolate chips — for the peanut butter fanatic.' },
];

async function seedProducts(): Promise<void> {
  console.log('\n🍦  Five-orites Scoop — Firestore Product Seeder');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📦  Total SKUs to seed: ${PRODUCT_CATALOG.length}\n`);

  const batch = db.batch();
  const productsCol = db.collection('products');

  for (const product of PRODUCT_CATALOG) {
    const pricing = PRICING_MATRIX[product.setNumber];
    const slug = product.variantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const docId = `set${product.setNumber}_${slug}`;
    const docRef = productsCol.doc(docId);

    // Look up existing stock so we don't clobber real inventory counts
    let stockToWrite = DEFAULT_STOCK;
    if (PRESERVE_STOCK) {
      const existingDoc = await docRef.get();
      const existingStock = existingDoc.exists ? existingDoc.data()?.stock : undefined;
      if (existingStock) {
        stockToWrite = existingStock;
      }
    }

    batch.set(docRef, {
      setNumber: product.setNumber,
      setName: product.setName,
      variantName: product.variantName,
      description: product.description,
      imageUrl: '',
      pricing,
      stock: stockToWrite,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log(`  ✔  Set ${product.setNumber} · ${product.setName.padEnd(15)} → ${product.variantName}`);
  }

  console.log('\n⏳  Writing to Firestore...\n');
  await batch.commit();
  console.log(`\n✅  Seed complete! ${PRODUCT_CATALOG.length} products written.\n`);
  process.exit(0);
}

seedProducts().catch((err: any) => {
  console.error('❌  Seed error:', err.message || err);
  process.exit(1);
});
