import mercadopago from "mercadopago";
import Usuario from "../models/usuario.js";
import mongoose from "mongoose";

// ==== 1. CONFIRMAR PAGO (Mongo DB) ====
export const confirmarPago = async (req, res) => {
  try {
    const { payment_id, status, external_reference } = req.body.payment_id ? req.body : req.query;

    console.log("\n=== [confirmarPago] REQUEST RECIBIDO ===");
    console.log("payment_id:", payment_id, "| status:", status, "| external_reference:", external_reference);

    if (!external_reference || external_reference === "sin_usuario") {
      return res.status(400).json({ error: "No se recibió external_reference válido" });
    }

    if (status !== "approved") {
      return res.json({ msg: "Pago no aprobado", status });
    }

    const objectIdReferencia = new mongoose.Types.ObjectId(external_reference);

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      objectIdReferencia,
      {
        plan: "mistico_pro",
        estadoActividad: "Premium",
        estado: 1, 
        premiumActivo: true,
        fechaPagoPremium: new Date(),
      },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ error: "Usuario no encontrado en la BD para actualizar" });
    }

    console.log("✅ ¡USUARIO ACTUALIZADO A PREMIUM EXITOSAMENTE EN MONGODB!");
    console.log("========================================\n");

    res.json({
      msg: "Pago confirmado y usuario actualizado a Mistico Pro",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("❌ Error grave en confirmarPago:", error);
    res.status(500).json({ error: "Error procesando la confirmación de pago" });
  }
};

// ==== 2. CREAR PREFERENCIA ====
export const crearPreferencia = async (req, res) => {
  try {
    const {
      titulo = "Plan Premium Mensual - NumeraAI",
      precio = 29000,
      cantidad = 1,
      usuario_id,
    } = req.body;

    console.log("\n=== [crearPreferencia V1 FINAL] REQUEST ===");
    
    // Configuración Clásica de MP (V1)
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
    });
    
    const external_reference = usuario_id ? String(usuario_id) : "sin_usuario";

    // ✅ REGLA CRITICA DE MERCADO PAGO APLICADA CORRECTAMENTE:
    // MercadoPago (Específicamente V1) en su core de Checkout Pro obliga a que `auto_return` vaya ACOMPAÑADO de unas back_urls de estructura idéntica a esta.
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
        failure: "http://localhost:5173/",
        pending: "http://localhost:5173/",
      },
      auto_return: "approved", 
      external_reference,
      statement_descriptor: "NumeraAI",
    };

    const response = await mercadopago.preferences.create(preference);
    
    console.log("✅ Preferencia creada V1 FINAL. ID:", response.body.id);
    console.log("==============================\n");

    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Error MP V1:", error);
    res.status(500).json({
      msg: "Error al crear preferencia de pago V1",
      raw_mercadopago_error: error,
    });
  }
};
