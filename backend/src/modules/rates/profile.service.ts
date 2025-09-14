import { ProfileModel } from '../profile/profile.model';
import type { IProfile } from '../profile/profile.types';

/**
 * Servicio de perfiles para el módulo de rates
 * Funciones básicas CRUD para perfiles
 */

export const crearPerfil = async (perfilData: Partial<IProfile>): Promise<IProfile> => {
  const perfil = new ProfileModel(perfilData);
  return await perfil.save();
};

export const obtenerPerfiles = async (): Promise<IProfile[]> => {
  return await ProfileModel.find().populate('user', 'name email').lean();
};

export const obtenerPerfilPorId = async (id: string): Promise<IProfile | null> => {
  return await ProfileModel.findById(id).populate('user', 'name email').lean();
};

export const actualizarPerfil = async (id: string, updateData: Partial<IProfile>): Promise<IProfile | null> => {
  return await ProfileModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('user', 'name email').lean();
};

export const eliminarPerfil = async (id: string): Promise<IProfile | null> => {
  return await ProfileModel.findByIdAndDelete(id);
};