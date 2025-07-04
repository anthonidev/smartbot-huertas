import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClaudeApiService } from './claude-api.service';

@Module({
  imports: [HttpModule],
  providers: [ClaudeApiService],
  exports: [ClaudeApiService],
})
export class ClaudeApiModule {}
