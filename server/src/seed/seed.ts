import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Review } from '../models/Review';
import { Cart } from '../models/Cart';
import { slugify } from '../utils/slugify';

function ensureSeedImages(): Record<string, string> {
  const seedDir = path.join(process.cwd(), 'uploads', 'seed');
  fs.mkdirSync(seedDir, { recursive: true });

  const palettes: Record<string, { bg: string; accent: string; label: string }> = {
    home: { bg: '#EFECE6', accent: '#6B7C6E', label: 'HOME GOODS' },
    stationery: { bg: '#EAE6DF', accent: '#7D6E5D', label: 'PAPER & DESK' },
    apparel: { bg: '#E6EAE8', accent: '#3E6B5E', label: 'TEXTILES' },
    kitchen: { bg: '#F0EBE3', accent: '#8C6249', label: 'KITCHENWARE' },
    accessories: { bg: '#E8E9EC', accent: '#525B66', label: 'EVERYDAY CARRY' },
  };

  const paths: Record<string, string> = {};

  for (const [key, style] of Object.entries(palettes)) {
    const filename = `${key}.svg`;
    const fullPath = path.join(seedDir, filename);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${style.bg}"/>
  <rect x="240" y="150" width="320" height="240" rx="12" fill="#FFFFFF" stroke="${style.accent}" stroke-width="2" opacity="0.85"/>
  <circle cx="400" cy="255" r="42" fill="${style.accent}" opacity="0.22"/>
  <text x="400" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" letter-spacing="3" fill="${style.accent}" text-anchor="middle">${style.label}</text>
</svg>`;
    fs.writeFileSync(fullPath, svg, 'utf-8');
    paths[key] = `/uploads/seed/${filename}`;
  }

  return paths;
}

async function seed() {
  await connectDB();
  const images = ensureSeedImages();

  // Clear existing data so seed is cleanly idempotent
  await Promise.all([
    Review.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);

  const [adminHash, sellerHash, buyerHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Seller@123', 10),
    bcrypt.hash('Buyer@123', 10),
  ]);

  const [admin, seller1, seller2, buyer] = await User.create([
    {
      name: 'Clara Vance',
      email: 'admin@demo.com',
      passwordHash: adminHash,
      role: 'admin',
    },
    {
      name: 'Hannah Lindqvist',
      email: 'seller@demo.com',
      passwordHash: sellerHash,
      role: 'seller',
      storeName: 'Maple & Thread',
    },
    {
      name: 'Julian Mercer',
      email: 'seller2@demo.com',
      passwordHash: sellerHash,
      role: 'seller',
      storeName: 'Stone Studio',
    },
    {
      name: 'Owen Patel',
      email: 'buyer@demo.com',
      passwordHash: buyerHash,
      role: 'buyer',
    },
  ]);

  const categoryNames = ['Home', 'Stationery', 'Apparel', 'Kitchen', 'Accessories'];
  const createdCategories = await Category.create(
    categoryNames.map((name) => ({ name, slug: slugify(name) }))
  );

  const catMap = Object.fromEntries(
    createdCategories.map((c) => [c.slug, c._id])
  );

  const catalog = [
    {
      seller: seller1._id,
      title: 'Washed Linen Throw Blanket',
      description: 'Medium-weight European flax linen throw with subtle herringbone weave and fringed edges. Pre-washed for immediate softness.',
      price: 8400,
      stock: 14,
      category: catMap.home,
      images: [images.home],
    },
    {
      seller: seller2._id,
      title: 'Matte Stoneware Table Vase',
      description: 'Wheel-thrown speckled clay vessel with a waterproof interior glaze and raw unglazed exterior base. Stands 21 cm tall.',
      price: 4600,
      stock: 9,
      category: catMap.home,
      images: [images.home],
    },
    {
      seller: seller1._id,
      title: 'Beeswax Taper Candle Pair',
      description: 'Hand-dipped 100% pure local beeswax tapers with braided cotton wicks. Dripless burn time of approximately 10 hours each.',
      price: 2200,
      stock: 30,
      category: catMap.home,
      images: [images.home],
    },
    {
      seller: seller2._id,
      title: 'Oiled Walnut Desk Tray',
      description: 'Solid American black walnut catchall tray milled from a single block and finished with food-safe tung oil.',
      price: 3800,
      stock: 4,
      category: catMap.home,
      images: [images.home],
    },
    {
      seller: seller1._id,
      title: 'Lay-Flat Thread-Bound Notebook',
      description: '192 pages of 100gsm fountain-pen friendly Japanese cream paper wrapped in bookbinders linen cloth.',
      price: 2400,
      stock: 25,
      category: catMap.stationery,
      images: [images.stationery],
    },
    {
      seller: seller2._id,
      title: 'Solid Brass Hexagonal Pen',
      description: 'Precision-machined raw brass rollerball pen that develops a warm patina over time. Accepts standard G2 refills.',
      price: 5200,
      stock: 11,
      category: catMap.stationery,
      images: [images.stationery],
    },
    {
      seller: seller1._id,
      title: 'Cotton Rag Correspondence Set',
      description: 'Box of 20 heavy 300gsm deckle-edge flat note cards paired with matching gummed envelopes.',
      price: 2800,
      stock: 18,
      category: catMap.stationery,
      images: [images.stationery],
    },
    {
      seller: seller2._id,
      title: 'Archival Desktop Perpetual Calendar',
      description: 'Minimalist letterpress-printed heavy card stock blocks seated in a brushed steel stand.',
      price: 3400,
      stock: 3,
      category: catMap.stationery,
      images: [images.stationery],
    },
    {
      seller: seller1._id,
      title: 'Organic Heavyweight Pocket Tee',
      description: '260gsm combed organic cotton jersey in a relaxed boxy cut with reinforced collar ribbing.',
      price: 4200,
      stock: 22,
      category: catMap.apparel,
      images: [images.apparel],
    },
    {
      seller: seller1._id,
      title: 'Merino Ribbed Watch Cap',
      description: 'Fine 100% Australian merino wool beanie knit in a dense fisherman rib for breathable warmth.',
      price: 3600,
      stock: 16,
      category: catMap.apparel,
      images: [images.apparel],
    },
    {
      seller: seller1._id,
      title: 'Selvedge Canvas Work Apron',
      description: '14oz unbleached cotton duck canvas apron with cross-back webbing straps and reinforced tool pockets.',
      price: 6400,
      stock: 7,
      category: catMap.apparel,
      images: [images.apparel],
    },
    {
      seller: seller1._id,
      title: 'Linen Relaxed Overshirt',
      description: 'Breathable garment-dyed linen button-up with corozo nut buttons and dual chest patch pockets.',
      price: 9200,
      stock: 6,
      category: catMap.apparel,
      images: [images.apparel],
    },
    {
      seller: seller2._id,
      title: 'Porcelain Pour-Over Coffee Dripper',
      description: 'Spiral-ribbed ceramic dripper engineered for even extraction. Fits standard 02 cone paper filters.',
      price: 3200,
      stock: 15,
      category: catMap.kitchen,
      images: [images.kitchen],
    },
    {
      seller: seller2._id,
      title: 'End-Grain Maple Cutting Board',
      description: 'Reversible butcher block board gentle on chef knives, equipped with recessed finger grips.',
      price: 7600,
      stock: 5,
      category: catMap.kitchen,
      images: [images.kitchen],
    },
    {
      seller: seller2._id,
      title: 'Hand-Forged Carbon Steel Skillet',
      description: '10-inch spun carbon steel pan that seasons naturally into a slick non-stick cooking surface.',
      price: 8800,
      stock: 8,
      category: catMap.kitchen,
      images: [images.kitchen],
    },
    {
      seller: seller1._id,
      title: 'Waffle Weave Kitchen Towel Set',
      description: 'Set of three absorbent cotton-linen blend tea towels with sewn hanging loops.',
      price: 2600,
      stock: 28,
      category: catMap.kitchen,
      images: [images.kitchen],
    },
    {
      seller: seller1._id,
      title: 'Vegetable-Tanned Card Holder',
      description: 'Slim saddle-stitched full-grain leather wallet with four card slots and a central folded bill pocket.',
      price: 4800,
      stock: 12,
      category: catMap.accessories,
      images: [images.accessories],
    },
    {
      seller: seller1._id,
      title: 'Waxed Canvas Everyday Tote',
      description: 'Water-resistant 18oz waxed cotton tote with bridle leather handles and interior laptop sleeve.',
      price: 7800,
      stock: 10,
      category: catMap.accessories,
      images: [images.accessories],
    },
    {
      seller: seller2._id,
      title: 'Brushed Brass Key Hook',
      description: 'Solid cast brass belt and pocket clip with split ring for secure everyday key carry.',
      price: 2400,
      stock: 20,
      category: catMap.accessories,
      images: [images.accessories],
    },
    {
      seller: seller2._id,
      title: 'Woven Wool Scarf',
      description: 'Soft brushed lambswool scarf in a muted oatmeal check pattern, finished with short twisted fringe.',
      price: 6800,
      stock: 2,
      category: catMap.accessories,
      images: [images.accessories],
    },
  ];

  const products = await Product.create(catalog);

  // Create 3 sample orders for buyer@demo.com in different statuses
  const order1 = await Order.create({
    buyer: buyer._id,
    items: [
      {
        product: products[0]._id,
        seller: seller1._id,
        titleSnapshot: products[0].title,
        priceSnapshot: products[0].price,
        quantity: 1,
        status: 'delivered',
      },
      {
        product: products[12]._id,
        seller: seller2._id,
        titleSnapshot: products[12].title,
        priceSnapshot: products[12].price,
        quantity: 1,
        status: 'delivered',
      },
    ],
    shippingAddress: {
      fullName: 'Owen Patel',
      line1: '412 Cedar Avenue, Apt 3B',
      city: 'Portland',
      postalCode: '97205',
      phone: '503-555-0194',
    },
    totalAmount: products[0].price + products[12].price,
    payment: {
      method: 'test_card',
      status: 'paid',
      reference: 'PAY-SEED-1001',
      last4: '4242',
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  });

  await Order.create({
    buyer: buyer._id,
    items: [
      {
        product: products[4]._id,
        seller: seller1._id,
        titleSnapshot: products[4].title,
        priceSnapshot: products[4].price,
        quantity: 2,
        status: 'shipped',
      },
    ],
    shippingAddress: {
      fullName: 'Owen Patel',
      line1: '412 Cedar Avenue, Apt 3B',
      city: 'Portland',
      postalCode: '97205',
      phone: '503-555-0194',
    },
    totalAmount: products[4].price * 2,
    payment: {
      method: 'test_card',
      status: 'paid',
      reference: 'PAY-SEED-1002',
      last4: '4242',
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  await Order.create({
    buyer: buyer._id,
    items: [
      {
        product: products[1]._id,
        seller: seller2._id,
        titleSnapshot: products[1].title,
        priceSnapshot: products[1].price,
        quantity: 1,
        status: 'placed',
      },
    ],
    shippingAddress: {
      fullName: 'Owen Patel',
      line1: '412 Cedar Avenue, Apt 3B',
      city: 'Portland',
      postalCode: '97205',
      phone: '503-555-0194',
    },
    totalAmount: products[1].price,
    payment: {
      method: 'test_card',
      status: 'paid',
      reference: 'PAY-SEED-1003',
      last4: '4242',
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  });

  // Add realistic reviews on delivered products
  await Review.create([
    {
      product: products[0]._id,
      buyer: buyer._id,
      rating: 5,
      comment: 'Substantial weave without feeling heavy. Washed well right out of the package.',
    },
    {
      product: products[12]._id,
      buyer: buyer._id,
      rating: 5,
      comment: 'Holds heat nicely during morning pour-overs and cleans up in seconds.',
    },
  ]);

  await Product.updateOne(
    { _id: products[0]._id },
    { $set: { ratingAverage: 5, ratingCount: 1 } }
  );
  await Product.updateOne(
    { _id: products[12]._id },
    { $set: { ratingAverage: 5, ratingCount: 1 } }
  );

  console.log(`Seed completed: 4 users, ${createdCategories.length} categories, ${products.length} products, 3 orders (${order1._id} delivered).`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});