import { Router } from 'express'
import { crearPreferencia } from '../controllers/mercadopago.js'

const router = Router()

// POST /api/mercadopago/create-preference
router.post('/create-preference', crearPreferencia)

export default router
