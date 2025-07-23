import type { Request, Response } from 'express';
import {
    createService,
    deleteService,
    getServiceById,
    getServiceNames,
    getServices,
    updateService,
} from './services.sevice';

export const createServiceHandler = async (req: Request, res: Response) => {
    try {
        const service = await createService(req.body);
        res.status(201).json(service);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getServiceNamesHandler = async (req: Request, res: Response) => {
    try {
        const serviceNames = await getServiceNames();
        res.status(200).json(serviceNames);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getServicesHandler = async (req: Request, res: Response) => {
    try {
        const services = await getServices();
        res.status(200).json(services);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getServiceByIdHandler = async (req: Request, res: Response) => {
    try {
        const service = await getServiceById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json(service);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateServiceHandler = async (req: Request, res: Response) => {
    try {
        const service = await updateService(req.params.id, req.body);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json(service);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteServiceHandler = async (req: Request, res: Response) => {
    try {
        const service = await deleteService(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json(service);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
