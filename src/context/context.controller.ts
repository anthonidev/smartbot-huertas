import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContextService } from './context.service';
import { CreateContextBaseDto } from './dto/create-base-context.dto';
import { CreateQuickHelpDto } from './dto/create-quick-help.dto';
import { CreateRoleContextDto } from './dto/create-role-context.dto';
import { CreateSystemGuideDto } from './dto/create-system-guide.dto';
import { User } from 'src/common/interfaces/user.interface';

@Controller()
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @MessagePattern({ cmd: 'context.base.create' })
  createContextBase(@Payload() data: CreateContextBaseDto) {
    return this.contextService.createContextBase(data);
  }

  @MessagePattern({ cmd: 'context.quick-help.create' })
  createQuickHelp(@Payload() data: CreateQuickHelpDto) {
    return this.contextService.createQuickHelp(data);
  }

  @MessagePattern({ cmd: 'context.system-guide.create' })
  createSystemGuide(@Payload() data: CreateSystemGuideDto) {
    return this.contextService.createSystemGuide(data);
  }

  @MessagePattern({ cmd: 'context.role-context.create' })
  createRoleContext(@Payload() data: CreateRoleContextDto) {
    return this.contextService.createRoleContext(data);
  }

  @MessagePattern({ cmd: 'quick-help' })
  getQuickHelp(@Payload() data: { user: User }) {
    return this.contextService.getQuickHelpForUser(data.user);
  }

  @MessagePattern({ cmd: 'guide' })
  getGuideByKey(@Payload() data: { guideKey: string; user: User }) {
    return this.contextService.getGuideByKey(data.guideKey, data.user);
  }

  @MessagePattern({ cmd: 'available-guides' })
  getAvailableGuides(@Payload() data: { user: User }) {
    return this.contextService.getAvailableGuidesForUser(data.user);
  }
}
