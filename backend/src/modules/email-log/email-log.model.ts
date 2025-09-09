import { Schema, model, Document, Types } from 'mongoose';

export interface IEmailLog extends Document {
    subject: string;
    content: string;
    recipients: string;
    successCount: number;
    errorCount: number;
    sentAt: Date;
    sentBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
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
        maxlength: 50000 // Para almacenar emails separados por comas
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
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    collection: 'email_logs'
});

// Índices para optimizar consultas
EmailLogSchema.index({ sentAt: -1 });
EmailLogSchema.index({ sentBy: 1 });
EmailLogSchema.index({ sentAt: -1, sentBy: 1 });

export const EmailLogModel = model<IEmailLog>('EmailLog', EmailLogSchema);