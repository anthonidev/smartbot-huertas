import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContextController } from './context.controller';
import { ContextService } from './context.service';
import { ContextBase, ContextBaseSchema } from './entities/context-base.entity';
import { QuickHelp, QuickHelpSchema } from './entities/quick-help.entity';
import { RoleContext, RoleContextSchema } from './entities/role-context.entity';
import { SystemGuide, SystemGuideSchema } from './entities/system-guide.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContextBase.name, schema: ContextBaseSchema },
      { name: QuickHelp.name, schema: QuickHelpSchema },
      { name: SystemGuide.name, schema: SystemGuideSchema },
      { name: RoleContext.name, schema: RoleContextSchema },
    ]),
  ],
  controllers: [ContextController],
  providers: [ContextService],
  exports: [ContextService, MongooseModule],
})
export class ContextModule {}
