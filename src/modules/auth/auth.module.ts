import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { OtpEntity } from '../user/entities/otp.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports : [TypeOrmModule.forFeature([UserEntity, OtpEntity])],
  controllers: [AuthController],
  providers: [AuthService , JwtService],
  exports : [TypeOrmModule , JwtService , AuthService]
})
export class AuthModule {}
