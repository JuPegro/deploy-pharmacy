// src/services/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

const signToken = (id) => {
    // Usa un valor predeterminado para JWT_SECRET si no está definido
    const secret = process.env.JWT_SECRET || 'tu_secreto_super_seguro_aqui';
    return jwt.sign({ id }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d'
    });
};


exports.registro = async (usuarioData) => {
    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: usuarioData.email }
    });

    if (usuarioExistente) {
        throw new AppError('Este email ya está registrado', 400);
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(usuarioData.password, salt);

    // Crear el usuario
    const usuario = await prisma.usuario.create({
        data: {
            ...usuarioData,
            password: hashedPassword
        }
    });

    // Eliminar la contraseña de la respuesta
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
};

exports.login = async (email, password) => {
    // Buscar usuario por email
    const usuario = await prisma.usuario.findUnique({
        where: { email }
    });

    if (!usuario) {
        throw new AppError('Email o password incorrectos', 401);
    }

    // Verificar password
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
        throw new AppError('Email o password incorrectos', 401);
    }

    // Generar token
    const token = signToken(usuario.id);

    // Eliminar la contraseña de la respuesta
    const { password: _, ...usuarioSinPassword } = usuario;

    // Asegurarse de devolver un objeto con la estructura correcta
    return {
        usuario: usuarioSinPassword,
        token
    };
};

exports.getMe = async (id) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id },
        include: {
            farmacias: true
        }
    });

    if (!usuario) {
        throw new AppError('No se encontró el usuario', 404);
    }

    // Eliminar la contraseña de la respuesta
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
};