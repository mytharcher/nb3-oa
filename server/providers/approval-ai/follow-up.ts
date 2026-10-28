import type {
  ReviewReference,
  ReviewView,
} from '../../../shared/approval-ai.js';
import type { ApprovalAiService } from './service.js';
import { ApprovalAiError } from './service.js';

export async function readReviewForFollowUp(
  service: Pick<ApprovalAiService, 'reviews'>,
  reference: ReviewReference,
  userId: string,
  translate: (key: string) => string,
): Promise<ReviewView> {
  const reviews = await service.reviews(
    reference.lifecycle,
    reference.recordId,
    userId,
    translate,
  );
  const review = reviews.find((item) => item.taskId === reference.taskId);
  if (!review) throw new ApprovalAiError('NOT_FOUND');
  if (
    review.status !== 'succeeded' ||
    !review.findings ||
    review.generatedAt !== reference.generatedAt
  )
    throw new ApprovalAiError('CONFLICT');
  return review;
}
