export class AntigravityAgent {
  name: string;
  skills: string[];
  triggers: string[];
  memory: {
    set: (key: string, value: any) => Promise<void>;
    get: (key: string) => Promise<any>;
  };

  constructor(config: { name: string; skills: string[]; memory: string; triggers: string[] }) {
    this.name = config.name;
    this.skills = config.skills;
    this.triggers = config.triggers;
    
    // In-memory mock
    const store = new Map<string, any>();
    this.memory = {
      set: async (key: string, value: any) => { store.set(key, value); },
      get: async (key: string) => store.get(key),
    };
  }
}

export const ecoAgent = new AntigravityAgent({
  name: 'eco-impact-tracker',
  skills: [
    'bom-ingestion', 
    'eco-ingestion', 
    'blast-radius-analysis',
    'gemini-impact-scoring', 
    'approval-workflow'
  ],
  memory: 'session',
  triggers: ['dual-csv-upload'],
});
