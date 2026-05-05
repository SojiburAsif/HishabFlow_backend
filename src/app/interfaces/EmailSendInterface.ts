export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: "otp" | "subscription" | "verification" | "notification";
  templateData: Record<string, any>;
  attachments?: EmailAttachment[];
}