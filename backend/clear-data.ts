// backend/clear-data.ts
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/pos_db';

async function clearData() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const db = client.db(); // uses database from URI

  // Collections to clear (drop all documents)
  const collectionsToClear = [
    'Category',
    'Supplier',
    'Product',
    'Customer',
    'Sale',
    'SaleItem',
    'Expense',
    // 'BusinessSettings' – uncomment if you also want to reset business settings
  ];

  console.log('🗑️  Clearing data from collections (keeping User collection)...');
  for (const collName of collectionsToClear) {
    const coll = db.collection(collName);
    const result = await coll.deleteMany({});
    console.log(`   ✅ ${collName}: deleted ${result.deletedCount} documents`);
  }

  console.log('\n✨ All specified collections have been cleared.');
  console.log('   Your User accounts (admin, manager, cashier) are untouched.');
  console.log('   BusinessSettings are still present (if you want to reset them, uncomment the line above).');
  
  await client.close();
}

clearData().catch(console.error).finally(() => process.exit(0));