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

// Class-Validation Reject Error
export class ValidationErrorResultDto {
    @ApiProperty({description: 'http 상태코드', required: true})
    statusCode: HttpStatus.BAD_REQUEST;

    @ApiProperty({description: '메세지', required: true})
    message: string;

    @ApiProperty({description: '에러 목록', isArray: true, type: () => ValidationErrorDto})
    validationError: Array<ValidationErrorDto> = [];
}