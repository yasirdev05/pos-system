import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

// Fix for Windows / ISP DNS blocking MongoDB Atlas SRV lookups (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

const MONGO_URI = process.env.DATABASE_URL || 'mongodb+srv://7262yas_db_user:CyqWqFYKsSEaeU7e@cluster0.cc7r21b.mongodb.net/?appName=pos_db';

let client: MongoClient | null = null;

function getDbName(uri: string): string {
  const parts = uri.split('/');
  const last = parts[parts.length - 1].split('?')[0];
  return last || 'pos_db';
}

export async function getDb() {
  if (!client) {
    const isSrv = MONGO_URI.startsWith('mongodb+srv://');
    client = new MongoClient(MONGO_URI, isSrv ? {} : { directConnection: true });
    await client.connect();
  }
  return client.db(getDbName(MONGO_URI));
}

export { ObjectId };
