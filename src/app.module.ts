import { Module } from '@nestjs/common';
import { GlobalConfigsModule } from './modules/config/configs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmDbConfig } from './config/typeorm.config';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    GlobalConfigsModule, 
    TypeOrmModule.forRootAsync({
      useClass : TypeOrmDbConfig, 
      inject : [TypeOrmDbConfig],
    }), 
    UserModule
  ],
  controllers: [],
  // All Injectables should be listed in the Providers too
  providers: [
    TypeOrmDbConfig
  ],
})
export class AppModule {}
