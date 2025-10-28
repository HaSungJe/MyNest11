import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoginDto, LoginSuccessResultDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserLogin } from '@root/entities/user/t_user_login.entity';
import { SignDto } from './dto/sign.dto';
import { User } from '@root/entities/user/t_user.entity';
import { CheckLoginIdDto } from './dto/check.loginId.dto';
import { CheckNicknameDto } from './dto/check.nickname.dto';
import { ApiFailResultDto, ApiSuccessResultDto } from '@root/result.dto';
import { v4 as UUID } from 'uuid';
import * as util from '@util/util';

@Injectable()
export class UserService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly jwtService: JwtService
    ) {}

    /**
     * 로그인
     * 
     * @param dto 
     * @returns 
     */
    async login(dto: LoginDto): Promise<LoginSuccessResultDto | ApiFailResultDto> {
        type LoginData = {
            user_id: string;
            login_id: string;
            login_pw: string;
            name: string;
            nickname: string;
            auth_id: string 
            auth_name: string;
            state_id: string;
            state_name: string;
            login_able_yn: string;
        }

        // 1. 아이디/비밀번호 확인
        const builder = this.dataSource.createQueryBuilder();
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
        builder.from('t_user', 'u');
        builder.innerJoin('t_state', 's', 'u.state_id = s.state_id');
        builder.innerJoin('t_auth', 'a', 'u.auth_id = a.auth_id');
        builder.where('u.login_id = :login_id', {login_id: dto.login_id});
        const user: LoginData = await builder.getRawOne();
        if (user) {
            const match = await util.matchBcrypt(dto.login_pw, user.login_pw);
            if (!match) {
                return { statusCode: HttpStatus.UNAUTHORIZED, message: '아이디 또는 비밀번호가 잘못되었습니다.' }
            } else if (user.login_able_yn === 'N') {
                return { statusCode: HttpStatus.FORBIDDEN, message: '사용이 정지된 계정입니다. 관리자에게 문의해주세요.' }
            }
        } else {
            return { statusCode: HttpStatus.UNAUTHORIZED, message: '아이디 또는 비밀번호가 잘못되었습니다.' }
        }

        // 2-1. Refresh Token 생성
        const refreshToken = this.jwtService.sign({
            type: 'refresh',
            user_id: user.user_id,
            auth_id: user.auth_id
        }, {expiresIn: '90d'});
        const refreshTokenDecode = await this.jwtService.decode(refreshToken);
        const refreshTokenIAT = new Date(refreshTokenDecode['iat'] * 1000);
        const refreshTokenEXP = new Date(refreshTokenDecode['exp'] * 1000);

        // 2-2. Access Token 생성
        const accessToken = this.jwtService.sign({
            type: 'access',
            user_id: user.user_id,
            auth_id: user.auth_id
        }, {expiresIn: '20m'})
        const accessTokenDecode = await this.jwtService.decode(accessToken);
        const accessTokenIAT = new Date(accessTokenDecode['iat'] * 1000);
        const accessTokenEXP = new Date(accessTokenDecode['exp'] * 1000);

        // 2-3. 로그인 이력 정보 생성
        const login = new UserLogin();
        login.user_login_id = UUID().replaceAll('-', '');
        login.user_id = user.user_id;
        login.refresh_token = refreshToken;
        login.access_token = accessToken;
        login.refresh_token_start_dt = refreshTokenIAT;
        login.refresh_token_end_dt = refreshTokenEXP;
        login.access_token_start_dt = accessTokenIAT;
        login.access_token_end_dt = accessTokenEXP;
    
        // 2-2. 앱 로그인 처리
        login.ip = dto.ip;
        login.agent = dto.agent;
        login.device_type = dto.device_type;
        login.device_os = dto.device_os;
        login.device_id = dto.device_id;
        login.fcm_token = dto.fcm_token;

        // 3. 로그인
        const conn = this.dataSource.createQueryRunner();
        await conn.startTransaction();

        try {
            await conn.manager.insert(UserLogin, login);
            await conn.commitTransaction();
            return { statusCode: HttpStatus.OK, refresh_token: refreshToken, access_token: accessToken, refresh_token_end_dt: refreshTokenEXP, access_token_end_dt: accessTokenEXP }
        } catch (error) {
            await conn.rollbackTransaction();
            return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: '요청이 실패했습니다. 관리자에게 문의해주세요.' }
        } finally {
            await conn.release();
        }
    }

    /**
     * 회원가입
     * 
     * @param dto 
     * @returns 
     */
    async sign(dto: SignDto): Promise<ApiSuccessResultDto | ApiFailResultDto> {
        const conn = this.dataSource.createQueryRunner();
        await conn.startTransaction();

        try {
            const user = new User();
            user.user_id = UUID().replaceAll('-', '');
            user.login_id = dto.login_id;
            user.login_pw = await util.getBcrypt(dto.login_pw);
            user.name = dto.name;
            user.nickname = dto.nickname;
            user.auth_id = 'USER';
            user.state_id = 'DONE';
            await conn.manager.insert(User, user);

            await conn.commitTransaction();
            return { statusCode: HttpStatus.OK };
        } catch (error) {
            await conn.rollbackTransaction();
            if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_User_nickname') !== -1) {
                const validationError = util.createValidationError('nickname', '이미 사용중인 닉네임입니다.');
                return { statusCode: HttpStatus.BAD_REQUEST, message: '이미 사용중인 닉네임입니다.', validationError };
            } else if (error.errno === 1062 && error.sqlMessage.indexOf('Unique_User_loginId') !== -1) {
                const validationError = util.createValidationError('nickname', '이미 사용중인 아이디입니다.');
                return { statusCode: HttpStatus.BAD_REQUEST, message: '이미 사용중인 아이디입니다.', validationError };
            } else {
                return { statusCode: HttpStatus.BAD_REQUEST, message: '요청이 실패했습니다. 관리자에게 문의해주세요.' };
            }
        } finally {
            await conn.release();
        }
    }

    /**
     * 아이디 중복 확인
     * 
     * @param dto 
     * @returns 
     */
    async checkLoginId(dto: CheckLoginIdDto): Promise<ApiSuccessResultDto | ApiFailResultDto> {
        try {
            const builder = this.dataSource.createQueryBuilder();
            builder.from(User, 'u');
            builder.where('u.login_id = :login_id', {login_id: dto.login_id});
            const count = await builder.getCount();
            if (count === 0) {
                return { statusCode: HttpStatus.OK };
            } else {
                const validationError = util.createValidationError('nickname', '이미 사용중인 아이디입니다.');
                return { statusCode: HttpStatus.BAD_REQUEST, message: '이미 사용중인 아이디입니다.', validationError };
            }
        } catch (error) {
            return { statusCode: HttpStatus.BAD_REQUEST, message: '요청이 실패했습니다. 관리자에게 문의해주세요.' };
        }
    }

    /**
     * 닉네임 중복 확인
     * 
     * @param dto 
     * @returns 
     */
    async checkNickname(dto: CheckNicknameDto): Promise<ApiSuccessResultDto | ApiFailResultDto> {
        try {
            const builder = this.dataSource.createQueryBuilder();
            builder.from(User, 'u');
            builder.where('u.nickname = :nickname', {nickname: dto.nickname});
            const count = await builder.getCount(); 
            if (count === 0) {
                return { statusCode: HttpStatus.OK };
            } else {
                const validationError = util.createValidationError('nickname', '이미 사용중인 닉네임입니다.');
                return { statusCode: HttpStatus.BAD_REQUEST, message: '이미 사용중인 닉네임입니다.', validationError };
            } 
        } catch (error) {
            return { statusCode: HttpStatus.BAD_REQUEST, message: '요청이 실패했습니다. 관리자에게 문의해주세요.' };
        }
    }
}
