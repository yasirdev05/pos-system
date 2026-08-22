import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hash(p, 10);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ─── 1. Business Settings ─────────────────────────────────────────────────
  const existingSettings = await prisma.businessSettings.findFirst();
  if (!existingSettings) {
    await prisma.businessSettings.create({
      data: {
        companyName: 'Foji Store',
        ownerName: 'Qaiser Abbas',
        phone: '0307 8838980',
        email: 'admin@pos.com',
        address: '24 np SadiqAbad JDW road',
        taxPercentage: 0,
        currency: 'PKR',
        invoicePrefix: 'TMP-',
        returnPolicy: 'Returns not accepted',
      },
    });
    console.log('✅ Business settings created');
  } else {
    console.log('⏭  Business settings already exist, skipping');
  }

  // ─── 2. Users ──────────────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@pos.com' } });
  let admin: any = existingAdmin;
  let manager: any;
  let cashier: any;

  if (!existingAdmin) {
    admin   = await prisma.user.create({ data: { name: 'Qaiser Abbas',   email: 'admin@pos.com',   password: await hash('admin5658'),   role: 'ADMIN'   } });
    manager = await prisma.user.create({ data: { name: 'Ansir Mehmood', email: 'manager@pso.com', password: await hash('manager123'), role: 'MANAGER' } });
    cashier = await prisma.user.create({ data: { name: 'Mughees Abbas',      email: 'cashier@pos.com', password: await hash('cashier123'), role: 'CASHIER' } });
    console.log('✅ Users created');
  } else {
    manager = await prisma.user.findUnique({ where: { email: 'manager@pos.com' } }) ?? admin;
    cashier = await prisma.user.findUnique({ where: { email: 'cashier@pos.com' } }) ?? admin;
    console.log('⏭  Users already exist, skipping');
  }

  // ─── 3. Categories ────────────────────────────────────────────────────────
  const catNames = ['Electronics', 'Accessories', 'Clothing', 'Food & Beverages', 'Furniture', 'Sports & Outdoors', 'Books & Stationery', 'Office Supplies'];
  const existingCats = await prisma.category.findMany({ where: { name: { in: catNames } } });
  
  if (existingCats.length < catNames.length) {
    for (const name of catNames) {
      const exists = existingCats.find(c => c.name === name);
      if (!exists) {
        await prisma.category.create({ data: { name, description: `${name} products` } });
      }
    }
    console.log('✅ Categories created');
  } else {
    console.log('⏭  Categories already exist, skipping');
  }

  const allCats = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  allCats.forEach(c => { catMap[c.name] = c.id; });

  // ─── 4. Suppliers ─────────────────────────────────────────────────────────
  const existingSups = await prisma.supplier.findMany();
  let sup1: any, sup2: any, sup3: any;

  if (existingSups.length === 0) {
    sup1 = await prisma.supplier.create({ data: { companyName: 'Tech Distributors Inc', contactPerson: 'Robert Lee',    phone: '555-0200', email: 'sales@techdist.com',    address: '456 Tech Ave, Silicon Valley' } });
    sup2 = await prisma.supplier.create({ data: { companyName: 'Global Fashion Ltd',    contactPerson: 'Emma Davis',    phone: '555-0300', email: 'orders@globalfashion.com', address: '789 Fashion Blvd, New York'  } });
    sup3 = await prisma.supplier.create({ data: { companyName: 'Office World Corp',     contactPerson: 'James Wilson',  phone: '555-0400', email: 'info@officeworld.com',    address: '321 Business Park, Chicago'  } });
    console.log('✅ Suppliers created');
  } else {
    [sup1, sup2, sup3] = existingSups;
    console.log('⏭  Suppliers already exist, skipping');
  }

  // ─── 5. Products ──────────────────────────────────────────────────────────
  const existingProds = await prisma.product.findMany();
  let products: any[] = existingProds;

  if (existingProds.length === 0) {
    const productData = [
      { name: 'iPhone 16 Pro',             sku: 'EL-IP16-001', categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 800,  sellingPrice: 999,  stock: 15, minStock: 5  },
      { name: 'Samsung Galaxy S25',         sku: 'EL-SG25-002', categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 700,  sellingPrice: 899,  stock: 3,  minStock: 5  },
      { name: 'MacBook Air M3',             sku: 'EL-MBA-003',  categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 1000, sellingPrice: 1299, stock: 8,  minStock: 3  },
      { name: 'Dell XPS 15 Laptop',         sku: 'EL-DXP-004',  categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 900,  sellingPrice: 1149, stock: 6,  minStock: 3  },
      { name: 'iPad Pro 13"',               sku: 'EL-IPD-005',  categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 900,  sellingPrice: 1099, stock: 10, minStock: 4  },
      { name: 'Sony WH-1000XM5 Headphones', sku: 'EL-SNY-006',  categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 200,  sellingPrice: 349,  stock: 20, minStock: 8  },
      { name: 'Apple Watch Series 10',      sku: 'EL-AW-007',   categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 300,  sellingPrice: 399,  stock: 12, minStock: 5  },
      { name: 'LG 27" 4K Monitor',          sku: 'EL-LGM-008',  categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 350,  sellingPrice: 499,  stock: 7,  minStock: 3  },
      { name: 'Canon EOS R8 Camera',        sku: 'EL-CNR-009',  categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 1100, sellingPrice: 1499, stock: 4,  minStock: 2  },
      { name: 'PlayStation 5 Console',      sku: 'EL-PS5-010',  categoryId: catMap['Electronics'],       supplierId: sup1.id, purchasePrice: 400,  sellingPrice: 499,  stock: 0,  minStock: 5  },
      { name: 'USB-C Fast Charger 65W',     sku: 'AC-USBC-001', categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 12,   sellingPrice: 29,   stock: 80, minStock: 20 },
      { name: 'MagSafe Wireless Charger',   sku: 'AC-MGS-002',  categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 20,   sellingPrice: 45,   stock: 50, minStock: 15 },
      { name: 'iPhone 16 Pro Silicone Case',sku: 'AC-CSI-003',  categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 8,    sellingPrice: 19,   stock: 100,minStock: 30 },
      { name: 'Anker Power Bank 20000mAh',  sku: 'AC-PBK-004',  categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 25,   sellingPrice: 55,   stock: 35, minStock: 10 },
      { name: 'Wireless Bluetooth Mouse',   sku: 'AC-WBM-005',  categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 18,   sellingPrice: 39,   stock: 25, minStock: 8  },
      { name: 'Mechanical Keyboard',        sku: 'AC-MKB-006',  categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 60,   sellingPrice: 119,  stock: 18, minStock: 5  },
      { name: 'Screen Protector Glass',     sku: 'AC-SPG-007',  categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 3,    sellingPrice: 12,   stock: 200,minStock: 50 },
      { name: 'AirPods Pro 2nd Gen',        sku: 'AC-APP-008',  categoryId: catMap['Accessories'],      supplierId: sup1.id, purchasePrice: 150,  sellingPrice: 249,  stock: 2,  minStock: 5  },
      { name: "Men's Classic T-Shirt",      sku: 'CL-MTS-001',  categoryId: catMap['Clothing'],         supplierId: sup2.id, purchasePrice: 8,    sellingPrice: 25,   stock: 60, minStock: 15 },
      { name: "Women's Hoodie",             sku: 'CL-WHD-002',  categoryId: catMap['Clothing'],         supplierId: sup2.id, purchasePrice: 20,   sellingPrice: 55,   stock: 40, minStock: 10 },
      { name: 'Denim Jeans',                sku: 'CL-DJN-003',  categoryId: catMap['Clothing'],         supplierId: sup2.id, purchasePrice: 25,   sellingPrice: 65,   stock: 30, minStock: 8  },
      { name: 'Premium Coffee Beans 1kg',   sku: 'FB-COF-001',  categoryId: catMap['Food & Beverages'], supplierId: sup3.id, purchasePrice: 15,   sellingPrice: 35,   stock: 45, minStock: 10 },
      { name: 'Green Tea Set',              sku: 'FB-GTS-002',  categoryId: catMap['Food & Beverages'], supplierId: sup3.id, purchasePrice: 10,   sellingPrice: 25,   stock: 30, minStock: 8  },
      { name: 'Premium A4 Paper Ream',      sku: 'OF-PAP-001',  categoryId: catMap['Office Supplies'],  supplierId: sup3.id, purchasePrice: 5,    sellingPrice: 12,   stock: 100,minStock: 20 },
      { name: 'Ballpoint Pens Box (50)',    sku: 'OF-PEN-002',  categoryId: catMap['Office Supplies'],  supplierId: sup3.id, purchasePrice: 8,    sellingPrice: 18,   stock: 75, minStock: 15 },
      
     
    ];

    products = [];
    for (const p of productData) {
      const created = await prisma.product.create({ data: p });
      products.push(created);
    }
    console.log(`✅ ${products.length} products created`);
  } else {
    console.log('⏭  Products already exist, skipping');
  }

  // ─── 6. Customers ─────────────────────────────────────────────────────────
  const existingCustomers = await prisma.customer.findMany();
  let customers: any[] = existingCustomers;

  if (existingCustomers.length === 0) {
    const customersData = [
      { name: 'Naimat Ali',     phone: '03029267832', email: 'email@example.com',     address: '24 np '     },
    ];
    customers = [];
    for (const c of customersData) {
      const created = await prisma.customer.create({ data: c });
      customers.push(created);
    }
    console.log(`✅ ${customers.length} customers created`);
  } else {
    console.log('⏭  Customers already exist, skipping');
  }

  // ─── 7. Sales (FULLY sequential, NO nested creates) ───────────────────────
  const existingSales = await prisma.sale.count();
  if (existingSales === 0 && products.length > 0) {
    const paymentMethods = ['CASH', 'CARD', 'TRANSFER'];
    const users = [admin, manager, cashier].filter(Boolean);
    let saleCount = 0;

    for (let i = 0; i < 20; i++) {
      const customer = Math.random() > 0.3 ? customers[rand(0, customers.length - 1)] : null;
      const user = users[rand(0, users.length - 1)];
      const numItems = rand(1, 3);
      const saleProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, numItems);

      const items = saleProducts.map(p => ({
        productId: p.id,
        quantity: rand(1, 3),
        unitPrice: p.sellingPrice,
      }));

      const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
      const taxAmount = Math.round(subtotal * 0.1 * 100) / 100;
      const totalAmount = subtotal + taxAmount;
      const paymentMethod = paymentMethods[rand(0, 2)];
      const amountPaid = paymentMethod === 'CASH' ? Math.ceil(totalAmount / 10) * 10 : totalAmount;
      const change = Math.round((amountPaid - totalAmount) * 100) / 100;

      saleCount++;
      const invoiceNumber = `TMP-${String(saleCount).padStart(6, '0')}`;
      const createdAt = daysAgo(rand(0, 29));

      // Step 1: Create the sale (no nested items)
      const sale = await prisma.sale.create({
        data: {
          invoiceNumber,
          customerId: customer?.id ?? undefined,
          userId: user.id,
          subtotal,
          taxAmount,
          discountAmount: 0,
          totalAmount,
          paymentMethod,
          amountPaid,
          change,
          status: 'COMPLETED',
          createdAt,
        },
      });

      // Step 2: Create each sale item separately
      for (const it of items) {
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.unitPrice * it.quantity,
          },
        });
      }
    }
    console.log(`✅ ${saleCount} sales created`);
  } else {
    console.log('⏭  Sales already exist or no products, skipping');
  }

  // ─── 8. Expenses ──────────────────────────────────────────────────────────
  const existingExpenses = await prisma.expense.count();
  if (existingExpenses === 0) {
    const expCategories = ['Rent', 'Electricity', 'Internet', 'Salaries', 'Transportation', 'Maintenance', 'Marketing'];
    const paymentMethods = ['CASH', 'CARD', 'TRANSFER'];
    for (let i = 0; i < 10; i++) {
      const cat = expCategories[rand(0, expCategories.length - 1)];
      await prisma.expense.create({
        data: {
          title: `${cat} - ${new Date().toLocaleString('default', { month: 'long' })}`,
          category: cat,
          amount: rand(100, 3000),
          paymentMethod: paymentMethods[rand(0, 2)],
          date: daysAgo(rand(0, 29)),
          addedById: admin.id,
        },
      });
    }
    console.log('✅ Expenses created');
  } else {
    console.log('⏭  Expenses already exist, skipping');
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin:   admin@pos.com   / admin5658');
  console.log('   Manager: manager@pos.com / manager5658');
  console.log('   Cashier: cashier@pos.com / cashier095');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
