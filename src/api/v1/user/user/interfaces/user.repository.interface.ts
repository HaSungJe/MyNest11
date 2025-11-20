import { FindManyOptions } from "typeorm";
import { User } from "../../entities/t_user.entity";

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

export interface UserRepositoryInterface {
    /**
     * 회원 수
     * 
     * @param option 
     * @returns 
     */
    getCount(option: FindManyOptions<User>): Promise<number>;

    /**
     * 아이디로 회원정보 조회
     * 
     * @param login_id 
     */
    findUserForLoginId(login_id: string): Promise<FindUserType | null>;

    /**
     * 회원가입
     * 
     * @param dto 
     * @returns 
     */
    sign(user: User): Promise<void>;

    /**
     * 회원탈퇴
     * 
     * @param user_id
     */
    leave(user_id: string): Promise<void>;
}
