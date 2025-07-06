export interface RateLimitStatus {
  current: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  isBlocked: boolean;
  warningThreshold?: number;
  isNearLimit?: boolean;
}
