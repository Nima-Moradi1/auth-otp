import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { isJWT } from "class-validator";
import { Request } from "express";
import { Observable } from "rxjs";
import { AuthService } from "../auth.service";

@Injectable()
// in nestjs, Guards typically implement from CanActive
export class AuthGuard implements CanActivate{
    constructor(
        private authService : AuthService
    ){}
    async canActivate(context: ExecutionContext) {
        const httpContext = context.switchToHttp();
        const request : Request = httpContext.getRequest<Request>();
        const {token} = await this.extractToken(request)
        request.user = await this.authService.validateToken(token);
        return true
    }
    protected async extractToken(request : Request){
        const {authorization} = request.headers;
        if(!authorization || authorization?.trim() === ""){
            throw new UnauthorizedException("لطفا ابتدا وارد حساب کاربری خود شوید");
        }
        const [bearer , token] = authorization?.split(" ");
        if(bearer.toLowerCase() !== "bearer" ||
        !token || !isJWT(token)
        )  throw new UnauthorizedException("لطفا ابتدا وارد حساب کاربری خود شوید");
        return {
            token
        }
    }
}