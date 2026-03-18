import mercadopago from "mercadopago";

export const crearPreferencia = async (req, res) => {
  try {
    const { titulo, precio, cantidad } = req.body;

    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });

    let preference = {
      items: [
        {
          title: titulo,
          unit_price: Number(precio),
          quantity: Number(cantidad),
          currency_id: "COP"
        },
      ],
      back_urls: {
        success: "http://localhost:5173/dashboard",
        failure: "http://localhost:5173/membresias-pagos",
        pending: "http://localhost:5173/membresias-pagos",
      }
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
    });
  } catch (error) {
    console.error("ERROR CREANDO PREFERENCIA:", JSON.stringify(error, null, 2));
    res.status(500).json({
      msg: "Error al crear preferencia de pago",
      raw_mercadopago_error: error
    });
  }
};