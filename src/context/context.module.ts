import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { envs } from 'src/config/envs';
import { NATS_SERVICE } from 'src/config/services';
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
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.NATS_SERVERS,
        },
      },
    ]),
  ],
  controllers: [ContextController],
  providers: [ContextService],
  exports: [ContextService, MongooseModule],
})
export class ContextModule {}
