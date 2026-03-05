import 'dotenv/config'
import { generarLecturaGemini } from './helpers/lecturas.js'

const r = await generarLecturaGemini("1999-05-10", "diaria");
console.log(r);
