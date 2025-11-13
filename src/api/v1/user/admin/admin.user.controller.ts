import { Controller, Get, HttpException, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminUserService } from "./admin.user.service";
import { AdminUserListDto, AdminUserListResultDto } from "./dto/list.dto";
import { ApiFailResultDto } from "@root/global.result.dto";
import { PassportJwtAuthGuard } from "@root/guards/passport.jwt.auth/passport.jwt.auth.guard";
import { AuthGuard } from "@root/guards/auth/auth.guard";
import { Auths } from "@root/guards/auth/auth.decorator";

@ApiTags('회원 관리')
@Controller('api/v1/admin/user')
@ApiBearerAuth('accessToken')
export class AdminUserController {
    constructor(
        private readonly service: AdminUserService
    ) {}

    /**
     * 회원 목록
     * 
     * @param dto 
     * @returns 
     */
    @Get('/list')
    @UseGuards(PassportJwtAuthGuard, AuthGuard)
    @Auths('ADMIN, SUPER_ADMIN')
    @ApiOperation({summary: '회원 목록'})
    @ApiOkResponse({type: AdminUserListResultDto})
    @ApiInternalServerErrorResponse({type: ApiFailResultDto})
    async list(@Query() dto: AdminUserListDto): Promise<AdminUserListResultDto | ApiFailResultDto> {
        const result = await this.service.list(dto);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
        }
    }
}