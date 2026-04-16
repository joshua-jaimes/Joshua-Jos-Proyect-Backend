import axios from "axios";
import Usuario from "../models/usuario.js";
import mongoose from "mongoose";

// ==== 1. CONFIRMAR PAGO (MongoDB) ====
export const confirmarPago = async (req, res) => {
  try {
    const { payment_id, status, external_reference } =
      req.body.payment_id ? req.body : req.query;

    console.log("\n=== [confirmarPago] REQUEST ===");
    console.log("  status            :", status);
    console.log("  external_reference:", external_reference);
    console.log("  payment_id        :", payment_id);

    if (!external_reference || external_reference === "sin_usuario") {
      return res.status(400).json({ error: "No se recibió external_reference válido" });
    }

    if (status !== "approved") {
      return res.json({ msg: "Pago no aprobado todavía", status });
    }

    const objectIdReferencia = new mongoose.Types.ObjectId(external_reference);

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      objectIdReferencia,
      {
        plan: "mistico_pro",
        estadoPlan: "activo",
        estado: 1,
        premiumActivo: true,
        fechaPagoPremium: new Date(),
      },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ error: "Usuario no encontrado en la BD para actualizar" });
    }

    console.log("✅ USUARIO ACTUALIZADO A PREMIUM:");
    console.log("   plan:", usuarioActualizado.plan);
    console.log("   estado:", usuarioActualizado.estado);
    console.log("=========================================\n");

    res.json({
      msg: "Pago confirmado. Usuario ahora es Mistico Pro.",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("❌ Error en confirmarPago:", error);
    res.status(500).json({ error: "Error procesando la confirmación de pago" });
  }
};

// ==== 2. CREAR PREFERENCIA (axios directo a la API REST de MP) ====
export const crearPreferencia = async (req, res) => {
  try {
    const {
      titulo = "Membresía Premium - Místico Pro",
      precio = 29000,
      cantidad = 1,
      usuario_id,
    } = req.body;

    console.log("\n=== [crearPreferencia] REQUEST ===");
    console.log("  usuario_id:", usuario_id);

    if (!usuario_id || !mongoose.Types.ObjectId.isValid(usuario_id)) {
      console.error("❌ usuario_id inválido:", usuario_id);
      return res.status(400).json({ error: "Se requiere un usuario_id válido de MongoDB" });
    }

    const external_reference = String(usuario_id);
    console.log("  external_reference:", external_reference);

    // ──────────────────────────────────────────────────────────────────────────
    // IMPORTANTE: auto_return: "approved" es INCOMPATIBLE con URLs localhost.
    // FRONTEND_URL en .env de Render:
    //   Desarrollo:  FRONTEND_URL=http://localhost:4173
    //   Producción:  FRONTEND_URL=https://tu-app.vercel.app
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4173";

    const preference = {
      items: [
        {
          title: String(titulo),
          unit_price: Number(precio),
          quantity: Number(cantidad),
          currency_id: "COP",
        },
      ],
      external_reference,
      back_urls: {
        success: `${frontendUrl}/pago-exitoso`,
        failure: `${frontendUrl}/pago-fallido`,
        pending: `${frontendUrl}/pago-pendiente`,
      },
      // auto_return: "approved" → ACTIVAR en producción (requiere HTTPS)
      // Descomenta esta línea cuando FRONTEND_URL sea HTTPS de Vercel:
      // auto_return: "approved",
    };

    console.log("  frontendUrl:", frontendUrl);
    console.log("  Enviando a MP API:", JSON.stringify(preference, null, 2));

    const mpResponse = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      preference,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = mpResponse.data;
    console.log("✅ Preferencia creada. ID:", data.id);
    console.log("   init_point:", data.init_point);
    console.log("==============================\n");

    res.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (error) {
    const detalle = error.response?.data || error.message;
    console.error("❌ Error MP API:", detalle);
    res.status(500).json({ msg: "Error al crear preferencia de pago", detalle });
  }
};
