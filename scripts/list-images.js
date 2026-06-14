const { connect } = require("./_db");
(async () => {
  const m = await connect();
  const items = await m.connection.collection("products").find({}).toArray();
  for (const p of items) {
    console.log(`\n##### ${p.title} (${String(p._id)})`);
    console.log("   images:", (p.images||[]).length, "| contentBlocks:", (p.contentBlocks||[]).length);
    (p.images||[]).forEach((im,i)=>console.log(`     [${i}] ${im.url}`));
  }
  await m.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
