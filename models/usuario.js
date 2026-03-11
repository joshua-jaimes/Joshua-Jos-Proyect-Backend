import mongoose from "mongoose";

const usuario = new mongoose.Schema({
  nombre: { type: String, require: true },
  edad: { type: Number },
  fechanacimiento: { type: Date, default: Date.now },
  email: { type: String, unique: true },
  estado: { type: Number, default: 1 },
  rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
  password: {
    type: String,
    required: true
  }


});

export default mongoose.model("Usuario", usuario)