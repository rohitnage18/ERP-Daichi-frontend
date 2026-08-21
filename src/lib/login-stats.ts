import { MongoClient } from "mongodb";

const DB_NAME = "daichi_erp";

type LoginStats = { totalDealers: number; products: number };

declare global {
  // eslint-disable-next-line no-var
  var __daichiMongo: MongoClient | undefined;
}

function mongoUri(): string {
  return (process.env.DATABASE_URL || process.env.MONGODB_URI || "").trim();
}

async function getClient(): Promise<MongoClient | null> {
  const uri = mongoUri();
  if (!uri.startsWith("mongodb")) return null;
  if (!globalThis.__daichiMongo) {
    globalThis.__daichiMongo = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 5,
    });
  }
  await globalThis.__daichiMongo.connect();
  return globalThis.__daichiMongo;
}

export async function loadLoginStats(): Promise<LoginStats | null> {
  const client = await getClient();
  if (!client) return null;
  const db = client.db(DB_NAME);
  const [totalDealers, products] = await Promise.all([
    db.collection("daichiDealers").countDocuments(),
    db.collection("products").countDocuments({ status: "ACTIVE" }),
  ]);
  return { totalDealers, products };
}
