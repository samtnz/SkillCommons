import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case');

export const versionSchema = z
  .string()
  .max(32)
  .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'invalid semver');

export const tagsSchema = z.array(z.string().min(1).max(32)).max(20);
export const capabilitiesSchema = z.array(z.string().min(1).max(32)).max(20);

export const markdownSchema = z.string().min(1).max(20000);
