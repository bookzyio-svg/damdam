import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

/**
 * AdminUser — comptes du back-office (NextAuth credentials + bcrypt).
 * Rôles : "owner" (seedé) / "staff".
 */
const AdminUserSchema = new Schema(
  {
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    name: String,
    role: { type: String, enum: ["owner", "staff"], default: "staff" },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    // Anti-brute-force : compteur d'échecs + verrouillage temporaire
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { timestamps: true },
);

export type AdminUserDoc = InferSchemaType<typeof AdminUserSchema>;

export const AdminUser: Model<AdminUserDoc> =
  (mongoose.models.AdminUser as Model<AdminUserDoc>) ||
  mongoose.model<AdminUserDoc>("AdminUser", AdminUserSchema);

export default AdminUser;
