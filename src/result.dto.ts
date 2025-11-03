import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

/**
 * 유효성검사 오류 DTO
 */
export class ValidationErrorDto {
    @ApiProperty({description: '유효성검사 반려 종류'})
    type: string;

    @ApiProperty({description: '유효성검사 반려 대상'})
    property: string;

    @ApiProperty({description: '유효성검사 반려 메시지'})
    message: string;
}

/**
 * API 요청 성공 반환 ResultDto
 */
export class ApiSuccessResultDto {
    @ApiProperty({description: 'http 상태코드', required: true, example: HttpStatus.OK})
    statusCode: HttpStatus.OK;
}

/**
 * API 요청 실패 반환 - 400
 */
export class ApiBadRequestResultDto {
    @ApiProperty({description: 'http 상태코드', required: true, example: HttpStatus.BAD_REQUEST})
    statusCode: HttpStatus.BAD_REQUEST;

    @ApiProperty({description: '메세지', required: true})
    message: string;

    @ApiProperty({description: '에러 목록', isArray: true, type: () => ValidationErrorDto, required: false})
    validationError?: Array<ValidationErrorDto>;
}

/**
 * API 요청 실패 반환 - 401, 403, 500, 502
 */
export class ApiFailResultDto {
    @ApiProperty({description: 'http 상태코드', required: true, example: HttpStatus.BAD_REQUEST})
    statusCode: HttpStatus.UNAUTHORIZED | HttpStatus.FORBIDDEN | HttpStatus.INTERNAL_SERVER_ERROR | HttpStatus.BAD_GATEWAY;

    @ApiProperty({description: '메세지', required: true})
    message: string;
}

