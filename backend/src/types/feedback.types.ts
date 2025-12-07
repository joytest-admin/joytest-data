/**
 * Feedback types
 * Defines types for the feedback system
 */

export enum FeedbackCategory {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  QUESTION = 'question',
  OTHER = 'other',
}

export enum FeedbackStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Feedback entity (database representation)
 */
export interface FeedbackEntity {
  id: string;
  doctorId: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  adminId: string | null;
  adminResponse: string | null;
  contextUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

/**
 * Create feedback request (from doctor)
 */
export interface CreateFeedbackRequest {
  category: FeedbackCategory;
  subject: string;
  message: string;
  contextUrl?: string | null;
}

/**
 * Update feedback request (admin only)
 */
export interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  adminResponse?: string | null;
}

/**
 * Feedback response (with doctor info)
 */
export interface FeedbackResponse {
  id: string;
  doctorId: string;
  doctorEmail: string | null;
  doctorIcpNumber: string | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  adminId: string | null;
  adminEmail: string | null;
  adminResponse: string | null;
  contextUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

