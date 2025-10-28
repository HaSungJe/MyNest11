import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { DataSource } from "typeorm";

// 로그인한 회원의 정보
export class LoginUserVO {
    @ApiProperty({description: '회원 ID', required: true})
    user_id: string;

    @ApiProperty({description: '로그인 ID', required: true})
    login_id: string;
}

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
    async getLoginUser(user_id: string): Promise<LoginUserVO> {
        try {
            // 1. 회원 정보 조회
            const builder = this.dataSource.createQueryBuilder();
            builder.select(`
                  u.user_id
                , u.login_id
            `);
            builder.from('t_user', 'u');
            builder.where('u.user_id = :user_id', {user_id});
            const result: LoginUserVO = await builder.getRawOne();

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