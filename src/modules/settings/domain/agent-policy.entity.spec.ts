import { AgentPolicy } from './agent-policy.entity';

describe('AgentPolicy', () => {
  it('rejects any action kind by default (empty allowedActions)', () => {
    const policy = AgentPolicy.createDefault('agent-1');
    expect(policy.permits('transfer', '0', 0)).toBe(false);
  });

  it('allows a transfer with an empty destination allowlist (fail-open)', () => {
    const policy = AgentPolicy.fromPersistence('policy-1', 'agent-1', '1', ['transfer'], []);
    expect(policy.permits('transfer', '0.5', 0, '0xAbC')).toBe(true);
  });

  it('allows a transfer to an address on the allowlist, case-insensitively', () => {
    const policy = AgentPolicy.fromPersistence(
      'policy-1',
      'agent-1',
      '1',
      ['transfer'],
      ['0xAbC123'],
    );
    expect(policy.permits('transfer', '0.5', 0, '0xabc123')).toBe(true);
  });

  it('rejects a transfer to an address not on the allowlist', () => {
    const policy = AgentPolicy.fromPersistence(
      'policy-1',
      'agent-1',
      '1',
      ['transfer'],
      ['0xAbC123'],
    );
    expect(policy.permits('transfer', '0.5', 0, '0xDeadBeef')).toBe(false);
  });

  it('does not destination-check non-transfer kinds even with a populated allowlist', () => {
    const policy = AgentPolicy.fromPersistence(
      'policy-1',
      'agent-1',
      '1',
      ['protocol_action'],
      ['0xAbC123'],
    );
    expect(policy.permits('protocol_action', '0', 0, '0xDeadBeef')).toBe(true);
  });

  it('still enforces the cumulative spend cap alongside the destination check', () => {
    const policy = AgentPolicy.fromPersistence(
      'policy-1',
      'agent-1',
      '1',
      ['transfer'],
      ['0xAbC123'],
    );
    expect(policy.permits('transfer', '0.5', 0.6, '0xAbC123')).toBe(false);
  });

  it('update() replaces allowedDestinations only when explicitly passed', () => {
    const policy = AgentPolicy.fromPersistence(
      'policy-1',
      'agent-1',
      '1',
      ['transfer'],
      ['0xAbC123'],
    );
    policy.update(undefined, undefined, undefined);
    expect(policy.allowedDestinations).toEqual(['0xAbC123']);

    policy.update(undefined, undefined, ['0xNewAddress']);
    expect(policy.allowedDestinations).toEqual(['0xNewAddress']);
  });
});
