import { Injectable, Logger } from '@nestjs/common';
import { ClaudeApiService } from '../../claude-api/claude-api.service';
import { RoleContext } from '../../context/entities/role-context.entity';
import { SystemGuide } from '../../context/entities/system-guide.entity';

@Injectable()
export class QueryClassificationService {
  private readonly logger = new Logger(QueryClassificationService.name);

  constructor(private readonly claudeApiService: ClaudeApiService) {}

  async classifyQuery(
    message: string,
    roleContext: RoleContext | null,
    systemGuides: SystemGuide[],
  ): Promise<boolean> {
    try {
      const classificationPrompt = this.buildClassificationPrompt(
        message,
        roleContext,
        systemGuides,
      );

      const response = await this.claudeApiService.sendMessage(
        [
          {
            role: 'user',
            content: classificationPrompt,
          },
        ],
        {
          model: 'claude-3-haiku-20240307',
          maxTokens: 10,
          temperature: 0.1,
        },
      );

      const cleanResponse = response.toLowerCase().trim();
      const isSystemQuery =
        cleanResponse.includes('true') ||
        cleanResponse.includes('sí') ||
        cleanResponse.includes('si') ||
        cleanResponse.includes('sistema');

      this.logger.debug(
        `🔍 Clasificación de consulta: "${message}" -> ${isSystemQuery ? 'SISTEMA' : 'BASE_DATOS'}`,
      );

      return isSystemQuery;
    } catch (error) {
      this.logger.error(`❌ Error clasificando consulta: ${error.message}`);
      // En caso de error, asumir que es consulta al sistema por seguridad
      return true;
    }
  }

  private buildClassificationPrompt(
    message: string,
    roleContext: RoleContext | null,
    systemGuides: SystemGuide[],
  ): string {
    let contextInfo = '';

    if (roleContext) {
      contextInfo += `CONTEXTO DEL ROL (${roleContext.roleCode}):
- Capacidades: ${roleContext.capabilities.join(', ')}
- Consultas comunes: ${roleContext.commonQueries.join(', ')}
- Flujos de trabajo: ${roleContext.workflows.join(', ')}

`;
    }

    if (systemGuides && systemGuides.length > 0) {
      contextInfo += `GUÍAS DEL SISTEMA DISPONIBLES:
${systemGuides.map((guide) => `- ${guide.title}: ${guide.description || ''}`).join('\n')}

`;
    }

    return `Analiza la siguiente pregunta y determina si es una CONSULTA AL SISTEMA o una CONSULTA A LA BASE DE DATOS.

${contextInfo}PREGUNTA DEL USUARIO: "${message}"

CRITERIOS:
- CONSULTA AL SISTEMA (responde TRUE): Preguntas sobre cómo hacer algo, procesos, procedimientos, capacidades del sistema, guías paso a paso, flujos de trabajo.
  Ejemplos: "¿Cómo crear un usuario?", "¿Cuál es el proceso de venta?", "¿Qué puedo hacer en el sistema?", "Explícame cómo validar un archivo"

- CONSULTA A LA BASE DE DATOS (responde FALSE): Preguntas que requieren buscar, verificar o listar información específica almacenada.
  Ejemplos: "¿Existe el usuario María Pérez?", "Muéstrame los lotes disponibles", "¿Cuántos proyectos hay activos?", "Busca el cliente con ID 123"

Responde SOLO: TRUE (si es consulta al sistema) o FALSE (si es consulta a la base de datos)`;
  }
}
