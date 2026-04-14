import { Router } from 'express'
import { crearPreferencia, confirmarPago } from '../controllers/mercadopago.js'

const router = Router()

// POST /api/mercadopago/create-preference
router.post('/create-preference', crearPreferencia)

// POST /api/mercadopago/confirmar-pago
router.post('/confirmar-pago', confirmarPago)

export default router
