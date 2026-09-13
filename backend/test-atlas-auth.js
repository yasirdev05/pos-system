const { MongoClient } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const uri = process.env.DATABASE_URL;

async function testConnection() {
  console.log('Testing Atlas connection with URL:');
  console.log(uri ? uri.replace(/:([^@]+)@/, ':***@') : 'UNDEFINED');

  if (!uri) {
    console.error('❌ DATABASE_URL is not set in backend/.env');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🎉 SUCCESS! Connected to MongoDB Atlas successfully!');
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:', dbs.databases.map(d => d.name));
    await client.close();
  } catch (err) {
    console.error('\n❌ Connection Error:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    
    if (err.message.includes('bad auth')) {
      console.log('\n💡 Tip: In MongoDB Atlas (cloud.mongodb.com):');
      console.log('1. Go to "Database Access" in the left sidebar.');
      console.log('2. Check the exact username.');
      console.log('3. Click "Edit" -> "Edit Password" and enter a simple password without special characters (e.g. TestPass12345).');
      console.log('4. Click "Update User" and update DATABASE_URL in backend/.env.');
    }
  }
}

testConnection();
