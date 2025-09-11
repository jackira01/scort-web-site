"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarPerfil = exports.actualizarPerfil = exports.obtenerPerfilPorId = exports.obtenerPerfiles = exports.crearPerfil = void 0;
const profileService = __importStar(require("./profile.service"));
const crearPerfil = async (req, res) => {
    const perfil = await profileService.crearPerfil(req.body);
    res.status(201).json(perfil);
};
exports.crearPerfil = crearPerfil;
const obtenerPerfiles = async (_, res) => {
    const perfiles = await profileService.obtenerPerfiles();
    res.json(perfiles);
};
exports.obtenerPerfiles = obtenerPerfiles;
const obtenerPerfilPorId = async (req, res) => {
    const perfil = await profileService.obtenerPerfilPorId(req.params.id);
    if (!perfil)
        return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    res.json(perfil);
};
exports.obtenerPerfilPorId = obtenerPerfilPorId;
const actualizarPerfil = async (req, res) => {
    const perfil = await profileService.actualizarPerfil(req.params.id, req.body);
    res.json(perfil);
};
exports.actualizarPerfil = actualizarPerfil;
const eliminarPerfil = async (req, res) => {
    await profileService.eliminarPerfil(req.params.id);
    res.status(204).send();
};
exports.eliminarPerfil = eliminarPerfil;
