import { Router } from "express";
import { forgotPassword, resetPassword } from "../controllers/auth.js";
import { check } from "express-validator";
import { validarCampos } from "../middlewares/validar-campos.js";

const router = new Router();

// Endpoint: Solicitar restablecimiento de contraseña
router.post("/forgot-password", [
  check('email', 'El correo es obligatorio y debe ser un email válido').isEmail(),
  validarCampos
], forgotPassword);

// Endpoint: Confirmar el restablecimiento con el token temporal
router.post("/reset-password", [
  check('token', 'El token es obligatorio').not().isEmpty(),
  check('password', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
  validarCampos
], resetPassword);

export default router;
