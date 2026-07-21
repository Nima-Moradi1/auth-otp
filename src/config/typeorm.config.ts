import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { UserEntity } from "src/modules/user/entities/user.entity";

@Injectable()
export class TypeOrmDbConfig implements TypeOrmOptionsFactory{
    constructor(private configService : ConfigService) {}
    createTypeOrmOptions(connectionName?: string): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
        return {
            type : "postgres",
            port : this.configService.get("Db.port"),
            host : this.configService.get("Db.host"),
            username : this.configService.get("Db.username"),
            password : this.configService.get("Db.password"),
            database : this.configService.get("Db.database"),
            synchronize : true, 
            autoLoadEntities : false ,
            entities : [
                "dist/**/**/**/*.entity{.ts, .js}",
                "dist/**/**/*.entity{.ts, .js}",
            ]
        }
    }
}