

import Lectura from "../models/lecturas.js"
import Usuario from "../models/usuario.js"
import Pago from "../models/pagos.js"

const getLecturas = async (req, res) => {
  try {
    const lecturas = await Lectura.find()
    res.json({ lecturas })
  } catch (error) {
    res.status(400).json({ error })
  }
}
const getLecturasId = async (req, res) => {
  try {
    const { usuario_id } = req.params
    const lecturas = await Lectura.find({ usuario_id })
    res.json({ lecturas })
  } catch (error) {
    res.status(400).json({ error })
  }
}




const postLecturas = async (req, res) => {
  try {
    console.log("\n================ NUEVA PETICIÓN =================");
    console.log("👉 BODY:", req.body);

    const { usuario_id } = req.body;
    let tipo = req.body.tipo; // ahora es reasignable

    const usuario = await Usuario.findById(usuario_id);
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // ------------------------------
    // Determinar tipo real de lectura
    // ------------------------------
    let tipoLectura = tipo;

    // Si el usuario está inactivo, forzamos principal
    if (usuario.estado === 0) {
      tipoLectura = "principal";
      console.log("Usuario inactivo → se genera lectura principal de por vida");
    }

    // ------------------------------
    // Validación lectura principal
    // ------------------------------
    if (tipoLectura === "principal") {
      const lecturaExistente = await Lectura.findOne({
        usuario_id,
        tipo: "principal",
      });
      if (lecturaExistente) {
        return res.status(400).json({
          msg: "Ya has generado tu lectura principal. Esta lectura es única de por vida.",
        });
      }
    }

    // ------------------------------
    // Lectura diaria solo para usuarios activos
    // ------------------------------
    let diaHoy;
    if (tipoLectura === "diaria") {
      if (usuario.estado !== 1) {
        return res.status(403).json({
          msg: "Solo los usuarios activos pueden generar lecturas diarias",
        });
      }

      const pagoActivo = await Pago.findOne({
        usuario_id,
        fecha_vencimiento: { $gte: new Date() },
      });

      if (!pagoActivo) {
        return res.status(403).json({
          msg: "Tu membresía ha vencido. Debes renovar el pago para acceder a lecturas diarias",
        });
      }

      diaHoy = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Bogota",
      });

      const existente = await Lectura.findOne({
        usuario_id,
        tipo: "diaria",
        dia: diaHoy,
      });

      if (existente) {
        return res.status(400).json({
          msg: "Ya generaste tu lectura diaria de hoy",
        });
      }
    }

    // ------------------------------
    // Verificar API Key
    // ------------------------------
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ msg: "API Key no configurada" });
    }

    const hoy = new Date().toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const prompt =
      tipoLectura === "principal"
        ? `
Eres un numerólogo profesional, claro, respetuoso y motivador.

Genera una lectura numerológica PRINCIPAL completa para una persona nacida el ${usuario.fechanacimiento}.

Incluye obligatoriamente las siguientes secciones:

1. Número de vida y su significado.
2. Misión de vida.
3. Talentos naturales.
4. Retos importantes.
5. Propósito personal y espiritual.
6. Consejo general para su camino de vida.

Reglas:
- No inventes fechas.
- No muestres cálculos matemáticos.
- No menciones astrología.
- No hagas referencias a años pasados o futuros.

Redacta en español claro, con buena estructura y tono positivo.
`
        : `
Eres un numerólogo profesional y motivador.

Genera una lectura numerológica DIARIA, clara, breve e inspiradora.

Fecha obligatoria: HOY es ${hoy}.
No utilices ninguna otra fecha.

Datos del usuario:
Fecha de nacimiento: ${usuario.fechanacimiento}.

Incluye:
1. Número del día y su significado.
2. Energía general del día.
3. Consejo práctico para hoy.

Reglas:
- No inventes fechas.
- No muestres cálculos matemáticos.
- No hagas referencias a años pasados o futuros.
- Mantén un tono cercano y positivo.

Inicia el texto mencionando claramente la fecha de hoy: ${hoy}.
`;

    console.log("📝 Enviando petición a Gemini...");

    const axios = (await import("axios")).default;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const makeRequest = async (retries = 3, delay = 1000) => {
      try {
        return await axios.post(
          url,
          { contents: [{ parts: [{ text: prompt }] }] },
          { headers: { "Content-Type": "application/json" }, timeout: 20000 }
        );
      } catch (err) {
        if (retries > 0 && err.response && err.response.status === 429) {
          console.log(`⚠️ Rate limit hit (429). Retrying in ${delay}ms...`);
          await new Promise((res) => setTimeout(res, delay));
          return makeRequest(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    const response = await makeRequest();
    const contenido = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!contenido) throw new Error("Respuesta vacía de Gemini");

    // ------------------------------
    // Guardar lectura
    // ------------------------------
    let lectura;
    if (tipoLectura === "diaria") {
      lectura = new Lectura({ usuario_id, tipo: tipoLectura, contenido, dia: diaHoy });
    } else {
      lectura = new Lectura({ usuario_id, tipo: tipoLectura, contenido });
    }

    await lectura.save();
    console.log("✅ Lectura guardada en BD");

    res.json({ msg: "Lectura creada correctamente", lectura });
  } catch (error) {
    const apiError = error.response?.data?.error;
    console.error("❌ Gemini Error:", apiError ? JSON.stringify(apiError) : error.message);

    res.status(500).json({
      error: error.message,
      details: apiError || error.toString(),
    });
  }
};




const putLecturas = async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, contenido } = req.body
    await Lectura.findByIdAndUpdate(id, { tipo, contenido })
    res.json({ msg: "Lectura modificada correctamente" })
  } catch (error) {
    res.status(400).json({ error })
  }
}
const deleteLecturas = async (req, res) => {
  try {
    const { id } = req.params
    await Lectura.findByIdAndDelete(id)
    res.json({ msg: "Lectura eliminada correctamente" })
  } catch (error) {
    res.status(400).json({ error })
  }
}


const getLecturaDiaria = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const diaHoy = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Bogota",
    });

    const lectura = await Lectura.findOne({
      usuario_id,
      tipo: "diaria",
      dia: diaHoy,
    });

    if (!lectura) {
      return res.status(404).json({ msg: "No hay lectura diaria hoy" });
    }

    res.json({ lectura });

  } catch (error) {
    res.status(500).json({ msg: "Error del servidor" });
  }
};

export { getLecturas, postLecturas, putLecturas, deleteLecturas, getLecturasId, getLecturaDiaria };