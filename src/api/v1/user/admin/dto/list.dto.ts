import { ApiProperty } from "@nestjs/swagger";
import { ApiSuccessResultDto } from "@root/global.result.dto";
import { PagenationDto, PagenationResultDto } from "@root/util/pagenation";
import { AdminUserListVO } from "../vo/list.vo";

/**
 * 회원 목록 Dto
 */
export class AdminUserListDto extends PagenationDto {
    @ApiProperty({description: '검색 종류. (ALL: 전체, ID: 아이디, NAME: 이름, NICKNAME: 닉네임)', required: false})
    search_type: 'ALL' | 'ID' | 'NAME' | 'NICKNAME';

    @ApiProperty({description: '검색 값', required: false})
    search_value: string;

    @ApiProperty({description: '상태 ID. (ALL: 전체, DONE: 정상, BLOCK: 정지, DELETE: 삭제)', required: false})
    state_id: string;
}

/**
 * 회원 목록 반환 Dto
 */
export class AdminUserListResultDto extends ApiSuccessResultDto {
    @ApiProperty({description: '총 개수', required: true})
    total_count: number;

    @ApiProperty({description: '페이지 정보', required: true, type: () => PagenationResultDto})
    pagenation: PagenationResultDto;

    @ApiProperty({description: '회원 목록', required: true, isArray: true, type: () => AdminUserListVO})
    list: Array<AdminUserListVO>;
}