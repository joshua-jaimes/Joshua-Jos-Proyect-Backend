import express from "express"
import cors from "cors"
import 'dotenv/config'
import { conectarMongo } from "./database/cnx-mongo.js"
import usuarioRoute from "./routes/usuario.js"
import lecturasRoute from "./routes/lecturas.js"
import pagosRoute from "./routes/pagos.js"
import mercadopagoRoute from "./routes/mercadopago.js"


const app = express()
conectarMongo()

app.use(cors())
app.use(express.json())





app.use("/api/usuario", usuarioRoute)
app.use("/api/lecturas", lecturasRoute)
app.use("/api/pagos", pagosRoute)
app.use("/api/mercadopago", mercadopagoRoute)


app.listen(process.env.PORT, () => {
    console.log(`Servidor escuchando en el puerto ${process.env.PORT}`);
})

