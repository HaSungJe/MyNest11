import { Test, TestingModule } from '@nestjs/testing';
import { AdminUserController } from './admin.user.controller';
import { AdminUserService } from './admin.user.service';

describe('AdminUserController', () => {
  let controller: AdminUserController;

  const mockAdminUserService: Partial<AdminUserService> = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        { provide: AdminUserService, useValue: mockAdminUserService },
      ],
    }).compile();

    controller = module.get<AdminUserController>(AdminUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('list - success', async () => {
    const dto: any = { page: 1, take: 10 };
    const result = { statusCode: 200, list: [], total_count: 0, pagenation: { page: 1, take: 10, totalPage: 0 } } as any;
    (mockAdminUserService.list as any) = jest.fn().mockResolvedValue(result);

    const res = await controller.list(dto);
    expect(res).toBe(result);
    expect(mockAdminUserService.list).toHaveBeenCalledWith(dto);
  });
});
