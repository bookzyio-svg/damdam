import "./load-env";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { AdminUser } from "../lib/models/AdminUser";

/**
 * Crée (ou met à jour) le compte admin "owner" à partir des variables :
 *   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME
 *
 *   npm run seed:admin
 */
async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  const name = process.env.SEED_ADMIN_NAME || "Administrateur";

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD sont requis (voir .env.example).",
    );
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    existing.role = "owner";
    existing.active = true;
    await existing.save();
    console.log(`✅ Admin mis à jour : ${email}`);
  } else {
    await AdminUser.create({
      email,
      passwordHash,
      name,
      role: "owner",
      active: true,
    });
    console.log(`✅ Admin créé : ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed admin échoué :", err);
  process.exit(1);
});
