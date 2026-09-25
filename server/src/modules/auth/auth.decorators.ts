import { applyDecorators, SetMetadata } from '@nestjs/common';

export function Public() {
  return SetMetadata('isPublic', true);
}

export function RequireConsent(scope: string) {
  return SetMetadata('requiredConsent', scope);
}
