import { DataSource, Repository } from "typeorm";
import { UserLogin } from "../../entities/t_user_login.entity";
import { Injectable } from "@nestjs/common";

export type LoginUserDataType = {
    user_id: string;
    user_login_id: string;
    access_token: string;
    refresh_token: string;
    auth_id: string;
    login_able_yn: string;
}

@Injectable()
export class UserLoginRepository extends Repository<UserLogin> {
    constructor(private readonly dataSource: DataSource) {
        super(UserLogin, dataSource.createEntityManager());
    }

    /**
     * 로그인 정보 확인
     * 
     * @param refresh_token 
     * @returns 
     */
    async getLoginInfo(refresh_token: string): Promise<LoginUserDataType | null> {
        const builder = this.createQueryBuilder('l');
        builder.select(`
              l.user_id
            , l.user_login_id 
            , l.access_token 
            , l.refresh_token 
            , a.auth_id 
            , s.login_able_yn 
        `);
        builder.innerJoin('t_user', 'u', 'l.user_id = u.user_id and u.state_id = :state_id', {state_id: 'DONE'});
        builder.innerJoin('t_state', 's', 'u.state_id = s.state_id');
        builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
        builder.where(`l.use_yn = :use_yn`, {use_yn: 'Y'});
        builder.andWhere('l.refresh_token = :refresh_token', {refresh_token})
        builder.andWhere('now() < l.refresh_token_end_dt');
        return await builder.getRawOne<LoginUserDataType>();
    }
}