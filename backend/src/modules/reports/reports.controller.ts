import { Request, Response } from 'express';
import { ProfileModel } from '../profile/profile.model';
import { AttributeGroupModel } from '../attribute-group/attribute-group.model';
import { ExcelColumn, generateExcel } from './reports.service';

export const exportProfilesToExcel = async (req: Request, res: Response) => {
    try {
        // 1. Obtener datos de la DB
        // Puedes agregar filtros aquí si vienen en req.query
        const profiles = await ProfileModel.find({})
            .populate('user', 'email name isVerified')
            .populate('verification', 'verificationProgress')
            .populate('planAssignment.planId', 'name'); // Poblar info del plan

        // Obtener TODOS los grupos de atributos para columnas dinámicas
        const allAttributeGroups = await AttributeGroupModel.find({});

        // 2. Definir columnas
        const columns: ExcelColumn[] = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Nombre Perfil', key: 'name', width: 30 },
            { header: 'Nombre Usuario', key: 'userName', width: 30 },
            { header: 'Edad', key: 'age', width: 10 },
        ];

        // Agregar columnas dinámicas por cada AttributeGroup
        allAttributeGroups.forEach(group => {
            columns.push({ 
                header: group.name || group.key, // Usar nombre o key como header
                key: `attr_${group._id.toString()}`, 
                width: 20 
            });
        });

        // Agregar resto de columnas fijas
        columns.push(
            { header: 'Plan / Expiración', key: 'planInfo', width: 25 },
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
        );

        // 3. Mapear datos para que coincidan con las keys
        const data = profiles.map(profile => {
            // Lógica para el Plan
            let planInfo = 'Sin plan';
            const now = new Date();
            
            if (profile.planAssignment && profile.planAssignment.planId) {
                if (profile.planAssignment.expiresAt) {
                    const expiresAt = new Date(profile.planAssignment.expiresAt);
                    if (expiresAt < now) {
                        planInfo = 'Expirado';
                    } else {
                        planInfo = expiresAt.toLocaleDateString();
                    }
                } else {
                    planInfo = 'Activo (Sin fecha)'; 
                }
            }

            // Lógica para AttributeGroups Dinámicos
            const attributeValues: Record<string, string> = {};
            
            // Inicializar todas en "No"
            allAttributeGroups.forEach(group => {
                attributeValues[`attr_${group._id.toString()}`] = 'No';
            });

            // Verificar qué atributos tiene el perfil
            if (profile.features && profile.features.length > 0) {
                profile.features.forEach((feature: any) => {
                    // feature.group_id puede ser el ID o el objeto poblado
                    const groupId = feature.group_id._id 
                        ? feature.group_id._id.toString() 
                        : feature.group_id.toString();
                    
                    // Si el perfil tiene este grupo de atributos y tiene valores
                    if (attributeValues[`attr_${groupId}`] !== undefined && feature.value && feature.value.length > 0) {
                        attributeValues[`attr_${groupId}`] = 'Sí';
                    }
                });
            }

            return {
                _id: profile._id.toString(),
                name: profile.name,
                userName: (profile.user as any)?.name || 'N/A',
                age: profile.age,
                ...attributeValues, // Esparcir las columnas de atributos
                planInfo: planInfo,
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
