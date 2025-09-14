"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailLogModel = void 0;
const mongoose_1 = require("mongoose");
const EmailLogSchema = new mongoose_1.Schema({
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 10000
    },
    recipients: {
        type: String,
        required: true,
        maxlength: 50000
    },
    successCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    errorCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    sentAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    sentBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    collection: 'email_logs'
});
EmailLogSchema.index({ sentAt: -1 });
EmailLogSchema.index({ sentBy: 1 });
EmailLogSchema.index({ sentAt: -1, sentBy: 1 });
exports.EmailLogModel = (0, mongoose_1.model)('EmailLog', EmailLogSchema);
