const { connect } = require("./_db");
(async () => {
  const m = await connect();
  const items = await m.connection.collection("products").find({}).toArray();
  for (const p of items) {
    console.log("\n##### ", p.title, " (", String(p._id), ") price", p.price/100, "€");
    console.log("VARIANTS:", JSON.stringify((p.variants||[]).map(v=>({title:v.title,price:v.price,image:!!v.image}))));
    console.log("DESC:\n", (p.description||"(vide)").slice(0,1400));
  }
  await m.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
