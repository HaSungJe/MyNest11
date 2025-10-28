import { Module, SetMetadata } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';

@SetMetadata('type', 'API')
@SetMetadata('description', '게시판')
@SetMetadata('path', 'board')
@Module({
    controllers: [BoardController],
    providers: [BoardService],
})

export class BoardModule {}
