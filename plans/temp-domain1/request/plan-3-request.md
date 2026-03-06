면회 신청내역 목록 api 계획

1) 기본조건
    - 대상 테이블. t_visit_reserve
    - 페이지네이션 적용
    - 검색조건. 검색어 입력시에 적용
        - 전체. 이름 또는 연락처 like 검색
        - 이름. name like검색
        - 연락처. phone like 검색
    - 등록기간. 시작일 또는 종료일 입력시 적용
        - 시작일: 입력시, create_at이 입력값보다 크거나 같아야 함.
        - 종료일: 입력시, create_at이 입력값보다 작거나 같아야 함.
    - 상태. 전체/예정/취소/완료
        - 전체: 조건X
        - 예정: visit_reserve_status_id가 WAIT인 것만.
        - 완료: visit_reserve_status_id가 COMPLETE인 것만.
        - 취소: visit_reserve_status_id가 CANCEL인 것만.

2) 검색 필드
    - 면회일자: t_visit_reserve의 date
    - 회차: t_visit_round의 round. innerjoin
    - 면회 시작시간: t_visit_reserve의 start_minute
    - 면회 종료시간: t_visit_reserve의 end_minute
    - 이름: t_visit_reserve의 name
    - 입원 호수: t_visit_reserve의 room
    - 앱 푸쉬 전송가능 여부. t_visit_reserve의 push_token 존재시 true, 아니면 false
    - 연락처: t_visit_reserve의 phone
    - 등록일: t_visit_reserve의 create_at. yyyy-MM-dd HH:mm
    - 상태: t_visit_reserve_status의 visit_reserve_status_name. innerjoin