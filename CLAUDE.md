# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev            # Start with watch mode (alias for start:dev)
npm run start:dev      # Start with watch mode
npm run start:prod     # Run compiled output

# Build & Lint
npm run build          # Compile TypeScript via NestJS CLI
npm run lint           # ESLint with auto-fix — DO NOT RUN (reformats all files)
npm run format         # Prettier format      — DO NOT RUN (reformats all files)

# Tests
npm run test                        # Run all unit tests
npm run test:watch                  # Watch mode
npm run test:cov                    # Coverage report
npm run test:e2e                    # End-to-end tests
npx jest --testPathPattern=user     # Run tests matching a pattern (single file/domain)
```

## ⚠️ 주의사항

- **`npm run lint` 및 `npm run format` 절대 실행 금지** — 실행 시 프로젝트 전체 파일의 들여쓰기/줄바꿈 포맷이 변경됨
- 컴파일 오류 확인은 반드시 **`npm run build`** 만 사용할 것

## Environment Variables (.env)

Required before running:

| Variable | Description |
|---|---|
| `SERVER` | `DEV` or `PROD` |
| `SERVER_PORT` | HTTP port (default: 3000) |
| `JWT_SECRET` | JWT signing secret |
| `TYPEORM_SYNC` | `T` to auto-sync DB schema, `F` to disable |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`, `MYSQL_ID`, `MYSQL_PW` | MySQL connection |

## Architecture Overview

This is a **NestJS 11** application with TypeORM (MySQL), JWT authentication via Passport, and Swagger docs.

### Directory Layout

```
src/
├── api/v1/<domain>/          # Feature modules (versioned API)
│   ├── <domain>.module.ts    # NestJS module with @SetMetadata for Swagger grouping
│   ├── <domain>.symbols.ts   # DI injection tokens (Symbol constants)
│   ├── entities/             # TypeORM entities
│   ├── dto/                  # Request/response DTOs
│   ├── interfaces/           # Repository interface contracts
│   └── repositories/         # Repository implementations
├── common/                   # Shared code — DTO/utils only (no NestJS modules here)
│   ├── dto/                  # Shared schemas/types (global.result.dto.ts, pagination.dto.ts)
│   └── utils/                # Shared logic, one file per feature (bcrypt.ts, validation.ts, pagination.ts)
├── modules/                  # Infrastructure NestJS @Module() wiring (TypeORM, Redis, etc.)
│   └── typeorm/
├── guards/                   # Auth guards, strategies, decorators
│   ├── auth/                 # Role-based AuthGuard + @Auths() decorator
│   └── passport.jwt.auth/    # JWT Passport strategy + guard
├── exception/exception.ts    # Global exception filter (CustomErrorFilter)
├── config/typeorm.config.ts  # TypeORM connection config
└── main.ts                   # Bootstrap, Swagger setup, ValidationPipe
```

**`src/common` vs `src/modules` distinction**:
- `common/` — DTO schemas and reusable utility functions. No NestJS `@Module()` here.
- `modules/` — Infrastructure `@Module()` classes (TypeORM, Redis, Mailer, etc.).

### Naming Conventions

**Entity class names**: always use `*Entity` suffix — class name ends with `Entity`.
- `UserEntity`, `AuthEntity`, `StateEntity`
- Constraint names (PK/UK/IDX/FK) use the **short name without `Entity`** suffix: `PK_User`, `Unique_User_loginId`, `User_FK_Auth`

**DTO files**: always use `*.dto.ts` suffix.
- `pagination.dto.ts`, `global.result.dto.ts`

**Utils files**: one file per feature — do not put everything in a single `util.ts`.
- `bcrypt.ts`, `validation.ts`, `pagination.ts`

**Validation error key**: always use `validationErrors` — never any other name.
- `ValidationPipe.exceptionFactory` in `main.ts` must use this key.
- All manual throws must use this key: `{message, validationErrors}`.

**API routes**: follow `/api/v1/<domain>/...` pattern in controllers.

### New Domain Minimum File Structure

When creating a new domain `<domain>`, generate at minimum:

```
src/api/v1/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
├── <domain>.symbols.ts
├── entities/*.entity.ts
├── dto/*.dto.ts
├── interfaces/*.interface.ts   # (if needed)
└── repositories/<domain>.repository.ts
```

### Key Patterns

**Module registration for Swagger tabs**: Each domain module uses `@SetMetadata` so `main.ts` can auto-generate per-module Swagger tabs:
```ts
@SetMetadata('type', 'API')
@SetMetadata('description', '회원')
@SetMetadata('path', 'user')
@Module({...})
export class UserModule {}
```
Then register it in `app.module.ts` imports.

**Repository injection via Symbols**: Repositories are bound as providers using Symbol tokens from `<domain>.symbols.ts` and injected with `@Inject(TOKEN)`:
```ts
// symbols.ts
export const USER_REPOSITORY = Symbol('UserRepositoryInterface');

// module.ts
{ 
    provide: USER_REPOSITORY, 
    useClass: UserRepository 
}

// service.ts
@Inject(USER_REPOSITORY) private readonly repo: UserRepositoryInterface
```

**Transactions**: Use `@Transactional()` from `typeorm-transactional` on service methods. The DataSource is registered in `main.ts` via `addTransactionalDataSource`.

**Authentication**:
- `PassportJwtAuthGuard` (`@UseGuards(PassportJwtAuthGuard)`) — validates JWT access token, populates `req.user` with `PassportUserResultVo`
- `AuthGuard` + `@Auths('ADMIN')` decorator — role check on top of JWT (checks `user.auth_id`)

**Import alias**: Use `@root/` for all internal imports (maps to `src/`).
```ts
import { ValidationErrorDto } from '@root/common/dto/global.result.dto';
import { createValidationError } from '@root/common/utils/validation';
```

## TypeORM Entity Rules

### Constraint Name Standards (required for every entity)

| Type | Pattern | Example |
|------|---------|---------|
| PK | `PK_<Name>` | `PK_User`, `PK_Auth` |
| UK | `Unique_<Name>_<ColumnName>` | `Unique_User_loginId` |
| UK (composite) | `Unique_<Name>_<ColA>And<ColB>` | `Unique_User_loginIdAndstateId` |
| IDX | `Index_<Name>_<ColumnName>` | `Index_Auth_order` |
| IDX (composite) | `Index_<Name>_<ColA>And<ColB>` | `Index_User_stateIdAndcreateAt` |
| FK | `<ChildName>_FK_<ParentName>` | `User_FK_Auth`, `UserLogin_FK_User` |

> `<Name>` = 클래스명에서 `Entity` 제거한 짧은 이름 (`UserEntity` → `User`)

### Hard Rules

- **Unique must use `@Unique()` decorator** — `@Column({unique: true})` is forbidden.
- **Options on one line** — `@PrimaryColumn({...})`, `@Column({...})`, `@JoinColumn({...})` options always on a single line so `name/length/nullable/comment` are visible at a glance.
- Always specify `@Entity({name: 't_table', comment: '...'})`.

### Basic Entity Template

```ts
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({name: 't_table', comment: '(설명)'})
export class TableEntity {
    @PrimaryColumn({name: 'table_id', length: 32, comment: 'PK', primaryKeyConstraintName: 'PK_Table'})
    table_id: string;

    @Column({name: 'name', length: 30, nullable: false, comment: '이름'})
    name: string;
}
```

### Unique Constraint

```ts
@Entity({name: 't_user', comment: '회원 정보'})
@Unique('Unique_User_loginId', ['login_id'])
@Unique('Unique_User_nickname', ['nickname'])
// composite:
@Unique('Unique_User_loginIdAndstateId', ['login_id', 'state_id'])
export class UserEntity {...}
```

### Index

```ts
@Index('Index_Auth_Order', ['order'])
// composite:
@Index('Index_User_stateIdAndcreateAt', ['state_id', 'create_at'])
export class AuthEntity {...}
```

### Foreign Key

Use `@ManyToOne()` + `@JoinColumn()` with explicit `foreignKeyConstraintName`. One-line style:

```ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';
import { AuthEntity } from './auth.entity';

@Entity({name: 't_user', comment: '회원 정보'})
@Unique('Unique_User_loginId', ['login_id'])
@Unique('Unique_User_nickname', ['nickname'])
export class UserEntity {
    @PrimaryColumn({name: 'user_id', length: 32, comment: '회원 ID', primaryKeyConstraintName: 'PK_User'})
    user_id: string;

    @ManyToOne(() => AuthEntity, {nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE'})
    @JoinColumn({name: 'auth_id', referencedColumnName: 'auth_id', foreignKeyConstraintName: 'User_FK_Auth'})
    auth_id: string;

    @Column({name: 'login_id', length: 30, nullable: false, comment: '로그인 ID'})
    login_id: string;
}
```

### Timestamps

Use `@BeforeInsert` / `@BeforeUpdate` — do not use TypeORM `@CreateDateColumn` / `@UpdateDateColumn`.

```ts
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';

@Entity({name: 't_user', comment: '회원 정보'})
export class UserEntity {
    @Column({name: 'create_at', type: 'timestamp', nullable: false, comment: '생성일'})
    create_at: Date;

    @Column({name: 'update_at', type: 'timestamp', nullable: false, comment: '수정일'})
    update_at: Date;

    @BeforeInsert()
    insertTimestamp() {
        const now = new Date();
        this.create_at = now;
        this.update_at = now;
    }

    @BeforeUpdate()
    updateTimestamp() {
        this.update_at = new Date();
    }
}
```

## Error Handling

- Validation errors always use the key `validationErrors` (array of `ValidationErrorDto`) — consistent across `ValidationPipe.exceptionFactory` and manual throws.
- `createValidationError(property, message)` from `@root/common/utils/validation` builds `ValidationErrorDto[]`.
- Throw: `new HttpException({message, validationErrors}, HttpStatus.BAD_REQUEST)`
- MySQL duplicate key errors (errno 1062) are caught in repositories and converted to 400 responses using the constraint name string (e.g. `'Unique_User_nickname'`).

## Adding a New Domain

1. Create `src/api/v1/<domain>/` with the standard structure above.
2. Add `@SetMetadata('type', 'API')` etc. to the module class.
3. Import the module in `src/app.module.ts`.
4. Bind repositories via Symbol tokens in the module providers.

## Checklist

- [ ] Common logic extracted to `src/common/utils/`
- [ ] Shared DTO/schema types in `src/common/dto/`
- [ ] `validationErrors` key used consistently in all throws (global pipe + manual)
- [ ] Every Entity has explicit PK / UK / IDX / FK constraint names
- [ ] Unique constraints use `@Unique()` decorator, not `@Column({unique: true})`
- [ ] FK defined with `@ManyToOne` + `@JoinColumn({foreignKeyConstraintName})`
