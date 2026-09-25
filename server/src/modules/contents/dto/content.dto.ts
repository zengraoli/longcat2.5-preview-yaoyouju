export class CreateContentDto {
  type: string;
  title: string;
  applicableScope?: string;
  notApplicable?: string;
  script?: string;
  subtitleText?: string;
  evidenceIds?: string[];
}

export class SubmitReviewDto {
  contentId: string;
  evidenceIds: string[];
}

export class ReviewDecisionDto {
  contentId: string;
  decision: string;
  comment?: string;
}

export class PublishDto {
  contentId: string;
  reviewerId: string;
}

export class OfflineDto {
  contentId: string;
  reason?: string;
}
