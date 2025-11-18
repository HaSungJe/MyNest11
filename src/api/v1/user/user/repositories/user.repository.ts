import { Injectable } from '@nestjs/common';
import { FindManyOptions, Repository } from 'typeorm';
import { User } from '../../entities/t_user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindUserType, UserRepositoryInterface } from '../interfaces/user.repository.interface';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>
    ) {}

    /**
     * 회원 수
     * 
     * @param option 
     * @returns 
     */
    async getCount(option: FindManyOptions<User>): Promise<number> {
        return this.repository.count(option);
    }

    /**
     * 아이디로 회원정보 조회
     * 
     * @param login_id 
     * @returns 
     */
    async findUserForLoginId(login_id: string): Promise<FindUserType | null> {
        const builder = this.repository.createQueryBuilder('u');
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
