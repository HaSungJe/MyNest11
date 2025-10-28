import { ApiProperty } from "@nestjs/swagger";

// 페이지탭에 표시될 페이지목록의 범위
class PageRangeResultDto {
    @ApiProperty({description: '시작값', required: true})
    start: number;

    @ApiProperty({description: '종료값', required: true})
    end: number;
}

// 페이지 정보 
export class PagenationResultDto {
    @ApiProperty({description: '전체검색 여부(Y/N)', required: true})
    all_search_yn: string;

    @ApiProperty({description: '총 개수', required: true})
    totalCount: number;

    @ApiProperty({description: '현재 페이지', required: true})
    page: number;

    @ApiProperty({description: '최대 페이지', required: true})
    maxPage: number;

    @ApiProperty({description: '페이지탭에 표시될 페이지목록의 범위', type: () => PageRangeResultDto, required: true})
    pageRange: PageRangeResultDto;

    @ApiProperty({description: '컨텐츠에 표시할 번호 시작값', required: true})
    content_start_number: number;

    @ApiProperty({description: '컨텐츠에 표시할 번호 시작값 (역순)', required: true})
    content_start_number_reverse: number;
}

// 페이지 데이터 입력용
export class PagenationDto {
    @ApiProperty({description: '페이지. 기본값: 1', required: false})
    page: number;

    @ApiProperty({description: '페이지당 출력될 데이터 수. 기본값: 10', required: false})
    size: number;

    @ApiProperty({description: '페이지탭에 출력될 페이지의 수. 기본값: 10', required: false})
    pageSize: number;

    constructor(data: any) {
        if (data) {
            this.page = !isNaN(parseInt(data['page'])) ? parseInt(data['page']) : 1;
            this.size = !isNaN(parseInt(data['size'])) ? parseInt(data['size']) : 10;
            this.pageSize = !isNaN(parseInt(data['pageSize'])) ? parseInt(data['pageSize']) : 10;
        }
    }

    getPageData() {
        return {
            page: this.page,
            size: this.size,
            pageSize: this.pageSize,
        }
    }
}

// 페이지 정보
export class PagenationClass {
    public readonly all_search_yn: string = 'N'; // 전체검색 여부(Y/N)
    public readonly size: number; // 페이지당 출력될 데이터 수
    public readonly pageSize: number; // 페이지탭에 출력될 페이지의 수
    public readonly totalCount: number; // 총 게시글 수
    public readonly page: number; // 현재 페이지
    public readonly maxPage: number; // 마지막 페이지
    public readonly pageRange: any; // 페이지탭에 출력될 페이지의 시작과 끝 값
    public readonly limit: number; // Query용 limit 값
    public readonly offset: number; // Query용 offset 값

    constructor (data: any) {
        if (data) {
            this.totalCount = !isNaN(parseInt(data['totalCount'])) ? parseInt(data['totalCount']) : 1;
            this.page = !isNaN(parseInt(data['page'])) ? parseInt(data['page']) : 1;
            this.size = !isNaN(parseInt(data['size'])) ? parseInt(data['size']) : 20;
            this.pageSize = !isNaN(parseInt(data['pageSize'])) ? parseInt(data['pageSize']) : 10;

            // 현재페이지가 1보다 작을경우, 1로 변경
            if (this.page <= 0) {
                this.page = 1;
            }
    
            // 최대 페이지 수
            this.maxPage = Math.floor(this.totalCount / this.size);
            if (this.totalCount % this.size > 0) {
                this.maxPage++; 
            }
    
            // 페이지당 출력될 개수가 -1인 경우, 전체 출력
            if (this.size === -1) {
                this.all_search_yn = 'Y';
                this.page = 1;
                this.maxPage = 1;
                this.size = this.totalCount;
            }

            // 총 개수가 0일 경우, 최대페이지를 기본 1로 설정.
            if (this.maxPage === 0) {
                this.maxPage = 1;
            }
    
            // 현재페이지가 최대페이지를 넘어설 경우, 현재페이지를 최대페이지로 변경
            if (this.page > this.maxPage) {
                this.page = this.maxPage;
            }
    
            // mysql 검색용 limit 
            this.limit = this.size;
            this.offset = ((this.page-1) * this.size);
    
            // 노출할 페이지 목록 수
            this.pageRange = {
                start: 0,
                end: 0
            }

            this.pageRange.end = Math.floor(this.page / this.pageSize);
            if (this.page % this.pageSize > 0) {
                this.pageRange.end++;
            }
            
            this.pageRange.end = this.pageRange.end * this.pageSize;
            this.pageRange.start = this.pageRange.end - (this.pageSize - 1);
            if (this.pageRange.end > this.maxPage) {
                this.pageRange.end = this.maxPage;
            }
        }
    }
    
    getPagenation(): PagenationResultDto {
        return {
            all_search_yn: this.all_search_yn,
            totalCount: this.totalCount,
            page: this.page,
            maxPage: this.maxPage,
            pageRange: this.pageRange,
            content_start_number: this.totalCount - ((this.page - 1) * this.size),
            content_start_number_reverse: 1 + ((this.page-1) * this.size)
        }
    }
}

