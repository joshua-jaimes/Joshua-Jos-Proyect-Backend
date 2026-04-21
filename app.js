import express from "express"
import cors from "cors"
import path from "path"
import 'dotenv/config'
import { conectarMongo } from "./database/cnx-mongo.js"
import usuarioRoute from "./routes/usuario.js"
import lecturasRoute from "./routes/lecturas.js"
import pagosRoute from "./routes/pagos.js"
import mercadopagoRoute from "./routes/mercadopago.js"
import authRoute from "./routes/authRoute.js"


const app = express()
conectarMongo()

app.use(cors())
app.use(express.json())

// Servir el frontend buildeado desde la carpeta public
app.use(express.static(path.join(path.dirname(new URL(import.meta.url).pathname), 'public')))

app.use("/api/usuario", usuarioRoute)
app.use("/api/lecturas", lecturasRoute)
app.use("/api/pagos", pagosRoute)
app.use("/api/mercadopago", mercadopagoRoute)
app.use("/api/auth", authRoute)


app.listen(process.env.PORT, () => {
    console.log(`Servidor escuchando en el puerto ${process.env.PORT}`);
    console.log('\n=== 🔧 DIAGNÓSTICO DE VARIABLES DE ENTORNO ===');
    console.log('  PORT           :', process.env.PORT);
    console.log('  FRONTEND_URL   :', process.env.FRONTEND_URL || '❌ NO DEFINIDA (usará localhost:4173)');
    console.log('  MP_TOKEN       :', process.env.MERCADOPAGO_ACCESS_TOKEN ? '✅ definido' : '❌ NO DEFINIDO');
    console.log('  MONGO_URI      :', process.env.MONGO_URI ? '✅ definido' : '❌ NO DEFINIDO');
    const fe = process.env.FRONTEND_URL || '';
    console.log('  auto_return    :', fe.startsWith('https://') ? '✅ ACTIVO (producción HTTPS)' : '⛔ INACTIVO (localhost o no definida)');
    console.log('==============================================\n');
})
