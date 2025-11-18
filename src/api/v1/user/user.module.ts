import { USER_REPOSITORY, USER_LOGIN_REPOSITORY, ADMIN_USER_REPOSITORY } from './user.symbols';
import { Module, SetMetadata } from '@nestjs/common';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { TypeORMModule } from '@root/api/shared/typeorm/typeorm.module';
import { PassportJwtAuthModule } from '@root/guards/passport.jwt.auth/passport.jwt.auth.module';
import { AdminUserController } from './admin/admin.user.controller';
import { AdminUserService } from './admin/admin.user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/t_user.entity';
import { State } from './entities/t_state.entity';
import { Auth } from './entities/t_auth.entity';
import { UserLogin } from './entities/t_user_login.entity';
import { UserRepository } from './user/repositories/user.repository';
import { UserLoginRepository } from './user/repositories/user-login.repository';
import { AdminUserRepository } from './admin/repositories/admin.user.repository';

@SetMetadata('type', 'API')
@SetMetadata('description', '회원')
@SetMetadata('path', 'user')
@Module({
    imports: [
        TypeORMModule,
        TypeOrmModule.forFeature([User, State, Auth, UserLogin]),
        PassportJwtAuthModule
    ],
    controllers: [UserController, AdminUserController],
    providers: [
        UserService,
        AdminUserService,
        {
            provide: USER_REPOSITORY,
            useClass: UserRepository
        },
        {
            provide: USER_LOGIN_REPOSITORY,
            useClass: UserLoginRepository
        },
        {
            provide: ADMIN_USER_REPOSITORY,
            useClass: AdminUserRepository
        }
    ],
})

export class UserModule {}
