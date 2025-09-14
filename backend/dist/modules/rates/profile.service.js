"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarPerfil = exports.actualizarPerfil = exports.obtenerPerfilPorId = exports.obtenerPerfiles = exports.crearPerfil = void 0;
const profile_model_1 = require("../profile/profile.model");
const crearPerfil = async (perfilData) => {
    const perfil = new profile_model_1.ProfileModel(perfilData);
    return await perfil.save();
};
exports.crearPerfil = crearPerfil;
const obtenerPerfiles = async () => {
    return await profile_model_1.ProfileModel.find().populate('user', 'name email').lean();
};
exports.obtenerPerfiles = obtenerPerfiles;
const obtenerPerfilPorId = async (id) => {
    return await profile_model_1.ProfileModel.findById(id).populate('user', 'name email').lean();
};
exports.obtenerPerfilPorId = obtenerPerfilPorId;
const actualizarPerfil = async (id, updateData) => {
    return await profile_model_1.ProfileModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('user', 'name email').lean();
};
exports.actualizarPerfil = actualizarPerfil;
const eliminarPerfil = async (id) => {
    return await profile_model_1.ProfileModel.findByIdAndDelete(id);
};
exports.eliminarPerfil = eliminarPerfil;
