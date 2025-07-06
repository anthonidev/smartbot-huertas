import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { User } from 'src/common/interfaces/user.interface';
import { ChatRateLimit } from '../entities/chat-rate-limit.entity';
import { getRateLimitConfig } from '../config/rate-limit.config';
import { RateLimitStatus } from '../interfaces/rate-limit.interface';

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(
    @InjectModel(ChatRateLimit.name)
    private readonly chatRateLimitModel: Model<ChatRateLimit>,
  ) {}

  async getRateLimitStatus(user: User) {
    try {
      // 1. Obtener configuración del rate limit según el rol
      const rateLimitConfig = getRateLimitConfig(user.role.code);

      // 2. Calcular la ventana de tiempo actual (hora actual)
      const now = new Date();
      const windowStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
      );

      // 3. Buscar el registro de rate limit actual
      const currentRateLimit = await this.chatRateLimitModel.findOne({
        user: user.id,
        windowStart,
      });

      // 4. Calcular valores del estado
      const current = currentRateLimit?.requestCount || 0;
      const limit = rateLimitConfig.maxRequestsPerHour;
      const remaining = Math.max(0, limit - current);

      // 5. Calcular tiempo de reset (inicio de la próxima hora)
      const resetTime = new Date(windowStart);
      resetTime.setHours(resetTime.getHours() + 1);

      // 6. Determinar si está bloqueado
      let isBlocked = false;

      // Verificar si está bloqueado manualmente
      if (currentRateLimit?.isBlocked && currentRateLimit?.blockedUntil) {
        isBlocked = now < currentRateLimit.blockedUntil;

        // Si el tiempo de bloqueo ya pasó, desbloquear
        if (!isBlocked && currentRateLimit.isBlocked) {
          currentRateLimit.isBlocked = false;
          currentRateLimit.blockedUntil = undefined;
          await currentRateLimit.save();
        }
      }

      // Verificar si excedió el límite por hora
      if (current >= limit) {
        isBlocked = true;

        // Si no estaba bloqueado, bloquearlo
        if (currentRateLimit && !currentRateLimit.isBlocked) {
          const blockUntil = new Date(now);
          blockUntil.setMinutes(
            blockUntil.getMinutes() + rateLimitConfig.blockDurationMinutes,
          );

          currentRateLimit.isBlocked = true;
          currentRateLimit.blockedUntil = blockUntil;
          await currentRateLimit.save();
        }
      }

      // 7. Verificar si está cerca del límite (warning)
      const warningThreshold = rateLimitConfig.warningThreshold;
      const warningLimit = Math.floor((limit * warningThreshold) / 100);
      const isNearLimit = current >= warningLimit && !isBlocked;

      const rateLimitStatus: RateLimitStatus = {
        current,
        limit,
        remaining,
        resetTime,
        isBlocked,
        warningThreshold,
        isNearLimit,
      };

      this.logger.debug(
        `✅ Rate limit status para usuario ${user.email} (${user.role.code}): ${current}/${limit}`,
      );

      return {
        success: true,
        rateLimitStatus,
        userRole: {
          code: user.role.code,
          name: user.role.name,
        },
        config: {
          maxRequestsPerHour: rateLimitConfig.maxRequestsPerHour,
          blockDurationMinutes: rateLimitConfig.blockDurationMinutes,
          warningThreshold: rateLimitConfig.warningThreshold,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Error obteniendo rate limit status: ${error.message}`,
      );
      throw new RpcException({
        status: 400,
        success: false,
        message: 'Error al obtener el estado del rate limit',
        error: error.message,
      });
    }
  }

  /**
   * Método auxiliar para verificar si un usuario puede hacer una request
   */
  async canMakeRequest(
    user: User,
    pointsToConsume: number = 1,
  ): Promise<boolean> {
    try {
      const status = await this.getRateLimitStatus(user);

      if (!status.success) {
        return false;
      }

      const { rateLimitStatus } = status;

      // Si está bloqueado, no puede hacer requests
      if (rateLimitStatus.isBlocked) {
        return false;
      }

      // Si no tiene suficientes puntos restantes
      if (rateLimitStatus.remaining < pointsToConsume) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `❌ Error verificando si puede hacer request: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Método para limpiar rate limits expirados (puede ejecutarse periódicamente)
   */
  async cleanupExpiredRateLimits(): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Eliminar registros de rate limit de más de una hora
      const result = await this.chatRateLimitModel.deleteMany({
        windowStart: { $lt: oneHourAgo },
      });

      this.logger.debug(
        `🧹 Limpieza de rate limits: ${result.deletedCount} registros eliminados`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error en limpieza de rate limits: ${error.message}`,
      );
    }
  }

  /**
   * Método para resetear el rate limit de un usuario (uso administrativo)
   */
  async resetUserRateLimit(userId: string): Promise<boolean> {
    try {
      await this.chatRateLimitModel.deleteMany({ user: userId });
      this.logger.log(`🔄 Rate limit reseteado para usuario: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Error reseteando rate limit: ${error.message}`);
      return false;
    }
  }
}
