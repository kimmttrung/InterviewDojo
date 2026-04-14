import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createMock } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto, UserRole } from './dto/register.dto';
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

    expect(result.message).toBe('Login successful');
    expect(result.data.accessToken).toBeDefined();
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
    role: UserRole.CANDIDATE,
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
      role: UserRole.CANDIDATE,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if role is invalid', async () => {
    const dto = Object.assign(new RegisterDto(), {
      ...validData,
      role: UserRole.ADMIN,
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass if name is optional', async () => {
    const dto = Object.assign(new RegisterDto(), {
      email: 'test@mail.com',
      password: '123456',
      role: UserRole.CANDIDATE,
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
});
