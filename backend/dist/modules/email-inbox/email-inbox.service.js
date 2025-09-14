"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailInboxService = void 0;
const mongoose_1 = require("mongoose");
const AppError_1 = require("../../utils/AppError");
const logger_1 = require("../../utils/logger");
const email_inbox_model_1 = require("./email-inbox.model");
class EmailInboxService {
    static async storeIncomingEmail(emailData) {
        try {
            const existingEmail = await email_inbox_model_1.EmailInboxModel.findOne({
                messageId: emailData.messageId
            });
            if (existingEmail) {
                logger_1.logger.warn(`Email with messageId ${emailData.messageId} already exists`);
                return existingEmail;
            }
            const email = new email_inbox_model_1.EmailInboxModel({
                from: emailData.from,
                to: emailData.to,
                subject: emailData.subject,
                textPart: emailData.textPart,
                htmlPart: emailData.htmlPart,
                attachments: emailData.attachments,
                messageId: emailData.messageId,
                receivedAt: emailData.receivedAt,
                headers: emailData.headers,
                isRead: false
            });
            const savedEmail = await email.save();
            logger_1.logger.info(`Stored incoming email with ID: ${savedEmail._id}`);
            return savedEmail;
        }
        catch (error) {
            logger_1.logger.error('Error storing incoming email:', error);
            throw new AppError_1.AppError('Failed to store incoming email', 500);
        }
    }
    static async getInboxEmails(query) {
        try {
            const { page = 1, limit = 20, from, subject, dateFrom, dateTo, isRead } = query;
            const filters = {};
            if (from) {
                filters['from.email'] = { $regex: from, $options: 'i' };
            }
            if (subject) {
                filters.subject = { $regex: subject, $options: 'i' };
            }
            if (dateFrom || dateTo) {
                filters.receivedAt = {};
                if (dateFrom)
                    filters.receivedAt.$gte = new Date(dateFrom);
                if (dateTo)
                    filters.receivedAt.$lte = new Date(dateTo);
            }
            if (typeof isRead === 'boolean') {
                filters.isRead = isRead;
            }
            const skip = (page - 1) * limit;
            const [emails, total] = await Promise.all([
                email_inbox_model_1.EmailInboxModel
                    .find(filters)
                    .sort({ receivedAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select('-headers -attachments.content')
                    .lean(),
                email_inbox_model_1.EmailInboxModel.countDocuments(filters)
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                emails: emails.map(email => ({
                    id: email._id.toString(),
                    from: email.from,
                    to: email.to,
                    subject: email.subject,
                    textPart: email.textPart,
                    htmlPart: email.htmlPart,
                    attachments: email.attachments?.map(att => ({
                        filename: att.filename,
                        contentType: att.contentType,
                        size: att.size,
                        contentId: att.contentId
                    })),
                    messageId: email.messageId,
                    receivedAt: email.receivedAt,
                    isRead: email.isRead,
                    createdAt: email.createdAt,
                    updatedAt: email.updatedAt
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting inbox emails:', error);
            throw new AppError_1.AppError('Failed to get inbox emails', 500);
        }
    }
    static async getEmailById(emailId) {
        try {
            if (!mongoose_1.Types.ObjectId.isValid(emailId)) {
                throw new AppError_1.AppError('Invalid email ID', 400);
            }
            const email = await email_inbox_model_1.EmailInboxModel
                .findById(emailId)
                .select('-headers')
                .lean();
            if (!email) {
                return null;
            }
            return {
                id: email._id.toString(),
                from: email.from,
                to: email.to,
                subject: email.subject,
                textPart: email.textPart,
                htmlPart: email.htmlPart,
                attachments: email.attachments,
                messageId: email.messageId,
                receivedAt: email.receivedAt,
                isRead: email.isRead,
                createdAt: email.createdAt,
                updatedAt: email.updatedAt
            };
        }
        catch (error) {
            logger_1.logger.error(`Error getting email by ID ${emailId}:`, error);
            throw new AppError_1.AppError('Failed to get email', 500);
        }
    }
    static async markAsRead(request) {
        try {
            const { emailIds } = request;
            const validIds = emailIds.filter(id => mongoose_1.Types.ObjectId.isValid(id));
            if (validIds.length === 0) {
                throw new AppError_1.AppError('No valid email IDs provided', 400);
            }
            const result = await email_inbox_model_1.EmailInboxModel.updateMany({
                _id: { $in: validIds.map(id => new mongoose_1.Types.ObjectId(id)) },
                isRead: false
            }, {
                $set: { isRead: true }
            });
            logger_1.logger.info(`Marked ${result.modifiedCount} emails as read`);
            return { modifiedCount: result.modifiedCount };
        }
        catch (error) {
            logger_1.logger.error('Error marking emails as read:', error);
            throw new AppError_1.AppError('Failed to mark emails as read', 500);
        }
    }
    static async markAsUnread(request) {
        try {
            const { emailIds } = request;
            const validIds = emailIds.filter(id => mongoose_1.Types.ObjectId.isValid(id));
            if (validIds.length === 0) {
                throw new AppError_1.AppError('No valid email IDs provided', 400);
            }
            const result = await email_inbox_model_1.EmailInboxModel.updateMany({
                _id: { $in: validIds.map(id => new mongoose_1.Types.ObjectId(id)) },
                isRead: true
            }, {
                $set: { isRead: false }
            });
            logger_1.logger.info(`Marked ${result.modifiedCount} emails as unread`);
            return { modifiedCount: result.modifiedCount };
        }
        catch (error) {
            logger_1.logger.error('Error marking emails as unread:', error);
            throw new AppError_1.AppError('Failed to mark emails as unread', 500);
        }
    }
    static async deleteEmails(emailIds) {
        try {
            const validIds = emailIds.filter(id => mongoose_1.Types.ObjectId.isValid(id));
            if (validIds.length === 0) {
                throw new AppError_1.AppError('No valid email IDs provided', 400);
            }
            const result = await email_inbox_model_1.EmailInboxModel.deleteMany({
                _id: { $in: validIds.map(id => new mongoose_1.Types.ObjectId(id)) }
            });
            logger_1.logger.info(`Deleted ${result.deletedCount} emails`);
            return { deletedCount: result.deletedCount };
        }
        catch (error) {
            logger_1.logger.error('Error deleting emails:', error);
            throw new AppError_1.AppError('Failed to delete emails', 500);
        }
    }
    static async getInboxStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const [total, unread, todayCount] = await Promise.all([
                email_inbox_model_1.EmailInboxModel.countDocuments({}),
                email_inbox_model_1.EmailInboxModel.countDocuments({ isRead: false }),
                email_inbox_model_1.EmailInboxModel.countDocuments({
                    receivedAt: {
                        $gte: today,
                        $lt: tomorrow
                    }
                })
            ]);
            return {
                total,
                unread,
                read: total - unread,
                todayCount
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting inbox stats:', error);
            throw new AppError_1.AppError('Failed to get inbox stats', 500);
        }
    }
}
exports.EmailInboxService = EmailInboxService;
