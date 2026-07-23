import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { OtpEntity } from '../user/entities/otp.entity';
import { CheckOtpDto, SendOtpDto } from './dto/auth.dto';
import { randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
 constructor(
  @InjectRepository(UserEntity)
  private userRepository: Repository<UserEntity>,
  @InjectRepository(OtpEntity)
  private otpRepository: Repository<OtpEntity>,
  private jwtService : JwtService, 
  private configService : ConfigService
 ) {}

async sendOtp(otpDto : SendOtpDto) {
  const {mobile} = otpDto;
  let user = await this.userRepository.findOneBy({mobile});


  if(!user){
    user = this.userRepository.create({
      mobile,
    })
    user = await this.userRepository.save(user)
  }
  await this.createOtpForUser(user);
  return {
    message : "کد با موفقیت ارسال گردید"
  }  
}
async checkOtp(otpDto : CheckOtpDto){
  const {code,mobile} = otpDto;
  const now = new Date();
  const user = await this.userRepository.findOne({
    where : {mobile}, 
    relations : {
      otp : true
    }
  });
  if(!user || !user.otp){
    throw new UnauthorizedException("حساب کاربری شما یافت نشد ! ")
  }
  const otp = user?.otp;
  if( otp.code !== code) {
    throw new UnauthorizedException("کد وارد شده معتبر نیست !")
  }
  if(otp?.expires_in < now) {
    throw new UnauthorizedException("کد وارد شده منقضی شده است. لطفا مجدد درخواست ارسال کد را انجام دهید.")
  }
  if(!user.mobile_verify) {
    await this.userRepository.update({id:user.id}, {
      mobile_verify : true
    })
  }
  const accessToken = this.jwtService.sign({id:user.id , mobile}, {
    secret : this.configService.get("Jwt.accessTokenSecret"), 
    expiresIn : "3d"
  })
  const refreshToken = this.jwtService.sign({id:user.id , mobile}, {
    secret : this.configService.get("Jwt.refreshTokenSecret"), 
    expiresIn : "90d"
  })
    return {
      message : "شما با موفقیت وارد حساب کاربری شدید!", 
      accessToken,
      refreshToken
    }
}
async createOtpForUser(user : UserEntity) {
    const expiresIn = new Date(new Date().getTime() + 1000 * 60 * 2);
    const code = randomInt(10000,99999).toString();
    let otp = await this.otpRepository.findOneBy({userId : user.id})
      if(otp){
        if(otp.expires_in > new Date()){
          throw new BadRequestException("کد قبلا برای شما ارسال شده است")
        }
        otp.code = code ;
        otp.expires_in = expiresIn;
      } else {
        otp = this.otpRepository.create({
          code ,
          expires_in : expiresIn,
          userId : user.id
        })
      }
      otp = await this.otpRepository.save(otp);
      user.otpId = otp.id;
      await this.userRepository.save(user);
}
}
