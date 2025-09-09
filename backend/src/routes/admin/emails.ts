import { Router, Response } from 'express';
import EmailService from '../../services/email.service';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { adminMiddleware as requireAdmin } from '../../middlewares/admin.middleware';
import { AuthRequest } from '../../types/auth.types';
import User from '../../modules/user/User.model';
import { ProfileModel } from '../../modules/profile/profile.model';
import { EmailLogModel } from '../../modules/email-log/email-log.model';

const router = Router();

// Función para obtener la instancia del servicio de forma lazy
const getEmailService = () => {
  return new EmailService();
};

// Ruta para obtener todos los correos (para envío masivo)
router.get('/all-emails', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Obtener todos los usuarios con email válido para envío masivo
        const users = await User.find({
            $and: [
                { email: { $exists: true } },
                { email: { $ne: null } },
                { email: { $ne: '' } }
            ]
        })
        .select('username email')
        .skip(skip)
        .limit(limitNum)
        .sort({ username: 1 });

        // Simplificar respuesta - solo enviar datos necesarios para el frontend
        const allEmails = users.map(user => ({
            id: (user as any)._id,
            username: (user as any).username,
            email: (user as any).email
        }));

        res.json(allEmails);
    } catch (error) {
        console.error('Error al obtener todos los correos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Buscar usuarios por ID de perfil, nombre de usuario o nombre del perfil
router.get('/users/search', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
        }

        const searchTerm = q.toLowerCase();

        // Buscar usuarios por username
        const usersByUsername = await User.find({
            $and: [
                { email: { $ne: null, $exists: true } },
                { username: { $regex: searchTerm, $options: 'i' } }
            ]
        }).populate('profiles', 'name _id')
          .select('username email profiles')
          .limit(10);

        // Buscar usuarios por nombre de perfil
        const profiles = await ProfileModel.find({
            name: { $regex: searchTerm, $options: 'i' }
        }).select('user').limit(10);
        
        const profileUserIds = profiles.map((profile: any) => profile.user);
        
        const usersByProfile = await User.find({
            $and: [
                { email: { $ne: null, $exists: true } },
                { _id: { $in: profileUserIds } }
            ]
        }).populate('profiles', 'name _id')
          .select('username email profiles')
          .limit(10);

        // Combinar resultados y eliminar duplicados
        const allUsers = [...usersByUsername, ...usersByProfile];
        const uniqueUsers = allUsers.filter((user, index, self) => 
            index === self.findIndex(u => (u as any)._id.toString() === (user as any)._id.toString())
        );

        const users = uniqueUsers.slice(0, 20);

        // Simplificar respuesta - solo enviar datos necesarios
        const formattedUsers = users.map(user => ({
            id: (user as any)._id.toString(),
            username: (user as any).username,
            email: (user as any).email
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Enviar correo individual o masivo
router.post('/send', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { subject, content, recipients } = req.body;

        if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ 
                error: 'Asunto, contenido y destinatarios son requeridos' 
            });
        }

        // Validar que todos los destinatarios sean emails válidos
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = recipients.filter(email => !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            return res.status(400).json({ 
                error: `Emails inválidos: ${invalidEmails.join(', ')}` 
            });
        }

        // Enviar correos
        const results = [];
        const errors = [];
        const emailService = getEmailService();

        for (const email of recipients) {
            try {
                await emailService.sendSingleEmail({
                    to: { email: email },
                    content: {
                        subject: subject,
                        htmlPart: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                                    <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
                                    <div style="background-color: white; padding: 20px; border-radius: 4px; line-height: 1.6;">
                                        ${content.replace(/\n/g, '<br>')}
                                    </div>
                                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
                                        <p>Este correo fue enviado desde el panel de administración.</p>
                                    </div>
                                </div>
                            </div>
                        `
                    }
                });
                results.push({ email, status: 'success' });
            } catch (error) {
                console.error(`Error sending email to ${email}:`, error);
                errors.push({ email, error: error instanceof Error ? error.message : String(error) });
            }
        }

        // Registrar el envío en la base de datos
        try {
            await EmailLogModel.create({
                subject,
                content,
                recipients: recipients.join(','),
                successCount: results.length,
                errorCount: errors.length,
                sentAt: new Date(),
                sentBy: req.user?.id || req.user?._id
            });
        } catch (logError) {
            console.error('Error logging email send:', logError);
            // No fallar la respuesta por error de logging
        }

        res.json({
            success: true,
            message: results.length === recipients.length 
                ? `Correo enviado exitosamente a todos los ${recipients.length} destinatarios`
                : `Correo enviado a ${results.length} de ${recipients.length} destinatarios`,
            successful: results.length,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener historial de envíos
router.get('/history', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [logs, total] = await Promise.all([
            EmailLogModel.find()
                .sort({ sentAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('sentBy', 'username')
                .lean(),
            EmailLogModel.countDocuments()
        ]);

        res.json({
            logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching email history:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;