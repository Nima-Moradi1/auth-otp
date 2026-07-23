import { registerAs } from "@nestjs/config";
export enum ConfigKeys  {
    App = "App", 
    Db = "Db", 
    Jwt = "Jwt"
}

//application config
const AppConfig = registerAs(ConfigKeys.App , () => ({port : 3000}))

// jwt config 
const JwtConfig = registerAs(ConfigKeys.Jwt , () => ({
  accessTokenSecret: "2a1194f42bd0d1e1685777d81316598ee25ee0a997c49c07a22d9f628f474e4aa3334a66ea9aff5f5b54d944759190ee3fd496ad117e43990abc793c86922787",
  refreshTokenSecret : "5dd2ad51d04311cfb4fe07b3fdff06b97bbd9eae105eb3200c5f95d6f0781bd4420817ea27082d5191b28aff07ae8d03e9a09dbe3183b53ba15137d6a787b268"
}))

//database config
const DbConfig = registerAs(ConfigKeys.Db , () => ({
  port: Number(process.env.DB_PORT ?? 5432),
  host: process.env.DB_HOST ?? 'localhost',
  username: process.env.DB_USERNAME ?? "postgres",
  password: process.env.DB_PASSWORD ?? "Wealth2025!@#$",
  database: process.env.DB_DATABASE ?? "auth-otp",
}));

export const configuration = [AppConfig, DbConfig , JwtConfig]