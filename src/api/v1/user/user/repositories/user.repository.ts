import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../entities/t_user.entity';

export type FindUserType = {
    user_id: string;
    login_id: string;
    login_pw: string;
    name: string;
    nickname: string;
    auth_id: string;
    auth_name: string;
    state_id: string;
    state_name: string;
    login_able_yn: string;
};

@Injectable()
export class UserRepository extends Repository<User> {
    constructor(private readonly dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    /**
     * 아이디로 회원정보 조회
     * 
     * @param login_id 
     * @returns 
     */
    async findUserForLoginId(login_id: string): Promise<FindUserType | null> {
        const builder = this.createQueryBuilder('u');
        builder.select(`
              u.user_id 
            , u.login_id 
            , u.login_pw 
            , u.name 
            , u.nickname 
            , a.auth_id 
            , a.auth_name 
            , s.state_id 
            , s.state_name 
            , s.login_able_yn 
        `);
        builder.innerJoin('t_state', 's', 'u.state_id = s.state_id and s.state_id = :state_id', {state_id: 'DONE'});
        builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
        builder.where('u.login_id = :login_id', {login_id});
        return builder.getRawOne<FindUserType>();
    }
}
