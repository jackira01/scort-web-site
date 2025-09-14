"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_mailjet_1 = __importDefault(require("node-mailjet"));
const config_parameter_service_1 = require("../modules/config-parameter/config-parameter.service");
class EmailService {
    constructor() {
        this.mailjet = null;
        this.senderEmail = '';
        this.appName = '';
        this.initialized = false;
    }
    async initialize() {
        if (this.initialized)
            return;
        const apiKeyPublic = process.env.MJ_APIKEY_PUBLIC;
        const apiKeyPrivate = process.env.MJ_APIKEY_PRIVATE;
        this.senderEmail = await config_parameter_service_1.ConfigParameterService.getValue('company.email') || '';
        this.appName = await config_parameter_service_1.ConfigParameterService.getValue('company.name') || 'Soporte App';
        if (!apiKeyPublic || !apiKeyPrivate) {
            throw new Error('Mailjet API keys are required. Please set MJ_APIKEY_PUBLIC and MJ_APIKEY_PRIVATE environment variables.');
        }
        if (!this.senderEmail) {
            throw new Error('Company email is required. Please configure company.email in database configuration parameters.');
        }
        this.mailjet = new node_mailjet_1.default({
            apiKey: apiKeyPublic,
            apiSecret: apiKeyPrivate
        });
        this.initialized = true;
    }
    async sendSingleEmail(emailRequest) {
        try {
            await this.initialize();
            const { to, content } = emailRequest;
            const request = this.mailjet
                .post('send', { version: 'v3.1' })
                .request({
                Messages: [
                    {
                        From: {
                            Email: this.senderEmail,
                            Name: this.appName
                        },
                        To: [
                            {
                                Email: to.email,
                                Name: to.name || to.email
                            }
                        ],
                        Subject: content.subject,
                        TextPart: content.textPart,
                        HTMLPart: content.htmlPart
                    }
                ]
            });
            const result = await request;
            const messageInfo = result.body.Messages[0];
            if (messageInfo.Status === 'success') {
                return {
                    success: true,
                    messageId: messageInfo.To[0].MessageID.toString()
                };
            }
            else {
                return {
                    success: false,
                    error: messageInfo.Errors?.[0]?.ErrorMessage || 'Unknown error occurred'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to send email'
            };
        }
    }
    async sendBulkEmails(bulkEmailRequest) {
        try {
            await this.initialize();
            const { to, content } = bulkEmailRequest;
            const results = [];
            let totalSent = 0;
            let totalFailed = 0;
            const messages = to.map(recipient => ({
                From: {
                    Email: this.senderEmail,
                    Name: this.appName
                },
                To: [
                    {
                        Email: recipient.email,
                        Name: recipient.name || recipient.email
                    }
                ],
                Subject: content.subject,
                TextPart: content.textPart,
                HTMLPart: content.htmlPart
            }));
            const request = this.mailjet
                .post('send', { version: 'v3.1' })
                .request({
                Messages: messages
            });
            const result = await request;
            const messageResults = result.body.Messages;
            messageResults.forEach((messageInfo, index) => {
                const recipient = to[index];
                if (messageInfo.Status === 'success') {
                    results.push({
                        email: recipient.email,
                        success: true,
                        messageId: messageInfo.To[0].MessageID.toString()
                    });
                    totalSent++;
                }
                else {
                    results.push({
                        email: recipient.email,
                        success: false,
                        error: messageInfo.Errors?.[0]?.ErrorMessage || 'Unknown error occurred'
                    });
                    totalFailed++;
                }
            });
            return {
                success: totalSent > 0,
                results,
                totalSent,
                totalFailed
            };
        }
        catch (error) {
            const results = bulkEmailRequest.to.map(recipient => ({
                email: recipient.email,
                success: false,
                error: error.message || 'Failed to send email'
            }));
            return {
                success: false,
                results,
                totalSent: 0,
                totalFailed: bulkEmailRequest.to.length
            };
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    validateEmailData(content, recipients) {
        if (!content.subject || content.subject.trim() === '') {
            return 'Subject is required';
        }
        if (!content.textPart && !content.htmlPart) {
            return 'Email content (textPart or htmlPart) is required';
        }
        if (!recipients || recipients.length === 0) {
            return 'At least one recipient is required';
        }
        for (const recipient of recipients) {
            if (!this.isValidEmail(recipient.email)) {
                return `Invalid email format: ${recipient.email}`;
            }
        }
        return null;
    }
}
exports.default = EmailService;
