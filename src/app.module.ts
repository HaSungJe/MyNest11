import { Module } from '@nestjs/common';
import { UserModule } from './api/v1/user/user.module';
import { BoardModule } from './api/v1/board/board.module';

@Module({
    imports: [UserModule, BoardModule]
})

export class AppModule {}
