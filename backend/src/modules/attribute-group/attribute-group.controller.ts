import type { Request, Response } from 'express';
import * as service from './attribute-group.service';

export const create = async (req: Request, res: Response) => {
    try {
        const group = await service.createAttributeGroup(req.body);
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error creating attribute group', error });
    }
};

export const list = async (_: Request, res: Response) => {
    const groups = await service.getAttributeGroups();
    res.json(groups);
};

export const getByKey = async (req: Request, res: Response) => {
    const group = await service.getAttributeGroupByKey(req.params.key);
    if (!group) return res.status(404).json({ message: 'Not found' });
    res.json(group);
};

export const patchVariant = async (req: Request, res: Response) => {
    try {
        const updated = await service.updateVariant(req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating variant', error });
    }
};

export const deleteGroup = async (req: Request, res: Response) => {
    try {
        await service.deleteAttributeGroup(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting attribute group', error });
    }
};

export const addVariant = async (req: Request, res: Response) => {
    try {
        const updated = await service.addVariant(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error adding variant', error });
    }
};

export const removeVariant = async (req: Request, res: Response) => {
    try {
        const { variantIndex } = req.body;
        const updated = await service.removeVariant(req.params.id, variantIndex);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error removing variant', error });
    }
};

export const updateGroup = async (req: Request, res: Response) => {
    try {
        const updated = await service.updateGroup(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating group', error });
    }
};
