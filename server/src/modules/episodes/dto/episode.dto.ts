export class CreateEpisodeDto {
  title: string;
  onsetDate?: string;
  onsetCertainty?: string;
}

export class CreateCareEventDto {
  episodeId: string;
  eventType: string;
  occurredAt: string;
  sourceType: string;
  rawText?: string;
  verifyStatus?: string;
}

export class CreateSymptomLogDto {
  careEventId: string;
  sitMinutes?: number;
  plannedActivityDone?: string;
  sleepImpact?: number;
  topWorry?: string;
  legChange?: string;
}

export class UpdateCareEventDto {
  rawText?: string;
  verifyStatus?: string;
}
