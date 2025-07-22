import CategoryModel from './Category.model';

export const createCategory = async (category: any) => {
    return await CategoryModel.create(category);
};

export const getAllCategories = async () => {
    return await CategoryModel.find();
};

export const getCategoryById = async (id: string) => {
    return await CategoryModel.findById(id);
};

export const updateCategory = async (id: string, category: any) => {
    return await CategoryModel.findByIdAndUpdate(id, category, { new: true });
};

export const deleteCategory = async (id: string) => {
    return await CategoryModel.findByIdAndDelete(id);
};
