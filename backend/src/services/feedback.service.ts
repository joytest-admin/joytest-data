/**
 * Feedback service
 * Business logic for feedback operations
 */

import {
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackResponse,
  FeedbackEntity,
  FeedbackStatus,
} from '../types/feedback.types';
import {
  createFeedback,
  findFeedbackById,
  findAllFeedback,
  findFeedbackByDoctor,
  updateFeedback,
} from '../queries/feedback.queries';
import { findUserById } from '../queries/user.queries';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { UserRole } from '../types/auth.types';

/**
 * Convert FeedbackEntity to FeedbackResponse with user info
 */
const toFeedbackResponse = async (feedback: FeedbackEntity): Promise<FeedbackResponse> => {
  const doctor = await findUserById(feedback.doctorId);
  const admin = feedback.adminId ? await findUserById(feedback.adminId) : null;

  return {
    id: feedback.id,
    doctorId: feedback.doctorId,
    doctorEmail: doctor?.email || null,
    doctorIcpNumber: doctor?.icpNumber || null,
    category: feedback.category,
    subject: feedback.subject,
    message: feedback.message,
    status: feedback.status,
    adminId: feedback.adminId,
    adminEmail: admin?.email || null,
    adminResponse: feedback.adminResponse,
    contextUrl: feedback.contextUrl,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    resolvedAt: feedback.resolvedAt,
  };
};

/**
 * Create feedback (doctor only)
 */
export const createFeedbackService = async (
  doctorId: string,
  data: CreateFeedbackRequest,
): Promise<FeedbackResponse> => {
  // Validate doctor exists
  const doctor = await findUserById(doctorId);
  if (!doctor || doctor.role !== UserRole.USER) {
    throw new BadRequestError('Doctor not found');
  }

  const feedback = await createFeedback(
    doctorId,
    data.category,
    data.subject.trim(),
    data.message.trim(),
    data.contextUrl?.trim() || null,
  );

  return toFeedbackResponse(feedback);
};

/**
 * Get all feedback (admin only)
 */
export const getAllFeedbackService = async (options: {
  status?: FeedbackStatus;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ results: FeedbackResponse[]; total: number }> => {
  const { results, total } = await findAllFeedback({
    status: options.status,
    category: options.category as any,
    limit: options.limit,
    offset: options.offset,
  });

  const responses = await Promise.all(results.map((feedback) => toFeedbackResponse(feedback)));

  return { results: responses, total };
};

/**
 * Get feedback by ID (admin only)
 */
export const getFeedbackByIdService = async (id: string): Promise<FeedbackResponse> => {
  const feedback = await findFeedbackById(id);
  if (!feedback) {
    throw new NotFoundError('Feedback not found');
  }

  return toFeedbackResponse(feedback);
};

/**
 * Get feedback by doctor (doctor only)
 */
export const getDoctorFeedbackService = async (
  doctorId: string,
  limit?: number,
  offset?: number,
): Promise<{ results: FeedbackResponse[]; total: number }> => {
  const { results, total } = await findFeedbackByDoctor(doctorId, limit, offset);

  const responses = await Promise.all(results.map((feedback) => toFeedbackResponse(feedback)));

  return { results: responses, total };
};

/**
 * Get single feedback by ID for doctor (doctor only)
 */
export const getDoctorFeedbackByIdService = async (
  doctorId: string,
  feedbackId: string,
): Promise<FeedbackResponse> => {
  const feedback = await findFeedbackById(feedbackId);
  if (!feedback) {
    throw new NotFoundError('Feedback not found');
  }

  // Ensure feedback belongs to the doctor
  if (feedback.doctorId !== doctorId) {
    throw new ForbiddenError('You do not have access to this feedback');
  }

  return toFeedbackResponse(feedback);
};

/**
 * Update feedback (admin only)
 */
export const updateFeedbackService = async (
  id: string,
  adminId: string,
  data: UpdateFeedbackRequest,
): Promise<FeedbackResponse> => {
  const feedback = await findFeedbackById(id);
  if (!feedback) {
    throw new NotFoundError('Feedback not found');
  }

  // Validate admin exists
  const admin = await findUserById(adminId);
  if (!admin || admin.role !== UserRole.ADMIN) {
    throw new BadRequestError('Admin not found');
  }

  const updated = await updateFeedback(id, {
    status: data.status,
    adminId: data.status ? adminId : feedback.adminId, // Set adminId when status is updated
    adminResponse: data.adminResponse !== undefined ? (data.adminResponse?.trim() || null) : undefined,
  });

  return toFeedbackResponse(updated);
};

