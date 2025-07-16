import UserModel from './User.model';

export const createUser = (data: any) => UserModel.create(data);
export const findUserByEmail = async (email: string) => {
    return UserModel.findOne({ email });
};
/* export const obtenerPerfiles = () => UserModel.find();
export const obtenerPerfilPorId = (id: string) => UserModel.findById(id);
export const actualizarPerfil = (id: string, data: any) =>
  UserModel.findByIdAndUpdate(id, data, { new: true });
export const eliminarPerfil = (id: string) =>
  UserModel.findByIdAndDelete(id); */
