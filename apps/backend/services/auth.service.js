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
        where: { email },
        include: {
            farmacias: true,
            farmaciaActiva: true
        }
    });

    if (!usuario) {
        throw new AppError('Email o password incorrectos', 401);
    }

    // Verificar password
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
        throw new AppError('Email o password incorrectos', 401);
    }

    // Si es usuario de farmacia y no tiene farmacia activa pero tiene farmacias asignadas
    if (usuario.rol === 'FARMACIA' && !usuario.farmaciaActivaId && usuario.farmacias.length > 0) {
        // Establecer la primera farmacia como activa
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                farmaciaActivaId: usuario.farmacias[0].id
            }
        });
        usuario.farmaciaActiva = usuario.farmacias[0];
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

exports.seleccionarFarmaciaActiva = async (usuarioId, farmaciaId) => {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: { farmacias: true }
    });

    if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar que el usuario tiene acceso a esta farmacia
    const tieneAcceso = usuario.farmacias.some(f => f.id === farmaciaId);
    if (!tieneAcceso) {
        throw new AppError('No tienes acceso a esta farmacia', 403);
    }

    // Actualizar la farmacia activa
    const usuarioActualizado = await prisma.usuario.update({
        where: { id: usuarioId },
        data: { farmaciaActivaId: farmaciaId },
        include: {
            farmacias: true,
            farmaciaActiva: true
        }
    });

    // Eliminar la contraseña de la respuesta
    const { password, ...usuarioSinPassword } = usuarioActualizado;
    return usuarioSinPassword;
};

exports.getMe = async (id) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id },
        include: {
            farmacias: true,
            farmaciaActiva: true
        }
    });

    if (!usuario) {
        throw new AppError('No se encontró el usuario', 404);
    }

    // Eliminar la contraseña de la respuesta
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
};