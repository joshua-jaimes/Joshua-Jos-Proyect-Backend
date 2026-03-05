import { Router } from "express";
import { getPagos, getPagosId, putPagosId, postPagosId, deletePagos } from "../controllers/pagos.js";
import { validarCampos } from "../middlewares/validar-campos.js";
import { check } from "express-validator";




const router = new Router()


router.get("/", getPagos);


router.get("/:usuario_id", [
  check("usuario_id", "No es un ID válido").isMongoId(),
  validarCampos
], getPagosId);

router.delete("/:id", [
  check("id", "No es un ID válido").isMongoId(),
  validarCampos
], deletePagos);

router.post("/", [
  check("usuario_id", "El campo usuario_id es obligatorio").not().isEmpty(),
  check("usuario_id", "No es un ID válido").isMongoId(),

  check("monto", "El campo monto debe ser numérico").isNumeric(),

  check("fecha_pago", "El campo fecha_pago es obligatorio").not().isEmpty(),
  check("fecha_pago", "El campo fecha_pago debe ser una fecha válida").isISO8601(),

  check("fecha_vencimiento", "El campo fecha_vencimiento es obligatorio").not().isEmpty(),
  check("fecha_vencimiento", "El campo fecha_vencimiento debe ser una fecha válida").isISO8601(),

  check("metodo", "El campo metodo es obligatorio").not().isEmpty(),

  validarCampos
], postPagosId);

router.put("/:id", [
  check("id", "No es un ID válido").isMongoId(),

  check("monto", "El campo monto debe ser numérico").optional().isNumeric(),
  check("fecha_pago", "El campo fecha_pago debe ser una fecha válida").optional().isISO8601(),
  check("fecha_vencimiento", "El campo fecha_vencimiento debe ser una fecha válida").optional().isISO8601(),
  check("metodo", "El campo metodo es obligatorio").optional().not().isEmpty(),

  validarCampos
], putPagosId);




export default router