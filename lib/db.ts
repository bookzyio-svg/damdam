import mongoose from "mongoose";

/**
 * Connexion Mongoose mise en cache globalement (§2).
 *
 * En environnement serverless (Vercel), chaque invocation peut réutiliser le
 * même process Node. On cache donc la connexion sur `globalThis` pour éviter
 * d'ouvrir une nouvelle connexion à chaque requête (et épuiser le pool Atlas).
 */

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// On étend globalThis avec notre cache (clé _mongoose, cf. cahier des charges)
declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI manquant. Renseignez-le dans .env.local (voir .env.example).",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Délais raisonnables pour le serverless
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
