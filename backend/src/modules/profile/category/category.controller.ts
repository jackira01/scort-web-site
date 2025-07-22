import type { Request, Response } from 'express';
import * as categoryService from './category.services';

export const createCategory = async (req: Request, res: Response) => {
    try {
        const categoryData = { ...req.body };
        if (!categoryData.image) {
            categoryData.image = 'https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg'; // Default image URL
        }
        const category = await categoryService.createCategory(categoryData);
        res.status(201).json(category);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json(categories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const category = await categoryService.updateCategory(
            req.params.id,
            req.body,
        );
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const category = await categoryService.deleteCategory(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getNameCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await categoryService.getAllCategories();
        const categoryNames = categories.map((category) => category.name);
        res.status(200).json(categoryNames);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
