import { MongoClient } from "mongodb";

async function watchChanges() {
  const uri: string = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Conectado a MongoDB, esperando cambios...");

    const db = client.db("WEBPAGE");
    const collection = db.collection("auth_db");

    // Escuchar cambios en la colección

    const changeStream = collection.watch();

    changeStream.on("change", (change) => {
      console.log("🔄 Cambio detectado:", JSON.stringify(change, null, 2));
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

watchChanges();
