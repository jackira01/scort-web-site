import type { Request, Response } from 'express';
import {
    createGender,
    deleteGender,
    getGenderById,
    getGenderNames,
    getGenders,
    updateGender,
} from './gender.services';

export async function createGenderHandler(req: Request, res: Response) {
    try {
        const gender = await createGender(req.body);
        res.status(201).json(gender);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}

export async function getGenderNamesHandler(req: Request, res: Response) {
    try {
        const genderNames = await getGenderNames();
        res.status(200).json(genderNames);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function getGendersHandler(req: Request, res: Response) {
    try {
        const genders = await getGenders();
        res.status(200).json(genders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function getGenderByIdHandler(req: Request, res: Response) {
    try {
        const gender = await getGenderById(req.params.id);
        if (!gender) {
            return res.status(404).json({ message: 'Gender not found' });
        }
        res.status(200).json(gender);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function updateGenderHandler(req: Request, res: Response) {
    try {
        const gender = await updateGender(req.params.id, req.body);
        if (!gender) {
            return res.status(404).json({ message: 'Gender not found' });
        }
        res.status(200).json(gender);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}

export async function deleteGenderHandler(req: Request, res: Response) {
    try {
        const gender = await deleteGender(req.params.id);
        if (!gender) {
            return res.status(404).json({ message: 'Gender not found' });
        }
        res.status(200).json(gender);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
}
