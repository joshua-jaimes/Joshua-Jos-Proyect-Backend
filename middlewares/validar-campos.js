import { validationResult } from 'express-validator';

export const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Devuelve el primer error como mensaje legible (el frontend busca .error o .message)
    const primerError = errors.array()[0].msg;
    return res.status(400).json({ error: primerError });
  }
  next();
}