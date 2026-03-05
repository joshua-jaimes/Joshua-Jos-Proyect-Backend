import { Router } from "express";
import { getLecturas, getLecturasId, postLecturas, putLecturas, deleteLecturas, getLecturaDiaria } from "../controllers/lecturas.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { check } from "express-validator";
import { validarJWT } from '../middlewares/validar-jwt.js'





const router = new Router()

;

router.get('/', validarJWT, getLecturas)

router.get("/diaria/:usuario_id", getLecturaDiaria);

router.get("/:usuario_id", [
  check("usuario_id", "No es un ID válido").isMongoId(),
  validarCampos
], getLecturasId);

router.delete("/:id", [
  check("id", "No es un ID válido").isMongoId(),
  validarCampos
], deleteLecturas);

router.post("/", [
  check("usuario_id", "El campo usuario_id es obligatorio").not().isEmpty(),
  check("usuario_id", "No es un ID válido").isMongoId(),
  check("tipo", "El campo tipo es obligatorio").isIn(["principal", "diaria"]),
  validarCampos
], postLecturas);

router.put("/:id", [
  check("id", "No es un ID válido").isMongoId(),
  check("tipo", "El campo tipo debe ser principal o diaria").optional().isIn(["principal", "diaria"]),
  check("contenido", "El campo contenido debe ser texto").optional().isString(),
  validarCampos
], putLecturas);




router.get("/test", (req, res) => {
  res.json({ ok: true });
});

export default router
