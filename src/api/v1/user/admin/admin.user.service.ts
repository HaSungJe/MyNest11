import type { AdminUserRepositoryInterface } from "./interfaces/admin.user.repository.interface";
import { ADMIN_USER_REPOSITORY } from "../user.symbols";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { DataSource, Not } from "typeorm";
import { AdminUserListDto, AdminUserListResultDto } from "./dto/list.dto";
import { ApiFailResultDto } from "@root/global.result.dto";

@Injectable()
export class AdminUserService {
    constructor(
        private readonly dataSource: DataSource,
        @Inject(ADMIN_USER_REPOSITORY)
        private readonly adminUserRepository: AdminUserRepositoryInterface
    ) {}

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    async list(dto: AdminUserListDto): Promise<AdminUserListResultDto | ApiFailResultDto> {
        try {
            // 1. 총 개수
            const total_count: number = await this.adminUserRepository.getCount({where: {state_id: Not('DELETE')}});

            // 2. 목록, 페이징정보
            const {list, pagination} = await this.adminUserRepository.getUserList(dto);

            return { statusCode: HttpStatus.OK, list, total_count, pagination };
        } catch (error) {
            return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: '요청이 실패했습니다. 관리자에게 문의해주세요.' }
        }
    }
}