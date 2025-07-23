import Gender, { type IGender } from './Gender.model';

export async function createGender(gender: IGender): Promise<IGender> {
    return await Gender.create(gender);
}

export async function getGenders(): Promise<IGender[]> {
    return await Gender.find();
}

export async function getGenderNames(): Promise<string[]> {
    return (await Gender.find({ isActive: true })).map((gender) => gender.name);
}

export async function getGenderById(id: string): Promise<IGender | null> {
    return await Gender.findById(id);
}

export async function updateGender(
    id: string,
    gender: IGender,
): Promise<IGender | null> {
    return await Gender.findByIdAndUpdate(id, gender, { new: true });
}

export async function deleteGender(id: string): Promise<IGender | null> {
    return await Gender.findByIdAndDelete(id);
}
