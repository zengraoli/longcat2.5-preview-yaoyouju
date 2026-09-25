export class CreateFeedbackDto {
  analysisId?: string;
  helpType?: string;
  unsolvedQuestion?: string;
  isErrorReport?: boolean;
  errorCategory?: string;
  errorDescription?: string;
  severity?: string;
}

export class GrantFeedbackViewDto {
  feedbackId: string;
  granteeId: string;
}
