import mercadopago from "mercadopago";

export const crearPreferencia = async (req, res) => {
  try {
    const {
      titulo    = 'Plan Premium Mensual - NumeraAI',
      precio    = 29000,
      cantidad  = 1,
      usuario_id
    } = req.body;

    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });

    const preference = {
      items: [
        {
          title: titulo,
          unit_price: Number(precio),
          quantity: Number(cantidad),
          currency_id: "COP",
        },
      ],
      back_urls: {
        success: "http://localhost:5173/pago-exitoso",
        failure: "http://localhost:5173/pago-fallido",
        pending: "http://localhost:5173/pago-pendiente",
      },
      external_reference: usuario_id ? String(usuario_id) : "sin_usuario",
      statement_descriptor: "NumeraAI",
    };

    const response = await mercadopago.preferences.create(preference);

    // Devolver id (preference_id), init_point y sandbox_init_point
    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
    });

  } catch (error) {
    console.error("Error MP:", error);
    res.status(500).json({
      msg: "Error al crear preferencia de pago",
      raw_mercadopago_error: error,
    });
  }
};
