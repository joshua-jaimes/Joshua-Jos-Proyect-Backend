import { Router } from "express";
import { deleteUsuario, getUsuario, getUsuarioEmail, postUsuario, putUsuario, putUsuarioActivar, putUsuarioInactivar, registerUser, cambiarPassword, activarPremium } from "../controllers/usuario.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { check } from "express-validator";
import { validarEmail, validarExisteUsuario } from "../helpers/usuarios.js";
import { loginUsuario } from '../controllers/usuario.js'





const router = new Router()





router.post('/login', [
    check('email', 'El email es obligatorio').not().isEmpty(),
    check('email', 'No es un email válido').isEmail(),
    check('password', 'El password debe tener al menos 6 caracteres').isLength({ min: 6 }),
    validarCampos
], loginUsuario)


router.get("/email", [
    check('email').not().isEmpty(),
    check('email', "No es un email valido").isEmail(),
    validarCampos
], getUsuarioEmail)

router.get("/", getUsuario)


router.post("/", [
    check('nombre', 'El nombre es obligatorio y debe tener entre 3 y 50 caracteres').not().isEmpty().isLength({ min: 3, max: 50 }),
    check('fechanacimiento', 'El formato de fecha no es válido').optional().isISO8601(),
    check('email', 'No es un email válido').isEmail().normalizeEmail(),
    check('email').custom(validarEmail),
    check('password', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
    validarCampos
], postUsuario)


router.put("/activar/:id", putUsuarioActivar)

router.put("/inactivar/:id", putUsuarioInactivar)

router.put("/:id", [
    check('nombre').not().isEmpty(),
    check('id').isMongoId(),
    check('id').custom(validarExisteUsuario),
    validarCampos
], putUsuario)


router.put("/cambiar-password/:id", [
    check('passwordActual', 'La contraseña actual es obligatoria').not().isEmpty(),
    check('nuevaPassword', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
    validarCampos
], cambiarPassword)

router.delete("/:id", deleteUsuario)


router.post("/register", [
    check('name', 'El nombre es obligatorio y debe tener entre 3 y 50 caracteres').not().isEmpty().isLength({ min: 3, max: 50 }),
    check('dob', 'La fecha de nacimiento es obligatoria').not().isEmpty(),
    check('dob', 'El formato de fecha no es válido').isISO8601(),
    check('email', 'No es un email válido').isEmail().normalizeEmail(),
    check('email').custom(validarEmail),
    check('password', 'La contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
    validarCampos
], registerUser)

// Activa premium tras pago aprobado
router.post("/activar-premium", activarPremium)

export default router