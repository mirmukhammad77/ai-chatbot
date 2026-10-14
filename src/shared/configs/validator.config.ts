import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { flattenValidationErrors } from '../http/responce-codes.ts/validator-error.util.js';

export const ValidatorConfig = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) =>
    new UnprocessableEntityException({
      code: 'validation_failed',
      message: 'one or more fields are invalid',
      details: {
        field_errors: flattenValidationErrors(errors),
      },
    }),
});
