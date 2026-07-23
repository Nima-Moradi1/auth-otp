# Auth OTP — Project Guide and Learning Path

This project is a NestJS authentication API that practices two sign-in paths: one-time-password (OTP) authentication and email/password signup and login. Its value is not only that the endpoints work—it is a compact place to learn request validation, clean service boundaries, password handling, JWT protection, and the next steps needed for a production-grade system.

> This guide describes the current implementation and, from a mentor's perspective, calls out the most useful improvements to make next.

## What is implemented

- Creating a user and issuing an OTP for a mobile number
- Verifying a five-digit OTP with a two-minute expiry
- Creating access and refresh tokens after OTP verification
- Signup with first name, last name, mobile number, email, and password
- Password hashing with `bcrypt`
- Login with email and password
- A custom decorator to validate `confirm_password`
- A JWT-protected `GET /user/profile` endpoint that returns the authenticated user

## Technology stack

| Tool | Role in this project |
| --- | --- |
| NestJS | Modular API structure: controllers, services, modules, and guards |
| TypeScript | Type safety and clear contracts between layers |
| TypeORM | Maps entities to PostgreSQL tables |
| PostgreSQL | Stores users and OTP records |
| class-validator | Validates request payloads through DTOs |
| bcrypt | Hashes and verifies passwords |
| @nestjs/jwt | Signs and verifies access and refresh tokens |

## Prerequisites and local setup

You need a current Node.js LTS release, pnpm, and a running PostgreSQL instance.

```bash
pnpm install
pnpm start:dev
```

The application listens on `http://localhost:3000` by default. Create a PostgreSQL database named `auth-otp`, or configure the connection with environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-local-password
DB_DATABASE=auth-otp
```

> Important: the fallback credentials in the current config are acceptable only for local learning. Never commit database passwords or JWT secrets to a production repository. Move all secrets to `.env`, keep that file out of Git, and rotate any secret that was already committed.

## Project map

```text
src/
├── main.ts                         # Nest bootstrap and global ValidationPipe
├── app.module.ts                   # Wires the main modules together
├── config/                         # Application and TypeORM configuration
├── common/
│   ├── decorator/password.decorator.ts  # Custom ConfirmPassword validator
│   └── typeDefinitions/request.d.ts     # Adds user to Express Request
└── modules/
    ├── auth/
    │   ├── auth.controller.ts      # /auth routes
    │   ├── auth.service.ts         # OTP, signup, login, and JWT logic
    │   ├── dto/                    # Input contracts and validation
    │   └── guards/auth.guard.ts    # Reads and validates Bearer tokens
    └── user/
        ├── entities/               # UserEntity and OtpEntity
        └── user.controller.ts      # Protected profile route
```

The useful NestJS mental model is:

```text
HTTP request → Controller → Service → Repository/Database
                   ↓
           DTO + ValidationPipe

HTTP request → Guard → Controller (only when authorized)
```

- Keep a **controller** thin: accept input and delegate.
- Put business decisions in the **service**: does the user exist, did the code expire, is the password correct?
- Use the **repository** only for persistence concerns.
- Treat a **DTO** as the API contract; it rejects malformed input before it reaches the service.

## Authentication flows

### 1. OTP authentication

```text
POST /auth/send-otp
        ↓
Find or create the user by mobile number
        ↓
Create/update the OTP and save its expiry
        ↓
POST /auth/check-otp with mobile and code
        ↓
Validate code and expiry
        ↓
Issue accessToken and refreshToken
```

The current API does not expose the OTP in its response and does not yet send an actual SMS. For local testing, inspect the database. In a real implementation, deliver it through an SMS provider—never via API responses or application logs.

### 2. Email/password authentication

```text
POST /auth/signup
        ↓
DTO validates email/mobile format, password length, and confirmation
        ↓
Check that email and mobile are not already registered
        ↓
Hash the password with bcrypt and save the user

POST /auth/login
        ↓
Find the user by email
        ↓
Compare the supplied password to its bcrypt hash
        ↓
Issue access and refresh tokens
```

Never store or log a raw password. The current `hashSync` and `compareSync` implementation is correct functionally; for a high-traffic API, prefer the asynchronous `hash` and `compare` functions so the Node.js event loop is not blocked.

## API reference

All examples send JSON with:

```http
Content-Type: application/json
```

### Send an OTP

```http
POST /auth/send-otp

{
  "mobile": "09123456789"
}
```

### Verify an OTP

```http
POST /auth/check-otp

{
  "mobile": "09123456789",
  "code": "12345"
}
```

A successful response includes `accessToken` and `refreshToken`.

### Sign up

```http
POST /auth/signup

{
  "first_name": "Nima",
  "last_name": "Moradi",
  "mobile": "09123456789",
  "email": "nima@gmail.com",
  "password": "strong-password",
  "confirm_password": "strong-password"
}
```

The current DTO restricts email addresses to `gmail.com` and passwords to 6–20 characters.

### Log in

```http
POST /auth/login

{
  "email": "nima@gmail.com",
  "password": "strong-password"
}
```

### Read the current user's profile

```http
GET /user/profile
Authorization: Bearer <accessToken>
```

`AuthGuard` extracts the token from the header, verifies it with the access-token secret, loads the user from the database, and attaches that user to `request.user`. The controller therefore does not need to parse the token again.

> Route order matters. Put a static route such as `@Get('/profile')` before a dynamic route such as `@Get(':id')`. Otherwise Nest can interpret `profile` as an `id`, and `+'profile'` becomes `NaN`.

## DTOs and the password-confirmation decorator

`SignupDto` verifies the password confirmation through this custom decorator:

```ts
@ConfirmPassword('password')
confirm_password: string;
```

The decorator stores the related property name in `constraints`. The validator reads that property from the same object and compares it with `confirm_password`. Using `object.constructor` is essential when registering the decorator; a typo in `constructor` causes a runtime failure while Nest loads the signup DTO.

Every class-validator decorator also needs the `@` prefix:

```ts
@IsString()
first_name: string;
```

Without `@`, TypeScript interprets `IsString()` as a method declaration without an implementation and reports “Function implementation is missing.”

## Postman test checklist

1. Send a valid signup request and confirm the success response.
2. Send the same email or mobile number again and confirm `409 Conflict`.
3. Send a different `confirm_password` and confirm a validation error.
4. Call `/auth/login` with an incorrect password and expect `401 Unauthorized`.
5. Obtain an `accessToken` through login or OTP verification.
6. Call `/user/profile` without an Authorization header and expect `401`.
7. Repeat with `Authorization: Bearer <accessToken>` and confirm that the current user is returned.
8. Wait for an OTP to expire and confirm `/auth/check-otp` rejects it.

## Mentor notes: the next important improvements

These are not theoretical polish; each one makes the project materially safer or easier to maintain.

### High-priority security and data work

- **Move secrets out of source code.** Read database credentials and JWT secrets from the environment, then rotate the existing secrets.
- **Disable `synchronize: true` in production.** Use TypeORM migrations to make schema changes predictable.
- **Hash OTP values.** Storing them in plain text is risky if the database is exposed. Hash the issued code and compare during verification.
- **Add rate limits.** OTP send and verification endpoints need request limits and an attempt cap to resist brute force attacks.
- **Do not return the entity directly.** The current profile response can expose fields such as `password`. Add a `ProfileResponseDto` that returns only safe fields.
- **Design refresh-token lifecycle.** Add a refresh endpoint, token rotation, logout invalidation, and secure storage strategy.

### Code quality and developer experience

- Configure `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` so unknown fields cannot reach services.
- Separate response DTOs from input DTOs; a database entity is not a public API contract.
- Add automated tests for signup, login, expired OTP, invalid tokens, and profile access.
- Add database-level unique constraints for email and mobile. Service-level checks alone are vulnerable to race conditions.
- Hide the SMS provider behind an interface such as `SmsService`, so changing providers does not require changing `AuthService`.

## Suggested learning path

1. Exercise every current flow in Postman and understand each failure response.
2. Write e2e tests for the authentication endpoints.
3. Move configuration and secrets into `.env`.
4. Introduce response DTOs for profiles and tokens.
5. Add OTP hashing and rate limiting.
6. Implement refresh-token rotation and logout.
7. Add migrations, structured logging, and OpenAPI/Swagger documentation.

Keep each step small, tested, and committed separately. That gives you a readable Git history and makes debugging much easier.

## Useful commands

```bash
# Development mode with watch
pnpm start:dev

# Type-check without emitting build files
npx tsc --noEmit

# Production build
pnpm build

# Run tests
pnpm test
```

---

This is a strong starting point for learning authentication. Its main strength is that it brings together core NestJS concepts—DTOs, services, guards, repositories, and JWTs. The next step is to make those same flows more secure, tested, and explicit.
