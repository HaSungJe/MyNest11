import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { createQueryBuilder, DataSource } from 'typeorm';
import { UserLoginFailResultDto, UserLoginSuccessResultDto } from './dto/user.login.dto';
import { HttpStatus } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, {
        provide: DataSource,
        useValue: {
          createQueryBuilder: jest.fn()
        }
      }],
    }).compile();

    service = module.get<UserService>(UserService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should return accessToken when login succeeds', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        user_id: '1',
        login_id: 'test',
        login_pw: 'pw',
        name: 'Test',
        nickname: 'Tester',
      }),
    };
    jest.spyOn(dataSource, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

    const result = await service.login({ login_id: 'test', login_pw: 'pw' });
    const expected: UserLoginSuccessResultDto = {
      statusCode: 200,
      accessToken: 'ASDF1234',
    };
    expect(result).toEqual(expected);
  });

  it('should return 401 when login fails', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(dataSource, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

    const result = await service.login({ login_id: 'wrong', login_pw: 'wrong' });
    const expected: UserLoginFailResultDto = {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: '아이디 또는 비밀번호가 잘못되었습니다.',
    };
    expect(result).toEqual(expected);
  });

  it('should return 500 when query throws an error', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockRejectedValue(new Error('DB error')),
    };
    jest.spyOn(dataSource, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

    const result = await service.login({ login_id: 'test', login_pw: 'pw' });
    const expected: UserLoginFailResultDto = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '관리자에게 문의해주세요.',
    };
    expect(result).toEqual(expected);
  });
});
