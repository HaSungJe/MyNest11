import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { ValidationErrorDto } from "@root/exception/validation.error.dto";

// 회원가입
export class UserSignDto {
    @ApiProperty({description: '로그인 ID', required: true})
    login_id: string;

    @ApiProperty({description: '로그인 PW', required: true})
    login_pw: string;

    @ApiProperty({description: '로그인 PW 확인', required: true})
    login_pw2: string;

    @ApiProperty({description: '이름', required: true})
    name: string;

    @ApiProperty({description: '닉네임', required: true})
    nickname: string;
}

// 로그인 성공 반환
export class UserSignSuccessResultDto {
    @ApiProperty({description: 'http 상태코드', required: true})
    statusCode: HttpStatus.OK;
}

// 로그인 실패 반환
export class UserSignFailResultDto {
    @ApiProperty({description: 'http 상태코드', required: true})
    statusCode: HttpStatus.BAD_REQUEST | HttpStatus.INTERNAL_SERVER_ERROR;

    @ApiProperty({description: '실패 메세지', required: false})
    message: string;

    @ApiProperty({description: '에러 목록', isArray: true, type: () => ValidationErrorDto})
    validationError?: Array<ValidationErrorDto> = [];
}