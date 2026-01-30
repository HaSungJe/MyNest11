# AI 바이브코딩 가이드

이 문서는 **구조/코드 스타일/TypeORM Entity 제약명 규칙**에 맞춰, AI가 새 기능을 만들 때 “기존 코드처럼” 생성하도록 하기 위한 가이드입니다.

## 0) 중요한 전제 (빈 프로젝트에서도 재현 가능해야 함)

`src/api/v1/` 아래에 코드가 하나도 없더라도, AI가 아래 규칙만 보고 **디렉토리/파일 뼈대 + 최소 동작 코드**를 생성할 수 있어야 합니다.

- **[원칙]** 기능을 추가할 때는 항상 아래 2가지를 함께 생성합니다.
  - **[기능 폴더]** `src/api/v1/<domain>/...` (controller/service/repository/dto/entities/module 등)
  - **[공통 폴더]** 필요 시 `src/common/dto`, `src/common/utils`에 공통 코드를 분리

- **[생성 템플릿]** 신규 도메인 `<domain>`을 만들 때 최소 생성 구조
  - `src/api/v1/<domain>/<domain>.module.ts`
  - `src/api/v1/<domain>/<domain>.controller.ts`
  - `src/api/v1/<domain>/<domain>.service.ts`
  - `src/api/v1/<domain>/repositories/<domain>.repository.ts`
  - `src/api/v1/<domain>/dto/*.dto.ts`
  - `src/api/v1/<domain>/entities/*.entity.ts`
  - (필요 시) `src/api/v1/<domain>/interfaces/*.interface.ts`, `vo/*.vo.ts`

- **[ResultDto 생성 규칙]** 전역 성공 스키마를 정의하지 않더라도 `*ResultDto`는 작성할 수 있습니다.
  - **리스트/복합 응답**은 `*ResultDto`로 감싸서 반환 형태를 명시
  - **단일 리소스**는 DTO를 그대로 반환하거나 필요 시 `Get*ResultDto`로 감싸기
  - 즉, 성공 응답은 “표준 래퍼” 없이도 **케이스별 스키마를 문서화**하는 방식으로 충분히 일관성을 만들 수 있습니다.

## 1) 디렉토리 구조 규칙

### 1.1 `src/api/*` (기능/버전 단위)
- API 기능은 `src/api/v1/<domain>/...` 아래에 둡니다.
- 도메인 폴더 안에서 일반적으로 아래가 같이 움직입니다.
  - `controller` (요청/응답)
  - `service` (비즈니스 로직)
  - `repositories` (DB 접근)
  - `dto` (요청/응답 DTO)
  - `entities` (TypeORM Entity)
  - `interfaces`, `vo` 등

### 1.2 `src/common/*` (프로젝트 공통 코드)
- 여러 도메인에서 공유하는 공통 코드는 `src/common` 아래에 둡니다.
- **DTO / Utils 분리**
  - **문서/스키마/타입**: `src/common/dto/*`
  - **재사용 로직**: `src/common/utils/*`

예시
- `src/common/dto/global.result.dto.ts` (공통 실패 응답 스키마)
- `src/common/dto/pagination.dto.ts`
- `src/common/utils/bcrypt.ts`
- `src/common/utils/pagination.ts`
- `src/common/utils/validation.ts`

### 1.3 `src/modules/*` (인프라/와이어링 Nest 모듈)
- TypeORM, Redis, Mailer, Logger 등 **전역 인프라 구성/연결 모듈**은 `src/modules`에 둡니다.
- `common`은 DTO/유틸 중심으로 유지하고, **Nest `@Module()` 성격은 `modules`로 분리**합니다.

### 1.4 `src/guards/*` (인증/인가)
- Guard/Strategy/Decorator 등 보안 관련 Nest 구성요소는 `src/guards` (또는 규모가 커지면 `src/auth/*`)에 둡니다.

### 1.5 `src/exception/*` (글로벌 예외/필터)
- 예외 필터/공통 예외 처리 로직은 `src/exception`에 둡니다.

---

## 2) 네이밍/파일명 규칙

### 2.1 DTO 파일
- `*.dto.ts` suffix 사용
- 예: `pagination.dto.ts`, `global.result.dto.ts`

### 2.2 utils 파일
- 기능 단위로 파일 분리 (하나의 `util.ts`에 몰아넣지 않음)
- 예: `bcrypt.ts`, `validation.ts`, `pagination.ts`

### 2.3 에러 응답 필드명
- validation 에러 배열 키는 `validationErrors`로 통일
  - `main.ts`의 `ValidationPipe.exceptionFactory`도 동일 키 사용
  - 커스텀 throw도 `{ message, validationErrors }` 형태로 통일

---

## 3) Import 스타일

### 3.1 alias 사용
- 프로젝트 내부 import는 `@root/...` 패턴을 선호합니다.
- 예:
  - `import { ValidationErrorDto } from '@root/common/dto/global.result.dto';`
  - `import { createValidationError } from '@root/common/utils/validation';`

### 3.2 `common`을 경유한 재사용
- 도메인 서비스/리포지토리에서 공통 로직이 필요하면 `common/utils`에서 가져옵니다.
- 문서용 타입이 필요하면 `common/dto`에서 가져옵니다.

---

## 4) TypeORM Entity 작성 규칙 (중요)

이 프로젝트 Entity는 다음 특징을 따릅니다.
- `@Entity({ name: '테이블명', comment: '설명' })`
- PK/UK/IDX/FK 제약명(Constraint Name)을 **명시적으로 지정**
- `comment`, `length`, `nullable`, `default` 등을 명시적으로 적어줌

### 4.0 제약/인덱스 명칭 표준 템플릿 (필수)

새 Entity를 만들 때는 아래 규칙을 **그대로** 적용합니다.

- **PK**: `PK_<EntityName>`
  - 예: `PK_User`, `PK_Auth`

- **UK(Unique)**: `Unique_<EntityName>_<ColumnName>`
  - 단일 컬럼 예: `Unique_User_loginId`
  - 복합 유니크 예: `Unique_User_loginId_stateId`

- **IDX(Index)**: `Index_<EntityName>_<ColumnName>`
  - 단일 컬럼 예: `Index_Auth_Order`
  - 복합 인덱스 예: `Index_User_stateId_createAt`

- **FK**: `<ChildEntityName>_FK_<ParentEntityName>`
  - 예: `User_FK_Auth`, `UserLogin_FK_User`

그리고 아래 규칙을 강제합니다.

- **Unique는 반드시 `@Unique()`로만 작성**
  - `@Column({ unique: true })` 사용 금지
- **옵션 객체는 한 줄로 작성**
  - `@PrimaryColumn({ ... })`, `@Column({ ... })`, `@JoinColumn({ ... })`
  - 이유: `name/length/nullable/comment`가 한눈에 보여야 함

### 4.1 기본 템플릿
```ts
import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * (설명) Entity
 */
@Entity({ name: 't_table', comment: '(설명)' })
export class Table {
    @PrimaryColumn({ name: 'table_id', length: 32, comment: 'PK 설명', primaryKeyConstraintName: 'PK_Table' })
    table_id: string;

    @Column({ name: 'name', length: 30, nullable: false, comment: '이름' })
    name: string;
}
```

### 4.2 Primary Key (PK) 제약명
- `@PrimaryColumn({ ..., primaryKeyConstraintName: 'PK_테이블명' })`

레포 기준 예시
- `User.user_id` → `primaryKeyConstraintName: 'PK_User'`
- `Auth.auth_id` → `primaryKeyConstraintName: 'PK_Auth'`

### 4.3 Unique 제약명 (UK)
Unique는 **반드시 `@Unique()` 데코레이터로만** 작성합니다. (`@Column({ unique: true })` 사용 금지)

#### `@Unique()` 데코레이터로 제약명 명시
```ts
import { Entity, Unique } from 'typeorm';

@Entity({ name: 't_user', comment: '회원 정보' })
@Unique('Unique_User_loginId', ['login_id'])
@Unique('Unique_User_nickname', ['nickname'])
export class User {}
```

#### 복합 Unique 예시
```ts
@Unique('Unique_User_loginIdAndstateId', ['login_id', 'state_id'])
export class User {}
```

### 4.4 Index (IDX) 이름 명시
- `@Index('Index_테이블_컬럼', ['컬럼'])`

레포 예시
```ts
@Index('Index_Auth_Order', ['order'])
export class Auth {}
```

#### 복합 Index 예시
```ts
@Index('Index_User_stateIdAndcreateAt', ['state_id', 'create_at'])
export class User {}
```

### 4.5 Foreign Key (FK) 제약명
- 관계는 `@ManyToOne()` + `@JoinColumn()`로 구성
- FK 제약명은 `foreignKeyConstraintName`로 명시

레포 기준 예시
```ts
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Auth } from './auth.entity';

@Entity({ name: 't_user', comment: '회원 정보' })
export class User {
    @ManyToOne(() => Auth, { nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auth_id', referencedColumnName: 'auth_id', foreignKeyConstraintName: 'User_FK_Auth' })
    auth_id: string;
}
```

#### FK를 포함한 “한 줄 스타일” 예시 (권장 형태)
```ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 't_user', comment: '회원 정보' })
@Unique('Unique_User_loginId', ['login_id'])
@Unique('Unique_User_nickname', ['nickname'])
export class User {
    @PrimaryColumn({ name: 'user_id', length: 32, comment: '회원 ID', primaryKeyConstraintName: 'PK_User' })
    user_id: string;

    @ManyToOne(() => Auth, { nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auth_id', referencedColumnName: 'auth_id', foreignKeyConstraintName: 'User_FK_Auth' })
    auth_id: string;

    @Column({ name: 'login_id', length: 30, nullable: false, comment: '로그인 ID' })
    login_id: string;
}
```

#### FK 제약명 추천 패턴
- `ChildTable_FK_ParentTable`
- 예: `User_FK_Auth`, `UserLogin_FK_User`

### 4.6 Timestamp 컬럼 패턴
레포에서는 `create_at`, `update_at`를 `@BeforeInsert`, `@BeforeUpdate`로 세팅합니다.

레포 예시
```ts
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';

@Entity({ name: 't_user', comment: '회원 정보' })
export class User {
    @Column({ name: 'create_at', type: 'timestamp', nullable: false, comment: '생성일' })
    create_at: Date;

    @Column({ name: 'update_at', type: 'timestamp', nullable: false, comment: '수정일' })
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

---

## 5) AI에게 요청할 때(프롬프트) 넣을 핵심 문장 예시

아래 문장을 그대로 복사해서 AI에게 요청하면, 이 레포 스타일에 맞추는 데 도움이 됩니다.

```text
- 새 코드는 이 가이드의 구조/코드스타일을 따라 작성해줘.
- 폴더는 src/api/v1/<domain> 아래에 배치하고, 공통 로직은 src/common/utils, 공통 DTO는 src/common/dto에 둬.
- validation 에러 배열 키는 validationErrors로 통일해.
- Entity는 TypeORM 데코레이터를 사용하고, PK/UK/IDX/FK 제약명(primaryKeyConstraintName, @Unique name, @Index name, foreignKeyConstraintName)을 명시해.
- Unique는 반드시 @Unique('Unique_...', ['col']) 데코레이터로만 작성하고, @Column({ unique: true })는 사용하지 마.
- @PrimaryColumn/@Column/@JoinColumn 옵션 객체는 한 줄로 작성해. (name/length/nullable/comment가 한눈에 보이도록)
```

---

## 6) 체크리스트
- [ ] 공통 로직이 `src/common/utils`로 분리되어 있는가?
- [ ] 문서용 DTO가 `src/common/dto`에 있는가?
- [ ] `validationErrors` 키가 전역/개별 throw 모두에서 일관적인가?
- [ ] Entity에 PK/UK/IDX/FK 제약명이 명시되어 있는가?
- [ ] FK는 `@ManyToOne` + `@JoinColumn(foreignKeyConstraintName)` 패턴을 따르는가?
