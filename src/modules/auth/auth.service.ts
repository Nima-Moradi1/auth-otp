import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { OtpEntity } from '../user/entities/otp.entity';
import { SendOtpDto } from './dto/auth.dto';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
 constructor(
  @InjectRepository(UserEntity)
  private userRepository: Repository<UserEntity>,
  @InjectRepository(OtpEntity)
  private otpRepository: Repository<OtpEntity>
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
  this.createOtpForUser(user)
  return {
    message : "کد با موفقیت ارسال گردید"
  }  
}




 async createOtpForUser(user : UserEntity) {
    const expiresIn = new Date(new Date().getTime() + 1000 * 60 * 2);
    const code = randomInt(10000,99999).toString();
    let otp = await this.otpRepository.findOneBy({userId : user.id})
      if(otp){
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
