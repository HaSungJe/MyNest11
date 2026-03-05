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
├── api/v1/<domain>/          # Feature modules (versioned API) — controller 있음
│   ├── <domain>.module.ts    # NestJS module with @SetMetadata for Swagger grouping
│   ├── <domain>.symbols.ts   # DI injection tokens (Symbol constants)
│   ├── entities/             # TypeORM entities
│   ├── dto/                  # Request/response DTOs
│   ├── interfaces/           # Repository interface contracts
│   └── repositories/         # Repository implementations
├── shared/                   # 여러 도메인이 공유하는 Entity/Repository — NestJS 모듈 없음
│   └── <name>/
│       ├── <name>.entity.ts
│       ├── <name>.repository.interface.ts
│       └── <name>.repository.ts
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

**디렉토리 역할 구분**:
- `api/v1/` — 외부 HTTP 요청을 받는 도메인 (controller 있음)
- `shared/` — 여러 도메인이 공유하는 비즈니스 모듈 (controller 없음, API 직접 노출 안 함)
- `modules/` — 인프라 `@Module()` (TypeORM 연결, Redis, Mailer 등)
- `common/` — DTO 스키마와 유틸 함수. NestJS `@Module()` 없음

**`src/shared/` 사용 패턴**:
- 두 개 이상의 도메인(예: `meal`, `visit`)이 같은 Entity/Repository를 사용할 때
- `shared/<name>.module.ts`에서 repository를 `exports`로 노출
- 사용하는 도메인 모듈에서 import

```ts
// shared/hospital/hospital.module.ts
@Module({
    imports: [TypeOrmModule.forFeature([HospitalEntity])],
    providers: [{provide: HOSPITAL_REPOSITORY, useClass: HospitalRepository}],
    exports: [HOSPITAL_REPOSITORY],
})
export class HospitalModule {}

// api/v1/visit/visit.module.ts — 필요한 도메인에서 import
import { HospitalModule } from '@root/shared/hospital/hospital.module';

@Module({
    imports: [..., HospitalModule],
})
export class VisitModule {}
```

### Naming Conventions

**Entity class names**: always use `*Entity` suffix — class name ends with `Entity`.
- `UserEntity`, `AuthEntity`, `StateEntity`
- Constraint names (PK/UK/IDX/FK) use the **short name without `Entity`** suffix: `PK_User`, `Unique_User_loginId`, `User_FK_Auth`

**DTO files**: always use `*.dto.ts` suffix.
- `pagination.dto.ts`, `global.result.dto.ts`

**Utils files**: 재사용 범위에 따라 위치를 구분한다.

| 범위 | 위치 | 파일명 규칙 | 예시 |
|------|------|------------|------|
| 전역 (여러 도메인에서 사용) | `src/common/utils/` | 기능 단위 파일명 | `bcrypt.ts`, `validation.ts`, `pagination.ts` |
| 도메인 내부 (해당 도메인만 사용) | `src/api/v1/<domain>/` | `<domain>.util.ts` | `visit.util.ts` |

- Service 내부에 private 헬퍼 메서드로 두지 말 것 — 같은 도메인의 다른 service/class에서 재사용할 수 없음
- 도메인 내 util은 반드시 `<domain>.util.ts` 단일 파일로 관리 (기능별로 쪼개지 않음)
- 예: 시간 변환(`toHHMM`), 슬롯 생성(`buildTimes`) → `src/api/v1/visit/visit.util.ts`

**Validation error key**: always use `validationErrors` — never any other name.
- `ValidationPipe.exceptionFactory` in `main.ts` must use this key.
- All manual throws must use this key: `{message, validationErrors}`.

**API routes**: follow `/api/v1/<domain>/...` pattern in controllers.

**Path parameter 변수명**: URL path parameter는 반드시 엔티티 컬럼명 기준 snake_case로 통일.
- 라우트 경로: `/:visit_round_id` (camelCase 금지 — `/:visitRoundId` ❌)
- 서비스 파라미터: `visit_round_id: string` (camelCase 금지 — `visitRoundId: string` ❌)
- 레포지토리/인터페이스 파라미터: 동일하게 컬럼명 그대로 사용

**`@Param()` DTO 필수**: Path parameter는 반드시 DTO 클래스로 받을 것. `@Param('key') key: string` 방식 금지.
- 파일명: `<entity>-param.dto.ts` (예: `visit-round-param.dto.ts`)
- 클래스명: `<Entity>ParamDto` (예: `VisitRoundParamDto`)
- 컨트롤러: `@Param() param: VisitRoundParamDto` → 서비스에 `param.visit_round_id` 전달

```ts
// dto/visit-round-param.dto.ts
export class VisitRoundParamDto {
    @ApiProperty({description: '면회 회차 ID', required: true, example: 'abc123'})
    @IsString({message: '면회 회차 ID는 문자열이어야합니다.'})
    @IsNotEmpty({message: '면회 회차 ID를 입력해주세요.'})
    visit_round_id: string;
}

// controller
@Delete('/visit-round/:visit_round_id')
async deleteVisitRound(@Param() param: VisitRoundParamDto): Promise<void> {
    await this.service.deleteVisitRound(param.visit_round_id);
}

// service
async deleteVisitRound(visit_round_id: string): Promise<void> { ... }

// repository interface & implementation
findById(visit_round_id: string): Promise<Entity | null>;
deleteRound(visit_round_id: string): Promise<void>;
```

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

**Schedulers**: Use `@nestjs/schedule`. Create `<domain>.scheduler.ts`, register it as a plain provider (not a Symbol token), and inject repositories normally. `ScheduleModule.forRoot()` is already imported in `app.module.ts` — do not add it again.
```ts
// visit.scheduler.ts
@Injectable()
export class VisitScheduler {
    constructor(
        @Inject(VISIT_RESERVE_REPOSITORY)
        private readonly repo: VisitReserveRepositoryInterface,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async completeExpiredReserves(): Promise<void> {
        await this.repo.completeExpiredReserves();
    }
}

// visit.module.ts — add scheduler to providers list alongside services
providers: [VisitService, VisitScheduler, ...]
```

**Authentication**:
- `PassportJwtAuthGuard` (`@UseGuards(PassportJwtAuthGuard)`) — validates JWT access token, populates `req.user` with `PassportUserResultVo`
- `AuthGuard` + `@Auths('ADMIN')` decorator — role check on top of JWT (checks `user.auth_id`)

**Import alias**: Use `@root/` for all internal imports (maps to `src/`).
```ts
import { ValidationErrorDto } from '@root/common/dto/global.result.dto';
import { createValidationError } from '@root/common/utils/validation';
```

## Repository 구현 규칙

### try/catch 필수

모든 repository 메서드는 반드시 `try/catch`로 감싸고 `throw error`로 재던질 것.

```ts
// ✅ 올바른 패턴
async findById(visit_round_id: string): Promise<VisitRoundEntity | null> {
    try {
        return this.repository.findOne({where: {visit_round_id, is_delete: 0}});
    } catch (error) {
        throw error;
    }
}

// ❌ 금지 — try/catch 없음
async findById(visit_round_id: string): Promise<VisitRoundEntity | null> {
    return this.repository.findOne({where: {visit_round_id, is_delete: 0}});
}
```

### 검색/정렬 조건은 메서드 내부에 인라인으로 작성

- `applyFilters()`, `applySort()` 같은 private 헬퍼 메서드로 분리 **금지**
- WHERE / ORDER BY 조건은 해당 repository 메서드 안에 직접 작성
- `getCount`와 `getList`는 조건이 중복되더라도 각각 인라인으로 작성

```ts
// ✅ 올바른 패턴 — 조건을 메서드 내부에 직접 작성
async getVisitRoundCount(dto: VisitRoundListDto): Promise<number> {
    try {
        const builder = this.repository.createQueryBuilder('r');
        builder.where('r.is_delete = 0');
        if (127 !== dto.weekday) {
            builder.andWhere('(1 << r.weekday) & :weekday > 0', {weekday: dto.weekday});
        }
        if ('ALL' !== dto.is_holiday_open) {
            builder.andWhere('r.is_holiday_open = :is_holiday_open', {is_holiday_open: dto.is_holiday_open});
        }
        return builder.getCount();
    } catch (error) {
        throw error;
    }
}

// ❌ 금지 — 조건을 private 메서드로 분리
private applyFilters(qb, dto) { ... }  // X
```

## Pagination 사용 패턴

### Query 파라미터는 모두 string — DTO 생성자에서 변환

`@Query()`로 받은 값은 모두 문자열(string)이다. 숫자·기본값 처리는 반드시 **DTO 생성자(`constructor`)** 에서 수행하고, 컨트롤러에서 `new XxxDto(query)`로 인스턴스를 생성해 서비스에 전달한다.

```ts
// DTO — 생성자에서 타입 변환 + 기본값 설정
export class VisitRoundListDto extends PaginationDto {
    weekday?: number;
    is_holiday_open?: string;   // 'ALL' | '0' | '1'
    is_active?: string;         // 'ALL' | '0' | '1'
    SORT_WEEKDAY?: 'ASC' | 'DESC';

    constructor(data: any) {
        super();
        if (data) {
            this.weekday = !isNaN(parseInt(data['weekday'])) ? parseInt(data['weekday']) : 127;
            this.is_holiday_open = ['ALL', '0', '1'].includes(data['is_holiday_open']) ? data['is_holiday_open'] : 'ALL';
            this.is_active = ['ALL', '0', '1'].includes(data['is_active']) ? data['is_active'] : 'ALL';
            this.SORT_WEEKDAY = data['SORT_WEEKDAY'] === 'DESC' ? 'DESC' : 'ASC';
        }
    }
}

// Controller — new Dto(query)로 반드시 인스턴스 생성 후 전달
async getVisitRoundList(@Query() query: VisitRoundListDto): Promise<VisitRoundListResultDto> {
    const dto = new VisitRoundListDto(query);
    return this.service.getVisitRoundList(dto);
}

// ❌ 금지 — @Transform / class-validator로 변환 + query를 그대로 서비스에 넘기기
async getVisitRoundList(@Query() query: VisitRoundListDto): Promise<VisitRoundListResultDto> {
    return this.service.getVisitRoundList(query);  // X
}
```

### Pagination 인스턴스 생성 및 사용 (서비스)

처리 순서는 반드시 아래 4단계로 작성한다.

| 단계 | 설명 | 비고 |
|------|------|------|
| 1. 총 개수 조회 | 검색조건 **없이** 전체 등록 수 조회 | 응답의 `totalCount` 필드로 반환 |
| 2. 검색 개수 조회 | 검색조건 **적용** 후 개수 조회 | Pagination 생성에 사용 |
| 3. Pagination 생성 | **2번 값**으로 인스턴스 생성 | 1번 값으로 생성하면 안 됨 ❌ |
| 4. 목록 조회 | limit / offset 으로 데이터 조회 | — |

개수 조회 메서드는 **하나(getXxxCount)** 만 두고, `null` 전달 여부로 용도를 구분한다. 별도 `getTotalCount` 메서드를 만들지 않는다.

```ts
// repository — dto가 null이면 전체 개수, dto가 있으면 검색 개수
async getVisitRoundCount(dto: VisitRoundListDto | null): Promise<number> {
    try {
        const builder = this.repository.createQueryBuilder('r').where('r.is_delete = 0');
        if (dto) {
            if (127 !== dto.weekday) { builder.andWhere('...'); }
            // ... 나머지 필터
        }
        return builder.getCount();
    } catch (error) { throw error; }
}

// service
// 1. 전체 총 개수 (검색조건 무시) — null 전달 → 응답의 totalCount
const totalCount = await this.repository.getVisitRoundCount(null);

// 2. 검색조건 적용 개수 — dto 전달 → Pagination 생성에 사용
const count = await this.repository.getVisitRoundCount(dto);

// 3. Pagination 인스턴스 생성 — 반드시 2번(count)으로 생성, 객체명은 'pagination'
const pagination = new Pagination({totalCount: count, page: dto.page, size: dto.size, pageSize: dto.pageSize});

// 4. 목록 조회
const entities = await this.repository.getVisitRoundList(dto, pagination.limit, pagination.offset);

// 응답 — totalCount는 1번 값, pagination은 3번 인스턴스
return {list, totalCount, pagination: pagination.getPagination()};

// ❌ 금지 — 1번(totalCount)으로 Pagination을 생성하면 전체 개수 기준으로 페이지가 계산됨
const pagination = new Pagination({totalCount, ...});  // X
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

## JSDoc Comment Rules

**Repository 메서드 (interface 및 implementation 모두)** — 모든 메서드에 반드시 JSDoc 주석을 달 것:

```ts
/**
 * 설명
 *
 * @param param1 설명
 * @param param2 설명
 * @returns 설명 (void면 생략 가능)
 */
async methodName(param1: Type, param2: Type): Promise<ReturnType> { ... }
```

**Service 메서드** — 동일하게 JSDoc 주석 필수.

**Controller 메서드** — 동일하게 JSDoc 주석 필수.

## DTO 서브타입 공유 패턴

### 객체 배열 필드 — 반드시 별도 클래스 선언

`@ApiProperty`에서 인라인 객체 타입(`{key: string}[]`)을 사용하면 Swagger에서 `["string"]`으로 잘못 표시된다. 객체 배열 필드는 반드시 **별도 클래스**를 선언하고 `type: [ClassName]`으로 지정할 것.

```ts
// ❌ 금지 — Swagger에서 ["string"]으로 표시됨
@ApiProperty({description: '시간 슬롯 목록'})
times: {start_time: string; end_time: string}[];

// ✅ 올바른 패턴 — 별도 클래스 선언 후 type 지정
export class VisitRoundTimeSlotDto {
    @ApiProperty({description: '시작 시간 (HH:MM)', example: '09:00'})
    start_time: string;

    @ApiProperty({description: '종료 시간 (HH:MM)', example: '09:30'})
    end_time: string;
}

@ApiProperty({description: '시간 슬롯 목록', type: [VisitRoundTimeSlotDto]})
times: VisitRoundTimeSlotDto[];
```

### JSON 컬럼 타입 클래스 — 엔티티 파일 상단에 선언, DTO는 거기서 import

엔티티에 `type: 'json'` 컬럼이 있고 그 타입을 클래스로 표현할 경우, **해당 엔티티 파일 상단**에 클래스를 선언한다. 이 타입을 응답 DTO에서도 사용해야 할 때는 엔티티 파일에서 import한다.

- 클래스를 엔티티 파일에 두는 이유는 "공유"가 목적이 아니라, **엔티티 자체가 해당 타입을 JSON 컬럼으로 사용**하기 때문
- DTO 파일들은 이미 선언된 위치(엔티티 파일)에서 import하면 됨

```ts
// entities/visit-round.entity.ts
// JSON 컬럼 타입이 필요하므로 엔티티 파일 상단에 선언
export class VisitRoundTimeSlotDto {
    @ApiProperty({description: '시작 시간 (HH:MM)', example: '09:00'})
    start_time: string;
    @ApiProperty({description: '종료 시간 (HH:MM)', example: '09:30'})
    end_time: string;
}

@Entity({name: 't_visit_round', ...})
export class VisitRoundEntity {
    @Column({name: 'times', type: 'json', comment: '면회 시간 슬롯 목록', nullable: false})
    times: VisitRoundTimeSlotDto[];  // ← 엔티티 컬럼 타입으로 직접 사용
}

// dto/visit-round-list.dto.ts — 이미 선언된 엔티티 파일에서 import
import { VisitRoundTimeSlotDto } from '../entities/visit-round.entity';

// dto/visit-round-by-date.dto.ts — 동일
import { VisitRoundTimeSlotDto } from '../entities/visit-round.entity';
```

## Swagger Decorators (Controller)

모든 컨트롤러 메서드에 반드시 Swagger 데코레이터를 달 것.

### 필수 데코레이터 순서

```ts
@ApiOperation({ summary: '한줄 설명' })
@ApiBody({ type: RequestDto })           // POST·PUT·PATCH 에만
@ApiOkResponse({ type: ResultDto })      // 200 반환이 있을 때
@ApiNoContentResponse()                  // void 반환 (204)
@ApiBadRequestResponse({ type: ApiBadRequestResultDto })     // 항상
@ApiUnauthorizedResponse({ type: ApiFailResultDto })         // JWT 가드 있을 때
@ApiForbiddenResponse({ type: ApiFailResultDto })            // 권한 가드 있을 때
@ApiNotFoundResponse({ type: ApiFailResultDto })             // NotFoundException 가능할 때
@ApiInternalServerErrorResponse({ type: ApiFailResultDto })  // 항상
```

### 응답 코드 기준

| 상황 | 데코레이터 |
|------|-----------|
| 데이터 반환 | `@ApiOkResponse({ type: ResultDto })` |
| void 반환 | `@ApiNoContentResponse()` |
| 유효성 오류 | `@ApiBadRequestResponse({ type: ApiBadRequestResultDto })` |
| JWT 없음 | `@ApiUnauthorizedResponse({ type: ApiFailResultDto })` |
| 권한 없음 | `@ApiForbiddenResponse({ type: ApiFailResultDto })` |
| 리소스 없음 | `@ApiNotFoundResponse({ type: ApiFailResultDto })` |
| 서버 오류 | `@ApiInternalServerErrorResponse({ type: ApiFailResultDto })` |

### import 경로

```ts
import {
    ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiForbiddenResponse,
    ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse,
    ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiBadRequestResultDto, ApiFailResultDto } from '@root/common/dto/global.result.dto';
```

## Error Handling

- Validation errors always use the key `validationErrors` (array of `ValidationErrorDto`) — consistent across `ValidationPipe.exceptionFactory` and manual throws.
- `createValidationError(property, message)` from `@root/common/utils/validation` builds `ValidationErrorDto[]`.
- MySQL duplicate key errors (errno 1062) are caught in repositories and converted to 400 responses using the constraint name string.

### Duplicate Key (errno 1062) 처리 패턴

repository의 `catch` 블록에서 `error.errno === 1062`를 확인하고, `error.sqlMessage`에서 constraint 이름을 추출하여 적절한 에러 메시지를 반환한다.

**메시지 규칙**

| Unique 종류 | 메시지 형식 | 기준 |
|------------|------------|------|
| 단일 컬럼 | `이미 사용중인 {컬럼 comment}입니다.` | 해당 컬럼의 `comment` |
| 복합 컬럼 | `이미 등록된 {테이블 comment}입니다.` | 해당 테이블의 `comment` |

```ts
// 엔티티 예시
@Entity({name: 't_user', comment: '회원'})
@Unique('Unique_User_loginId', ['login_id'])
@Unique('Unique_User_nameAndtel', ['name', 'tel'])
export class UserEntity {
    @Column({name: 'login_id', comment: '아이디'})
    login_id: string;
    // ...
}

// repository catch 블록
} catch (error) {
    if (error.errno === 1062) {
        const match = error.sqlMessage?.match(/for key '(.+?)'/);
        const keyName = match ? match[1] : '';

        // 단일 컬럼 Unique → "이미 사용중인 {컬럼 comment}입니다."
        if (keyName === 'Unique_User_loginId') {
            const message = '이미 사용중인 아이디입니다.';
            throw new HttpException({message, validationErrors: createValidationError('login_id', message)}, HttpStatus.BAD_REQUEST);
        }

        // 복합 컬럼 Unique → "이미 등록된 {테이블 comment}입니다."
        if (keyName === 'Unique_User_nameAndtel') {
            const message = '이미 등록된 회원입니다.';
            throw new HttpException({message, validationErrors: createValidationError('name', message)}, HttpStatus.BAD_REQUEST);
        }
    }
    throw error;
}
```

- constraint 이름은 `error.sqlMessage`에서 `/for key '(.+?)'/` 정규식으로 추출
- `validationErrors`의 property는 복합 Unique의 경우 첫 번째 컬럼명 사용
- 매핑되지 않은 Unique 오류는 그대로 `throw error`로 재던짐

### throw 패턴 — 반드시 1줄로 작성

메시지 문자열이 `message`와 `createValidationError` 양쪽에서 중복되므로, **반드시 `const message`로 먼저 선언**한 뒤 한 줄로 throw 할 것.

```ts
// ✅ 올바른 패턴
const message = '운영 요일을 선택해주세요.';
throw new HttpException({message, validationErrors: createValidationError('weekdays', message)}, HttpStatus.BAD_REQUEST);

// ❌ 금지 — 문자열 중복 + 멀티라인
throw new HttpException(
    {message: '운영 요일을 선택해주세요.', validationErrors: createValidationError('weekdays', '운영 요일을 선택해주세요.')},
    HttpStatus.BAD_REQUEST,
);
```

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
- [ ] Path parameter는 `@Param() param: XxxParamDto` 방식으로 수신 (`@Param('key')` 금지)
- [ ] Path parameter 변수명은 엔티티 컬럼명 snake_case 기준으로 전 레이어 통일
- [ ] Controller → Service → Repository 파라미터명 모두 동일한 snake_case 컬럼명 사용
- [ ] 모든 repository 메서드는 try/catch로 감싸고 throw error로 재던짐
- [ ] Repository의 WHERE/ORDER BY 조건은 메서드 내부에 인라인 작성 (private 헬퍼 메서드 분리 금지)
- [ ] Query 파라미터는 컨트롤러에서 `new XxxDto(query)`로 인스턴스 생성 후 서비스에 전달
- [ ] Pagination 인스턴스 생성 시 객체명은 `pagination`으로 통일
