export interface AppConfig {
  nodeEnv: string;
  port: number;
  logLevel: string;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtl: string;
  };
  keeperHub: {
    mcpBaseUrl?: string;
    apiKey?: string;
    walletAddress?: string;
    walletIntegrationId?: string;
  };
  ai: {
    oxloBaseUrl?: string;
    oxloApiKey?: string;
    oxloModel: string;
  };
  email: {
    host?: string;
    port: number;
    user?: string;
    pass?: string;
    from?: string;
  };
  agentScheduler: {
    enabled: boolean;
    intervalMs: number;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  keeperHub: {
    mcpBaseUrl: process.env.KEEPERHUB_MCP_BASE_URL,
    apiKey: process.env.KEEPERHUB_API_KEY,
    walletAddress: process.env.KEEPERHUB_WALLET_ADDRESS,
    walletIntegrationId: process.env.KEEPERHUB_WALLET_INTEGRATION_ID,
  },
  ai: {
    oxloBaseUrl: process.env.OXLO_BASE_URL,
    oxloApiKey: process.env.OXLO_API_KEY,
    oxloModel: process.env.OXLO_MODEL ?? 'deepseek-r1-8b',
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  agentScheduler: {
    enabled: process.env.AGENT_SCHEDULER_ENABLED === 'true',
    intervalMs: parseInt(process.env.AGENT_EVALUATION_INTERVAL_MS ?? '900000', 10),
  },
});
