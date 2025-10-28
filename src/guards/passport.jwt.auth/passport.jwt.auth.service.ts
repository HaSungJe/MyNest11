import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { PassportUserResultDto } from "./passport.jwt.auth.dto";

@Injectable()
export class PassPortJwtAuthService {
    constructor(
        private readonly dataSource: DataSource
    ) {}

    /**
     * 로그인 정보 확인
     * 
     * @param user_id 
     * @returns 
     */
    async getLoginUser(user_id: string): Promise<PassportUserResultDto> {
        try {
            // 1. 회원 정보 조회
            const builder = this.dataSource.createQueryBuilder();
            builder.select(`
                  u.user_id 
                , u.login_id 
                , u.name 
                , u.nickname 
                , a.auth_id 
                , s.state_id 
                , s.login_able_yn 
            `);
            builder.from('t_user', 'u');
            builder.where('u.user_id = :user_id', {user_id});
            builder.innerJoin('t_state', 's', 'u.state_id = s.state_id');
            builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
            const result: PassportUserResultDto = await builder.getRawOne();
            if (result) {
                return result;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }
}