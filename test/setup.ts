import { jest } from '@jest/globals';
import 'reflect-metadata';

(globalThis as unknown as { jest: typeof jest }).jest = jest;
