import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AUTHS_KEY } from './auth.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredAuths = this.reflector.getAllAndOverride<string[]>(AUTHS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredAuths) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (user?.jwt_guard_pass) {
            return requiredAuths.some((auth_id: string) => auth_id === user.auth_id);
        } else {
            return false;
        }
    }
}
