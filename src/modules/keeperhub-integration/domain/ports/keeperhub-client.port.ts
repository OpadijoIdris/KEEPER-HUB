export const KEEPERHUB_CLIENT = Symbol('KEEPERHUB_CLIENT');

export interface ExecuteTransferParams {
  chainId: string;
  toAddress: string;
  amount: string;
  tokenAddress?: string;
  idempotencyKey: string;
}

export interface ExecuteProtocolActionParams {
  actionType: string;
  params: Record<string, unknown>;
  idempotencyKey: string;
}

export interface KeeperHubExecutionHandle {
  keeperHubExecutionId: string;
}

export interface KeeperHubExecutionStatus {
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  transactionHash?: string;
  result?: unknown;
  error?: string;
}

export interface ProtocolAction {
  actionType: string;
  protocol: string;
  description: string;
}

/**
 * The Anti-Corruption Layer boundary (docs/ARCHITECTURE.md §5.5) — phrased
 * in our domain's terms; only the adapter behind this knows it's backed by
 * KeeperHub's MCP JSON-RPC protocol.
 */
export interface KeeperHubClient {
  executeTransfer(params: ExecuteTransferParams): Promise<KeeperHubExecutionHandle>;
  executeProtocolAction(params: ExecuteProtocolActionParams): Promise<KeeperHubExecutionHandle>;
  getExecutionStatus(keeperHubExecutionId: string): Promise<KeeperHubExecutionStatus>;
  searchProtocolActions(query?: string, protocol?: string): Promise<ProtocolAction[]>;
}
