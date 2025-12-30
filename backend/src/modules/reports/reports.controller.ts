import { Request, Response } from 'express';
import { ProfileModel } from '../profile/profile.model';
import { ExcelColumn, generateExcel } from './reports.service';

export const exportProfilesToExcel = async (req: Request, res: Response) => {
    try {
        // 1. Obtener datos de la DB
        // Puedes agregar filtros aquí si vienen en req.query
        const profiles = await ProfileModel.find({})
            .populate('user', 'email name isVerified')
            .populate('verification', 'verificationProgress');

        // 2. Definir columnas
        const columns: ExcelColumn[] = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Nombre Perfil', key: 'name', width: 30 },
            { header: 'Nombre Usuario', key: 'userName', width: 30 },
            { header: 'Edad', key: 'age', width: 10 },
            { header: 'Categoría', key: 'category', width: 20 },
            { header: 'Ciudad', key: 'city', width: 20 },
            { header: 'Departamento', key: 'department', width: 20 },
            { header: 'Usuario (Email)', key: 'userEmail', width: 30 },
            { header: 'Teléfono', key: 'phone', width: 15 },
            { header: 'WhatsApp', key: 'whatsapp', width: 15 },
            { header: 'Telegram', key: 'telegram', width: 15 },
            { header: 'Instagram', key: 'instagram', width: 20 },
            { header: 'OnlyFans', key: 'onlyFans', width: 20 },
            { header: 'TikTok', key: 'tiktok', width: 20 },
            { header: '% Verif. Perfil', key: 'profileVerification', width: 15 },
            { header: 'Verif. Usuario', key: 'userVerification', width: 15 },
            { header: 'Fecha de Creación', key: 'createdAt', width: 20 },
            { header: 'Activo', key: 'isActive', width: 10 },
        ];

        // 3. Mapear datos para que coincidan con las keys
        const data = profiles.map(profile => {
            // Extraer categoría de features
            // Buscamos en los features si hay alguno que parezca ser la categoría
            // Basado en la imagen, features es un array de objetos con 'value' que es un array de objetos con 'label'
            let category = 'N/A';
            if (profile.features && profile.features.length > 0) {
                // Intentamos encontrar un feature que tenga valores como "Escort", "Trans", etc.
                // O simplemente concatenamos todos los labels encontrados para dar información completa
                const labels: string[] = [];
                profile.features.forEach((feature: any) => {
                    if (Array.isArray(feature.value)) {
                        feature.value.forEach((val: any) => {
                            if (val.label) labels.push(val.label);
                        });
                    }
                });
                if (labels.length > 0) {
                    category = labels.join(', ');
                }
            }

            return {
                _id: profile._id.toString(),
                name: profile.name,
                userName: (profile.user as any)?.name || 'N/A',
                age: profile.age,
                category: category,
                city: profile.location?.city?.label || '',
                department: profile.location?.department?.label || '',
                userEmail: (profile.user as any)?.email || 'N/A',
                phone: profile.contact?.number || '',
                whatsapp: profile.contact?.whatsapp || '',
                telegram: profile.contact?.telegram || '',
                instagram: profile.socialMedia?.instagram || '',
                onlyFans: profile.socialMedia?.onlyFans || '',
                tiktok: profile.socialMedia?.tiktok || '',
                profileVerification: (profile.verification as any)?.verificationProgress ? `${(profile.verification as any).verificationProgress}%` : '0%',
                userVerification: (profile.user as any)?.isVerified ? 'Sí' : 'No',
                createdAt: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '',
                isActive: profile.isActive ? 'Sí' : 'No'
            };
        });

        // 4. Generar Excel
        await generateExcel(res, 'Perfiles', columns, data, 'Reporte_Perfiles.xlsx');

    } catch (error) {
        console.error("Error en exportProfilesToExcel:", error);
        res.status(500).json({ message: "Error al exportar perfiles" });
    }
};
