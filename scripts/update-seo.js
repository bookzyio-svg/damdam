const { connect } = require("./_db");
(async () => {
  const m = await connect();
  const r = await m.connection.collection("settings").updateOne(
    { singleton: "main" },
    { $set: {
      "store.slogan": "Électroménager neuf & reconditionné, au meilleur prix",
      "seo.title": "DAMDAM Électroménager — Électroménager neuf & reconditionné, TV & High-Tech",
      "seo.description": "DAMDAM Électroménager : gros et petit électroménager, TV, audio et high-tech, neufs et reconditionnés. Livraison suivie, paiement sécurisé, retour 14 jours.",
    } },
    { upsert: true },
  );
  console.log("SEO réglages mis à jour:", r.modifiedCount ? "OK" : "(déjà à jour / créé)");
  await m.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
