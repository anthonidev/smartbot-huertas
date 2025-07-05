import { User } from 'src/common/interfaces/user.interface';

export interface SendMessageDto {
  message: string;
  sessionId?: string;
}

export interface SendMessageRequest {
  user: User;
  data: SendMessageDto;
}
