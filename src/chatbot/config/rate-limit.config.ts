export interface RateLimitConfig {
  maxRequestsPerHour: number;
  blockDurationMinutes: number;
  warningThreshold: number;
}

export const ROLE_RATE_LIMITS: Record<string, RateLimitConfig> = {
  SYS: {
    maxRequestsPerHour: 100,
    blockDurationMinutes: 15,
    warningThreshold: 80,
  },
  ADM: {
    maxRequestsPerHour: 80,
    blockDurationMinutes: 20,
    warningThreshold: 80,
  },
  JVE: {
    maxRequestsPerHour: 60,
    blockDurationMinutes: 30,
    warningThreshold: 85,
  },
  VEN: {
    maxRequestsPerHour: 40,
    blockDurationMinutes: 30,
    warningThreshold: 85,
  },
  REC: {
    maxRequestsPerHour: 50,
    blockDurationMinutes: 25,
    warningThreshold: 85,
  },
  COB: {
    maxRequestsPerHour: 30,
    blockDurationMinutes: 45,
    warningThreshold: 90,
  },
  SCO: {
    maxRequestsPerHour: 30,
    blockDurationMinutes: 45,
    warningThreshold: 90,
  },
  FAC: {
    maxRequestsPerHour: 30,
    blockDurationMinutes: 45,
    warningThreshold: 90,
  },
  DEFAULT: {
    maxRequestsPerHour: 20,
    blockDurationMinutes: 60,
    warningThreshold: 90,
  },
};

export const getRateLimitConfig = (roleCode: string): RateLimitConfig => {
  return ROLE_RATE_LIMITS[roleCode] || ROLE_RATE_LIMITS.DEFAULT;
};
