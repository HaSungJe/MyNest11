import { PaginationResultDto } from "@root/util/pagination";
import { AdminUserListDto } from "../dto/list.dto";
import { AdminUserListVO } from "../vo/list.vo";
import { FindManyOptions } from "typeorm";
import { User } from "../../entities/user.entity";

export interface AdminUserRepositoryInterface {
    /**
     * 회원 수
     * 
     * @param option 
     * @returns 
     */
    getCount(option: FindManyOptions<User>): Promise<number>;

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    getUserList(dto: AdminUserListDto): Promise<{list: Array<AdminUserListVO>, count: number, pagination: PaginationResultDto}>;
}
