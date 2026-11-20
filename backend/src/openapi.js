import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// Le contrat d'API fait foi : il est rédigé dans backend/openapi.yaml et servi tel quel par Swagger.
export const openapiSpec = parse(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8'));
