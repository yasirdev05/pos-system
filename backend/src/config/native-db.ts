import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config({ override: true });

// Fix for Windows / ISP DNS blocking MongoDB Atlas SRV lookups (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if not permitted
}

function cleanMongoUri(raw?: string): string {
  if (!raw) return 'mongodb://127.0.0.1:27017/pos_db';
  const str = String(raw).trim();
  const match = str.match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/i);
  if (match) {
    return match[1];
  }
  return str.replace(/^["']+|["']+$/g, '');
}

const MONGO_URI = cleanMongoUri(process.env.DATABASE_URL);

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
