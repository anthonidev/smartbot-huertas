import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { envs } from '../config/envs';
import {
  ClaudeApiConfig,
  ClaudeApiResponse,
  ClaudeMessage,
} from './interfaces/claude-api.interface';

@Injectable()
export class ClaudeApiService {
  private readonly logger = new Logger(ClaudeApiService.name);

  private readonly defaultConfig: ClaudeApiConfig = {
    model: 'claude-3-haiku-20240307',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000,
  };

  constructor(private readonly httpService: HttpService) {}

  async sendMessage(
    messages: ClaudeMessage[],
    config: Partial<ClaudeApiConfig> = {},
  ): Promise<string> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      const response = await firstValueFrom(
        this.httpService.post<ClaudeApiResponse>(
          'https://api.anthropic.com/v1/messages',
          {
            model: finalConfig.model,
            max_tokens: finalConfig.maxTokens,
            temperature: finalConfig.temperature,
            messages,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': envs.CLAUDE_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            timeout: finalConfig.timeout,
          },
        ),
      );

      if (!response?.data?.content?.[0]?.text) {
        throw new Error('Invalid response from Claude API');
      }

      this.logger.debug(
        `✅ Claude API response received (${response.data.content[0].text.length} chars)`,
      );

      return response.data.content[0].text;
    } catch (error) {
      this.logger.error(`❌ Claude API Error: ${error.message}`);

      if (error.response?.status) {
        this.logger.error(`🔥 API Status: ${error.response.status}`);
        if (error.response.data) {
          this.logger.error(
            `📄 API Response: ${JSON.stringify(error.response.data)}`,
          );
        }
      }

      throw error;
    }
  }

  isAvailable(): boolean {
    return !!(envs.CLAUDE_API_KEY && envs.CLAUDE_API_KEY.trim());
  }
}
