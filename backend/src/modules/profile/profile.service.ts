import ProfileModel from './Profile.model';

export const crearPerfil = (data: any) => ProfileModel.create(data);
export const obtenerPerfiles = () => ProfileModel.find();
export const obtenerPerfilPorId = (id: string) => ProfileModel.findById(id);
export const actualizarPerfil = (id: string, data: any) =>
  ProfileModel.findByIdAndUpdate(id, data, { new: true });
export const eliminarPerfil = (id: string) =>
  ProfileModel.findByIdAndDelete(id);
