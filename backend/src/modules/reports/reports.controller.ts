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

        // Identificar el grupo de "Servicios" para tratamiento especial
        const servicesGroup = allAttributeGroups.find(g => g.key === 'services' || g.name === 'Servicios');
        const servicesGroupId = servicesGroup ? servicesGroup._id.toString() : null;
        const serviceVariants = servicesGroup ? servicesGroup.variants : [];

        // 2. Definir columnas
        const columns: ExcelColumn[] = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Nombre Perfil', key: 'name', width: 30 },
            { header: 'Nombre Usuario', key: 'userName', width: 30 },
            { header: 'Edad', key: 'age', width: 10 },
        ];

        // Agregar columnas dinámicas por cada AttributeGroup (EXCEPTO Servicios)
        allAttributeGroups.forEach(group => {
            if (group._id.toString() !== servicesGroupId) {
                columns.push({ 
                    header: group.name || group.key, 
                    key: `attr_${group._id.toString()}`, 
                    width: 20 
                });
            }
        });

        // Agregar columnas específicas para cada variante de SERVICIOS
        if (servicesGroup) {
            serviceVariants.forEach(variant => {
                columns.push({
                    header: `Servicio: ${variant.label}`,
                    key: `srv_${variant.value}`,
                    width: 15
                });
            });
        }

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
            
            // Inicializar atributos normales en vacío (para rellenar con valor real)
            allAttributeGroups.forEach(group => {
                if (group._id.toString() !== servicesGroupId) {
                    attributeValues[`attr_${group._id.toString()}`] = '';
                }
            });

            // Inicializar variantes de servicios en "No"
            if (servicesGroup) {
                serviceVariants.forEach(variant => {
                    attributeValues[`srv_${variant.value}`] = 'No';
                });
            }

            // Verificar qué atributos tiene el perfil
            if (profile.features && profile.features.length > 0) {
                profile.features.forEach((feature: any) => {
                    // feature.group_id puede ser el ID o el objeto poblado
                    const groupId = feature.group_id._id 
                        ? feature.group_id._id.toString() 
                        : feature.group_id.toString();
                    
                    // CASO 1: Es el grupo de SERVICIOS -> Desglosar variantes (Sí/No)
                    if (groupId === servicesGroupId) {
                        if (feature.value && Array.isArray(feature.value)) {
                            feature.value.forEach((val: any) => {
                                // val puede ser string o objeto {key, label, value}
                                const valKey = (typeof val === 'string' ? val : val.value || val.key || '').toLowerCase();
                                
                                // Buscar si coincide con alguna variante conocida
                                const matchedVariant = serviceVariants.find(v => v.value === valKey);
                                if (matchedVariant) {
                                    attributeValues[`srv_${matchedVariant.value}`] = 'Sí';
                                }
                            });
                        }
                    } 
                    // CASO 2: Es otro grupo -> Mostrar el valor real (concatenado si son múltiples)
                    else if (attributeValues[`attr_${groupId}`] !== undefined) {
                        if (feature.value && Array.isArray(feature.value)) {
                            // Extraer etiquetas legibles
                            const labels = feature.value.map((val: any) => {
                                return typeof val === 'string' ? val : val.label || val.value || '';
                            }).filter(Boolean);
                            
                            attributeValues[`attr_${groupId}`] = labels.join(', ');
                        }
                    }
                });
            }

            return {
                _id: profile._id.toString(),
                name: profile.name,
                userName: (profile.user as any)?.name || 'N/A',
                age: profile.age,
                ...attributeValues, // Esparcir las columnas de atributos y servicios
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
