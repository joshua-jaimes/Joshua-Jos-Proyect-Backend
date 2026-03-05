import mongoose from "mongoose";

export const conectarMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("BD conectada a Mongo Atlas!");
  } catch (error) {
    console.log("Error conexión Mongo:", error);
  }
};
