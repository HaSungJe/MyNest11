import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

// 로그인한 회원의 정보
export class PassportUserResultDto {
    @ApiProperty({description: '회원 ID', required: true})
    user_id: string;

    @ApiProperty({description: '로그인 ID', required: true})
    login_id: string;
    
    @ApiProperty({description: '이름', required: true})
    name: string;

    @ApiProperty({description: '닉네임', required: true})
    nickname: string;

    @ApiProperty({description: '권한 ID', required: true})
    auth_id: string;

    @ApiProperty({description: '상태 ID', required: true})
    state_id: string;

    @ApiProperty({description: '로그인 가능 여부', required: true})
    login_able_yn: string;
}

// 로그인한 회원의 정보 - 성공
export class PassportUserSuccessResultDto {
    @ApiProperty({description: 'http 상태코드', required: true})
    statusCode: HttpStatus.OK;

    @ApiProperty(({description: '회원 정보', required: true, type: PassportUserResultDto}))
    info: PassportUserResultDto;
}

// 로그인한 회원의 정보 - 실패
export class PassportUserFailResultDto {
    @ApiProperty({description: 'http 상태코드', required: true})
    statusCode: HttpStatus.UNAUTHORIZED

    @ApiProperty({description: '실패 메세지', required: false})
    message: string;
}