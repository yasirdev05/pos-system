const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/pos_db');
  await client.connect();
  const db = client.db('pos_db');

  const users = db.collection('User');
  const categories = db.collection('Category');
  const suppliers = db.collection('Supplier');
  const products = db.collection('Product');
  const customers = db.collection('Customer');
  const sales = db.collection('Sale');
  const saleItems = db.collection('SaleItem');
  const expenses = db.collection('Expense');

  // Fetch admin user
  const admin = await users.findOne({ email: 'admin@pos.io' }) || await users.findOne({ role: 'ADMIN' });
  const cashier = await users.findOne({ email: 'cashier@pos.io' }) || admin;

  // Categories
  const catDefs = [
    { name: 'Electronics', description: 'Gadgets & devices' },
    { name: 'Accessories', description: 'Cables, cases, chargers' },
    { name: 'Clothing', description: 'Apparel & fashion' },
    { name: 'Food & Beverages', description: 'Snacks, coffee, drinks' },
    { name: 'Office Supplies', description: 'Paper, pens, desk items' },
    { name: 'Sports & Outdoors', description: 'Fitness & outdoor gear' },
  ];
  const catMap = {};
  for (const c of catDefs) {
    let found = await categories.findOne({ name: c.name });
    if (!found) {
      const res = await categories.insertOne({ _id: new ObjectId(), ...c });
      catMap[c.name] = res.insertedId;
    } else {
      catMap[c.name] = found._id;
    }
  }

  // Suppliers
  const supDefs = [
    { companyName: 'Tech Distributors Inc', contactPerson: 'Robert Lee', phone: '555-0200', email: 'sales@techdist.com', address: '456 Tech Ave, Silicon Valley' },
    { companyName: 'Global Fashion Ltd', contactPerson: 'Emma Davis', phone: '555-0300', email: 'orders@globalfashion.com', address: '789 Fashion Blvd, New York' },
    { companyName: 'Office World Corp', contactPerson: 'James Wilson', phone: '555-0400', email: 'info@officeworld.com', address: '321 Business Park, Chicago' },
  ];
  const supIds = [];
  for (const s of supDefs) {
    let found = await suppliers.findOne({ companyName: s.companyName });
    if (!found) {
      const res = await suppliers.insertOne({ _id: new ObjectId(), ...s });
      supIds.push(res.insertedId);
    } else {
      supIds.push(found._id);
    }
  }

  // Products
  const prodDefs = [
    { name: 'iPhone 16 Pro Max', sku: 'EL-IP16-001', catName: 'Electronics', supIdx: 0, purchasePrice: 900, sellingPrice: 1199, stock: 18, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60' },
    { name: 'Samsung Galaxy S25 Ultra', sku: 'EL-SG25-002', catName: 'Electronics', supIdx: 0, purchasePrice: 850, sellingPrice: 1099, stock: 12, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60' },
    { name: 'MacBook Air M3 15"', sku: 'EL-MBA-003', catName: 'Electronics', supIdx: 0, purchasePrice: 1050, sellingPrice: 1399, stock: 8, minStock: 3, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60' },
    { name: 'Sony WH-1000XM5 Wireless Headphones', sku: 'EL-SNY-006', catName: 'Electronics', supIdx: 0, purchasePrice: 220, sellingPrice: 379, stock: 24, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60' },
    { name: 'Apple Watch Ultra 2', sku: 'EL-AWU-007', catName: 'Electronics', supIdx: 0, purchasePrice: 600, sellingPrice: 799, stock: 9, minStock: 4, imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60' },
    { name: 'Anker 100W USB-C GaN Charger', sku: 'AC-ANK-001', catName: 'Accessories', supIdx: 0, purchasePrice: 22, sellingPrice: 49.99, stock: 65, minStock: 15, imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=60' },
    { name: 'MagSafe Leather Wallet Stand', sku: 'AC-MGW-002', catName: 'Accessories', supIdx: 0, purchasePrice: 15, sellingPrice: 39.99, stock: 45, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=500&auto=format&fit=crop&q=60' },
    { name: 'Logitech MX Master 3S Mouse', sku: 'AC-LGT-003', catName: 'Accessories', supIdx: 0, purchasePrice: 55, sellingPrice: 99.99, stock: 30, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60' },
    { name: 'Mechanical RGB Gaming Keyboard', sku: 'AC-MKB-004', catName: 'Accessories', supIdx: 0, purchasePrice: 65, sellingPrice: 129.99, stock: 20, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60' },
    { name: 'AirPods Pro 2nd Gen USB-C', sku: 'AC-APP-008', catName: 'Accessories', supIdx: 0, purchasePrice: 160, sellingPrice: 249, stock: 14, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=60' },
    { name: 'Premium Heavyweight Cotton Tee', sku: 'CL-HCT-001', catName: 'Clothing', supIdx: 1, purchasePrice: 10, sellingPrice: 28, stock: 80, minStock: 20, imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60' },
    { name: 'Fleece Oversized Pullover Hoodie', sku: 'CL-FOH-002', catName: 'Clothing', supIdx: 1, purchasePrice: 24, sellingPrice: 59.99, stock: 40, minStock: 10, imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60' },
    { name: 'Slim Fit Stretch Denim Jeans', sku: 'CL-SFJ-003', catName: 'Clothing', supIdx: 1, purchasePrice: 28, sellingPrice: 69.99, stock: 35, minStock: 8, imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=60' },
    { name: 'Ethiopian Single Origin Whole Beans 1kg', sku: 'FB-ETH-001', catName: 'Food & Beverages', supIdx: 2, purchasePrice: 16, sellingPrice: 34.99, stock: 50, minStock: 12, imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60' },
    { name: 'Ceramic Pour-Over Coffee Dripper Set', sku: 'FB-POD-002', catName: 'Food & Beverages', supIdx: 2, purchasePrice: 18, sellingPrice: 38.50, stock: 25, minStock: 6, imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60' },
    { name: 'Heavy Duty Ergonomic Mesh Chair', sku: 'OF-EMC-001', catName: 'Office Supplies', supIdx: 2, purchasePrice: 140, sellingPrice: 289, stock: 7, minStock: 3, imageUrl: 'https://images.unsplash.com/photo-1580481077197-2a420cb058e0?w=500&auto=format&fit=crop&q=60' },
    { name: 'Dual Monitor Aluminum Desk Mount', sku: 'OF-DMM-002', catName: 'Office Supplies', supIdx: 2, purchasePrice: 35, sellingPrice: 79.99, stock: 15, minStock: 5, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60' },
    { name: 'Non-Slip Eco-Friendly Yoga Mat 6mm', sku: 'SP-EYM-001', catName: 'Sports & Outdoors', supIdx: 2, purchasePrice: 18, sellingPrice: 44.99, stock: 28, minStock: 6, imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&auto=format&fit=crop&q=60' },
  ];

  const addedProductIds = [];
  for (const p of prodDefs) {
    let found = await products.findOne({ sku: p.sku });
    if (!found) {
      const res = await products.insertOne({
        _id: new ObjectId(),
        name: p.name,
        sku: p.sku,
        categoryId: catMap[p.catName],
        supplierId: supIds[p.supIdx],
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        minStock: p.minStock,
        imageUrl: p.imageUrl || null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addedProductIds.push({ id: res.insertedId, price: p.sellingPrice });
    } else {
      await products.updateOne({ _id: found._id }, { $set: { imageUrl: p.imageUrl, name: p.name, sellingPrice: p.sellingPrice } });
      addedProductIds.push({ id: found._id, price: found.sellingPrice });
    }
  }
  console.log(`✅ Verified ${addedProductIds.length} catalog products.`);

  // Customers
  const custDefs = [
    { name: 'Sarah Jenkins', phone: '+1 555-0142', email: 'sarah.j@gmail.com', address: '124 Market St, Suite 4' },
    { name: 'Marcus Chen', phone: '+1 555-0189', email: 'marcus.chen@techcorp.io', address: '882 Silicon Blvd' },
    { name: 'Aaliyah Patel', phone: '+1 555-0231', email: 'aaliyah.p@outlook.com', address: '45 Lakeview Terr' },
    { name: 'David Rodriguez', phone: '+1 555-0377', email: 'david.r@innovate.co', address: '310 Broadway Ave' },
    { name: 'Elena Rostova', phone: '+1 555-0419', email: 'elena.rostova@design.org', address: '90 Pinecrest Dr' },
  ];
  const custIds = [];
  for (const c of custDefs) {
    let found = await customers.findOne({ phone: c.phone });
    if (!found) {
      const res = await customers.insertOne({ _id: new ObjectId(), ...c, createdAt: new Date() });
      custIds.push(res.insertedId);
    } else {
      custIds.push(found._id);
    }
  }

  // Create 15 recent sales for rich charts
  const existingSaleCount = await sales.countDocuments();
  if (existingSaleCount < 10) {
    const pMethods = ['CASH', 'CARD', 'TRANSFER'];
    for (let i = 0; i < 15; i++) {
      const custId = custIds[rand(0, custIds.length - 1)];
      const numItems = rand(1, 3);
      const chosenProds = [...addedProductIds].sort(() => 0.5 - Math.random()).slice(0, numItems);

      const items = chosenProds.map(cp => ({
        productId: cp.id,
        quantity: rand(1, 2),
        unitPrice: cp.price,
      }));

      const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
      const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
      const pMethod = pMethods[rand(0, 2)];
      const amountPaid = pMethod === 'CASH' ? Math.ceil(totalAmount / 10) * 10 : totalAmount;
      const change = Math.round((amountPaid - totalAmount) * 100) / 100;
      const invNum = `INV-${String(existingSaleCount + i + 1).padStart(6, '0')}`;
      const createdDate = daysAgo(rand(0, 20));

      const saleId = new ObjectId();
      await sales.insertOne({
        _id: saleId,
        invoiceNumber: invNum,
        customerId: custId,
        userId: admin._id,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        paymentMethod: pMethod,
        amountPaid,
        change,
        status: 'COMPLETED',
        createdAt: createdDate,
      });

      for (const item of items) {
        await saleItems.insertOne({
          _id: new ObjectId(),
          saleId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        });
      }
    }
    console.log('✅ Created 15 rich demo sales records.');
  }

  // Create demo expenses
  const existingExp = await expenses.countDocuments();
  if (existingExp < 5) {
    const expCategories = ['Rent', 'Electricity', 'Internet', 'Salaries', 'Maintenance', 'Marketing'];
    for (let i = 0; i < 8; i++) {
      const cat = expCategories[rand(0, expCategories.length - 1)];
      await expenses.insertOne({
        _id: new ObjectId(),
        title: `${cat} payment - ${new Date().toLocaleString('default', { month: 'short' })}`,
        category: cat,
        amount: rand(150, 1800),
        paymentMethod: 'TRANSFER',
        date: daysAgo(rand(0, 25)),
        addedById: admin._id,
      });
    }
    console.log('✅ Created demo expense records.');
  }

  console.log('\n🎉 FULL DEMO CATALOG READY!');
  await client.close();
}

run().catch(console.error);
