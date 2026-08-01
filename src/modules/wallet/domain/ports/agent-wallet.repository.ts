import { AgentWallet } from '../agent-wallet.entity';

export const AGENT_WALLET_REPOSITORY = Symbol('AGENT_WALLET_REPOSITORY');

export interface AgentWalletRepository {
  findByAgentId(agentId: string): Promise<AgentWallet | null>;
  save(wallet: AgentWallet): Promise<void>;
}
