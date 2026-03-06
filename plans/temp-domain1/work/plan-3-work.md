# 면회 신청내역 목록 조회 — 구현 계획

---

## 1. Summary

관리자(SUPER_ADMIN, ADMIN)가 `t_visit_reserve` 테이블의 면회 신청 내역을 페이지네이션 기반으로 조회하는 API를 구현한다.
검색 조건으로 검색어(이름·연락처 LIKE), 등록기간(시작일/종료일), 신청 상태(전체/예정/취소/완료)를 지원하며,
응답에는 면회일자, 회차(visit_round INNER JOIN), 시작/종료시간, 이름, 호실, 앱 푸시 가능 여부, 연락처, 등록일, 상태명(visit_reserve_status INNER JOIN)을 포함한다.
기존 `visit` 도메인을 확장하며 신규 파일은 DTO 1개, 기존 4개 파일(interface, repository, service, controller)을 수정한다.

---

## 2. Domain Analysis

- **기존 도메인 확장**: `src/api/v1/visit/` (controller 있음)
- 신규 엔티티/테이블 없음 — 기존 `VisitReserveEntity`, `VisitRoundEntity`, `VisitReserveStatusEntity` 활용
- 기존 Symbol 토큰 `VISIT_RESERVE_REPOSITORY` 그대로 사용
- 의존 모듈: 없음 (이미 visit.module.ts에 모두 등록됨)
- `visit.module.ts` / `app.module.ts` 수정 불필요

---

## 3. File Plan

의존 순서에 따라 나열한다.

### 3-1. CREATE — DTO

**Path**: `src/api/v1/visit/dto/visit-reserve-list.dto.ts`
**Action**: CREATE
**Purpose**: 관리자용 면회 신청내역 목록 조회의 Query DTO, 단건 응답 DTO, 목록 응답 DTO를 정의한다.

**Key contents**:
- `class VisitReserveListDto extends PaginationDto`
  - 필드: `search_type?: 'ALL' | 'NAME' | 'PHONE'`, `search_keyword?: string`, `start_date?: string`, `end_date?: string`, `status?: 'ALL' | 'WAIT' | 'COMPLETE' | 'CANCEL'`
  - `constructor(data: any)` 에서 각 필드 변환 및 기본값 설정 (아래 §7 Pagination Plan 참조)
  - `@ApiProperty` + `@IsOptional()` 각 필드에 적용
- `class VisitReserveListItemDto`
  - 필드 (모두 `@ApiProperty` 필수):
    - `visit_reserve_id: string` — 면회 신청 ID
    - `date: string` — 면회일자 (YYYY-MM-DD)
    - `round: number` — 회차 (t_visit_round.round)
    - `start_time: string` — 면회 시작시간 (HH:MM)
    - `end_time: string` — 면회 종료시간 (HH:MM)
    - `name: string` — 이름
    - `room: string | null` — 입원 호수
    - `has_push_token: number` — 앱 푸시 전송가능 여부 (1: 가능, 0: 불가)
    - `phone: string` — 연락처
    - `create_at: string` — 등록일시 (yyyy-MM-dd HH:mm)
    - `visit_reserve_status_name: string` — 상태명
- `class VisitReserveListResultDto`
  - 필드: `totalCount: number`, `pagination: PaginationResultDto`, `list: VisitReserveListItemDto[]`
  - `@ApiProperty` 각 필드에 적용 (`type: [VisitReserveListItemDto]`, `type: () => PaginationResultDto`)

---

### 3-2. MODIFY — Repository Interface

**Path**: `src/api/v1/visit/interfaces/visit-reserve.repository.interface.ts`
**Action**: MODIFY
**Purpose**: 관리자용 목록 조회에 필요한 두 메서드를 인터페이스에 추가한다.

**Key contents** (기존 메서드 유지, 아래 2개 추가):
- `getVisitReserveCount(dto: VisitReserveListDto | null): Promise<number>`
  - JSDoc: dto가 null이면 전체 개수, dto가 있으면 검색조건 적용 개수
  - import: `VisitReserveListDto` from `../dto/visit-reserve-list.dto`
- `getVisitReserveList(dto: VisitReserveListDto, limit: number, offset: number): Promise<VisitReserveListItemDto[]>`
  - JSDoc: 검색조건·페이지 적용 목록 조회
  - import: `VisitReserveListItemDto` from `../dto/visit-reserve-list.dto`

---

### 3-3. MODIFY — Repository Implementation

**Path**: `src/api/v1/visit/repositories/visit-reserve.repository.ts`
**Action**: MODIFY
**Purpose**: 인터페이스에 추가된 두 메서드를 구현한다.

**Key contents** (기존 메서드 유지, 아래 2개 추가):

#### `getVisitReserveCount(dto: VisitReserveListDto | null): Promise<number>`
- `try/catch` + `throw error` 필수
- `createQueryBuilder('reserve')`
- dto가 null이면 조건 없이 `builder.getCount()` 반환 (전체 건수)
- dto가 있으면 아래 조건을 **인라인**으로 직접 작성:
  - `search_keyword`가 비어 있지 않을 때:
    - `search_type === 'NAME'`: `.andWhere('reserve.name LIKE :keyword', {keyword: \`%${dto.search_keyword}%\`})`
    - `search_type === 'PHONE'`: `.andWhere('reserve.phone LIKE :keyword', {keyword: \`%${dto.search_keyword}%\`})`
    - `search_type === 'ALL'` (기본): `.andWhere('(reserve.name LIKE :keyword OR reserve.phone LIKE :keyword)', {keyword: \`%${dto.search_keyword}%\`})`
  - `start_date`가 있을 때: `.andWhere('DATE(reserve.create_at) >= :start_date', {start_date: dto.start_date})`
  - `end_date`가 있을 때: `.andWhere('DATE(reserve.create_at) <= :end_date', {end_date: dto.end_date})`
  - `status !== 'ALL'`: `.andWhere('reserve.visit_reserve_status_id = :status', {status: dto.status})`

#### `getVisitReserveList(dto: VisitReserveListDto, limit: number, offset: number): Promise<VisitReserveListItemDto[]>`
- `try/catch` + `throw error` 필수
- `createQueryBuilder('reserve')`
- `.select([...])` 에 아래 컬럼 지정:
  - `'reserve.visit_reserve_id AS visit_reserve_id'`
  - `'reserve.date AS date'`
  - `'round.round AS round'`
  - `'reserve.start_time AS start_time'`
  - `'reserve.end_time AS end_time'`
  - `'reserve.name AS name'`
  - `'reserve.room AS room'`
  - `'IF(reserve.push_token IS NOT NULL AND reserve.push_token != \\'\\', 1, 0) AS has_push_token'`
  - `'reserve.phone AS phone'`
  - `"DATE_FORMAT(reserve.create_at, '%Y-%m-%d %H:%i') AS create_at"`
  - `'status.visit_reserve_status_name AS visit_reserve_status_name'`
- `.innerJoin('t_visit_round', 'round', 'reserve.visit_round_id = round.visit_round_id')`
- `.innerJoin('t_visit_reserve_status', 'status', 'reserve.visit_reserve_status_id = status.visit_reserve_status_id')`
- 검색조건 (getVisitReserveCount와 **동일하게** 인라인으로 작성):
  - search_keyword, search_type, start_date, end_date, status 조건 동일 적용
- `.orderBy('reserve.create_at', 'DESC')` 기본 정렬
- `.limit(limit).offset(offset)`
- `.getRawMany<VisitReserveListItemDto>()`

---

### 3-4. MODIFY — Service

**Path**: `src/api/v1/visit/visit.service.ts`
**Action**: MODIFY
**Purpose**: 관리자용 면회 신청내역 목록 조회 비즈니스 로직을 추가한다.

**Key contents** (기존 메서드 유지, 아래 추가):
- import 추가: `VisitReserveListDto`, `VisitReserveListResultDto` from `./dto/visit-reserve-list.dto`
- `async adminGetVisitReserves(dto: VisitReserveListDto): Promise<VisitReserveListResultDto>` 메서드 추가
  - JSDoc 필수
  - Pagination 4단계 패턴 적용 (§7 참조)
  - `@Transactional()` 불필요 (읽기 전용)

---

### 3-5. MODIFY — Admin Controller

**Path**: `src/api/v1/visit/visit-admin.controller.ts`
**Action**: MODIFY (또는 `plan-createVisitAdminController-work.md` 계획과 함께 CREATE)
**Purpose**: `GET /api/v1/visit/admin/reserve/list` 엔드포인트를 추가한다. 관리자 메서드는 모두 `visit-admin.controller.ts`에 위치한다.

> ⚠️ **주의**: 이 메서드는 `visit.controller.ts`가 아닌 `visit-admin.controller.ts`에 작성한다.
> `visit-admin.controller.ts`의 prefix가 `/api/v1/visit/admin`이므로,
> 메서드 라우트는 `/reserve/list`로 작성한다.

**Key contents** (`visit-admin.controller.ts`에 추가):
- import 추가: `VisitReserveListDto`, `VisitReserveListResultDto` from `./dto/visit-reserve-list.dto`
- `async adminGetVisitReserves(@Query() query: VisitReserveListDto): Promise<VisitReserveListResultDto>` 메서드 추가
  - JSDoc 필수
  - 파라미터 **한 줄** 작성
  - 컨트롤러 내부: `const dto = new VisitReserveListDto(query);` 후 `return this.service.adminGetVisitReserves(dto);`
  - Swagger 데코레이터 필수 (§5 API Endpoints 참조)

---

## 4. Entity Design

신규 엔티티 없음. 기존 엔티티를 JOIN으로만 활용한다.

| 엔티티 | 테이블 | 용도 |
|--------|--------|------|
| `VisitReserveEntity` | `t_visit_reserve` | 주 테이블 (alias: `reserve`) |
| `VisitRoundEntity` | `t_visit_round` | INNER JOIN (alias: `round`) — `round` 컬럼 조회 |
| `VisitReserveStatusEntity` | `t_visit_reserve_status` | INNER JOIN (alias: `status`) — `visit_reserve_status_name` 조회 |

---

## 5. API Endpoints

### `GET /api/v1/visit/admin/reserve/list`

| 항목 | 내용 |
|------|------|
| HTTP Method + Route | `GET /api/v1/visit/admin/reserve/list` |
| 컨트롤러 파일 | `visit-admin.controller.ts` (prefix: `/api/v1/visit/admin`, 메서드 라우트: `/reserve/list`) |
| Auth | `@UseGuards(PassportJwtAuthGuard, RolesGuard)` + `@Roles('SUPER_ADMIN', 'ADMIN')` |
| Query Params DTO | `VisitReserveListDto` |
| Response DTO | `VisitReserveListResultDto` + HTTP 200 |

**Swagger 데코레이터 순서**:
```ts
@ApiOperation({summary: '관리자용 신생아 면회 신청내역 목록 조회'})
@ApiOkResponse({type: VisitReserveListResultDto})
@ApiBadRequestResponse({type: ApiBadRequestResultDto})
@ApiUnauthorizedResponse({type: ApiFailResultDto})
@ApiForbiddenResponse({type: ApiFailResultDto})
@ApiInternalServerErrorResponse({type: ApiFailResultDto})
```

**비즈니스 로직 요약**:
- 관리자 JWT + 역할 검증
- query를 `new VisitReserveListDto(query)`로 변환하여 서비스에 전달
- 서비스 메서드명: `adminGetVisitReserves(dto)` (service에서도 admin prefix 유지)
- 서비스에서 Pagination 4단계 패턴으로 totalCount / count / pagination / list 조회
- `t_visit_round` INNER JOIN으로 회차(round), `t_visit_reserve_status` INNER JOIN으로 상태명 조회
- 기본 정렬: `create_at DESC`

---

## 6. Repository Method Plan

### `getVisitReserveCount(dto: VisitReserveListDto | null): Promise<number>`

| 항목 | 내용 |
|------|------|
| 사용 쿼리 | `createQueryBuilder` + `getCount()` |
| `loadRelationIds` | 불필요 (getRawMany 기반 아님) |
| 페이지네이션 | 해당 없음 (개수만 반환) |
| 트랜잭션 | 불필요 |
| errno 1062 | 해당 없음 |

**조건 분기 (인라인 작성)**:
- `dto === null` → 조건 없이 전체 COUNT 반환
- `dto.search_keyword` 가 비어있지 않을 때 (`dto.search_keyword.trim() !== ''`):
  - `search_type === 'NAME'` → `reserve.name LIKE :keyword`
  - `search_type === 'PHONE'` → `reserve.phone LIKE :keyword`
  - `search_type === 'ALL'` → `(reserve.name LIKE :keyword OR reserve.phone LIKE :keyword)`
  - `:keyword` 값: `%${dto.search_keyword}%`
- `dto.start_date` 있을 때 → `DATE(reserve.create_at) >= :start_date`
- `dto.end_date` 있을 때 → `DATE(reserve.create_at) <= :end_date`
- `dto.status !== 'ALL'` → `reserve.visit_reserve_status_id = :status`

---

### `getVisitReserveList(dto: VisitReserveListDto, limit: number, offset: number): Promise<VisitReserveListItemDto[]>`

| 항목 | 내용 |
|------|------|
| 사용 쿼리 | `createQueryBuilder` + `getRawMany<VisitReserveListItemDto>()` |
| `loadRelationIds` | 불필요 (`findOne`/`find` 미사용) |
| 페이지네이션 | `.limit(limit).offset(offset)` |
| 트랜잭션 | 불필요 |
| errno 1062 | 해당 없음 |

**JOIN**:
- `.innerJoin('t_visit_round', 'round', 'reserve.visit_round_id = round.visit_round_id')`
- `.innerJoin('t_visit_reserve_status', 'status', 'reserve.visit_reserve_status_id = status.visit_reserve_status_id')`

**SELECT 컬럼**:
```
reserve.visit_reserve_id AS visit_reserve_id
reserve.date AS date
round.round AS round
reserve.start_time AS start_time
reserve.end_time AS end_time
reserve.name AS name
reserve.room AS room
IF(reserve.push_token IS NOT NULL AND reserve.push_token != '', 1, 0) AS has_push_token
reserve.phone AS phone
DATE_FORMAT(reserve.create_at, '%Y-%m-%d %H:%i') AS create_at
status.visit_reserve_status_name AS visit_reserve_status_name
```

**정렬**: `.orderBy('reserve.create_at', 'DESC')`

**검색 조건**: `getVisitReserveCount`와 동일한 조건을 인라인으로 중복 작성 (private 헬퍼 분리 금지)

---

## 7. Pagination Plan

### DTO 생성자 변환 규칙 (`VisitReserveListDto.constructor(data: any)`)

```
super()  ← PaginationDto 상속이므로 호출 필수

this.search_type  = ['ALL', 'NAME', 'PHONE'].includes(data['search_type'])
                  ? data['search_type'] : 'ALL';
this.search_keyword = typeof data['search_keyword'] === 'string'
                    ? data['search_keyword'].trim() : '';
this.start_date   = typeof data['start_date'] === 'string' && data['start_date'] !== ''
                  ? data['start_date'] : undefined;
this.end_date     = typeof data['end_date'] === 'string' && data['end_date'] !== ''
                ? data['end_date'] : undefined;
this.status       = ['ALL', 'WAIT', 'COMPLETE', 'CANCEL'].includes(data['status'])
                  ? data['status'] : 'ALL';
this.page     = !isNaN(parseInt(data['page']))     ? parseInt(data['page'])     : 1;
this.size     = !isNaN(parseInt(data['size']))     ? parseInt(data['size'])     : 20;
this.pageSize = !isNaN(parseInt(data['pageSize'])) ? parseInt(data['pageSize']) : 10;
```

> `page / size / pageSize` 변환은 기존 `VisitRoundListDto` 패턴을 따르지 않고,
> `PaginationDto`를 `extends`하면 `super()`로 기본값이 설정되지 않으므로 생성자에서 직접 파싱해야 한다.
> 기존 `VisitRoundListDto` 코드 참고 시 `page/size/pageSize`가 생성자 내 명시적으로 없음 — 동일 패턴을 유지한다 (생략하면 `Pagination` 클래스 내부에서 기본값 처리).

### 서비스 4단계 처리 순서

| 단계 | 코드 | 비고 |
|------|------|------|
| 1. 전체 총 개수 | `const totalCount = await this.visitReserveRepository.getVisitReserveCount(null)` | 응답의 `totalCount` |
| 2. 검색 개수 | `const count = await this.visitReserveRepository.getVisitReserveCount(dto)` | Pagination 생성에 사용 |
| 3. Pagination 생성 | `const pagination = new Pagination({totalCount: count, page: dto.page, size: dto.size, pageSize: dto.pageSize})` | **반드시 `count`로 생성** |
| 4. 목록 조회 | `const list = await this.visitReserveRepository.getVisitReserveList(dto, pagination.limit, pagination.offset)` | — |

**반환**: `{totalCount, pagination: pagination.getPagination(), list}`

---

## 8. Error Handling Plan

### Service throws (해당 없음)
- 이 API는 단순 조회이므로 수동 `HttpException` throw 없음

### Repository errno 1062 (해당 없음)
- 읽기 전용 쿼리 — 중복키 오류 없음

### 기타 예외
- `try/catch` → `throw error` 로 그대로 재던짐 (GlobalExceptionFilter가 처리)
- `NotFoundException` / `ConflictException` 없음

> ⚠️ `ApiBadRequestResponse` 데코레이터는 달아두어야 한다 — DTO `ValidationPipe`에서 400이 발생할 수 있음

---

## 9. Shared Module Considerations

- 해당 없음. 모든 엔티티/레포지토리가 이미 `visit` 도메인 내에 있으며, `visit.module.ts`에 등록 완료 상태.
- `visit.module.ts` 수정 불필요.
- `app.module.ts` 수정 불필요.

---

## 10. Implementation Order

1. **`visit-reserve-list.dto.ts` 생성** (§3-1)
   - `VisitReserveListDto`, `VisitReserveListItemDto`, `VisitReserveListResultDto` 선언
   - import: `PaginationDto`, `PaginationResultDto` from `@root/common/dto/pagination.dto`

2. **`visit-reserve.repository.interface.ts` 수정** (§3-2)
   - `VisitReserveListDto`, `VisitReserveListItemDto` import 추가
   - `getVisitReserveCount`, `getVisitReserveList` 메서드 시그니처 + JSDoc 추가

3. **`visit-reserve.repository.ts` 수정** (§3-3)
   - `VisitReserveListDto`, `VisitReserveListItemDto` import 추가
   - `getVisitReserveCount` 구현 (인라인 조건, try/catch)
   - `getVisitReserveList` 구현 (INNER JOIN, SELECT, 인라인 조건, limit/offset, try/catch)

4. **`visit.service.ts` 수정** (§3-4)
   - `VisitReserveListDto`, `VisitReserveListResultDto` import 추가
   - `getVisitReserves(dto)` 메서드 추가 (4단계 Pagination 패턴)

5. **`visit-admin.controller.ts` 수정** (§3-5)
   - `VisitReserveListDto`, `VisitReserveListResultDto` import 추가
   - `GET /reserve/list` 핸들러 추가 (메서드명 `adminGetVisitReserves`, Swagger 데코레이터, 한 줄 파라미터, `new VisitReserveListDto(query)` 변환)
   - ⚠️ `visit.controller.ts`가 아닌 `visit-admin.controller.ts`에 작성할 것

---

## 11. Checklist

- [ ] DTO 파일 생성: `visit-reserve-list.dto.ts`
  - [ ] `VisitReserveListDto.constructor(data: any)` 에서 모든 필드 타입 변환 및 기본값 처리
  - [ ] `search_type` 기본값: `'ALL'`
  - [ ] `search_keyword` 기본값: `''`
  - [ ] `status` 기본값: `'ALL'`
  - [ ] `start_date`, `end_date` 값 없으면 `undefined`
  - [ ] `VisitReserveListItemDto` 의 모든 필드에 `@ApiProperty` 작성
  - [ ] `VisitReserveListResultDto` 의 `list` 필드: `type: [VisitReserveListItemDto]`
  - [ ] `VisitReserveListResultDto` 의 `pagination` 필드: `type: () => PaginationResultDto`
- [ ] Repository Interface 수정
  - [ ] `getVisitReserveCount(dto: VisitReserveListDto | null): Promise<number>` JSDoc 포함
  - [ ] `getVisitReserveList(dto: VisitReserveListDto, limit: number, offset: number): Promise<VisitReserveListItemDto[]>` JSDoc 포함
- [ ] Repository Implementation 수정
  - [ ] `getVisitReserveCount` — try/catch + throw error 필수
  - [ ] `getVisitReserveCount` — dto null 분기 처리 (전체 개수)
  - [ ] `getVisitReserveCount` — search_keyword, search_type, start_date, end_date, status 조건 인라인 작성
  - [ ] `getVisitReserveList` — try/catch + throw error 필수
  - [ ] `getVisitReserveList` — `innerJoin` 두 개 (t_visit_round, t_visit_reserve_status) 작성
  - [ ] `getVisitReserveList` — `has_push_token` SQL: `IF(push_token IS NOT NULL AND push_token != '', 1, 0)`
  - [ ] `getVisitReserveList` — `create_at`: `DATE_FORMAT(..., '%Y-%m-%d %H:%i')`
  - [ ] `getVisitReserveList` — 검색조건 인라인 작성 (private 헬퍼 분리 금지)
  - [ ] `getVisitReserveList` — `.limit(limit).offset(offset)` + `.orderBy('reserve.create_at', 'DESC')`
  - [ ] `getVisitReserveList` — `.getRawMany<VisitReserveListItemDto>()` 사용
- [ ] Service 수정
  - [ ] `adminGetVisitReserves` — JSDoc 작성
  - [ ] `adminGetVisitReserves` — Pagination 4단계 순서 준수 (null → dto → count로 생성 → list)
  - [ ] `adminGetVisitReserves` — `Pagination` 인스턴스명 `pagination`으로 통일
  - [ ] `adminGetVisitReserves` — 반환: `{totalCount, pagination: pagination.getPagination(), list}`
- [ ] **`visit-admin.controller.ts`** 수정 (❌ `visit.controller.ts` 아님)
  - [ ] `adminGetVisitReserves` — JSDoc 작성
  - [ ] 파라미터 한 줄 작성 (`@Query() query: VisitReserveListDto`)
  - [ ] 컨트롤러 내부에서 `new VisitReserveListDto(query)` 변환 후 서비스 전달
  - [ ] 서비스 호출: `this.service.adminGetVisitReserves(dto)`
  - [ ] 메서드 라우트: `@Get('/reserve/list')` (컨트롤러 prefix `/api/v1/visit/admin` 포함 시 전체 URL: `GET /api/v1/visit/admin/reserve/list`)
  - [ ] `@UseGuards(PassportJwtAuthGuard, RolesGuard)` + `@Roles('SUPER_ADMIN', 'ADMIN')` 적용
  - [ ] Swagger 데코레이터 순서 준수: `@ApiOperation` → `@ApiOkResponse` → `@ApiBadRequestResponse` → `@ApiUnauthorizedResponse` → `@ApiForbiddenResponse` → `@ApiInternalServerErrorResponse`
- [ ] `validationErrors` 키: service 수동 throw 없으므로 해당 없음
- [ ] Repository에 `createValidationError` 사용 금지 확인
- [ ] `loadRelationIds` 불필요 확인 (`findOne`/`find` 미사용)
- [ ] `visit.module.ts` — `VisitAdminController` 등록 여부 (`plan-createVisitAdminController-work.md` 참조)
- [ ] `app.module.ts` 수정 불필요 확인
