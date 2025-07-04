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
  createContextBase(@Payload() createContextBaseDto: CreateContextBaseDto) {
    return this.contextService.createContextBase(createContextBaseDto);
  }

  @MessagePattern('context.quick-help.create')
  createQuickHelp(@Payload() createQuickHelpDto: CreateQuickHelpDto) {
    return this.contextService.createQuickHelp(createQuickHelpDto);
  }

  @MessagePattern('context.system-guide.create')
  createSystemGuide(@Payload() createSystemGuideDto: CreateSystemGuideDto) {
    return this.contextService.createSystemGuide(createSystemGuideDto);
  }
  @MessagePattern('context.role-context.create')
  createRoleContext(@Payload() createRoleContextDto: CreateRoleContextDto) {
    return this.contextService.createRoleContext(createRoleContextDto);
  }
}
