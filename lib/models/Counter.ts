import mongoose, { Schema, Model } from "mongoose";

/**
 * Counter — compteurs atomiques (numéros de commande séquentiels par année).
 * `nextSequence("order-2026")` renvoie un entier incrémenté de façon atomique.
 */
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

type CounterDoc = { _id: string; seq: number };

export const Counter: Model<CounterDoc> =
  (mongoose.models.Counter as Model<CounterDoc>) ||
  mongoose.model<CounterDoc>("Counter", CounterSchema);

/** Incrémente et renvoie la nouvelle valeur du compteur. */
export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean<CounterDoc>();
  return doc?.seq ?? 1;
}

export default Counter;
