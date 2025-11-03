import { Body, Controller, Delete, Get, Headers, HttpException, HttpStatus, Ip, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto, LoginResultDto } from './dto/login.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { PassportJwtAuthGuard } from '@root/guards/passport.jwt.auth/passport.jwt.auth.guard';
import { PassportUserResultDto, PassportUserSuccessResultDto } from '@root/guards/passport.jwt.auth/passport.jwt.auth.dto';
import { SignDto } from './dto/sign.dto';
import { CheckLoginIdDto } from './dto/check.loginId.dto';
import { CheckNicknameDto } from './dto/check.nickname.dto';
import { ApiBadRequestResultDto, ApiFailResultDto, ApiSuccessResultDto } from '@root/result.dto';
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
        const result = await this.service.login(dto);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
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
        const result = await this.service.refresh(dto);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
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
        const info: PassportUserResultDto = req.user;
        return { statusCode: HttpStatus.OK, info };
    }

    /**
     * 회원가입
     * 
     * @param dto 
     * @returns 
     */
    @Put('/sign')
    @ApiOperation({summary: '회원가입'})
    @ApiOkResponse({type: ApiSuccessResultDto})
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    @ApiInternalServerErrorResponse({type: ApiFailResultDto})
    async sign(@Body() dto: SignDto): Promise<ApiSuccessResultDto | ApiBadRequestResultDto | ApiFailResultDto> {
        const result = await this.service.sign(dto);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
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
    @ApiOkResponse({type: ApiSuccessResultDto})
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    async checkLoginId(@Body() dto: CheckLoginIdDto): Promise<ApiSuccessResultDto | ApiBadRequestResultDto> {
        const result = await this.service.checkLoginId(dto);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
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
    @ApiOkResponse({type: ApiSuccessResultDto})
    @ApiBadRequestResponse({type: ApiBadRequestResultDto})
    async checkNickname(@Body() dto: CheckNicknameDto): Promise<ApiSuccessResultDto | ApiBadRequestResultDto> {
        const result = await this.service.checkNickname(dto);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
        }
    }

    // 회원탈퇴
    @Delete('/leave')
    @ApiOperation({summary: '회원탈퇴'})
    @UseGuards(PassportJwtAuthGuard)
    @ApiOkResponse({type: ApiSuccessResultDto})
    @ApiUnauthorizedResponse({type: ApiFailResultDto})
    @ApiForbiddenResponse({type: ApiFailResultDto})
    @ApiInternalServerErrorResponse({type: ApiFailResultDto})
    async leave(@Req() req: any): Promise<ApiSuccessResultDto | ApiFailResultDto> {
        const result = await this.service.leave(req.user.id);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
        }
    }
}