import Usuario from "../models/usuario.js"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { enviarCorreo } from '../helpers/mailer.js'


const getUsuario = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
    res.json({ usuarios })
  } catch (error) {
    res.status(400).json({ error })
  }
}

const getUsuarioEmail = async (req, res) => {
  try {
    const { email } = req.query
    const usuarios = await Usuario.find({ email })
    res.json({ usuarios })
  } catch (error) {
    res.status(400).json({ error })
  }
}

const postUsuario = async (req, res) => {
  try {

    const { nombre, fechanacimiento, email, password } = req.body

    // 🔐 Hashear contraseña
    const salt = bcrypt.genSaltSync(10)
    const passwordHash = bcrypt.hashSync(password, salt)

    const usuario = new Usuario({
      nombre,
      fechanacimiento,
      email,
      password: passwordHash,
      estado: 0,
      rol: "usuario"
    })

    await usuario.save()

    // 📧 Enviar correo de bienvenida (Separado para que si falla no dañe el registro)
    try {
      await enviarCorreo({
        to: email,
        subject: "Bienvenido a Numerología AI",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 0; color: #2d3748;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              
              <!-- Header Gradient -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">Bienvenido a Numerología AI</h1>
              </div>
              
              <!-- Content Body -->
              <div style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #2d3748; font-size: 22px;">¡Hola, ${nombre}! 🌟</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin-bottom: 25px;">
                  Nos emociona tenerte con nosotros. Prepárate para descubrir todos los secretos y explorar el verdadero potencial que los números tienen para ofrecerte.
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4); display: inline-block;">
                    Iniciar sesión
                  </a>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6; color: #718096; margin-bottom: 0;">
                  Si tienes alguna pregunta, no dudes en contactarnos.<br>¡Disfruta mucho de la plataforma!
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 14px; color: #718096; margin: 0; font-weight: 500;">Tu cuenta fue creada exitosamente.</p>
                <p style="font-size: 13px; color: #a0aec0; margin: 8px 0 0 0;">&copy; 2026 Numerología AI.<br>Todos los derechos reservados.</p>
              </div>
              
            </div>
          </div>
        `
      })
      console.log(`✅ Correo de bienvenida enviado a: ${email}`)
    } catch (emailError) {
      console.error(`❌ Error al enviar el correo a ${email}:`, emailError.message)
    }

    res.json({ usuario, msg: "Usuario creado correctamente" })

  } catch (error) {
    res.status(400).json({ error })
  }
}


const putUsuario = async (req, res) => {
  try {
    const { nombre } = req.body
    const { id } = req.params

    await Usuario.findByIdAndUpdate(id, { nombre })

    res.json({ msg: "Usuario modificado correctamente" })
  } catch (error) {
    res.status(400).json({ error })
  }


}

const putUsuarioActivar = async (req, res) => {
  try {
    const { id } = req.params

    await Usuario.findByIdAndUpdate(id, { estado: 1 })

    res.json({ msg: "Usuario activado correctamente" })
  } catch (error) {
    res.status(400).json({ error })
  }


}

const putUsuarioInactivar = async (req, res) => {
  try {
    const { id } = req.params

    await Usuario.findByIdAndUpdate(id, { estado: 0 })

    res.json({ msg: "Usuario inactivado correctamente" })
  } catch (error) {
    res.status(400).json({ error })
  }


}

const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params

    await Usuario.findByIdAndDelete(id)

    res.json({ msg: "Usuario eliminado correctamente" })
  } catch (error) {
    res.status(400).json({ error })
  }


}

const loginUsuario = async (req, res) => {
  try {
    const { email: emailRaw, password } = req.body

    // Normalizar email exactamente igual que en el registro
    const email = emailRaw?.toString().toLowerCase().trim()

    console.log('\n🔑 [login] Intento de login:')
    console.log('  email recibido  :', emailRaw)
    console.log('  email normalizado:', email)

    const usuario = await Usuario.findOne({ email })
    console.log('  usuario encontrado:', usuario ? '✅ SÍ' : '❌ NO')

    if (!usuario) {
      return res.status(401).json({ error: 'No existe una cuenta con ese correo' })
    }

    const esCorrecto = await bcrypt.compare(password, usuario.password)
    console.log('  bcrypt.compare   :', esCorrecto ? '✅ CORRECTO' : '❌ INCORRECTO')

    if (!esCorrecto) {
      return res.status(401).json({ error: 'Contraseña incorrecta' })
    }

    const token = jwt.sign(
      { uid: usuario._id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    const { password: _, ...usuarioSinPassword } = usuario.toObject()

    console.log('  ✨ Login exitoso para:', email)
    res.json({
      token,
      usuario: usuarioSinPassword
    })

  } catch (error) {
    console.error('❌ [login] Error:', error.message)
    res.status(500).json({ error: 'Error en el servidor' })
  }
}


export const registerUser = async (req, res) => {
  try {
    const { name, email: emailRaw, dob, password } = req.body;

    // Normalizar email igual que en el login (evita problemas de mayúsculas)
    const email = emailRaw?.toString().toLowerCase().trim()

    console.log('📥 [register] Body recibido:', { name, email, dob, password: password ? '***' : 'VACÍO' });

    // Validar campos mínimos manualmente (segunda línea de defensa)
    if (!name || !email || !dob || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si el correo ya existe
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: 'El correo ya está registrado, usa otro' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario (sin campo edad)
    const nuevoUsuario = new Usuario({
      nombre: name,
      fechanacimiento: dob,
      email,
      password: hashedPassword,
      rol: 'usuario',
      estado: 0,
      plan: 'gratuito'
    });

    await nuevoUsuario.save();
    console.log('✅ [register] Usuario creado:', email);

    res.status(201).json({ message: 'Usuario creado correctamente' });

    // Enviar correo de bienvenida (NO bloqueante)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      enviarCorreo({
        to: email,
        subject: '¡Bienvenido a Numerología AI! 🌌',
        html: `
          <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background-color: #0f0914; margin: 0; padding: 40px 10px; color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #191022; border: 1px solid #2a0b4d; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #7311d4 0%, #2a0b4d 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">Numerología AI</h1>
                <p style="color: #d8b4fe; margin: 10px 0 0 0; font-size: 16px;">Descubre el poder de tus números</p>
              </div>
              
              <!-- Body -->
              <div style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #f3e8ff; font-size: 24px; font-weight: 600;">¡Hola, ${name}! ✨</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #d1d5db; margin-bottom: 25px;">
                  Tu cuenta ha sido creada exitosamente. Estamos emocionados de acompañarte en este viaje de autodescubrimiento y crecimiento espiritual a través de la numerología.
                </p>
                
                <div style="background-color: #231630; border-left: 4px solid #b980ff; padding: 15px 20px; border-radius: 4px; margin-bottom: 30px;">
                  <p style="margin: 0; color: #e5e7eb; font-size: 15px; line-height: 1.5;">
                    Ya puedes acceder a tu portal místico y comenzar a explorar tus lecturas personalizadas generadas por inteligencia artificial.
                  </p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${frontendUrl}" style="background: linear-gradient(135deg, #8f3ce6 0%, #7311d4 100%); color: #ffffff; text-decoration: none; padding: 15px 35px; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(115, 17, 212, 0.4); border: 1px solid #b980ff;">
                    Ir a mi portal
                  </a>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6; color: #9ca3af; margin-bottom: 0;">
                  Que el universo guíe tu camino.<br><br>
                  <strong style="color: #d8b4fe;">El equipo de Numerología AI</strong>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #120b18; padding: 25px; text-align: center; border-top: 1px solid #2a0b4d;">
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                  &copy; ${new Date().getFullYear()} Numerología AI.<br>Todos los derechos reservados.
                </p>
              </div>
              
            </div>
          </div>
        `
      }).catch(err => console.error('Error enviando email de bienvenida:', err));
    } catch (emailError) {
      console.error('Error configurando envío de correo:', emailError);
    }

  } catch (error) {
    console.error('❌ [register] Error:', error.message);
    res.status(500).json({ error: 'Error del servidor al registrar usuario' });
  }
};

export const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params
    const { passwordActual, nuevaPassword } = req.body

    // Buscar usuario con contraseña
    const usuario = await Usuario.findById(id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    // Verificar contraseña actual
    const esCorrecto = await bcrypt.compare(passwordActual, usuario.password)
    if (!esCorrecto) return res.status(401).json({ error: 'La contraseña actual es incorrecta' })

    // Hashear nueva contraseña
    const salt = bcrypt.genSaltSync(10)
    const passwordHash = bcrypt.hashSync(nuevaPassword, salt)

    await Usuario.findByIdAndUpdate(id, { password: passwordHash })

    res.json({ msg: 'Contraseña actualizada correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar la contraseña' })
  }
}

export { getUsuario, postUsuario, putUsuario, putUsuarioActivar, putUsuarioInactivar, deleteUsuario, getUsuarioEmail, loginUsuario }

// Activa premium tras pago aprobado — llamado desde el webhook/success de MP
export const activarPremium = async (req, res) => {
  try {
    const { usuario_id } = req.body   // viene del external_reference de MP

    if (!usuario_id || usuario_id === 'sin_usuario') {
      return res.status(400).json({ error: 'usuario_id requerido' })
    }

    const usuario = await Usuario.findByIdAndUpdate(
      usuario_id,
      { estado: 1, plan: 'premium' },
      { new: true }
    )

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    res.json({ msg: 'Plan premium activado correctamente', usuario })
  } catch (error) {
    console.error('Error activando premium:', error)
    res.status(500).json({ error: 'Error al activar premium' })
  }
}