import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService: Partial<UserService> = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login - success', async () => {
    const result = {
      statusCode: 200,
      refresh_token: 'r',
      access_token: 'a',
      refresh_token_end_dt: new Date(),
      access_token_end_dt: new Date(),
    };
    (mockUserService.login as any) = jest.fn().mockResolvedValue(result);

    const body: any = { login_id: 'id', login_pw: 'pw' };
    const res = await controller.login('agent', '127.0.0.1', body);
    expect(res).toBe(result);
    expect(mockUserService.login).toHaveBeenCalled();
  });

  it('refresh - success', async () => {
    const result = {
      statusCode: 200,
      refresh_token: 'r2',
      access_token: 'a2',
      refresh_token_end_dt: new Date(),
      access_token_end_dt: new Date(),
    };
    (mockUserService.refresh as any) = jest.fn().mockResolvedValue(result);

    const res = await controller.refresh({ refresh_token: 'x' } as any);
    expect(res).toBe(result);
    expect(mockUserService.refresh).toHaveBeenCalledWith({ refresh_token: 'x' });
  });

  it('info - success', async () => {
    const user = { id: 'U1', login_id: 'id' } as any;
    const res = await controller.info({ user } as any);
    expect(res).toEqual({ statusCode: 200, info: user });
  });

  it('sign - success', async () => {
    const result = { statusCode: 200 };
    (mockUserService.sign as any) = jest.fn().mockResolvedValue(result);

    const dto: any = { login_id: 'id', login_pw: 'pw', name: 'n', nickname: 'nn' };
    const res = await controller.sign(dto);
    expect(res).toBe(result);
    expect(mockUserService.sign).toHaveBeenCalledWith(dto);
  });

  it('checkLoginId - success', async () => {
    const result = { statusCode: 200 };
    (mockUserService.checkLoginId as any) = jest.fn().mockResolvedValue(result);

    const dto: any = { login_id: 'id' };
    const res = await controller.checkLoginId(dto);
    expect(res).toBe(result);
    expect(mockUserService.checkLoginId).toHaveBeenCalledWith(dto);
  });

  it('checkNickname - success', async () => {
    const result = { statusCode: 200 };
    (mockUserService.checkNickname as any) = jest.fn().mockResolvedValue(result);

    const dto: any = { nickname: 'nick' };
    const res = await controller.checkNickname(dto);
    expect(res).toBe(result);
    expect(mockUserService.checkNickname).toHaveBeenCalledWith(dto);
  });

  it('leave - success', async () => {
    const result = { statusCode: 200 };
    (mockUserService.leave as any) = jest.fn().mockResolvedValue(result);

    const req: any = { user: { id: 'U1' } };
    const res = await controller.leave(req);
    expect(res).toBe(result);
    expect(mockUserService.leave).toHaveBeenCalledWith('U1');
  });
});
