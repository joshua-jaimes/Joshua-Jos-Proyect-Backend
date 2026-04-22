import Usuario from "../models/usuario.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "El correo es requerido" });
    }

    const usuario = await Usuario.findOne({ email });

    // Regla de seguridad: Responder éxito genérico siempre, para no filtrar usuarios existentes
    if (!usuario) {
      return res.json({ msg: "Si el correo existe, te enviamos un enlace" });
    }

    // Generar token seguro temporal
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Asignar al usuario una expiración de 1 hora
    usuario.resetPasswordToken = resetToken;
    usuario.resetPasswordExpires = Date.now() + 3600000; // 1 hora en ms
    await usuario.save();

    // Enviar el correo usando Nodemailer con el mismo estilo actual
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'tu_correo@gmail.com',
        pass: process.env.EMAIL_PASS || 'tu_contraseña_app'
      }
    });

    // IMPORTANTE: URL que apunta al frontend con query params
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `"Numerología AI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Restablecer contraseña - Numerología AI",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 0; color: #2d3748;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">Restablecer contraseña</h1>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #2d3748; font-size: 22px;">¡Hola, ${usuario.nombre}! 🔐</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
                  Hemos recibido una solicitud para restablecer tu contraseña en Numerología AI. 
                  Si fuiste tú, haz clic en el botón de abajo para cambiarla.
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4); display: inline-block;">
                    Restablecer mi contraseña
                  </a>
                </div>
                
                <p style="font-size: 14px; line-height: 1.6; color: #718096; margin-bottom: 0;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <a href="${resetLink}" style="color: #667eea; word-break: break-all;">
                    ${resetLink}
                  </a>
                </p>

                <p style="font-size: 15px; line-height: 1.6; color: #718096; margin-bottom: 0; margin-top: 20px;">
                  Si no realizaste esta solicitud, puedes ignorar este correo de forma segura. El enlace expirará en 1 hora.<br><br>¡Saludos!
                </p>
              </div>
              
              <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 13px; color: #a0aec0; margin: 0;">&copy; ${new Date().getFullYear()} Numerología AI.<br>Todos los derechos reservados.</p>
              </div>
              
            </div>
          </div>
        `
      };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de reset password enviado a: ${email}`);

    res.json({ msg: "Si el correo existe, te enviamos un enlace" });

  } catch (error) {
    console.error("❌ Error en forgotPassword:", error);
    res.status(500).json({ error: "Ocurrió un error al procesar tu solicitud" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token, nuevaConfirmacionPassword } = req.body;
    
    // Para simplificar, la contraseña real es recibida
    // En las validaciones se pide que sea la nuevaPassword y confirmación
    // Solo requerimos 1 parámetro valioso validado desde front o destructuramos
    const claveAActualizar = req.body.password || req.body.nuevaPassword;

    if (!token || !claveAActualizar) {
      return res.status(400).json({ error: "Faltan datos obligatorios para el reseteo" });
    }

    // Buscar si existe alguien con ese token y que NO haya expirado
    const usuario = await Usuario.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ error: "El token es inválido o ha expirado" });
    }

    // Hashear la nueva contraseña
    const salt = bcrypt.genSaltSync(10);
    usuario.password = bcrypt.hashSync(claveAActualizar, salt);

    // Borrar el token para imposibilitar su re-uso
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;

    await usuario.save();
    console.log(`✅ Contraseña de ${usuario.email} restaurada con éxito.`);

    res.json({ msg: "Tu contraseña ha sido restaurada con éxito" });

  } catch (error) {
    console.error("❌ Error en resetPassword:", error);
    res.status(500).json({ error: "Error interno procesando la restauración de clave" });
  }
};
