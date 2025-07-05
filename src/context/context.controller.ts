import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleUser } from 'src/common/interfaces/user.interface';
import { ContextService } from './context.service';
import { CreateContextBaseDto } from './dto/create-base-context.dto';
import { CreateQuickHelpDto } from './dto/create-quick-help.dto';
import { CreateRoleContextDto } from './dto/create-role-context.dto';
import { CreateSystemGuideDto } from './dto/create-system-guide.dto';
import { CreateDatabaseAccessDto } from './dto/create-database-context.dto';

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

  @MessagePattern({ cmd: 'context.database-access.create' })
  createDatabaseAccess(@Payload() data: CreateDatabaseAccessDto) {
    return this.contextService.createDatabaseAccess(data);
  }

  @MessagePattern({ cmd: 'context.quick-help.get-by-role' })
  getQuickHelp(@Payload() role: RoleUser) {
    return this.contextService.getQuickHelpForUser(role);
  }

  @MessagePattern({ cmd: 'context.guide.by-key' })
  getGuideByKey(@Payload() data: { guideKey: string; role: RoleUser }) {
    return this.contextService.getGuideByKey(data.guideKey, data.role);
  }

  @MessagePattern({ cmd: 'context.available-guides.get-by-role' })
  getAvailableGuides(@Payload() role: RoleUser) {
    return this.contextService.getAvailableGuidesForUser(role);
  }
}
