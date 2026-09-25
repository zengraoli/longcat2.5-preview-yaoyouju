export class AskQuestionDto {
  episodeId: string;
  analysisId?: string;
  question: string;
}

export class AddFollowupQuestionDto {
  episodeId: string;
  question: string;
}
