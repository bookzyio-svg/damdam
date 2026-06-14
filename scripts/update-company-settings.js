const { connect } = require("./_db");

(async () => {
  const m = await connect();
  const Settings = m.connection.collection("settings");
  const res = await Settings.updateOne(
    { singleton: "main" },
    {
      $set: {
        "store.name": "DAMDAM ELECTROMENAGER",
        "store.email": "support@damdam.fr",
        "store.address": {
          line1: "4 rue de la Villa Romaine",
          postalCode: "14460",
          city: "Colombelles",
          country: "France",
        },
      },
    },
    { upsert: true },
  );
  console.log("Settings mis à jour:", res.matchedCount ? "modifié" : "créé/upsert");
  const s = await Settings.findOne({ singleton: "main" });
  console.log("store:", JSON.stringify(s.store, null, 2));
  await m.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
