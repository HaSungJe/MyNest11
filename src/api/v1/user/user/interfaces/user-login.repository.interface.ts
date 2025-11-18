export type LoginUserDataType = {
    user_id: string;
    user_login_id: string;
    access_token: string;
    refresh_token: string;
    auth_id: string;
    login_able_yn: string;
}

export interface UserLoginRepositoryInterface {
    /**
     * 로그인 정보 확인
     * 
     * @param refresh_token 
     */
    getLoginInfo(refresh_token: string): Promise<LoginUserDataType | null>;
}
