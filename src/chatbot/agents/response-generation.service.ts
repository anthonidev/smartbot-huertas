import { Injectable, Logger } from '@nestjs/common';
import { ClaudeApiService } from '../../claude-api/claude-api.service';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { RoleContext } from '../../context/entities/role-context.entity';
import { SystemGuide } from '../../context/entities/system-guide.entity';
import { User } from '../../common/interfaces/user.interface';

@Injectable()
export class ResponseGenerationService {
  private readonly logger = new Logger(ResponseGenerationService.name);

  constructor(private readonly claudeApiService: ClaudeApiService) {}

  async generateDatabaseResponse(
    userQuestion: string,
    user: User,
    queryResults: any[],
    conversationHistory: ChatMessage[],
  ): Promise<string> {
    try {
      const prompt = this.buildDatabaseResponsePrompt(
        userQuestion,
        user,
        queryResults,
        conversationHistory,
      );

      const response = await this.claudeApiService.sendMessage(
        [
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: 'claude-3-haiku-20240307',
          maxTokens: 1000,
          temperature: 0.7,
        },
      );

      this.logger.debug(
        `✅ Respuesta de BD generada para usuario ${user.email}`,
      );
      return response.trim();
    } catch (error) {
      this.logger.error(`❌ Error generando respuesta de BD: ${error.message}`);
      return 'He encontrado la información solicitada, pero ocurrió un error al formatear la respuesta.';
    }
  }

  async generateSystemResponse(
    userQuestion: string,
    user: User,
    conversationHistory: ChatMessage[],
    roleContext: RoleContext | null,
    systemGuides: SystemGuide[],
  ): Promise<string> {
    try {
      const prompt = this.buildSystemResponsePrompt(
        userQuestion,
        user,
        conversationHistory,
        roleContext,
        systemGuides,
      );

      const response = await this.claudeApiService.sendMessage(
        [
          {
            role: 'user',
            content: prompt,
          },
        ],
        {
          model: 'claude-3-haiku-20240307',
          maxTokens: 1500,
          temperature: 0.7,
        },
      );

      this.logger.debug(
        `✅ Respuesta de sistema generada para usuario ${user.email}`,
      );
      return response.trim();
    } catch (error) {
      this.logger.error(
        `❌ Error generando respuesta de sistema: ${error.message}`,
      );
      return 'Estoy aquí para ayudarte, pero ocurrió un error al procesar tu consulta. ¿Podrías reformular tu pregunta?';
    }
  }

  private buildDatabaseResponsePrompt(
    userQuestion: string,
    user: User,
    queryResults: any[],
    conversationHistory: ChatMessage[],
  ): string {
    const historyContext =
      this.buildConversationHistoryContext(conversationHistory);

    return `Eres un asistente especializado del sistema. Basándote en los resultados de la consulta a la base de datos, proporciona una respuesta clara y útil al usuario.

INFORMACIÓN DEL USUARIO:
- Nombre: ${user.fullName}
- Email: ${user.email}
- Rol: ${user.role.name} (${user.role.code})

PREGUNTA ORIGINAL: "${userQuestion}"

RESULTADOS DE LA CONSULTA:
${JSON.stringify(queryResults, null, 2)}

${historyContext}

INSTRUCCIONES PARA LA RESPUESTA:
1. Interpreta y presenta los datos de manera clara y comprensible
2. Si hay muchos resultados, resume los más relevantes y menciona el total
3. Incluye información contextual relevante basada en los datos
4. Usa un tono profesional pero amigable
5. Si los datos están relacionados con fechas, formatéalas apropiadamente
6. Si hay números o cantidades, preséntales de manera clara
7. Sugiere acciones adicionales si es relevante

Responde de manera conversacional, como si fueras un asistente experto del sistema.`;
  }

  private buildSystemResponsePrompt(
    userQuestion: string,
    user: User,
    conversationHistory: ChatMessage[],
    roleContext: RoleContext | null,
    systemGuides: SystemGuide[],
  ): string {
    const historyContext =
      this.buildConversationHistoryContext(conversationHistory);
    let contextInfo = '';

    if (roleContext) {
      contextInfo += `CONTEXTO DE TU ROL (${roleContext.roleCode} - ${roleContext.name}):
Descripción: ${roleContext.description}

CAPACIDADES QUE TIENES:
${roleContext.capabilities.map((cap) => `• ${cap}`).join('\n')}

CONSULTAS COMUNES DE TU ROL:
${roleContext.commonQueries.map((query) => `• ${query}`).join('\n')}

FLUJOS DE TRABAJO DISPONIBLES:
${roleContext.workflows.map((workflow) => `• ${workflow}`).join('\n')}

`;
    }

    if (systemGuides && systemGuides.length > 0) {
      contextInfo += `GUÍAS DEL SISTEMA DISPONIBLES PARA TI:
${systemGuides
  .map(
    (guide) => `
📋 ${guide.title}
${guide.description ? `   Descripción: ${guide.description}` : ''}
   Pasos:
${guide.steps.map((step, index) => `   ${index + 1}. ${step}`).join('\n')}
`,
  )
  .join('\n')}

`;
    }

    return `Eres un asistente especializado del sistema, experto en ayudar a usuarios con su rol específico.

INFORMACIÓN DEL USUARIO:
- Nombre: ${user.fullName}
- Email: ${user.email}
- Rol: ${user.role.name} (${user.role.code})

${contextInfo}PREGUNTA DEL USUARIO: "${userQuestion}"

${historyContext}

INSTRUCCIONES PARA LA RESPUESTA:
1. Responde específicamente a la pregunta basándote en el contexto del rol del usuario
2. Si la pregunta está relacionada con una guía disponible, proporciona los pasos específicos
3. Si es sobre capacidades, explica cómo puede usar esas funciones
4. Si es una consulta común de su rol, da una respuesta detallada
5. Si menciona un flujo de trabajo, guíalo paso a paso
6. Usa un tono profesional pero amigable
7. Si no tienes información específica, sugiere las opciones más relevantes para su rol
8. Siempre mantén el contexto de la conversación anterior si es relevante

Responde de manera conversacional, como si fueras un experto del sistema especializado en el rol del usuario.`;
  }

  private buildConversationHistoryContext(
    conversationHistory: ChatMessage[],
  ): string {
    if (!conversationHistory || conversationHistory.length === 0) {
      return '';
    }

    const historyText = conversationHistory
      .map((msg) => {
        const role = msg.role === MessageRole.USER ? 'Usuario' : 'Asistente';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    return `HISTORIAL DE CONVERSACIÓN RECIENTE:
${historyText}

`;
  }
}
