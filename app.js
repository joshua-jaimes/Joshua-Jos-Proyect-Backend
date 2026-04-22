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

// ─── CORS: whitelist de orígenes permitidos ────────────────────────────────────
// En Render, agrega la variable de entorno:
//   CORS_ORIGIN=https://joshua-jos-proyect-frontend.vercel.app
// (Si tienes más de un dominio, sepáralos con coma)
const originesPermitidos = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  // URL real del frontend en Vercel (hardcodeada como garantía)
  'https://joshua-jos-proyect-frontend.vercel.app',
  // Orígenes adicionales desde variable de entorno en Render:
  //   CORS_ORIGIN=https://mi-otro-dominio.vercel.app
  ...(process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : []),
]

const corsOptions = {
  origin: (origin, callback) => {
    // Sin origin: Postman, curl, peticiones server-to-server → permitir
    if (!origin) return callback(null, true)

    // Comparación robusta: coincidencia exacta O que el origin empiece con el permitido
    const permitido = originesPermitidos.some(o => origin === o || origin.startsWith(o))

    if (permitido) {
      callback(null, true)
    } else {
      console.warn(`⛔ CORS bloqueado para: ${origin}`)
      callback(new Error(`Origen no permitido por CORS: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-token'],
}

app.use(cors(corsOptions))
// NOTA: app.options('*', ...) no es compatible con Express 5 / path-to-regexp v8.
// app.use(cors(corsOptions)) ya maneja los preflight OPTIONS automáticamente.
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
