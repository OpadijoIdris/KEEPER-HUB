import { Inject, Injectable } from '@nestjs/common';
import { Agent } from '../../domain/agent.entity';
import { AGENT_REPOSITORY } from '../../domain/ports/agent.repository';
import type { AgentRepository } from '../../domain/ports/agent.repository';
import { EVENT_BUS_PORT } from '../../../../shared/application/event-bus.port';
import type { EventBusPort } from '../../../../shared/application/event-bus.port';
import { NotFoundError } from '../../../../shared/domain/domain-error.base';

@Injectable()
export class AgentService {
  constructor(
    @Inject(AGENT_REPOSITORY) private readonly agents: AgentRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async create(
    ownerId: string,
    name: string,
    monitoredTrigger: string,
    rules: string,
  ): Promise<Agent> {
    const agent = Agent.create(ownerId, name, monitoredTrigger, rules);
    await this.agents.save(agent);
    await this.publishEvents(agent);
    return agent;
  }

  async activate(agentId: string): Promise<Agent> {
    const agent = await this.mustFind(agentId);
    agent.activate();
    await this.agents.save(agent);
    return agent;
  }

  async pause(agentId: string): Promise<Agent> {
    const agent = await this.mustFind(agentId);
    agent.pause();
    await this.agents.save(agent);
    return agent;
  }

  async retire(agentId: string): Promise<Agent> {
    const agent = await this.mustFind(agentId);
    agent.retire();
    await this.agents.save(agent);
    return agent;
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    return this.agents.findById(agentId);
  }

  async listByOwner(ownerId: string): Promise<Agent[]> {
    return this.agents.findByOwnerId(ownerId);
  }

  private async mustFind(agentId: string): Promise<Agent> {
    const agent = await this.agents.findById(agentId);
    if (!agent) throw new NotFoundError(`Agent "${agentId}" not found.`);
    return agent;
  }

  private async publishEvents(agent: Agent): Promise<void> {
    for (const event of agent.pullDomainEvents()) {
      await this.eventBus.publish(event);
    }
  }
}
