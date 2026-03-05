import Pago from "../models/pagos.js"

const getPagos = async (req, res) => {
    try {
        const pagos = await Pago.find()
        res.json({ pagos })
    } catch (error) {
        res.status(400).json({ error })
    }
}
const getPagosId = async (req, res) => {
    try {
        const { usuario_id } = req.params;

        const pagos = await Pago.find({ usuario_id })
        res.json({ pagos })
    } catch (error) {
        res.status(400).json({ error })
    }
}
const postPagosId = async (req, res) => {
    try {
        const { usuario_id, monto, fecha_pago, fecha_vencimiento, metodo } = req.body
        const pago = new Pago({
            usuario_id, monto, fecha_pago, fecha_vencimiento, metodo
        })
        await pago.save()
        res.json({ pago, msg: "Pago creado correctamente" })
    } catch (error) {
        res.status(400).json({ error })
    }
}
const putPagosId = async (req, res) => {
  try {
    console.log("PARAMS 👉", req.params);
    console.log("BODY 👉", req.body);

    const { id } = req.params;
    const { monto, fecha_pago, fecha_vencimiento, metodo } = req.body;

    const pago = await Pago.findById(id);

    if (!pago) {
      return res.status(404).json({ msg: "Pago no encontrado" });
    }

    const pagoActualizado = await Pago.findByIdAndUpdate(
      id,
      { monto, fecha_pago, fecha_vencimiento, metodo },
      { new: true, runValidators: true }
    );

    res.json({
      msg: "Pago modificado correctamente",
      pago: pagoActualizado
    });

  } catch (error) {
    console.error("❌ ERROR PUT PAGOS:", error);
    res.status(500).json({ error: "Error al actualizar el pago" });
  }
};

const deletePagos = async (req, res) => {
    try {
        const { id } = req.params
        await Pago.findByIdAndDelete(id)
        res.json({ msg: "Pago eliminado correctamente" })
    } catch (error) {
        res.status(400).json({ error })
    }
}
export { getPagos, postPagosId, putPagosId, deletePagos, getPagosId }


