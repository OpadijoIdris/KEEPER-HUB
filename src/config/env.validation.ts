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
  // The org's existing KeeperHub wallet integration (see ROADMAP.md "KeeperHub live API
  // reconnaissance") — not something we provision ourselves, just a reference.
  KEEPERHUB_WALLET_ADDRESS: Joi.string().allow('').optional(),
  KEEPERHUB_WALLET_INTEGRATION_ID: Joi.string().allow('').optional(),

  // Optional until the AI module is built (Phase 2, Day 3).
  OXLO_BASE_URL: Joi.string().uri().optional(),
  OXLO_API_KEY: Joi.string().allow('').optional(),
  OXLO_MODEL: Joi.string().optional(),

  // Optional until Notifications sends its first real email — without these,
  // NodemailerEmailAdapter logs a warning and skips delivery instead of failing.
  EMAIL_HOST: Joi.string().allow('').optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_USER: Joi.string().allow('').optional(),
  EMAIL_PASS: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().allow('').optional(),

  // Off by default — AgentEvaluationScheduler can make agents execute real,
  // funded transactions unattended once enabled. See README.md "Known gaps".
  AGENT_SCHEDULER_ENABLED: Joi.boolean().default(false),
  AGENT_EVALUATION_INTERVAL_MS: Joi.number().default(900_000),
});
