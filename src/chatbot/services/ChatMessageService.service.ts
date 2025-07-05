import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { User } from 'src/common/interfaces/user.interface';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatRateLimit } from '../entities/chat-rate-limit.entity';
import { TitleGenerationService } from '../agents/title-generation.service';
import { QueryClassificationService } from '../agents/query-clasification.service';
import { DatabaseQueryService } from '../agents/database-query.service';
import { ResponseGenerationService } from '../agents/response-generation.service';
import { ContextService } from 'src/context/context.service';

export interface SendMessageDto {
  message: string;
  sessionId?: string;
}

export interface SendMessageRequest {
  user: User;
  data: SendMessageDto;
}

@Injectable()
export class ChatMessageService {
  private readonly logger = new Logger(ChatMessageService.name);

  constructor(
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessage>,
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSession>,
    @InjectModel(ChatRateLimit.name)
    private readonly chatRateLimitModel: Model<ChatRateLimit>,
    private readonly titleGenerationService: TitleGenerationService,
    private readonly queryClassificationService: QueryClassificationService,
    private readonly databaseQueryService: DatabaseQueryService,
    private readonly responseGenerationService: ResponseGenerationService,
    private readonly contextService: ContextService,
  ) {}

  async sendMessage({ user, data }: SendMessageRequest) {
    try {
      const { message, sessionId } = data;
      let currentSessionId = sessionId;
      let isNewSession = false;

      // 1. Validar si es sesión nueva y crear título si es necesario
      if (!sessionId) {
        isNewSession = true;
        const title = await this.titleGenerationService.generateTitle(message);
        await this.consumeRateLimit(user.id, 2); // Consumir puntos por usar agente

        const newSession = new this.chatSessionModel({
          user: user.id,
          title,
          isActive: true,
          messages: [],
        });

        const savedSession = await newSession.save();
        currentSessionId = (savedSession._id as any).toString();
      }

      // 2. Guardar mensaje del usuario
      const userMessage = new this.chatMessageModel({
        session: currentSessionId,
        role: MessageRole.USER,
        content: message,
        metadata: { userId: user.id },
      });

      await userMessage.save();

      // Actualizar sesión con el nuevo mensaje
      await this.chatSessionModel.findByIdAndUpdate(currentSessionId, {
        $push: { messages: userMessage._id },
      });

      // 3. Obtener historial de conversación (últimos 5 mensajes)
      const conversationHistory = await this.getConversationHistory(
        currentSessionId!,
        5,
      );

      // 4. Obtener contexto del rol del usuario
      const roleContext = await this.contextService.getRoleContextByCode(
        user.role.code,
      );
      const systemGuides = await this.contextService.getSystemGuidesByRole(
        user.role.code,
      );

      // 5. Determinar si es consulta al sistema o a la base de datos
      const isSystemQuery = await this.queryClassificationService.classifyQuery(
        message,
        roleContext,
        systemGuides,
      );
      await this.consumeRateLimit(user.id, 2); // Consumir puntos por usar agente

      let assistantResponse: string;

      if (!isSystemQuery) {
        // Es consulta a la base de datos
        assistantResponse = await this.handleDatabaseQuery(
          message,
          user,
          conversationHistory,
        );
      } else {
        // Es consulta al sistema
        assistantResponse = await this.handleSystemQuery(
          message,
          user,
          conversationHistory,
          roleContext,
          systemGuides,
        );
      }

      // 6. Guardar respuesta del asistente
      const assistantMessage = new this.chatMessageModel({
        session: currentSessionId,
        role: MessageRole.ASSISTANT,
        content: assistantResponse,
        metadata: {
          userId: user.id,
          queryType: isSystemQuery ? 'system' : 'database',
        },
      });

      await assistantMessage.save();

      // Actualizar sesión con la respuesta del asistente
      await this.chatSessionModel.findByIdAndUpdate(currentSessionId, {
        $push: { messages: assistantMessage._id },
      });

      return {
        success: true,
        message: isNewSession
          ? 'Nueva conversación iniciada'
          : 'Mensaje enviado exitosamente',
        sessionId: currentSessionId,
        response: assistantResponse,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error en sendMessage: ${error.message}`);
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al procesar el mensaje',
        error: error.message,
      });
    }
  }

  private async handleDatabaseQuery(
    message: string,
    user: User,
    conversationHistory: ChatMessage[],
  ): Promise<string> {
    try {
      // Obtener configuración de acceso a la base de datos del rol
      const databaseAccessResult =
        await this.contextService.getDatabaseAccessByRole(user.role.code);

      if (!databaseAccessResult.success) {
        return 'No tienes permisos para realizar consultas a la base de datos.';
      }

      const databaseAccess = databaseAccessResult.data;

      // Generar consulta SQL usando el agente
      const sqlResult = await this.databaseQueryService.generateSQLQuery(
        message,
        databaseAccess,
      );
      await this.consumeRateLimit(user.id, 2); // Consumir puntos por usar agente

      if (!sqlResult.success || !sqlResult.sqlQuery) {
        return (
          sqlResult.message || 'No tienes permisos para realizar esta consulta.'
        );
      }
      // Ejecutar la consulta SQL

      const queryResults = await this.databaseQueryService.executeQuery(
        sqlResult.sqlQuery,
      );

      if (!queryResults.success || !queryResults.data) {
        return 'No se pudo ejecutar la consulta o no se encontraron resultados.';
      }

      // Generar respuesta final usando el agente de respuesta
      const finalResponse =
        await this.responseGenerationService.generateDatabaseResponse(
          message,
          user,
          queryResults.data,
          conversationHistory,
        );
      await this.consumeRateLimit(user.id, 2); // Consumir puntos por usar agente

      return finalResponse;
    } catch (error) {
      this.logger.error(`Error en handleDatabaseQuery: ${error.message}`);
      return 'Ocurrió un error al procesar tu consulta a la base de datos.';
    }
  }

  private async handleSystemQuery(
    message: string,
    user: User,
    conversationHistory: ChatMessage[],
    roleContext: any,
    systemGuides: any[],
  ): Promise<string> {
    try {
      // Generar respuesta usando el agente de respuesta
      const response =
        await this.responseGenerationService.generateSystemResponse(
          message,
          user,
          conversationHistory,
          roleContext,
          systemGuides,
        );
      await this.consumeRateLimit(user.id, 2); // Consumir puntos por usar agente

      return response;
    } catch (error) {
      this.logger.error(`Error en handleSystemQuery: ${error.message}`);
      return 'Ocurrió un error al procesar tu consulta del sistema.';
    }
  }

  private async getConversationHistory(
    sessionId: string,
    limit: number = 5,
  ): Promise<ChatMessage[]> {
    try {
      const session = await this.chatSessionModel.findById(sessionId).populate({
        path: 'messages',
        model: 'ChatMessage',
        options: {
          sort: { createdAt: -1 },
          limit: limit * 2, // Multiplicamos por 2 para obtener intercalados user/assistant
        },
      });

      if (!session) {
        return [];
      }

      // Devolver los mensajes en orden cronológico
      return (session.messages as any[]).reverse().slice(-limit);
    } catch (error) {
      this.logger.error(`Error obteniendo historial: ${error.message}`);
      return [];
    }
  }

  private async consumeRateLimit(
    userId: string,
    points: number,
  ): Promise<void> {
    try {
      const now = new Date();
      const windowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
      );

      const existingLimit = await this.chatRateLimitModel.findOne({
        user: userId,
        windowStart,
      });

      if (existingLimit) {
        // Solo incrementar si no está bloqueado
        if (!existingLimit.isBlocked) {
          existingLimit.requestCount += points;
          await existingLimit.save();
        }
      } else {
        const newLimit = new this.chatRateLimitModel({
          user: userId,
          windowStart,
          requestCount: points,
          isBlocked: false,
        });
        await newLimit.save();
      }
    } catch (error) {
      this.logger.error(`Error actualizando rate limit: ${error.message}`);
      // No lanzamos error para no interrumpir el flujo principal
    }
  }
}
