import UserModel from './User.model';

export const createUser = (data: any) => UserModel.create(data);
export const findUserByEmail = async (email: string) => {
  return UserModel.findOne({ email });
};

export const uploadUserDocument = async (userId: string, documentUrl: string) => {
  const options = { new: true };
  const data = { verificationDocument: documentUrl };
  if (!userId || !documentUrl) {
    throw new Error('Faltan datos requeridos');
  }
  const user = await UserModel.findByIdAndUpdate(
    userId,
    data,
    options);
  return user;
};
/* export const obtenerPerfiles = () => UserModel.find();
export const obtenerPerfilPorId = (id: string) => UserModel.findById(id);
export const actualizarPerfil = (id: string, data: any) =>
  UserModel.findByIdAndUpdate(id, data, { new: true });
export const eliminarPerfil = (id: string) =>
  UserModel.findByIdAndDelete(id); */
