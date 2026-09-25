export class CreateEvidenceDocDto {
  title: string;
  sourceType: string;
  sourceUrl?: string;
  license?: string;
  verifiedAt?: string;
  chunks?: string[];
}

export class ToggleEvidenceDto {
  docId: string;
  active: boolean;
}
