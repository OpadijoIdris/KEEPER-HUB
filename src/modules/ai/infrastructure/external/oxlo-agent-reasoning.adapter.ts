import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import type {
  AgentReasoning,
  ReasoningRequest,
  ReasoningResult,
} from '../../domain/ports/agent-reasoning.port';
import type { AppConfig } from '../../../../config/configuration';

/**
 * Oxlo.ai via LangChain's ChatOpenAI (OpenAI-compatible endpoint — see
 * docs.oxlo.ai). The only place in the platform that imports LangChain
 * (docs/ARCHITECTURE.md §5.6) — the domain only knows AgentReasoning.
 */
@Injectable()
export class OxloAgentReasoningAdapter implements AgentReasoning {
  private readonly logger = new Logger(OxloAgentReasoningAdapter.name);
  private model: ChatOpenAI | null = null;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async evaluate(request: ReasoningRequest): Promise<ReasoningResult> {
    const model = this.getModel();

    const systemPrompt = [
      `You are the reasoning engine for an autonomous on-chain agent named "${request.agentName}".`,
      `What it monitors: ${request.monitoredTrigger}`,
      `Its rules: ${request.rules}`,
      `It may only take these kinds of action: ${request.allowedActions.join(', ') || '(none configured)'}.`,
      '',
      'Given the trigger context, decide one of: "execute" (the rules are satisfied and an allowed',
      'action should run), "skip" (rules not currently satisfied, do nothing), or "blocked" (the',
      'right action isn\'t in the allowed list, or the context is insufficient/unsafe to act on).',
      '',
      'Respond with ONLY a JSON object, no markdown fences, no other text. Omit "action" entirely',
      'unless outcome is "execute". When outcome is "execute", "action.params" MUST use exactly',
      'these keys (no others, no nesting) depending on "action.kind":',
      '- kind "transfer": {"chainId": "<chain id as a string, e.g. \\"1\\">", "toAddress": "<0x... recipient>",',
      '  "amount": "<decimal string, e.g. \\"0.0005\\">", "tokenAddress": "<0x... ERC20 contract, OMIT for native token>"}',
      '- kind "protocol_action": {"actionType": "<protocol/action-slug>", "params": {<action-specific key-values>}}',
      '',
      'Example: {"outcome": "execute", "rationale": "...",',
      ' "action": {"kind": "transfer", "params": {"chainId": "1", "toAddress": "0xabc...", "amount": "0.0005"}}}',
    ].join('\n');

    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Trigger context:\n${JSON.stringify(request.triggerContext, null, 2)}` },
    ]);

    const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    return this.parseResult(text);
  }

  private parseResult(text: string): ReasoningResult {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? jsonMatch[0] : text;
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.outcome !== 'execute' && parsed.outcome !== 'skip' && parsed.outcome !== 'blocked') {
        throw new Error(`Unrecognized outcome: ${parsed.outcome}`);
      }
      return {
        outcome: parsed.outcome,
        rationale: String(parsed.rationale ?? 'No rationale provided.'),
        action: parsed.outcome === 'execute' ? parsed.action : undefined,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse reasoning response as JSON: ${text}`);
      return {
        outcome: 'blocked',
        rationale: `Reasoning response was not valid JSON (${error instanceof Error ? error.message : 'parse error'}). Raw: ${text.slice(0, 300)}`,
      };
    }
  }

  private getModel(): ChatOpenAI {
    if (this.model) return this.model;

    const apiKey = this.configService.get('ai.oxloApiKey', { infer: true });
    const baseURL = this.configService.get('ai.oxloBaseUrl', { infer: true });
    const modelName = this.configService.get('ai.oxloModel', { infer: true });
    if (!apiKey || !baseURL) {
      throw new Error('OXLO_API_KEY / OXLO_BASE_URL are not configured.');
    }

    this.model = new ChatOpenAI({
      apiKey,
      model: modelName,
      configuration: { baseURL },
      temperature: 0.2,
    });
    return this.model;
  }
}
