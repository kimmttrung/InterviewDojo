import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { validate } from 'class-validator';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService - login', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
        {
          provide: JwtService,
          useValue: createMock<JwtService>(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  const validDto = {
    email: 'test@mail.com',
    password: '123456',
  };

  const mockUser = {
    id: 1,
    email: 'test@mail.com',
    password: 'hashed_password',
    role: 'CANDIDATE',
    mentorProfile: null,
    targetRoleId: 1,
  };

  it('should login successfully', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    (service as any).generateTokens = jest.fn().mockResolvedValue({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      },
    });

    const result = await service.login(validDto);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    });
    // Vì mockUser có targetRoleId (1), người dùng đã setup nên redirect = null
    expect(result.redirect).toBeNull();
  });

  it('should include correct payload in token', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const tokenSpy = jest
      .spyOn(service as any, 'generateTokens')
      .mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });

    await service.login(validDto);

    expect(tokenSpy).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.email,
      mockUser.role,
    );
  });

  it('should login with uppercase email (case insensitive)', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'TEST@MAIL.COM',
      password: '123456',
    });

    expect(result).toBeDefined();
  });

  it('should redirect incomplete mentor and candidate profiles to setup', async () => {
    jest.spyOn(service as any, 'generateTokens').mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {},
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    prisma.user.findUnique = jest.fn().mockResolvedValueOnce({
      ...mockUser,
      role: Role.MENTOR,
      mentorProfile: null,
    });
    await expect(service.login(validDto)).resolves.toEqual(
      expect.objectContaining({ redirect: '/mentor/setup' }),
    );

    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      ...mockUser,
      role: Role.CANDIDATE,
      targetRoleId: null,
    });
    await expect(service.login(validDto)).resolves.toEqual(
      expect.objectContaining({ redirect: '/candidate/setup' }),
    );
  });

  it('should throw if email does not exist', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    await expect(service.login(validDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw if password is incorrect', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login(validDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw if password is empty', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

    await expect(
      service.login({ email: validDto.email, password: '' }),
    ).rejects.toThrow();
  });

  it('should throw if email is missing', async () => {
    await expect(
      service.login({ password: '123456' } as LoginDto),
    ).rejects.toThrow();
  });

  it('should throw if password is missing', async () => {
    await expect(
      service.login({ email: 'test@mail.com' } as LoginDto),
    ).rejects.toThrow();
  });

  it('should throw if email format is invalid', async () => {
    prisma.user.findUnique = jest.fn().mockResolvedValue(null);

    await expect(
      service.login({ email: 'invalid-email', password: '123456' }),
    ).rejects.toThrow();
  });
});

describe('RegisterDto Validation', () => {
  const validData: RegisterDto = {
    email: 'test@mail.com',
    password: '123456',
    role: Role.CANDIDATE,
    name: 'Test',
  };

  it('should pass with valid data', async () => {
    const dto = Object.assign(new RegisterDto(), validData);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if email invalid format', async () => {
    const dto = Object.assign(new RegisterDto(), {
      ...validData,
      email: 'invalid-email',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if password too short', async () => {
    const dto = Object.assign(new RegisterDto(), {
      ...validData,
      password: '123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if missing email', async () => {
    const dto = Object.assign(new RegisterDto(), {
      password: '123456',
      role: 'CANDIDATE',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if missing password', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'test@mail.com',
      role: Role.CANDIDATE,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if role is invalid', async () => {
    const dto = Object.assign(new RegisterDto(), {
      ...validData,
      role: 'INVALID_ROLE' as Role,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass if name is optional', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'test@mail.com',
      password: '123456',
      role: Role.CANDIDATE,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('AuthService - account and token flows', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    jwt = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    process.env.JWT_ACCESS_SECRET = 'access';
    process.env.JWT_REFRESH_SECRET = 'refresh';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers a candidate and generates both tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        user: {
          create: jest.fn().mockResolvedValue({
            id: 1,
            email: 'user@test.com',
            role: Role.CANDIDATE,
          }),
        },
        mentorProfile: { create: jest.fn() },
      }),
    );
    jwt.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.register({
      email: 'user@test.com',
      password: '123456',
      name: 'User',
      role: Role.CANDIDATE,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 1, email: 'user@test.com', role: Role.CANDIDATE },
    });
  });

  it('defaults registration role to candidate when role is omitted', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    const create = jest.fn().mockResolvedValue({
      id: 5,
      email: 'default@test.com',
      role: Role.CANDIDATE,
    });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({ user: { create }, mentorProfile: { create: jest.fn() } }),
    );
    jwt.signAsync.mockResolvedValue('token');

    await service.register({
      email: 'default@test.com',
      password: '123456',
      name: 'Default',
    } as any);

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: Role.CANDIDATE }),
    });
  });

  it('creates admin account successfully', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({ id: 4, role: Role.ADMIN });

    await service.createAdmin({
      email: 'admin@test.com',
      password: 'secret',
      name: 'Admin',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'admin@test.com',
        password: 'hashed',
        name: 'Admin',
        role: Role.ADMIN,
      },
    });
  });

  it('rejects duplicate email when creating admin', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ id: 1 });

    await expect(
      service.createAdmin({
        email: 'admin@test.com',
        password: 'secret',
        name: 'Admin',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
