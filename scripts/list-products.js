const { connect } = require("./_db");
(async () => {
  const m = await connect();
  const Product = m.connection.collection("products");
  const items = await Product.find({}).toArray();
  console.log("TOTAL:", items.length, "\n");
  for (const p of items) {
    console.log("———");
    console.log("id:", String(p._id));
    console.log("title:", p.title);
    console.log("brand:", p.brand, "| condition:", p.condition, "| status:", p.status);
    console.log("price(cts):", p.price, "| compareAt:", p.compareAtPrice ?? "-");
    console.log("category:", p.category ? String(p.category) : "-");
    console.log("shortDescription:", (p.shortDescription||"").slice(0,80));
    console.log("description len:", (p.description||"").length, "| specs:", (p.specs||[]).length, "| reviewCount:", p.reviewCount||0, "| variants:", (p.variants||[]).length);
    console.log("seo:", JSON.stringify(p.seo||{}));
  }
  await m.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
