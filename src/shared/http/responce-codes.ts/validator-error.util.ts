import type { ValidationError } from 'class-validator';
import type { FieldError } from './api-responce.type.js';

export function flattenValidationErrors(errors: ValidationError[], parentPath = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const fieldErrors = Object.values(error.constraints ?? {}).map((detail) => ({
      field,
      detail,
    }));
    const childErrors = flattenValidationErrors(error.children ?? [], field);

    return [...fieldErrors, ...childErrors];
  });
}
