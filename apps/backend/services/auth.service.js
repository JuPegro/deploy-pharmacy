// src/services/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

const signToken = (id) => {
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

    // Verificar farmacia
    if (usuarioData.farmaciaId) {
        const farmacia = await prisma.farmacia.findUnique({
            where: { id: usuarioData.farmaciaId }
        });

        if (!farmacia) {
            throw new AppError('La farmacia especificada no existe', 404);
        }
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(usuarioData.password, salt);

    // Crear el usuario
    const usuario = await prisma.usuario.create({
        data: {
            ...usuarioData,
            password: hashedPassword,
            farmaciaActiva: usuarioData.farmaciaId ? 
                { connect: { id: usuarioData.farmaciaId } } : undefined
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
            farmacia: true,
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

    // Si es usuario de farmacia y no tiene farmacia activa
    if (usuario.rol === 'FARMACIA' && !usuario.farmaciaActivaId && usuario.farmaciaId) {
        // Establecer su farmacia principal como activa
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                farmaciaActivaId: usuario.farmaciaId
            }
        });
        usuario.farmaciaActiva = usuario.farmacia;
    }

    // Generar token
    const token = signToken(usuario.id);

    // Eliminar la contraseña de la respuesta
    const { password: _, ...usuarioSinPassword } = usuario;

    return {
        usuario: usuarioSinPassword,
        token
    };
};

exports.seleccionarFarmaciaActiva = async (usuarioId, farmaciaId) => {
    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId }
    });

    if (!usuario) {
        throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar que la farmacia existe y pertenece al usuario
    const farmacia = await prisma.farmacia.findUnique({
        where: { id: farmaciaId }
    });

    if (!farmacia) {
        throw new AppError('Farmacia no encontrada', 404);
    }

    // Actualizar la farmacia activa
    const usuarioActualizado = await prisma.usuario.update({
        where: { id: usuarioId },
        data: { 
            farmaciaActivaId: farmaciaId 
        },
        include: {
            farmacia: true,
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
            farmacia: true,
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