import mongoose from "mongoose";

const lectura = new mongoose.Schema({
    usuario_id:{type:mongoose.Schema.Types.ObjectId,ref:"Usuario", required:true},
    tipo:{type:String, required:true, enum:['principal', 'diaria']},

    
    dia:{type:String, index:true},

    contenido:{type:String, required:true},
    fecha_lectura:{type:Date, default:Date.now}
});

export default mongoose.model("Lectura",lectura)
