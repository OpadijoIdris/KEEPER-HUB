import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // Optional until the KeeperHub Integration / Wallet modules are built (Phase 2).
  KEEPERHUB_MCP_BASE_URL: Joi.string().uri().optional(),
  KEEPERHUB_API_KEY: Joi.string().allow('').optional(),
  KEEPERHUB_WALLET_SUB_ORG_ID: Joi.string().allow('').optional(),
  KEEPERHUB_WALLET_HMAC_SECRET: Joi.string().allow('').optional(),
});
