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

function cleanMongoUri(raw?: string): string {
  if (!raw) return 'mongodb://127.0.0.1:27017/pos_db';
  let cleaned = raw.trim();
  while (/^DATABASE_URL\s*=\s*/i.test(cleaned) || /^["']/.test(cleaned)) {
    cleaned = cleaned.replace(/^DATABASE_URL\s*=\s*/i, '');
    cleaned = cleaned.replace(/^["']+|["']+$/g, '').trim();
  }
  return cleaned;
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
