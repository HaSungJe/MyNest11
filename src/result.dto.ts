import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

// Class-Validation Error
export class ValidationErrorDto {
    @ApiProperty({description: '유효성검사 반려 종류'})
    type: string;

    @ApiProperty({description: '유효성검사 반려 대상'})
    property: string;

    @ApiProperty({description: '유효성검사 반려 메시지'})
    message: string;
}

// 반환정보 성공
export class ApiSuccessResultDto {
    @ApiProperty({description: 'http 상태코드', required: true, example: HttpStatus.OK})
    statusCode: HttpStatus.OK;
}

// 반환정보 실패
export class ApiFailResultDto {
    @ApiProperty({description: 'http 상태코드', required: true, example: HttpStatus.BAD_REQUEST})
    statusCode: HttpStatus.BAD_REQUEST | HttpStatus.UNAUTHORIZED | HttpStatus.FORBIDDEN | HttpStatus.INTERNAL_SERVER_ERROR;

    @ApiProperty({description: '메세지', required: true})
    message: string;

    @ApiProperty({description: '에러 목록', isArray: true, type: () => ValidationErrorDto})
    validationError?: Array<ValidationErrorDto>;
}