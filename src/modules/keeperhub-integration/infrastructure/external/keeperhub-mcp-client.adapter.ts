import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type {
  ExecuteProtocolActionParams,
  ExecuteTransferParams,
  KeeperHubClient,
  KeeperHubExecutionHandle,
  KeeperHubExecutionStatus,
  ProtocolAction,
  TransferSimulationResult,
} from '../../domain/ports/keeperhub-client.port';
import type { AppConfig } from '../../../../config/configuration';

interface JsonRpcResponse {
  result?: { content?: Array<{ type: string; text: string }> };
  error?: { code: number; message: string };
}

const SESSION_INVALID_CODE = -32003;

/**
 * MCP session handshake + JSON-RPC tool calls (see ROADMAP.md "KeeperHub
 * live API reconnaissance") — the only place in the platform that knows
 * KeeperHub speaks MCP over HTTP with a session-id header.
 */
@Injectable()
export class KeeperHubMcpClientAdapter implements KeeperHubClient {
  private readonly logger = new Logger(KeeperHubMcpClientAdapter.name);
  private sessionId: string | null = null;
  private initializing: Promise<string> | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async simulateTransfer(params: ExecuteTransferParams): Promise<TransferSimulationResult> {
    const result = await this.callTool('execute_transfer', {
      chain_id: params.chainId,
      to_address: params.toAddress,
      amount: params.amount,
      token_address: params.tokenAddress,
      simulate: true,
    });
    return {
      success: Boolean(result.success),
      wouldRevert: Boolean(result.wouldRevert),
      error: result.error,
    };
  }

  async executeTransfer(params: ExecuteTransferParams): Promise<KeeperHubExecutionHandle> {
    const result = await this.callTool('execute_transfer', {
      chain_id: params.chainId,
      to_address: params.toAddress,
      amount: params.amount,
      token_address: params.tokenAddress,
      idempotency_key: params.idempotencyKey,
    });
    return { keeperHubExecutionId: this.extractExecutionId(result) };
  }

  async executeProtocolAction(
    params: ExecuteProtocolActionParams,
  ): Promise<KeeperHubExecutionHandle> {
    const result = await this.callTool('execute_protocol_action', {
      actionType: params.actionType,
      params: params.params,
      idempotency_key: params.idempotencyKey,
    });
    return { keeperHubExecutionId: this.extractExecutionId(result) };
  }

  async getExecutionStatus(keeperHubExecutionId: string): Promise<KeeperHubExecutionStatus> {
    const result = await this.callTool('get_direct_execution_status', {
      execution_id: keeperHubExecutionId,
    });
    return {
      status: this.normalizeStatus(result.status),
      transactionHash: result.transactionHash ?? result.transaction_hash,
      result: result.result,
      error: result.error,
    };
  }

  async searchProtocolActions(query?: string, protocol?: string): Promise<ProtocolAction[]> {
    const result = await this.callTool('search_protocol_actions', { query, protocol });
    const actions = Array.isArray(result) ? result : (result.actions ?? []);
    return actions.map((a: Record<string, unknown>) => ({
      actionType: String(a.actionType),
      protocol: String(a.protocol),
      description: String(a.description ?? ''),
    }));
  }

  private normalizeStatus(status: unknown): KeeperHubExecutionStatus['status'] {
    const s = String(status).toLowerCase();
    if (s.includes('confirm') || s.includes('complet') || s === 'success' || s === 'succeeded')
      return 'confirmed';
    if (s.includes('fail') || s === 'reverted' || s === 'error') return 'failed';
    if (s.includes('submit') || s === 'pending_confirmation') return 'submitted';
    return 'pending';
  }

  private extractExecutionId(result: Record<string, unknown>): string {
    const id = result.executionId ?? result.execution_id ?? result.id;
    if (typeof id !== 'string') {
      throw new Error(`KeeperHub response had no execution id: ${JSON.stringify(result)}`);
    }
    return id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async callTool(name: string, args: Record<string, unknown>): Promise<any> {
    const sessionId = await this.ensureSession();
    const response = await this.rpcRequest(
      { jsonrpc: '2.0', id: randomUUID(), method: 'tools/call', params: { name, arguments: args } },
      sessionId,
    );

    if (response.error) {
      if (response.error.code === SESSION_INVALID_CODE) {
        this.sessionId = null;
        const freshSession = await this.ensureSession();
        const retry = await this.rpcRequest(
          {
            jsonrpc: '2.0',
            id: randomUUID(),
            method: 'tools/call',
            params: { name, arguments: args },
          },
          freshSession,
        );
        if (retry.error) throw new Error(`KeeperHub tool "${name}" failed: ${retry.error.message}`);
        return this.parseToolResult(retry);
      }
      throw new Error(`KeeperHub tool "${name}" failed: ${response.error.message}`);
    }
    return this.parseToolResult(response);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseToolResult(response: JsonRpcResponse): any {
    const text = response.result?.content?.[0]?.text;
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  private async ensureSession(): Promise<string> {
    if (this.sessionId) return this.sessionId;
    if (this.initializing) return this.initializing;

    this.initializing = this.initializeSession().finally(() => {
      this.initializing = null;
    });
    return this.initializing;
  }

  private async initializeSession(): Promise<string> {
    const baseUrl = this.configService.get('keeperHub.mcpBaseUrl', { infer: true });
    const apiKey = this.configService.get('keeperHub.apiKey', { infer: true });
    if (!baseUrl || !apiKey) {
      throw new Error('KEEPERHUB_MCP_BASE_URL / KEEPERHUB_API_KEY are not configured.');
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: randomUUID(),
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'keeperhub-platform', version: '0.1.0' },
        },
      }),
    });

    const sessionId = response.headers.get('mcp-session-id');
    if (!sessionId) {
      throw new Error('KeeperHub MCP initialize did not return an mcp-session-id header.');
    }
    await response.json(); // drain the initialize result body

    await this.rpcRequest(
      { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
      sessionId,
    );

    this.sessionId = sessionId;
    this.logger.log('KeeperHub MCP session established.');
    return sessionId;
  }

  private async rpcRequest(
    body: Record<string, unknown>,
    sessionId: string,
  ): Promise<JsonRpcResponse> {
    const baseUrl = this.configService.get('keeperHub.mcpBaseUrl', { infer: true });
    const apiKey = this.configService.get('keeperHub.apiKey', { infer: true });

    const response = await fetch(baseUrl as string, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 202) return {}; // notifications/* have no response body
    return (await response.json()) as JsonRpcResponse;
  }
}
