export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
  textPart?: string;
  htmlPart?: string;
}

export interface SingleEmailRequest {
  to: EmailRecipient;
  content: EmailContent;
}

export interface BulkEmailRequest {
  to: EmailRecipient[];
  content: EmailContent;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResponse {
  success: boolean;
  results: {
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }[];
  totalSent: number;
  totalFailed: number;
}