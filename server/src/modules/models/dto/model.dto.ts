export class CreateModelReleaseDto {
  modelName: string;
  promptVersion: string;
  retrievalStrategy: string;
  contentLibVersion: string;
}

export class SubmitEvalRunDto {
  modelReleaseId: string;
  evalSetId: string;
  triggerReason: string;
}

export class EvalResultDto {
  modelReleaseId: string;
  evalSetId: string;
  metrics: Record<string, number>;
  result: string;
  failedCases?: { input: string; expected: string; actual: string; judgment: string }[];
}

export class PublishModelDto {
  releaseId: string;
}

export class RollbackModelDto {
  releaseId: string;
}
