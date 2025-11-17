import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../entities/t_user.entity';
import { AdminUserListDto } from '../dto/list.dto';
import { AdminUserListVO } from '../vo/list.vo';
import { Pagination, PaginationResultDto } from '@root/util/pagination';

@Injectable()
export class AdminUserRepository extends Repository<User> {
    constructor(private readonly dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    async getUserList(dto: AdminUserListDto): Promise<{list: Array<AdminUserListVO>, count: number, pagination: PaginationResultDto}> {
        try {
            // 1. 개수
            const builder = this.createQueryBuilder('u');
            builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
            builder.innerJoin('t_state', 's', 'u.state_id = s.state_id');
            builder.where('s.state_id != :state_id', {state_id: 'DELETE'});
            
            if (dto.search_value) {
                if (dto.search_type === 'ID') {
                    builder.andWhere('u.user_id like :user_id', {user_id: `%${dto.search_value}%`});
                } else if (dto.search_type === 'NAME') {
                    builder.andWhere('u.name like :name', {name: `%${dto.search_value}%`});
                } else if (dto.search_type === 'NICKNAME') {
                    builder.andWhere('u.nickname like :nickname', {nickname: `%${dto.search_value}%`});
                } else {
                    builder.andWhere('(u.user_id like :user_id or u.name like :name or u.nickname like :nickname)', {
                        user_id: `%${dto.search_value}%`,
                        name: `%${dto.search_value}%`,
                        nickname: `%${dto.search_value}%`
                    });
                }
            }

            // 2. 페이징
            const pagination = new Pagination({totalCount: await builder.getCount(), ...dto});

            // 3. 목록
            builder.select(`
                  u.user_id 
                , a.auth_id 
                , a.auth_name 
                , s.state_id
                , s.state_name 
                , s.login_able_yn 
                , u.name 
                , u.nickname 
                , date_format(u.create_at, '%Y-%m-%d %H:%i') as create_at
            `);
            builder.orderBy('u.create_at', 'DESC');
            builder.limit(pagination.limit);
            builder.offset(pagination.offset);
            const list: Array<AdminUserListVO> = await builder.getRawMany<AdminUserListVO>();

            return {list, count: await builder.getCount(), pagination: pagination.getPagination()};
        } catch (error) {
            throw error;
        }
    }
}
