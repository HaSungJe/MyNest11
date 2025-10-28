import { HttpStatus, Injectable } from "@nestjs/common";
import { Pagenation } from "@root/util/pagenation";
import { DataSource } from "typeorm";
import { AdminUserListVO } from "./vo/list.vo";
import { AdminUserListResultDto } from "./dto/list.dto";
import { ApiFailResultDto } from "@root/result.dto";

@Injectable()
export class AdminUserService {
    constructor(
        private readonly dataSource: DataSource
    ) {}

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    async list(dto: any): Promise<AdminUserListResultDto | ApiFailResultDto> {
        try {
            // 1. 총 개수
            const builder = this.dataSource.createQueryBuilder();
            builder.from('t_user', 'u');
            builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
            builder.innerJoin('t_state', 's', 'u.state_id = s.state_id');
            builder.where('1 = 1');
            const totalCount = await builder.getCount();
            
            // 2. 조건
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

            // 3. 개수
            const count = await builder.getCount();

            // 4. 페이지네이션
            const pagenation = new Pagenation({totalCount: count, ...dto});

            // 5. 목록
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
            builder.limit(pagenation.limit);
            builder.offset(pagenation.offset);
            const list: Array<AdminUserListVO> = await builder.getRawMany();

            return { statusCode: HttpStatus.OK, list, pagenation: pagenation.getPagenation() };
        } catch (error) {
            return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: '요청이 실패했습니다. 관리자에게 문의해주세요.' }
        }
    }
}