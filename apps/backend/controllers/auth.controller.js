// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const AppError = require('../utils/errorHandler');
const jwt = require('jsonwebtoken');

exports.registro = async (req, res, next) => {
    try {
        const usuario = await authService.registro(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                usuario
            }
        });
    } catch (error) {
        next(error);
    }
};

// Función auxiliar para generar un token JWT
const signToken = (id) => {
    const secret = process.env.JWT_SECRET || 'default_secret_key_for_development';
    return jwt.sign({ id }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '90d'
    });
};
  
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
  
        // Verificar si se proporciona email y password
        if (!email || !password) {
            return next(new AppError('Por favor, proporciona email y password', 400));
        }
  
        try {
            const resultado = await authService.login(email, password);
        
            // Verificar que resultado tenga la estructura esperada
            if (!resultado || !resultado.token) {
                return next(new AppError('Error al generar credenciales', 500));
            }
        
            // Enviar respuesta
            res.status(200).json({
                status: 'success',
                data: resultado
            });
        } catch (serviceError) {
            console.error('Error en el servicio de autenticación:', serviceError);
            return next(serviceError);
        }
    } catch (error) {
        console.error('Error general en login:', error);
        next(error);
    }
};

// Endpoint para seleccionar farmacia activa
exports.seleccionarFarmaciaActiva = async (req, res, next) => {
    try {
        const { farmaciaId } = req.body;
        const usuarioId = req.usuario.id;

        if (!farmaciaId) {
            return next(new AppError('Se requiere un ID de farmacia válido', 400));
        }

        // Verificar que el usuario tenga acceso a esta farmacia
        const resultado = await authService.seleccionarFarmaciaActiva(usuarioId, farmaciaId);

        res.status(200).json({
            status: 'success',
            data: {
                usuario: resultado
            }
        });
    } catch (error) {
        next(error);
    }
};
  
// Endpoint de prueba
exports.loginTest = async (req, res) => {
    return res.status(200).json({
        status: 'success',
        data: {
            usuario: {
                id: '123',
                nombre: 'Usuario de Prueba',
                email: req.body.email || 'test@example.com',
                rol: 'ADMIN'
            },
            token: 'token-de-prueba-123456'
        }
    });
};

exports.getMe = async (req, res, next) => {
    try {
        const usuario = await authService.getMe(req.usuario.id);
        res.status(200).json({
            status: 'success',
            data: {
                usuario
            }
        });
    } catch (error) {
        next(error);
    }
};