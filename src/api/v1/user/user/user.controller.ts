import { Body, Controller, Delete, Get, Headers, HttpStatus, Ip, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto, LoginResultDto } from './dto/login.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PassportJwtAuthGuard } from '@root/guards/passport.jwt.auth/passport.jwt.auth.guard';
import { PassportUserSuccessResultDto } from '@root/guards/passport.jwt.auth/passport.jwt.auth.dto';
import { SignDto } from './dto/sign.dto';
import { CheckLoginIdDto } from './dto/check.loginId.dto';
import { CheckNicknameDto } from './dto/check.nickname.dto';
import { ApiBadRequestResultDto, ApiFailResultDto } from '@root/global.result.dto';
import { RefreshDto, RefreshResultDto } from './dto/refresh.dto';

@ApiTags('회원')
@Controller('/api/v1/user')
@ApiBearerAuth('accessToken')
export class UserController {
    constructor(
        private readonly service: UserService
    ) {}

    /**
     * 로그인
     * 
     * @param dto 
     * @returns 
     */
    @Post('/login')
    @ApiOperation({summary: '로그인'})
    @ApiBody({type: LoginDto})
    @ApiOkResponse({type: LoginResultDto})
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    @ApiUnauthorizedResponse({type: ApiFailResultDto})
    @ApiForbiddenResponse({type: ApiFailResultDto})
    @ApiInternalServerErrorResponse({type: ApiFailResultDto})
    async login(@Headers('user-agent') agent: string, @Ip() ip: string, @Body() dto: LoginDto): Promise<LoginResultDto | ApiBadRequestResultDto | ApiFailResultDto> {
        dto = new LoginDto({...dto, agent, ip});
        try {
            return await this.service.login(dto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 로그인키 재발급
     * 
     * @param dto 
     * @returns 
     */
    @Post('/refresh')
    @ApiOperation({summary: '로그인키 재발급'})
    @ApiOkResponse({type: RefreshResultDto})
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    @ApiUnauthorizedResponse({type: ApiFailResultDto})
    @ApiForbiddenResponse({type: ApiFailResultDto})
    @ApiInternalServerErrorResponse({type: ApiFailResultDto})
    async refresh(@Body() dto: RefreshDto): Promise<RefreshResultDto | ApiBadRequestResultDto | ApiFailResultDto> {
        try {
            return await this.service.refresh(dto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 내 정보
     * 
     * @param req 
     * @returns 
     */
    @Get('/info')
    @ApiOperation({summary: '내 정보'})
    @UseGuards(PassportJwtAuthGuard)
    @ApiOkResponse({type: PassportUserSuccessResultDto})
    @ApiUnauthorizedResponse({type: ApiFailResultDto})
    async info(@Req() req: any): Promise<PassportUserSuccessResultDto | ApiFailResultDto> {
        return { statusCode: HttpStatus.OK, info: req.user };
    }

    /**
     * 회원가입
     * 
     * @param dto 
     * @returns 
     */
    @Put('/sign')
    @ApiOperation({summary: '회원가입'})
    @ApiNoContentResponse()
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    @ApiInternalServerErrorResponse({type: ApiFailResultDto})
    async sign(@Body() dto: SignDto): Promise<void | ApiBadRequestResultDto | ApiFailResultDto> {
        try {
            await this.service.sign(dto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 아이디 중복 확인
     * 
     * @param dto 
     * @returns 
     */
    @Post('/check/id')
    @ApiOperation({summary: '아이디 중복 확인'})
    @ApiNoContentResponse()
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    async checkLoginId(@Body() dto: CheckLoginIdDto): Promise<void | ApiBadRequestResultDto> {
        try {
            await this.service.checkLoginId(dto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 닉네임 중복 확인
     * 
     * @param dto 
     * @returns 
     */
    @Post('/check/nickname')
    @ApiOperation({summary: '닉네임 중복 확인'})
    @ApiNoContentResponse()
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    async checkNickname(@Body() dto: CheckNicknameDto): Promise<void | ApiBadRequestResultDto> {
        try {
            await this.service.checkNickname(dto);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 회원탈퇴
     * 
     * @param req 
     * @returns 
     */
    @Delete('/leave')
    @ApiOperation({summary: '회원탈퇴'})
    @UseGuards(PassportJwtAuthGuard)
    @ApiNoContentResponse()
    @ApiUnauthorizedResponse({type: ApiFailResultDto})
    @ApiForbiddenResponse({type: ApiFailResultDto})
    @ApiInternalServerErrorResponse({type: ApiFailResultDto})
    async leave(@Req() req: any): Promise<void | ApiFailResultDto> {
        try {
            await this.service.leave(req.user.id);
        } catch (error) {
            throw error;
        }
    }
}