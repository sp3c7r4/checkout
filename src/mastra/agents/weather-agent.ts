import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools/weather-tool';
import { PgVector, PostgresStore } from '@mastra/pg';
import env from '../../config/env';

const prodConfig = {
    vector: new PgVector({connectionString: env.DB_MEMORY}),
    storage: new PostgresStore({
        connectionString: env.DB_MEMORY,
    }),
    embedder: google.textEmbeddingModel('text-embedding-004'),
};

const memory = new Memory({
    ...prodConfig,
    options: {
      lastMessages: 20,
      semanticRecall: {
         topK: 10,
         messageRange: 2,
      },
      workingMemory: {
         enabled: true,
         template: `
         first_name: {{first_name}}
         last_name: {{last_name}}
         `
      }
    },
  })

export const weatherAgent = new Agent({
  memory,
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn’t in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  model: google('gemini-1.5-pro-latest'),
  tools: { weatherTool },
  // memory: new Memory({
  //   storage: new LibSQLStore({
  //     url: 'file:../mastra.db', // path is relative to the .mastra/output directory
  //   }),
  // }),
});
