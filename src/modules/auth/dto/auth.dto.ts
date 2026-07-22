import { IsMobilePhone, IsString, Length } from "class-validator";

export class SendOtpDto {
    @IsMobilePhone("fa-IR" , {} , {message : "شماره موبایل معتبر وارد کنید"})
    mobile : string ;

}

export class CheckOtpDto {
    @IsMobilePhone("fa-IR" , {} , {message : "شماره موبایل معتبر وارد کنید"})
    mobile : string ;
    @IsString()
    @Length(5 , 5 , {message : "کد وارد شده نامعتبر میباشد"})
    code : string ;

}