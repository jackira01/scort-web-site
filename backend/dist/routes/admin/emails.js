"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_service_1 = __importDefault(require("../../services/email.service"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const admin_middleware_1 = require("../../middlewares/admin.middleware");
const User_model_1 = __importDefault(require("../../modules/user/User.model"));
const profile_model_1 = require("../../modules/profile/profile.model");
const email_log_model_1 = require("../../modules/email-log/email-log.model");
const router = (0, express_1.Router)();
const getEmailService = () => {
    return new email_service_1.default();
};
router.get('/all-emails', auth_middleware_1.authenticateToken, admin_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const users = await User_model_1.default.find({
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
        const allEmails = users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email
        }));
        res.json(allEmails);
    }
    catch (error) {
        console.error('Error al obtener todos los correos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
router.get('/users/search', auth_middleware_1.authenticateToken, admin_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
        }
        const searchTerm = q.toLowerCase();
        const usersByUsername = await User_model_1.default.find({
            $and: [
                { email: { $ne: null, $exists: true } },
                { username: { $regex: searchTerm, $options: 'i' } }
            ]
        }).populate('profiles', 'name _id')
            .select('username email profiles')
            .limit(10);
        const profiles = await profile_model_1.ProfileModel.find({
            name: { $regex: searchTerm, $options: 'i' }
        }).select('user').limit(10);
        const profileUserIds = profiles.map((profile) => profile.user);
        const usersByProfile = await User_model_1.default.find({
            $and: [
                { email: { $ne: null, $exists: true } },
                { _id: { $in: profileUserIds } }
            ]
        }).populate('profiles', 'name _id')
            .select('username email profiles')
            .limit(10);
        const allUsers = [...usersByUsername, ...usersByProfile];
        const uniqueUsers = allUsers.filter((user, index, self) => index === self.findIndex(u => u._id.toString() === user._id.toString()));
        const users = uniqueUsers.slice(0, 20);
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            email: user.email
        }));
        res.json(formattedUsers);
    }
    catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
router.post('/send', auth_middleware_1.authenticateToken, admin_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const { subject, content, recipients } = req.body;
        if (!subject || !content || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                error: 'Asunto, contenido y destinatarios son requeridos'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = recipients.filter(email => !emailRegex.test(email));
        if (invalidEmails.length > 0) {
            return res.status(400).json({
                error: `Emails inválidos: ${invalidEmails.join(', ')}`
            });
        }
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
            }
            catch (error) {
                console.error(`Error sending email to ${email}:`, error);
                errors.push({ email, error: error instanceof Error ? error.message : String(error) });
            }
        }
        try {
            await email_log_model_1.EmailLogModel.create({
                subject,
                content,
                recipients: recipients.join(','),
                successCount: results.length,
                errorCount: errors.length,
                sentAt: new Date(),
                sentBy: req.user?.id || req.user?._id
            });
        }
        catch (logError) {
            console.error('Error logging email send:', logError);
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
    }
    catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
router.get('/history', auth_middleware_1.authenticateToken, admin_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = await Promise.all([
            email_log_model_1.EmailLogModel.find()
                .sort({ sentAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('sentBy', 'username')
                .lean(),
            email_log_model_1.EmailLogModel.countDocuments()
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
    }
    catch (error) {
        console.error('Error fetching email history:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
exports.default = router;
