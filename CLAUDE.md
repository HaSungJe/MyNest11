# CLAUDE.md

## ⚠️ 주의사항

`npm run` 명령은 반드시 사용자가 직접 실행 (Claude 실행 금지)


## Architecture

NestJS 11 + TypeORM (MySQL) + JWT Passport + Swagger

```
src/
├── api/v1/<domain>/   # Feature modules — controller 있음
├── shared/            # 공유 Entity/Repository — controller 없음
├── common/            # DTO/utils only (no @Module)
├── modules/           # 인프라 @Module (TypeORM, Redis 등)
├── guards/            # Auth guards, strategies
└── main.ts
```

→ 상세: [docs/architecture.md](docs/architecture.md)

## Naming Conventions

- Entity: `*Entity` suffix. Constraint: `Entity` 제거한 짧은 이름
- DTO: `*.dto.ts` / Utils: 전역 `src/common/utils/`, 도메인 `<domain>.util.ts`
- **DTO 파일 합치기**: 같은 기능(query + result 등)의 DTO는 하나의 파일에 작성 (예: `get-blood-glucose.dto.ts`)
- API route: `/api/v1/<domain>/...`
- Path param: snake_case (`visit_round_id`), 전 레이어 통일
- **`@Param()` DTO 필수** — `@Param('key')` 방식 금지
- **컨트롤러 메서드 파라미터 한 줄** — 멀티라인 금지
- **validation error key**: 항상 `validationErrors`

## Repository 핵심 규칙

- 모든 메서드 `try/catch` + `throw error` 필수
- `findOne`/`find` 시 `loadRelationIds: true` 필수 (FK 컬럼 undefined 방지)
- WHERE/ORDER BY 조건은 메서드 내부 인라인 작성 (private 헬퍼 금지)

→ 상세: [docs/repository.md](docs/repository.md)

## Pagination

- Query 파라미터: 컨트롤러에서 `new XxxDto(query)` 생성 후 전달
- 서비스 4단계: `totalCount(null)` → `count(dto)` → `Pagination(count)` → list
- Pagination 객체명은 항상 `pagination`

## Query DTO 생성자 규칙

- 생성자가 있는 Query DTO는 반드시 `constructor(data: any = {})` 형태로 선언
- `data: any` 로만 선언 시 `class-transformer`(`plainToInstance`)가 인수 없이 호출하여 런타임 에러 발생

→ 상세: [docs/repository.md](docs/repository.md)

## Entity Rules

- Unique: `@Unique()` 데코레이터 (`@Column({unique: true})` 금지)
- FK: `@ManyToOne` + `@JoinColumn({foreignKeyConstraintName})` 필수
- Timestamp: `@BeforeInsert`/`@BeforeUpdate` (`@CreateDateColumn` 금지)
- 컬럼 옵션 한 줄, `@Entity({name, comment})` 필수

→ 상세: [docs/entity.md](docs/entity.md)

## Error Handling

- Service throw: `const message = '...'; throw new HttpException({message, validationErrors: createValidationError(...)}, ...)`
- Repository throw (errno 1062): `{message}` 만, `validationErrors` 금지
- errno 1062 확인: `error.errno === 1062 && error.sqlMessage.indexOf('constraint명') !== -1`

→ 상세: [docs/error-handling.md](docs/error-handling.md)

## Swagger & JSDoc

- 모든 controller/service/repository 메서드에 JSDoc 필수
- 컨트롤러 메서드에 Swagger 데코레이터 필수
- 순서: `@ApiOperation` → `@ApiBody` → `@ApiOkResponse` → `@ApiBadRequestResponse` → ... → `@ApiInternalServerErrorResponse`

→ 상세: [docs/swagger-dto.md](docs/swagger-dto.md)

## Key Patterns

- Module: `@SetMetadata('type','API')` + `app.module.ts` 등록
- Repository DI: Symbol token (`<domain>.symbols.ts`) + `@Inject(TOKEN)`
- Transaction: `@Transactional()` from `typeorm-transactional`
- Scheduler: `<domain>.scheduler.ts`, plain provider (Symbol 불필요), `ScheduleModule.forRoot()` 중복 등록 금지
- Auth: `PassportJwtAuthGuard` (JWT) + `AuthGuard` + `@Auths('ADMIN')` (권한)
- Import alias: `@root/` (maps to `src/`)

→ 상세: [docs/architecture.md](docs/architecture.md)

## 파일 명명 규칙 (작업 계획)

- request 파일: `plan-N-request.md` / work 파일: `plan-N-work.md`
- 구두 요청 시 work 파일만 생성 가능

## Checklist

- [ ] `validationErrors` key 일관 사용 (pipe + 수동 throw)
- [ ] Entity: PK/UK/IDX/FK constraint 명시, `@Unique()` 데코레이터 사용
- [ ] FK: `@ManyToOne` + `@JoinColumn({foreignKeyConstraintName})`
- [ ] Path param: `@Param() param: XxxParamDto`, snake_case 전 레이어 통일
- [ ] Repository: try/catch, `loadRelationIds: true`, 인라인 조건
- [ ] Query: `new XxxDto(query)` 인스턴스 생성, `pagination` 객체명 통일, 생성자는 `constructor(data: any = {})` 형태
- [ ] Controller 파라미터 한 줄, JSDoc + Swagger 데코레이터 완비
