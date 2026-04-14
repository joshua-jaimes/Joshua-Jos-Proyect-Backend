import mongoose from "mongoose";

const usuario = new mongoose.Schema({
  nombre: { type: String, require: true },
  edad: { type: Number },
  fechanacimiento: { type: Date, default: Date.now },
  email: { type: String, unique: true },
  estado: { type: Number, default: 0 },                // 0 = gratuito, 1 = premium
  plan: { type: String, default: 'gratuito' },         // 'gratuito' | 'mistico_pro'
  estadoPlan: { type: String, default: 'inactivo' },   // 'inactivo' | 'activo'
  premiumActivo: { type: Boolean, default: false },    // true al pagar
  fechaPago: { type: Date, default: null },             // compatibilidad
  fechaPagoPremium: { type: Date, default: null },      // fecha del pago aprobado
  rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
  password: {
    type: String,
    required: true
  }


});

export default mongoose.model("Usuario", usuario)