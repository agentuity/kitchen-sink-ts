import type { AgentRequest, AgentResponse } from '@agentuity/sdk';

export const detectHelpMessage = async (
  req: AgentRequest,
  resp: AgentResponse
) => {
  if (req.data.contentType !== 'text/plain') {
    return null;
  }

  if ((await req.data.text()).trim().toLowerCase() === 'help') {
    return resp.handoff({ name: 'kitchen-sink' });
  }

  return null;
};

export const replaceCircularReferences = () => {
  const seen = new WeakSet();

  return (_key: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }

      seen.add(value);
    }

    return value;
  };
};
