"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailInboxController = void 0;
const email_inbox_service_1 = require("./email-inbox.service");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
class EmailInboxController {
    static async getInboxEmails(req, res, next) {
        try {
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                from: req.query.from,
                subject: req.query.subject,
                dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
                dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined,
                isRead: req.query.isRead ? req.query.isRead === 'true' : undefined
            };
            const result = await email_inbox_service_1.EmailInboxService.getInboxEmails(query);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getInboxEmails controller:', error);
            next(error);
        }
    }
    static async getEmailById(req, res, next) {
        try {
            const { id } = req.params;
            const email = await email_inbox_service_1.EmailInboxService.getEmailById(id);
            if (!email) {
                throw new AppError_1.AppError('Email not found', 404);
            }
            res.status(200).json({
                success: true,
                data: email
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getEmailById controller:', error);
            next(error);
        }
    }
    static async markAsRead(req, res, next) {
        try {
            const request = req.body;
            if (!request.emailIds || !Array.isArray(request.emailIds) || request.emailIds.length === 0) {
                throw new AppError_1.AppError('emailIds array is required and must not be empty', 400);
            }
            const result = await email_inbox_service_1.EmailInboxService.markAsRead(request);
            res.status(200).json({
                success: true,
                message: `${result.modifiedCount} emails marked as read`,
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error in markAsRead controller:', error);
            next(error);
        }
    }
    static async markAsUnread(req, res, next) {
        try {
            const request = req.body;
            if (!request.emailIds || !Array.isArray(request.emailIds) || request.emailIds.length === 0) {
                throw new AppError_1.AppError('emailIds array is required and must not be empty', 400);
            }
            const result = await email_inbox_service_1.EmailInboxService.markAsUnread(request);
            res.status(200).json({
                success: true,
                message: `${result.modifiedCount} emails marked as unread`,
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error in markAsUnread controller:', error);
            next(error);
        }
    }
    static async deleteEmails(req, res, next) {
        try {
            const { emailIds } = req.body;
            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                throw new AppError_1.AppError('emailIds array is required and must not be empty', 400);
            }
            const result = await email_inbox_service_1.EmailInboxService.deleteEmails(emailIds);
            res.status(200).json({
                success: true,
                message: `${result.deletedCount} emails deleted`,
                data: result
            });
        }
        catch (error) {
            logger_1.logger.error('Error in deleteEmails controller:', error);
            next(error);
        }
    }
    static async getInboxStats(req, res, next) {
        try {
            const stats = await email_inbox_service_1.EmailInboxService.getInboxStats();
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getInboxStats controller:', error);
            next(error);
        }
    }
    static async receiveEmailWebhook(req, res, next) {
        try {
            const webhookData = req.body;
            if (!webhookData || !webhookData.email) {
                throw new AppError_1.AppError('Invalid webhook payload', 400);
            }
            const emailData = {
                from: {
                    email: webhookData.email.from?.email || webhookData.from,
                    name: webhookData.email.from?.name
                },
                to: {
                    email: webhookData.email.to?.email || webhookData.to,
                    name: webhookData.email.to?.name
                },
                subject: webhookData.email.subject || webhookData.subject || '',
                textPart: webhookData.email.textPart || webhookData.text,
                htmlPart: webhookData.email.htmlPart || webhookData.html,
                messageId: webhookData.email.messageId || webhookData.messageId || `${Date.now()}-${Math.random()}`,
                receivedAt: webhookData.email.receivedAt ? new Date(webhookData.email.receivedAt) : new Date(),
                attachments: webhookData.email.attachments,
                headers: webhookData.email.headers
            };
            const savedEmail = await email_inbox_service_1.EmailInboxService.storeIncomingEmail(emailData);
            logger_1.logger.info(`Received email via webhook: ${savedEmail._id}`);
            res.status(200).json({
                success: true,
                message: 'Email received and stored successfully',
                data: {
                    id: savedEmail._id,
                    messageId: savedEmail.messageId
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error in receiveEmailWebhook controller:', error);
            next(error);
        }
    }
    static async testReceiveEmail(req, res, next) {
        try {
            const testEmailData = {
                from: {
                    email: req.body.from || 'test@example.com',
                    name: req.body.fromName || 'Test Sender'
                },
                to: {
                    email: req.body.to || 'company@example.com',
                    name: req.body.toName || 'Company'
                },
                subject: req.body.subject || 'Test Email',
                textPart: req.body.textPart || 'This is a test email.',
                htmlPart: req.body.htmlPart || '<p>This is a test email.</p>',
                messageId: `test-${Date.now()}-${Math.random()}`,
                receivedAt: new Date(),
                headers: req.body.headers || {}
            };
            const savedEmail = await email_inbox_service_1.EmailInboxService.storeIncomingEmail(testEmailData);
            res.status(201).json({
                success: true,
                message: 'Test email created successfully',
                data: {
                    id: savedEmail._id,
                    messageId: savedEmail.messageId
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error in testReceiveEmail controller:', error);
            next(error);
        }
    }
}
exports.EmailInboxController = EmailInboxController;
