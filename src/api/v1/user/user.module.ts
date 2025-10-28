import { Module, SetMetadata } from '@nestjs/common';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { TypeORMModule } from '@root/modules/typeorm/typeorm.module';
import { PassportJwtAuthModule } from '@root/guards/passport.jwt.auth/passport.jwt.auth.module';
import { AdminUserController } from './admin/admin.user.controller';
import { AdminUserService } from './admin/admin.user.service';

@SetMetadata('type', 'API')
@SetMetadata('description', '회원')
@SetMetadata('path', 'user')
@Module({
    imports: [TypeORMModule, PassportJwtAuthModule],
    controllers: [UserController, AdminUserController],
    providers: [UserService, AdminUserService],
})

export class UserModule {}
