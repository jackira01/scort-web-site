export interface IncomingEmailData {
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
  headers?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
  contentId?: string;
}

export interface InboxEmailQuery {
  page?: number;
  limit?: number;
  from?: string;
  subject?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isRead?: boolean;
}

export interface InboxEmailResponse {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface InboxEmailListResponse {
  emails: InboxEmailResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MarkAsReadRequest {
  emailIds: string[];
}

export interface EmailWebhookPayload {
  event: string;
  email: IncomingEmailData;
  timestamp: number;
}