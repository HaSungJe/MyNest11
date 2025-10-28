import type { Request } from 'express';
import { Body, Controller, Headers, HttpException, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UserLoginDto, UserLoginFailResultDto, UserLoginSuccessResultDto } from './dto/user.login.dto';
import { ApiBadRequestResponse, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ValidationErrorResultDto } from '@root/exception/validation.error.dto';
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
    @ApiResponse({status: 200, description: '성공', type: UserLoginSuccessResultDto})
    @ApiResponse({status: 401, description: '아이디 또는 비밀번호 불일치', type: UserLoginFailResultDto})
    @ApiResponse({status: 500, description: '서버 오류', type: UserLoginFailResultDto})
    @ApiBadRequestResponse({description: '유효성검증 실패', type: ValidationErrorResultDto})
    async login(@Headers('user-agent') agent: string, @Req() req: Request, @Body() dto: UserLoginDto): Promise<UserLoginSuccessResultDto | UserLoginFailResultDto> {
        const ip = requestIP.getClientIp(req);
        dto = new UserLoginDto({...dto, agent, ip});
        const result = await this.service.login(dto);
        if (result?.statusCode === 200) {
            return result;
        } else {
            throw new HttpException(result, result?.statusCode);
        }
    }

    // 회원가입

    // 내 정보
}