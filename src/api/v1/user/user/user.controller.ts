import { Body, Controller, Get, Headers, HttpException, HttpStatus, Ip, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto, LoginResultDto } from './dto/login.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PassportJwtAuthGuard } from '@root/guards/passport.jwt.auth/passport.jwt.auth.guard';
import { PassportUserFailResultDto, PassportUserResultDto, PassportUserSuccessResultDto } from '@root/guards/passport.jwt.auth/passport.jwt.auth.dto';
import { SignDto } from './dto/sign.dto';
import { CheckLoginIdDto } from './dto/check.loginId.dto';
import { CheckNicknameDto } from './dto/check.nickname.dto';
import { ApiFailResultDto, ApiSuccessResultDto } from '@root/result.dto';
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
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: LoginResultDto})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: '아이디 또는 비밀번호 불일치', type: ApiFailResultDto})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: '정지된 계정', type: ApiFailResultDto})
    @ApiResponse({status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 오류', type: ApiFailResultDto})
    @ApiBadRequestResponse({description: '유효성검증 실패', type: ApiFailResultDto})
    async login(@Headers('user-agent') agent: string, @Ip() ip: string, @Body() dto: LoginDto): Promise<LoginResultDto | ApiFailResultDto> {
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
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: RefreshResultDto})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: '인증 실패', type: ApiFailResultDto})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: '정지된 계정', type: ApiFailResultDto})
    @ApiResponse({status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 오류', type: ApiFailResultDto})
    @ApiBadRequestResponse({description: '유효성검증 실패', type: ApiFailResultDto})
    async refresh(@Body() dto: RefreshDto): Promise<RefreshResultDto | ApiFailResultDto> {
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
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: PassportUserSuccessResultDto})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: '로그인하지 않은 상태', type: PassportUserFailResultDto})
    async info(@Req() req: any): Promise<PassportUserSuccessResultDto | PassportUserFailResultDto> {
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
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: ApiSuccessResultDto})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: '아이디/비밀번호 중복', type: ApiFailResultDto})
    @ApiResponse({status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 오류', type: ApiFailResultDto})
    @ApiBadRequestResponse({description: '유효성검증 실패', type: ApiFailResultDto})
    async sign(@Body() dto: SignDto): Promise<ApiSuccessResultDto | ApiFailResultDto> {
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
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: ApiSuccessResultDto})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: '아이디 중복', type: ApiFailResultDto})
    async checkLoginId(@Body() dto: CheckLoginIdDto): Promise<ApiSuccessResultDto | ApiFailResultDto> {
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
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: ApiSuccessResultDto})
    @ApiResponse({status: HttpStatus.BAD_REQUEST, description: '닉네임 중복', type: ApiFailResultDto})
    async checkNickname(@Body() dto: CheckNicknameDto) {
        const result = await this.service.checkNickname(dto);
        if (result.statusCode === HttpStatus.OK) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
        }
    }
}