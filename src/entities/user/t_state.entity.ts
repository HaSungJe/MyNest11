import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * 상태 정보 Entity
 */
@Entity({name: 't_state', comment: '상태 정보'})
export class State {
    @PrimaryColumn({name: 'state_id', comment: '상태 ID', length: 10, primaryKeyConstraintName: 'PK_State'})
    state_id: string;

    @Column({name: 'state_name', nullable: false, comment: '상태명', length: 15})
    state_name: string;

    @Column({name: 'login_able_yn', nullable: false, default: 'Y', comment: '로그인 가능 여부(Y/N)', length: 1})
    login_able_yn: string;
}