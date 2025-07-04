import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContextService } from './context.service';
import { CreateContextBaseDto } from './dto/create-base-context.dto';
import { CreateQuickHelpDto } from './dto/create-quick-help.dto';
import { CreateSystemGuideDto } from './dto/create-system-guide.dto';
import { CreateRoleContextDto } from './dto/create-role-context.dto';

@Controller()
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @MessagePattern('context.base.create')
  createContextBase(@Payload() data: CreateContextBaseDto) {
    return this.contextService.createContextBase(data);
  }

  @MessagePattern('context.quick-help.create')
  createQuickHelp(@Payload() data: CreateQuickHelpDto) {
    return this.contextService.createQuickHelp(data);
  }

  @MessagePattern('context.system-guide.create')
  createSystemGuide(@Payload() data: CreateSystemGuideDto) {
    return this.contextService.createSystemGuide(data);
  }
  @MessagePattern('context.role-context.create')
  createRoleContext(@Payload() data: CreateRoleContextDto) {
    return this.contextService.createRoleContext(data);
  }
}
