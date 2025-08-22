import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';

// Feature modules
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './features/auth/auth.module';
import { TtsModule } from './features/tts/tts.module';
import { ChatModule } from './features/chat/chat.module';
import { KnowledgeBaseModule } from './features/knowledge-base/knowledge-base.module';
import { FilesModule } from './features/files/files.module';
import { ReadmeSearchModule } from './features/readme-search/readme-search.module';
import { CustomerDictModule } from './features/customer-dict/customer-dict.module';
import { RequirementsModule } from './features/requirements/requirements.module';
import { SuggestionsModule } from './features/suggestions/suggestions.module';
import { BugsModule } from './features/bugs/bugs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    AuthModule,
    TtsModule,
    ChatModule,
    KnowledgeBaseModule,
    FilesModule,
    ReadmeSearchModule,
    CustomerDictModule,
    RequirementsModule,
    SuggestionsModule,
    BugsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
