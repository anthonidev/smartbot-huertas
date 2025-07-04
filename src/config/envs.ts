import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  NATS_SERVERS: string;
  MONGODB_URI: string;
  CLAUDE_API_KEY: string;
  POSTGRES_URI: string;
}

const envsSchema = joi
  .object({
    NATS_SERVERS: joi
      .string()
      .default('nats://localhost:4222')
      .description('NATS server URI'),
    PORT: joi.number().default(3001),
    NODE_ENV: joi
      .string()
      .valid('development', 'production', 'test')
      .default('development'),
    MONGODB_URI: joi.string().required().description('MongoDB connection URI'),
    CLAUDE_API_KEY: joi.string().required().description('Claude API key'),
    POSTGRES_URI: joi
      .string()
      .required()
      .description('PostgreSQL connection URI'),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const envs: EnvVars = value;
