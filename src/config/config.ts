import { registerAs } from "@nestjs/config";
export enum ConfigKeys  {
    App = "App", 
    Db = "Db"
}

//application config
const AppConfig = registerAs(ConfigKeys.App , () => ({port : 3000}))

//database config

const DbConfig = registerAs(ConfigKeys.Db , () => ({
  port: Number(process.env.DB_PORT ?? 5432),
  host: process.env.DB_HOST ?? 'localhost',
  username: process.env.DB_USERNAME ?? "postgres",
  password: process.env.DB_PASSWORD ?? "Wealth2025!@#$",
  database: process.env.DB_DATABASE ?? "auth-otp",
}));

export const configuration = [AppConfig, DbConfig]