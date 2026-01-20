import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassPortJwtAuthService } from './passport.jwt.auth.service';
import { Request } from 'express';

@Injectable()
export class PassportJwtAuthStrategy extends PassportStrategy(Strategy, 'jwt-user') {
    constructor(
        private readonly service: PassPortJwtAuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET || '',
            ignoreExpiration: process.env.SERVER === 'DEV' ? true : false,
            passReqToCallback: true
        });
    }

    /**
     * 로그인 확인
     * 
     * @param req 
     * @param payload 
     * @returns 
     */
    async validate(req: Request, payload: any) {
        if (payload && 'access' === payload?.type) {
            const accessToken: string = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
            const checkAccessToken = await this.service.checkAccessToken(accessToken);

            if (checkAccessToken) {
                const user = await this.service.getLoginUser(payload?.user_id || '');
                if (user) {
                    return user;
                } else {
                    throw new UnauthorizedException();
                }
            } else {
                throw new UnauthorizedException();
            }
        } else {
            throw new UnauthorizedException();
        }
    }
}