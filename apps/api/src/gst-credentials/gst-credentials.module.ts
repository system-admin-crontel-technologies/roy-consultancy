import { Module } from '@nestjs/common';
import { GstCredentialsController } from './gst-credentials.controller.js';
import { GstCredentialsService } from './gst-credentials.service.js';

@Module({
  controllers: [GstCredentialsController],
  providers: [GstCredentialsService],
})
export class GstCredentialsModule {}
