import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/**
 * 권한 정보 Entity
 */
@Entity({name: 't_auth', comment: '권한 정보'})
@Index(['order'])
export class Auth {
    @PrimaryColumn({name: 'auth_id', length: 20, comment: '권한 ID', primaryKeyConstraintName: 'PK_Auth'})
    auth_id: string;

    @Column({name: 'auth_name', unique: true, comment: '권한명', nullable: false, length: 20})
    auth_name: string;

    @Column({name: 'level', comment: '등급', nullable: false, default: 1})
    level: number;

    @Column({name: 'order', comment: '정렬값', nullable: false, default: 1})
    order: number;
}