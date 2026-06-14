const { connect } = require("./_db");
(async () => {
  const m = await connect();
  const { ObjectId } = require("mongodb");
  const Reviews = m.connection.collection("reviews");
  const total = await Reviews.countDocuments({});
  console.log("Total avis en base:", total);
  const id = new ObjectId("6a2b820894ce45ee23f3f911"); // TM7
  const sample = await Reviews.find({ product: id }).sort({createdAt:-1}).limit(4).toArray();
  console.log("\nExemples d'avis (TM7):");
  for (const r of sample) console.log(`  ${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)} — ${r.author} — « ${r.title} »\n     ${r.body}`);
  const p = await m.connection.collection("products").findOne({_id:id});
  console.log("\nTM7 → note:", p.ratingAvg, "| avis:", p.reviewCount, "| vendus:", p.soldCount, "| specs:", p.specs.length);
  await m.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
