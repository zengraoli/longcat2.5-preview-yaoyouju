export class PreviewFollowupDto {
  episodeId: string;
}

export class ExportFollowupDto {
  episodeId: string;
  format: string;
}

export class ReorderQuestionsDto {
  episodeId: string;
  questionIds: string[];
}
