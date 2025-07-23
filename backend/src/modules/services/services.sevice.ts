import Services, { type IServices } from './Services.model';

export const createService = async (service: IServices): Promise<IServices> =>
    await Services.create(service);

export const getServices = async (): Promise<IServices[]> =>
    Services.find();

export const getServiceNames = async (): Promise<string[]> =>
    (await Services.find({ isActive: true })).map((service) => service.name);

export const getServiceById = async (id: string): Promise<IServices | null> =>
    Services.findById(id);

export const updateService = async (
    id: string,
    service: IServices,
): Promise<IServices | null> => {
    return await Services.findByIdAndUpdate(id, service, { new: true });
}

export const deleteService = async (id: string): Promise<IServices | null> =>
    Services.findByIdAndDelete(id);
