import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { execSync } from 'child_process';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Starting MongoDB In-Memory Replica Set...');
  const dbPath = path.join(process.cwd(), 'local-mongo-db');
  require('fs').mkdirSync(dbPath, { recursive: true });
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [
      {
        dbPath,
        port: 27018
      }
    ]
  });
  const uri = replSet.getUri();
  console.log(`MongoDB running at: ${uri}`);

  process.env.DATABASE_URL = uri;

  console.log('Pushing database schema...');
  execSync('npx prisma db push --force-reset', { env: process.env, stdio: 'inherit' });

  console.log('Seeding database...');
  execSync('npx tsx seed.ts', { env: process.env, stdio: 'inherit' });

  console.log('Starting server...');
  require('./src/server.ts');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
