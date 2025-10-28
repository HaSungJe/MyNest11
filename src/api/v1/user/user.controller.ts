import type { Request } from 'express';
import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserLoginDto, UserLoginFailResultDto, UserLoginSuccessResultDto } from './dto/user.login.dto';
import { ApiBadRequestResponse, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ValidationErrorResultDto } from '@root/exception/validation.error.dto';
import { PassportJwtAuthGuard } from '@root/guards/passport.jwt.auth/passport.jwt.auth.guard';
import { PassportUserFailResultDto, PassportUserSuccessResultDto } from '@root/guards/passport.jwt.auth/passport.jwt.auth.dto';
import * as requestIP from 'request-ip';

@Controller('/api/v1/user')
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
    @ApiOperation({
        summary: '로그인',
        description: '로그인',
    })
    @ApiBody({type: UserLoginDto})
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: UserLoginSuccessResultDto})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: '아이디 또는 비밀번호 불일치', type: UserLoginFailResultDto})
    @ApiResponse({status: HttpStatus.FORBIDDEN, description: '정지된 계정', type: UserLoginFailResultDto})
    @ApiResponse({status: HttpStatus.INTERNAL_SERVER_ERROR, description: '서버 오류', type: UserLoginFailResultDto})
    @ApiBadRequestResponse({description: '유효성검증 실패', type: ValidationErrorResultDto})
    async login(@Headers('user-agent') agent: string, @Req() req: Request, @Body() dto: UserLoginDto): Promise<UserLoginSuccessResultDto | UserLoginFailResultDto> {
        const ip = requestIP.getClientIp(req);
        dto = new UserLoginDto({...dto, agent, ip});
        const result = await this.service.login(dto);
        if (result?.statusCode === HttpStatus.OK) {
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
    @ApiOperation({
        summary: '내 정보',
        description: '내 정보',
    })
    @UseGuards(PassportJwtAuthGuard)
    @ApiResponse({status: HttpStatus.OK, description: '성공', type: PassportUserSuccessResultDto})
    @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: '로그인하지 않은 상태', type: PassportUserFailResultDto})
    async info(@Req() req: any) {
        return { statusCode: HttpStatus.OK, info: req.user };
    }

    // 회원가입
}