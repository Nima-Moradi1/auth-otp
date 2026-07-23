# Auth OTP — راهنمای پروژه و مسیر یادگیری

این پروژه یک API احراز هویت با NestJS است که دو مسیر ورود را تمرین می‌کند: ورود با کد یک‌بارمصرف (OTP) و ثبت‌نام/ورود با ایمیل و رمز عبور. هدف آن فقط «کار کردن endpointها» نیست؛ ساختن درک درست از جریان داده، اعتبارسنجی، نگهداری امن رمز عبور و محافظت از routeها نیز هست.

> این سند وضعیت فعلی کد را توضیح می‌دهد و در کنار آن، به‌عنوان یک mentor، مواردی را که برای رساندن پروژه به سطح production باید یاد بگیرید یا اصلاح کنید مشخص می‌کند.

## آنچه اکنون پیاده‌سازی شده است

- ایجاد کاربر و ارسال OTP با شمارهٔ موبایل
- اعتبارسنجی OTP پنج‌رقمی با زمان انقضای دو دقیقه
- ساخت access token و refresh token پس از تأیید OTP
- ثبت‌نام با نام، نام خانوادگی، موبایل، ایمیل و رمز عبور
- هش‌کردن رمز عبور با `bcrypt`
- ورود با ایمیل و رمز عبور
- اعتبارسنجی تطابق `confirm_password` با یک decorator سفارشی
- محافظت از `GET /user/profile` با JWT و برگرداندن کاربر لاگین‌شده

## پشتهٔ فنی

| ابزار | نقش در پروژه |
| --- | --- |
| NestJS | ساختار ماژولار API، controller، service و guard |
| TypeScript | type-safety و قرارداد روشن بین لایه‌ها |
| TypeORM | نگاشت entityها به جدول‌های PostgreSQL |
| PostgreSQL | ذخیرهٔ کاربران و OTPها |
| class-validator | اعتبارسنجی payload ورودی با DTO |
| bcrypt | هش و بررسی رمز عبور |
| @nestjs/jwt | امضا و اعتبارسنجی access/refresh token |

## پیش‌نیازها

- Node.js نسخهٔ LTS
- pnpm
- PostgreSQL در حال اجرا

```bash
pnpm install
pnpm start:dev
```

برنامه به‌صورت پیش‌فرض روی `http://localhost:3000` اجرا می‌شود. قبل از اجرا، دیتابیس PostgreSQL با نام `auth-otp` را بسازید یا مقادیر اتصال را در متغیرهای محیطی تنظیم کنید:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-local-password
DB_DATABASE=auth-otp
```

> نکتهٔ مهم: مقادیر fallback در فایل config برای تمرین محلی مناسب‌اند، اما secretها و password دیتابیس نباید در repository یا کد production قرار بگیرند. در گام بعدی، JWT secretها را نیز به `.env` منتقل کنید و فایل `.env` را داخل `.gitignore` بگذارید.

## نقشهٔ پروژه

```text
src/
├── main.ts                         # بوت‌استرپ Nest و ValidationPipe سراسری
├── app.module.ts                   # اتصال moduleهای اصلی
├── config/                         # تنظیمات برنامه و TypeORM
├── common/
│   ├── decorator/password.decorator.ts  # ConfirmPassword سفارشی
│   └── typeDefinitions/request.d.ts     # افزودن user به Express Request
└── modules/
    ├── auth/
    │   ├── auth.controller.ts      # routeهای /auth
    │   ├── auth.service.ts         # منطق OTP، signup، login و JWT
    │   ├── dto/                    # قرارداد و validation ورودی‌ها
    │   └── guards/auth.guard.ts    # خواندن و اعتبارسنجی Bearer token
    └── user/
        ├── entities/               # UserEntity و OtpEntity
        └── user.controller.ts      # route محافظت‌شدهٔ profile
```

مدل ذهنی مفید در NestJS این است:

```text
HTTP request → Controller → Service → Repository/Database
                   ↓
           DTO + ValidationPipe

HTTP request → Guard → Controller (فقط اگر درخواست مجاز باشد)
```

- **Controller** باید نازک بماند: ورودی را بگیرد و service را فراخوانی کند.
- **Service** محل تصمیم‌های کسب‌وکاری است: آیا کاربر وجود دارد؟ کد منقضی شده؟ رمز درست است؟
- **Repository** تنها لایهٔ دسترسی به داده است.
- **DTO** قرارداد API است؛ قبل از رسیدن داده به service، آن را validate می‌کند.

## جریان‌های احراز هویت

### ۱) ورود با OTP

```text
POST /auth/send-otp
        ↓
کاربر با mobile پیدا یا ایجاد می‌شود
        ↓
OTP ایجاد/به‌روزرسانی و تاریخ انقضا ذخیره می‌شود
        ↓
POST /auth/check-otp با mobile و code
        ↓
کد و انقضا بررسی می‌شوند
        ↓
accessToken و refreshToken صادر می‌شوند
```

در نسخهٔ فعلی کد OTP در response نمایش داده نمی‌شود و ارسال واقعی SMS نیز وجود ندارد. برای آزمایش محلی، کد را از دیتابیس بخوانید. در نسخهٔ واقعی باید آن را با سرویس پیامک ارسال کنید، نه در log یا response API.

### ۲) ثبت‌نام و ورود با رمز عبور

```text
POST /auth/signup
        ↓
DTO: فرمت ایمیل/موبایل، طول رمز و confirm_password بررسی می‌شود
        ↓
تکراری نبودن ایمیل و موبایل بررسی می‌شود
        ↓
bcrypt(password) در دیتابیس ذخیره می‌شود

POST /auth/login
        ↓
کاربر با ایمیل پیدا می‌شود
        ↓
bcrypt.compare(password, hashedPassword)
        ↓
توکن‌ها صادر می‌شوند
```

رمز عبور خام هرگز نباید ذخیره یا log شود. `hashSync` و `compareSync` در پروژه درست کار می‌کنند، اما در APIهای پرترافیک بهتر است از نسخه‌های async یعنی `hash` و `compare` استفاده شود تا event loop بلاک نشود.

## راهنمای endpointها

همهٔ bodyها از نوع JSON هستند و header زیر را داشته باشند:

```http
Content-Type: application/json
```

### ارسال OTP

```http
POST /auth/send-otp

{
  "mobile": "09123456789"
}
```

### تأیید OTP

```http
POST /auth/check-otp

{
  "mobile": "09123456789",
  "code": "12345"
}
```

در پاسخ موفق، `accessToken` و `refreshToken` دریافت می‌کنید.

### ثبت‌نام

```http
POST /auth/signup

{
  "first_name": "نیما",
  "last_name": "مرادی",
  "mobile": "09123456789",
  "email": "nima@gmail.com",
  "password": "strong-password",
  "confirm_password": "strong-password"
}
```

طبق DTO فعلی، ایمیل باید از دامنهٔ `gmail.com` باشد و رمز عبور بین ۶ تا ۲۰ کاراکتر باشد.

### ورود

```http
POST /auth/login

{
  "email": "nima@gmail.com",
  "password": "strong-password"
}
```

### پروفایل کاربر فعلی

```http
GET /user/profile
Authorization: Bearer <accessToken>
```

`AuthGuard` توکن را از header استخراج می‌کند، آن را با access-token secret verify می‌کند، کاربر را از دیتابیس می‌خواند و سپس آن را در `request.user` قرار می‌دهد. به همین دلیل controller لازم نیست دوباره کاربر را از token استخراج کند.

> ترتیب routeها مهم است. route ثابت مانند `@Get('/profile')` باید پیش از route داینامیک مانند `@Get(':id')` تعریف شود؛ وگرنه Nest ممکن است واژهٔ `profile` را به‌عنوان `id` بخواند و تبدیل `+'profile'` به `NaN` می‌شود.

## DTO و decorator تطبیق رمز

در `SignupDto` این بخش مسئول بررسی یکسان بودن دو رمز است:

```ts
@ConfirmPassword('password')
confirm_password: string;
```

Decorator سفارشی نام property مرجع را در `constraints` نگه می‌دارد. validator سپس مقدار `password` را از همان object می‌گیرد و با مقدار `confirm_password` مقایسه می‌کند. نکتهٔ کلیدی این است که باید از `object.constructor` استفاده شود؛ typo در نام `constructor` باعث می‌شود Nest هنگام ثبت decorator خطای runtime بدهد.

همچنین هر decorator اعتبارسنجی باید با `@` نوشته شود:

```ts
@IsString()
first_name: string;
```

بدون `@`، TypeScript آن را یک declaration متد بدون بدنه تفسیر می‌کند و خطای «Function implementation is missing» می‌دهد.

## چک‌لیست تست با Postman

1. یک signup معتبر بفرستید و پاسخ موفق را ببینید.
2. همان email یا mobile را دوباره بفرستید و پاسخ `409 Conflict` را بررسی کنید.
3. برای `confirm_password` مقدار متفاوت بفرستید و خطای validation را ببینید.
4. با رمز نادرست به `/auth/login` درخواست بدهید و انتظار `401 Unauthorized` داشته باشید.
5. با login یا OTP موفق، `accessToken` را کپی کنید.
6. به `/user/profile` بدون header درخواست بدهید؛ باید `401` بگیرید.
7. همان درخواست را با `Authorization: Bearer <accessToken>` تکرار کنید؛ باید اطلاعات کاربر فعلی را ببینید.
8. بعد از انقضای OTP، `/auth/check-otp` باید آن را رد کند.

## نکات mentor برای ادامهٔ پروژه

این‌ها ایراد گرفتن برای ایراد گرفتن نیستند؛ هرکدام یک گام واقعی برای حرفه‌ای‌تر شدن پروژه است.

### اولویت بالا: امنیت و داده

- **Secretها را از کد خارج کنید.** access/refresh secret و password دیتابیس باید تنها از environment خوانده شوند و secretهای فعلی را rotate کنید.
- **`synchronize: true` را در production خاموش کنید.** از migrationهای TypeORM استفاده کنید تا schema دیتابیس قابل‌پیش‌بینی باشد.
- **OTP را هش کنید.** ذخیرهٔ مستقیم کد در دیتابیس، در صورت نشت داده خطرناک است. کد ارسالی را hash و هنگام تأیید compare کنید.
- **محدودسازی درخواست اضافه کنید.** endpoint ارسال و بررسی OTP باید rate limit و سقف تعداد تلاش داشته باشد تا brute force نشود.
- **کاربر را مستقیم برنگردانید.** `GET /user/profile` در وضعیت فعلی ممکن است فیلدهایی مثل `password` را نیز expose کند. یک `ProfileResponseDto` بسازید و فقط فیلدهای امن را برگردانید.
- **refresh token را طراحی کنید.** endpoint refresh، چرخش token (rotation)، ابطال token در logout و ذخیرهٔ امن آن را اضافه کنید.

### کیفیت کد و تجربهٔ توسعه

- `ValidationPipe` را با `whitelist: true` و `forbidNonWhitelisted: true` تنظیم کنید تا فیلدهای ناشناخته وارد service نشوند.
- DTOهای response را از DTOهای input جدا نگه دارید؛ entity دیتابیس، قرارداد عمومی API نیست.
- برای `signup`، `login`، OTP منقضی، token نامعتبر و `profile` test خودکار بنویسید.
- برای email و mobile در دیتابیس unique constraint بگذارید؛ check در service به‌تنهایی جلوی race condition را نمی‌گیرد.
- ارسال SMS را پشت یک interface مثل `SmsService` قرار دهید تا بتوانید provider را بدون تغییر AuthService عوض کنید.

## مسیر پیشنهادی یادگیری

1. ابتدا flow فعلی را با Postman کامل تست کنید و برای هر response ناموفق دلیلش را بفهمید.
2. برای endpointهای auth تست e2e بنویسید.
3. تنظیمات و secretها را به `.env` منتقل کنید.
4. response DTO برای profile و tokenها اضافه کنید.
5. rate limiting و hash کردن OTP را پیاده‌سازی کنید.
6. refresh-token rotation و logout را اضافه کنید.
7. در نهایت migrationها، logging ساختاریافته و مستندات OpenAPI/Swagger را وارد پروژه کنید.

اگر هر مرحله را با یک commit کوچک و یک تست قابل تکرار انجام دهید، هم history گیت شما خواناتر می‌شود و هم debugging بسیار ساده‌تر خواهد شد.

## فرمان‌های کاربردی

```bash
# اجرای توسعه با watch mode
pnpm start:dev

# بررسی TypeScript بدون ساخت فایل خروجی
npx tsc --noEmit

# ساخت production
pnpm build

# اجرای تست‌ها
pnpm test
```

---

این پروژه پایهٔ خوبی برای یادگیری authentication است. نقطهٔ قوت اصلی‌اش این است که مفاهیم مهم NestJS—DTO، service، guard، repository و JWT—را کنار هم قرار داده؛ گام بعدی، سخت‌تر و امن‌تر کردن همین جریان‌هاست.
