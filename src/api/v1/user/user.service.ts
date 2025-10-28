import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserLoginDto, UserLoginFailResultDto, UserLoginSuccessResultDto } from './dto/user.login.dto';
import { JwtService } from '@nestjs/jwt';
import { v4 as UUID } from 'uuid';
import dayjs from 'dayjs';
import * as util from '@util/util';
import { UserLogin } from '@root/entities/user/t_user_login.entity';

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
    async login(dto: UserLoginDto): Promise<UserLoginSuccessResultDto | UserLoginFailResultDto> {
        type UserLoginData = {
            user_id: string;
            login_id: string;
            login_pw: string;
            name: string;
            nickname: string;
        }

        // 1. 아이디/비밀번호 확인
        const builder = this.dataSource.createQueryBuilder();
        builder.select(`
              u.user_id
            , u.login_id
            , u.login_pw
            , u.name
            , u.nickname 
        `);
        builder.from('t_user', 'u');
        builder.where('u.login_id = :login_id', {login_id: dto.login_id});
        const user: UserLoginData = await builder.getRawOne();
        if (user) {
            const match = await util.matchBcrypt(dto.login_pw, user.login_pw);
            if (!match) {
                return { statusCode: HttpStatus.UNAUTHORIZED, message: '아이디 또는 비밀번호가 잘못되었습니다.' }
            }
        } else {
            return { statusCode: HttpStatus.UNAUTHORIZED, message: '아이디 또는 비밀번호가 잘못되었습니다.' }
        }

        // 2-1. Refresh Token 생성
        const refreshToken = this.jwtService.sign({
            type: 'refresh',
            user_id: user.user_id,
            now: dayjs().format('YYYYMMDDHHmmssSSS')
        }, {expiresIn: '90d'});
        const refreshTokenDecode = await this.jwtService.decode(refreshToken);
        const refreshTokenIAT = new Date(refreshTokenDecode['iat'] * 1000);
        const refreshTokenEXP = new Date(refreshTokenDecode['exp'] * 1000);

        // 2-2. Access Token 생성
        const accessToken = this.jwtService.sign({
            type: 'access',
            user_id: user.user_id,
            now: dayjs().format('YYYYMMDDHHmmssSSS')
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
            return { statusCode: 200, refresh_token: refreshToken, access_token: accessToken, refresh_token_end_dt: refreshTokenEXP, access_token_end_dt: accessTokenEXP }
        } catch (error) {
            await conn.rollbackTransaction();
            return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: '요청이 실패했습니다. 관리자에게 문의해주세요.' }
        } finally {
            await conn.release();
        }
    }
}
