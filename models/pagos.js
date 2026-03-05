

import mongoose from "mongoose";
const pago = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    monto: { type: Number, required: true },
    fecha_pago: { type: Date, default: Date.now },
    fecha_vencimiento: { type: Date, required: true },
    metodo: { type: String, required: true, enum: ['tarjeta', 'efectivo', 'transferencia'] }
});
export default mongoose.model("Pago", pago)