import Usuario from "../models/usuario.js"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'


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

    const { nombre, edad, fechanacimiento, email, password } = req.body

    // 🔐 Hashear contraseña
    const salt = bcrypt.genSaltSync(10)
    const passwordHash = bcrypt.hashSync(password, salt)

    const usuario = new Usuario({
      nombre,
      edad,
      fechanacimiento,
      email,
      password: passwordHash, // 👈 guardamos hash
      estado: 0,
      rol: "usuario"
    })

    await usuario.save()

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

    const { email, password } = req.body

    const usuario = await Usuario.findOne({ email })
    if (!usuario) {
      return res.status(401).json({ msg: "Credenciales incorrectas" })
    }

    const esCorrecto = await bcrypt.compare(password, usuario.password)
    if (!esCorrecto) {
      return res.status(401).json({ msg: "Credenciales incorrectas" })
    }

    const token = jwt.sign(
      { uid: usuario._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    const { password: _, ...usuarioSinPassword } = usuario.toObject()

    res.json({
      token,
      usuario: usuarioSinPassword
    })

  } catch (error) {
    res.status(500).json({ msg: "Error en el servidor" })
  }
}


export const registerUser = async (req, res) => {
  try {
    const { name, email, dob, age, password } = req.body;

    // Verificar si ya existe
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = new Usuario({
      nombre: name,
      fechanacimiento: dob,
      edad: age,
      email,
      password: hashedPassword,
      rol: "usuario",
      estado: 0,          // gratuito por defecto
      plan: "gratuito"    // gratuito por defecto
    });

    await nuevoUsuario.save();

    res.status(201).json({ message: "Usuario creado correctamente" });

    // Enviar correo de bienvenida (NO bloqueante)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"NumAI" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '¡Bienvenido a NumAI!',
        text: `Hola ${name},\n\nTu cuenta ha sido creada exitosamente en nuestro sistema de numerología.\nYa puedes iniciar sesión y comenzar a usar la plataforma.\n\nSaludos,\nEl equipo de NumAI.`
      };

      // Si falla, solo muestra en consola y no interrumpe porque no tiene await
      transporter.sendMail(mailOptions).catch(err => console.error("Error enviando email:", err));
    } catch (emailError) {
      console.error("Error configurando nodemailer:", emailError);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor" });
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