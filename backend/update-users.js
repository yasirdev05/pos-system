const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function run() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('pos_db');
  const usersCol = db.collection('User');

  const adminPass = await bcrypt.hash('admin123', 10);
  const managerPass = await bcrypt.hash('manager123', 10);
  const cashierPass = await bcrypt.hash('cashier123', 10);

  const users = [
    { name: 'Admin User', email: 'admin@pos.io', password: adminPass, role: 'ADMIN' },
    { name: 'Admin User', email: 'admin@pos.com', password: adminPass, role: 'ADMIN' },
    { name: 'Manager User', email: 'manager@pos.io', password: managerPass, role: 'MANAGER' },
    { name: 'Manager User', email: 'manager@pos.com', password: managerPass, role: 'MANAGER' },
    { name: 'Cashier User', email: 'cashier@pos.io', password: cashierPass, role: 'CASHIER' },
    { name: 'Cashier User', email: 'cashier@pos.com', password: cashierPass, role: 'CASHIER' },
  ];

  for (const u of users) {
    const existing = await usersCol.findOne({ email: u.email });
    if (existing) {
      await usersCol.updateOne({ email: u.email }, { $set: { password: u.password, role: u.role, name: u.name } });
      console.log(`Updated user password for: ${u.email}`);
    } else {
      await usersCol.insertOne({ _id: new ObjectId(), ...u, createdAt: new Date(), updatedAt: new Date() });
      console.log(`Inserted user: ${u.email}`);
    }
  }

  const all = await usersCol.find({}, { projection: { email: 1, name: 1, role: 1 } }).toArray();
  console.log('\nAll users in database:');
  console.log(all);

  await client.close();
}

run().catch(console.error);
