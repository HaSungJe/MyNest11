import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { HttpStatus } from '@nestjs/common';
import { UserLoginFailResultDto, UserLoginSuccessResultDto } from './dto/user.login.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{
        provide: UserService,
        useValue: {
          login: jest.fn()
        }
      }],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should return 200 and accessToken when login succeeds', async () => {
    const mockResult = { statusCode: HttpStatus.OK, accessToken: 'ASDF1234' };
    jest.spyOn(service, 'login').mockResolvedValue(mockResult as UserLoginSuccessResultDto);

    const result = await controller.login({ login_id: 'test', login_pw: 'pw' });
    expect(result).toEqual(mockResult);
  });

  it('should throw HttpException with 401 when login fails', async () => {
    const mockResult = { statusCode: HttpStatus.UNAUTHORIZED, message: '아이디 또는 비밀번호가 잘못되었습니다.' };
    jest.spyOn(service, 'login').mockResolvedValue(mockResult as UserLoginFailResultDto);

    await expect(controller.login({ login_id: 'wrong', login_pw: 'wrong' })).rejects.toMatchObject({
      response: { message: '아이디 또는 비밀번호가 잘못되었습니다.', statusCode: 401 }
    });
  });
});
