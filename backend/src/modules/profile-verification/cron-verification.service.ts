import cron from 'node-cron';
import ProfileVerification from './profile-verification.model';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import { enrichProfileVerification } from './verification.helper';
import { calculateVerificationProgress } from './verification-progress.utils';

// La lógica se mantiene separada para mantener el código limpio
export const runDailyVerificationProcess = async () => {
    console.log('⚡ [Cron Job] Iniciando proceso de verificación programado...');

    try {
        // IMPORTANTE: Asegúrate de que esto use el servicio de configuración y NO un número fijo (como 0)
        const minAgeMonths = await ConfigParameterService.getValue('profile.verification.minimum_age_months') || 12;

        const cutOffDate = new Date();
        cutOffDate.setMonth(cutOffDate.getMonth() - Number(minAgeMonths));

        console.log(`📅 Fecha de corte usada: ${cutOffDate.toISOString()}`);

        // Pipeline optimizado ("Francotirador")
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

        console.log(`🔍 [Cron Job] Candidatos encontrados para procesar: ${candidates.length}`);

        let updatedCount = 0;

        for (const candidate of candidates) {
            try {
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
                    console.log(`✅ [Cron Job] Perfil ${candidate.profileData._id} actualizado a ${newProgress}%`);
                }
            } catch (err) {
                console.error(`❌ [Cron Job] Error procesando candidato ${candidate._id}:`, err);
            }
        }

        console.log(`🏁 [Cron Job] Finalizado. Total actualizados: ${updatedCount}`);

    } catch (error) {
        console.error('❌ [Cron Job] Error crítico:', error);
    }
};

/**
 * Servicio Cron Principal
 */
export const startVerificationCron = () => {
    // Se ejecuta únicamente a las 03:00 AM
    cron.schedule('0 3 * * *', async () => {
        await runDailyVerificationProcess();
    });

    console.log('⏰ [Verification Cron] Programado correctamente para las 03:00 AM.');

    // HE ELIMINADO LA LLAMADA MANUAL AQUÍ. 
    // Ahora solo correrá cuando el reloj marque las 3:00 AM.
};