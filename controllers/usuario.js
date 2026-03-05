import Usuario from "../models/usuario.js"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


const getUsuario= async (req,res)=>{
    try {
        const usuarios= await Usuario.find()
        res.json({usuarios})
    } catch (error) {
        res.status(400).json({error})
    }
}

const getUsuarioEmail= async (req,res)=>{
    try {
        const {email}=req.query
        const usuarios= await Usuario.find({email})
        res.json({usuarios})
    } catch (error) {
        res.status(400).json({error})
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
            estado: 0
        })

        await usuario.save()

        res.json({ usuario, msg: "Usuario creado correctamente" })

    } catch (error) {
        res.status(400).json({ error })
    }
}


const putUsuario=async(req,res)=>{
    try {
        const {nombre}=req.body
        const {id}=req.params

        await Usuario.findByIdAndUpdate(id,{nombre})

        res.json({msg:"Usuario modificado correctamente"})
    } catch (error) {
          res.status(400).json({error})
    }
    

}

const putUsuarioActivar=async(req,res)=>{
    try {
        const {id}=req.params

        await Usuario.findByIdAndUpdate(id,{estado:1})

        res.json({msg:"Usuario activado correctamente"})
    } catch (error) {
          res.status(400).json({error})
    }
    

}

const putUsuarioInactivar=async(req,res)=>{
    try {
        const {id}=req.params

        await Usuario.findByIdAndUpdate(id,{estado:0})

        res.json({msg:"Usuario inactivado correctamente"})
    } catch (error) {
          res.status(400).json({error})
    }
    

}

const deleteUsuario=async(req,res)=>{
    try {
        const {id}=req.params

        await Usuario.findByIdAndDelete(id)

        res.json({msg:"Usuario eliminado correctamente"})
    } catch (error) {
          res.status(400).json({error})
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
      nombre: name,          // 👈 importante (ver abajo)
      fechanacimiento: dob,  // 👈 importante
      edad: age,
      email,
      password: hashedPassword
    });

    await nuevoUsuario.save();

    res.status(201).json({ message: "Usuario creado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

export {getUsuario,postUsuario,putUsuario,putUsuarioActivar,putUsuarioInactivar,deleteUsuario, getUsuarioEmail, loginUsuario}