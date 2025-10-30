import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassPortJwtAuthService } from './passport.jwt.auth.service';

@Injectable()
export class PassportJwtAuthStrategy extends PassportStrategy(Strategy, 'jwt-user') {
    constructor(
        private readonly service: PassPortJwtAuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_CODE || ''
        });
    }

    /**
     * 로그인 확인
     * 
     * @param payload 
     * @returns 
     */
    async validate(payload: any) {
        if (payload) {
            const user = await this.service.getLoginUser(payload?.user_id || '');
            if (user) {
                return user;
            } else {
                throw new UnauthorizedException();
            }
        } else {
            throw new UnauthorizedException();
        }
    }
}