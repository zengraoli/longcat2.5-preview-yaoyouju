export class CreateReportDto {
  careEventId: string;
  reportDate: string;
  rawText: string;
  sourceType: string;
}

export class OcrExtractDto {
  careEventId: string;
  reportDate: string;
}

export class VerifyReportDto {
  verifyStatus: string;
  extractedTerms: { term: string; position: string }[];
}
