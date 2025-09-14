import { Schema, model, Document, Types } from 'mongoose';
import { IncomingEmailData, EmailAttachment } from '../../types/email-inbox.types';

export interface IEmailInbox extends Document {
  from: {
    email: string;
    name?: string;
  };
  to: {
    email: string;
    name?: string;
  };
  subject: string;
  textPart?: string;
  htmlPart?: string;
  attachments?: EmailAttachment[];
  messageId: string;
  receivedAt: Date;
  isRead: boolean;
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAttachmentSchema = new Schema({
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

const EmailInboxSchema = new Schema<IEmailInbox>({
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
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'emailinbox'
});

// Índices para optimizar consultas
EmailInboxSchema.index({ 'from.email': 1, receivedAt: -1 });
EmailInboxSchema.index({ 'to.email': 1, receivedAt: -1 });
EmailInboxSchema.index({ subject: 'text', 'textPart': 'text', 'htmlPart': 'text' });
EmailInboxSchema.index({ receivedAt: -1 });
EmailInboxSchema.index({ isRead: 1, receivedAt: -1 });

// Middleware para validaciones
EmailInboxSchema.pre('save', function(next) {
  // Validar que al menos textPart o htmlPart esté presente
  if (!this.textPart && !this.htmlPart) {
    const error = new Error('Email must have either textPart or htmlPart');
    return next(error);
  }
  next();
});

export const EmailInboxModel = model<IEmailInbox>('EmailInbox', EmailInboxSchema);