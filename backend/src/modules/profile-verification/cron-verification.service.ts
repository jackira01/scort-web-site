import cron from 'node-cron';
import ProfileVerification from './profile-verification.model';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import { enrichProfileVerification } from './verification.helper';
import { calculateVerificationProgress } from './verification-progress.utils';

// --- 1. Lógica extraída a su propia función para poder ejecutarla cuando queramos ---
export const runDailyVerificationProcess = async () => {
    console.log('⚡ [Manual/Cron Trigger] Ejecutando proceso de verificación...');

    try {
        // NOTA: Si estás probando con un perfil creado HOY, 
        // cambia temporalmente esta línea a: const minAgeMonths = 0;
        const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;

        const cutOffDate = new Date();
        cutOffDate.setMonth(cutOffDate.getMonth() - Number(minAgeMonths));

        console.log(`📅 Fecha de corte usada: ${cutOffDate.toISOString()}`);

        const candidates = await ProfileVerification.aggregate([
            { $match: { verificationProgress: { $lt: 100 } } },
            {
                $lookup: {
                    from: 'profiles',
                    localField: 'profile',
                    foreignField: '_id',
                    as: 'profileData'
                }
            },
            { $unwind: '$profileData' },
            {
                $match: {
                    'profileData.createdAt': { $lte: cutOffDate }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'profileData.user',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } }
        ]);

        console.log(`🔍 Candidatos encontrados: ${candidates.length}`);

        let updatedCount = 0;

        for (const candidate of candidates) {
            try {
                // Reconstruir objeto de perfil para el helper
                const profileForHelper = {
                    ...candidate.profileData,
                    user: candidate.userData,
                    verification: {
                        ...candidate,
                        steps: candidate.steps,
                        verificationProgress: candidate.verificationProgress
                    }
                };

                const enrichedProfile = enrichProfileVerification(profileForHelper, Number(minAgeMonths));

                const newProgress = calculateVerificationProgress(
                    enrichedProfile.verification,
                    enrichedProfile.user,
                    enrichedProfile,
                    Number(minAgeMonths)
                );

                // Si el progreso ha mejorado, actualizamos la DB
                if (newProgress > candidate.verificationProgress) {
                    const updatedSteps = {
                        ...candidate.steps,
                        accountAge: enrichedProfile.verification.steps.accountAge,
                        contactConsistency: enrichedProfile.verification.steps.contactConsistency,
                        phoneChangeDetected: enrichedProfile.verification.steps.phoneChangeDetected
                    };

                    await ProfileVerification.findByIdAndUpdate(candidate._id, {
                        $set: {
                            verificationProgress: newProgress,
                            steps: updatedSteps
                        }
                    });

                    updatedCount++;
                    console.log(`✅ [Update] Perfil ${candidate.profileData._id} actualizado: ${candidate.verificationProgress}% -> ${newProgress}%`);
                }
            } catch (err) {
                console.error(`❌ Error procesando candidato ${candidate._id}:`, err);
            }
        }

        console.log(`🏁 Proceso finalizado. Actualizados: ${updatedCount}`);

    } catch (error) {
        console.error('❌ Error crítico en runDailyVerificationProcess:', error);
    }
};

/**
 * Servicio Cron para sincronizar el progreso de verificación de perfiles.
 */
export const startVerificationCron = () => {
    // 1. Programar ejecución futura (Todos los días a las 03:00 AM)
    cron.schedule('0 3 * * *', async () => {
        console.log('🔄 [Verification Cron] Iniciando sincronización diaria...');
        await runDailyVerificationProcess();
    });

    console.log('⏰ [Verification Cron] Programado para 03:00 AM diariamente.');

    // 2. EJECUCIÓN INMEDIATA AL ARRANQUE (Para arreglar datos actuales y testing)
    // Esto hace que corra apenas inicie el servidor sin esperar a la madrugada.
    runDailyVerificationProcess();
};