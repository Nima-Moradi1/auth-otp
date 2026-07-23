import { IsEmail, IsMobilePhone, IsString, Length } from "class-validator";
import { ConfirmPassword } from "src/common/decorator/password.decorator";

export class SignupDto {
    @IsString()
    first_name : string;
    @IsString()
    last_name : string;
    @IsMobilePhone("fa-IR" , {} , {message : "شماره موبایل معتبر وارد کنید"})
    mobile : string ;
    @IsString()
    @IsEmail({host_whitelist : ["gmail.com"]} , {message : "لطفا ایمیل معتبر وارد کنید"})
    email : string;
    @IsString()
    @Length(6,20 , {message : "رمز عبور باید حداقل ۶ و حداکثر ۲۰ کاراکتر باشد"})
    password : string;
    @IsString()
    @ConfirmPassword("password")
    confirm_password : string;

}

export class LoginDto {
    @IsString()
    @IsEmail({host_whitelist : ["gmail.com"]} , {message : "لطفا ایمیل معتبر وارد کنید"})
    email : string;
    @Length(6,20 , {message : "رمز عبور وارد شده صحیح نمیباشد"})
    password : string;
}