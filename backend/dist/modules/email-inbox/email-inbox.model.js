"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailInboxModel = void 0;
const mongoose_1 = require("mongoose");
const EmailAttachmentSchema = new mongoose_1.Schema({
    filename: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    content: {
        type: Buffer,
        required: false
    },
    contentId: {
        type: String,
        required: false
    }
}, { _id: false });
const EmailInboxSchema = new mongoose_1.Schema({
    from: {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        name: {
            type: String,
            trim: true
        }
    },
    to: {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        name: {
            type: String,
            trim: true
        }
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    textPart: {
        type: String,
        trim: true
    },
    htmlPart: {
        type: String,
        trim: true
    },
    attachments: [EmailAttachmentSchema],
    messageId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    receivedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    headers: {
        type: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    collection: 'emailinbox'
});
EmailInboxSchema.index({ 'from.email': 1, receivedAt: -1 });
EmailInboxSchema.index({ 'to.email': 1, receivedAt: -1 });
EmailInboxSchema.index({ subject: 'text', 'textPart': 'text', 'htmlPart': 'text' });
EmailInboxSchema.index({ receivedAt: -1 });
EmailInboxSchema.index({ isRead: 1, receivedAt: -1 });
EmailInboxSchema.pre('save', function (next) {
    if (!this.textPart && !this.htmlPart) {
        const error = new Error('Email must have either textPart or htmlPart');
        return next(error);
    }
    next();
});
exports.EmailInboxModel = (0, mongoose_1.model)('EmailInbox', EmailInboxSchema);
