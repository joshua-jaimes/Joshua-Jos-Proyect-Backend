/**
 * Script temporal para crear 2 administradores en la base de datos.
 *
 * USO:
 *   node crear-admins.js "mongodb+srv://usuario:password@cluster.mongodb.net/nombreDB"
 *
 * O si tienes .env configurado:
 *   node crear-admins.js
 *
 * ⚠️ Elimina este archivo después de ejecutarlo.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import 'dotenv/config';

// Tomar URI del argumento de línea de comandos O del .env
const MONGO_URI = process.argv[2] || process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ Debes pasar la URI de MongoDB como argumento:");
    console.error('   node crear-admins.js "mongodb+srv://..."');
    process.exit(1);
}

// Definir el schema directamente para no depender de la ruta del modelo
const usuarioSchema = new mongoose.Schema({
    nombre: String,
    email: { type: String, unique: true },
    password: String,
    rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
    estado: { type: Number, default: 1 },
    edad: Number,
    fechanacimiento: Date
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

const admins = [
    {
        nombre: "Administrador Uno",
        email: "admin1@sistema.com",
        password: "Admin1234",
    },
    {
        nombre: "Administrador Dos",
        email: "admin2@sistema.com",
        password: "Admin5678",
    }
];

async function crearAdmins() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB\n");

        for (const adminData of admins) {
            const existe = await Usuario.findOne({ email: adminData.email });
            if (existe) {
                console.log(`⚠️  Ya existe: ${adminData.email} (omitido)`);
                continue;
            }

            const passwordHash = await bcrypt.hash(adminData.password, 10);

            const admin = new Usuario({
                nombre: adminData.nombre,
                email: adminData.email,
                password: passwordHash,
                rol: "admin",
                estado: 1
            });

            await admin.save();

            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log(`✅ Admin creado exitosamente`);
            console.log(`   👤 Nombre    : ${adminData.nombre}`);
            console.log(`   📧 Correo    : ${adminData.email}`);
            console.log(`   🔑 Contraseña: ${adminData.password}`);
            console.log(`   🛡️  Rol       : admin`);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        }

        console.log("🎉 Listo. Recuerda eliminar este archivo (crear-admins.js).");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

crearAdmins();
