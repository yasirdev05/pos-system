/**
 * seed-native.ts
 * Uses the MongoDB Node.js driver directly — no Prisma transactions required.
 * Works with standalone MongoDB instances (no replica set needed).
 */
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || "mongodb+srv://7262yas_db_user:CyqWqFYKsSEaeU7e@cluster0.cc7r21b.mongodb.net/pos_db?retryWrites=true&w=majority";

// Extract database name from URI
function getDbName(uri: string): string {
  const parts = uri.split('/');
  const last = parts[parts.length - 1].split('?')[0];
  return last || 'pos_db';
}

const hash = (p: string) => bcrypt.hash(p, 10);

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function newId() {
  return new ObjectId();
}

async function main() {
  console.log('🌱 Seeding database with native MongoDB driver...');
  console.log(`   Connecting to: ${MONGO_URI.replace(/:([^@]+)@/, ':***@')}`);

  const isSrv = MONGO_URI.startsWith('mongodb+srv://');
  const client = new MongoClient(MONGO_URI, isSrv ? {} : { directConnection: true });
  await client.connect();
  console.log('✅ Connected to MongoDB');

  const dbName = getDbName(MONGO_URI);
  const db = client.db(dbName);

  // ─── Collections ───────────────────────────────────────────────────────────
  const users        = db.collection('User');
  const categories   = db.collection('Category');
  const suppliers    = db.collection('Supplier');
  const products     = db.collection('Product');
  const customers    = db.collection('Customer');
  const sales        = db.collection('Sale');
  const saleItems    = db.collection('SaleItem');
  const expenses     = db.collection('Expense');
  const bizSettings  = db.collection('BusinessSettings');

  // ─── 1. Business Settings ─────────────────────────────────────────────────
  const existingSettings = await bizSettings.findOne({});
  if (!existingSettings) {
    await bizSettings.insertOne({
      _id: newId(),
      companyName: 'Foji Store',
      ownerName: 'Qaiser Abbas',
      phone: '0307 8838980',
      email: 'admin@pos.com',
      address: '24 np sadiqabad JDW road',
      taxPercentage: 0,
      currency: 'PKR',
      invoicePrefix: 'TMP-',
      returnPolicy: 'Returns not accepted',
    });
    console.log('✅ Business settings created');
  } else {
    console.log('⏭  Business settings already exist');
  }

  // ─── 2. Users ──────────────────────────────────────────────────────────────
  const existingAdmin = await users.findOne({ email: 'admin@pos.com' });
  let adminId: ObjectId;
  let managerId: ObjectId;
  let cashierId: ObjectId;

  if (!existingAdmin) {
    adminId   = newId();
    managerId = newId();
    cashierId = newId();

    await users.insertOne({ _id: adminId,   name: 'Qaiser Abbas',   email: 'admin@pos.com',   password: await hash('admin5658'),   role: 'ADMIN',   createdAt: new Date(), updatedAt: new Date() });
    await users.insertOne({ _id: managerId, name: 'Ansir Mehmood', email: 'manager@pos.com', password: await hash('manager5658'), role: 'MANAGER', createdAt: new Date(), updatedAt: new Date() });
    await users.insertOne({ _id: cashierId, name: 'Mughees Abbas',      email: 'cashier@pos.com', password: await hash('cashier095'), role: 'CASHIER', createdAt: new Date(), updatedAt: new Date() });
    console.log('✅ Users created');
  } else {
    adminId   = existingAdmin._id as ObjectId;
    const mgr = await users.findOne({ email: 'manager@pos.com' });
    const csh = await users.findOne({ email: 'cashier@pos.com' });
    managerId = (mgr?._id ?? adminId) as ObjectId;
    cashierId = (csh?._id ?? adminId) as ObjectId;
    console.log('⏭  Users already exist');
  }

  // ─── 3. Categories ────────────────────────────────────────────────────────
  const catDefs = [
    { name: 'Electronics',        description: 'Electronic gadgets and devices' },
    { name: 'Accessories',        description: 'Product accessories and add-ons' },
    { name: 'Clothing',           description: 'Apparel and fashion items' },
    { name: 'Food & Beverages',   description: 'Food and drink products' },
    { name: 'Furniture',          description: 'Home and office furniture' },
    { name: 'Sports & Outdoors',  description: 'Sports equipment and outdoor gear' },
    { name: 'Books & Stationery', description: 'Books, notebooks and stationery' },
    { name: 'Office Supplies',    description: 'Office supplies and stationery' },
  ];
  const catMap: Record<string, ObjectId> = {};

  for (const cat of catDefs) {
    let existing = await categories.findOne({ name: cat.name });
    if (!existing) {
      const id = newId();
      await categories.insertOne({ _id: id, ...cat });
      catMap[cat.name] = id;
    } else {
      catMap[cat.name] = existing._id as ObjectId;
    }
  }
  console.log('✅ Categories ready');

  // ─── 4. Suppliers ─────────────────────────────────────────────────────────
  const supDefs = [
    { companyName: 'coca cola', contactPerson: 'Amjad Ali',   phone: '0300000000', email: 'coke@gmail.com',     address: 'ryk industrial area' },
  ];
  const supIds: ObjectId[] = [];

  for (const sup of supDefs) {
    let existing = await suppliers.findOne({ companyName: sup.companyName });
    if (!existing) {
      const id = newId();
      await suppliers.insertOne({ _id: id, ...sup });
      supIds.push(id);
    } else {
      supIds.push(existing._id as ObjectId);
    }
  }
  console.log('✅ Suppliers ready');

  // ─── 5. Products ──────────────────────────────────────────────────────────
  const existingProductCount = await products.countDocuments();
  const productIds: ObjectId[] = [];
  const productPrices: Record<string, number> = {};

  if (existingProductCount === 0) {
    const productDefs = [
      { name: 'Lactogen Grow 1',              sku: 'EL-IP16-001', catName: 'Grocery',       supIdx: 0, purchasePrice: 800,  sellingPrice: 999,  stock: 15, minStock: 5  },
      
    ];

    for (const p of productDefs) {
      const id = newId();
      await products.insertOne({
        _id: id,
        name: p.name,
        sku: p.sku,
        categoryId: catMap[p.catName],
        supplierId: supIds[p.supIdx],
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        minStock: p.minStock,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      productIds.push(id);
      productPrices[id.toString()] = p.sellingPrice;
    }
    console.log(`✅ ${productIds.length} products created`);
  } else {
    const allProducts = await products.find({}).toArray();
    allProducts.forEach(p => {
      productIds.push(p._id as ObjectId);
      productPrices[(p._id as ObjectId).toString()] = p.sellingPrice;
    });
    console.log(`⏭  ${productIds.length} products already exist`);
  }

  // ─── 6. Customers ─────────────────────────────────────────────────────────
  const existingCustomerCount = await customers.countDocuments();
  const customerIds: ObjectId[] = [];

  if (existingCustomerCount === 0) {
    const customerDefs = [
      { name: 'Naimat Ali',    phone: '03029267832', email: 'email@example.com'    },
     
      
    ];
    for (const c of customerDefs) {
      const id = newId();
      await customers.insertOne({ _id: id, ...c, createdAt: new Date() });
      customerIds.push(id);
    }
    console.log(`✅ ${customerIds.length} customers created`);
  } else {
    const all = await customers.find({}).toArray();
    all.forEach(c => customerIds.push(c._id as ObjectId));
    console.log(`⏭  ${customerIds.length} customers already exist`);
  }

  // ─── 7. Sales ─────────────────────────────────────────────────────────────
  const existingSaleCount = await sales.countDocuments();
  if (existingSaleCount === 0 && productIds.length > 0) {
    const paymentMethods = ['CASH', 'CARD', 'TRANSFER'];
    const userIds = [adminId, managerId, cashierId];

    for (let i = 0; i < 20; i++) {
      const customerId = Math.random() > 0.3 ? customerIds[rand(0, customerIds.length - 1)] : null;
      const userId = userIds[rand(0, 2)];
      const numItems = rand(1, 3);
      const chosenProductIds = [...productIds].sort(() => 0.5 - Math.random()).slice(0, numItems);

      const itemsData = chosenProductIds.map(pid => ({
        productId: pid,
        quantity: rand(1, 3),
        unitPrice: productPrices[pid.toString()] || 10,
      }));

      const subtotal = itemsData.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
      const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
      const paymentMethod = paymentMethods[rand(0, 2)];
      const amountPaid = paymentMethod === 'CASH' ? Math.ceil(totalAmount / 10) * 10 : totalAmount;
      const change = Math.round((amountPaid - totalAmount) * 100) / 100;
      const invoiceNumber = `TMP-${String(i + 1).padStart(6, '0')}`;
      const createdAt = daysAgo(rand(0, 29));

      const saleId = newId();
      await sales.insertOne({
        _id: saleId,
        invoiceNumber,
        customerId: customerId ?? null,
        userId,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        paymentMethod,
        amountPaid,
        change,
        status: 'COMPLETED',
        createdAt,
      });

      for (const it of itemsData) {
        await saleItems.insertOne({
          _id: newId(),
          saleId,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.unitPrice * it.quantity,
        });
      }
    }
    console.log('✅ 20 sales created');
  } else {
    console.log('⏭  Sales already exist or no products, skipping');
  }

  // ─── 8. Expenses ──────────────────────────────────────────────────────────
  const existingExpenseCount = await expenses.countDocuments();
  if (existingExpenseCount === 0) {
    const expCategories = ['Rent', 'Electricity', 'Internet', 'Salaries', 'Transportation', 'Maintenance', 'Marketing'];
    const paymentMethods = ['CASH', 'CARD', 'TRANSFER'];
    for (let i = 0; i < 10; i++) {
      const cat = expCategories[rand(0, expCategories.length - 1)];
      await expenses.insertOne({
        _id: newId(),
        title: `${cat} - ${new Date().toLocaleString('default', { month: 'long' })}`,
        category: cat,
        amount: rand(100, 3000),
        paymentMethod: paymentMethods[rand(0, 2)],
        date: daysAgo(rand(0, 29)),
        addedById: adminId,
      });
    }
    console.log('✅ Expenses created');
  } else {
    console.log('⏭  Expenses already exist, skipping');
  }

  await client.close();

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('   Admin:   admin@pos.com   / admin5658');
  console.log('   Manager: manager@pos.com / manager5658');
  console.log('   Cashier: cashier@pos.com / cashier095');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => console.log('Seed script finished.'));
