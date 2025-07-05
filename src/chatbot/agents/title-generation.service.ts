import { Injectable, Logger } from '@nestjs/common';
import { ClaudeApiService } from '../../claude-api/claude-api.service';

@Injectable()
export class TitleGenerationService {
  private readonly logger = new Logger(TitleGenerationService.name);

  constructor(private readonly claudeApiService: ClaudeApiService) {}

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const titlePrompt = `Genera un título corto y descriptivo (máximo 5 palabras) que comienza con: "${firstMessage.slice(0, 80)}..."
Ejemplos de buenos títulos:
- "Crear nuevo usuario"
- "Consulta sobre lotes"  
- "Proceso de venta"
- "Validar archivo Excel"
- "Gestión de pagos"
Responde SOLO con el título, sin comillas ni explicaciones.`;

      const title = await this.claudeApiService.sendMessage(
        [
          {
            role: 'user',
            content: titlePrompt,
          },
        ],
        {
          model: 'claude-3-haiku-20240307',
          maxTokens: 50,
          temperature: 0.3,
        },
      );

      // Limpiar el título removiendo comillas y limitando longitud
      const cleanTitle = title.replace(/['"]/g, '').trim().slice(0, 100);

      this.logger.debug(`✅ Título generado: "${cleanTitle}"`);
      return cleanTitle || 'Nueva conversación';
    } catch (error) {
      this.logger.error(`❌ Error generando título: ${error.message}`);
      return 'Nueva conversación';
    }
  }
}
