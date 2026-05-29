import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { MentorController } from '../modules/mentor/mentor.controller';
import { MentorService } from '../modules/mentor/mentor.service';
import { BookingController } from '../modules/booking/booking.controller';
import { BookingService } from '../modules/booking/booking.service';
import { BookingStatus } from '@prisma/client';
import { StreamService } from '../modules/stream/stream.service';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';

describe('Mentor Booking Backend Integration', () => {
  let app: INestApplication;

  const mentorServiceMock = {
    findAll: jest.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          email: 'mentor@test.com',
          name: 'Mentor Test',
          headline: 'Backend Mentor',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    }),

    findById: jest.fn().mockResolvedValue({
      id: 1,
      email: 'mentor@test.com',
      name: 'Mentor Test',
      headline: 'Backend Mentor',
      coachingPlans: [
        {
          id: 1,
          title: 'Mock Interview',
          duration: 60,
          price: 100000,
        },
      ],
    }),

    findAvailableSlots: jest.fn().mockResolvedValue([
      {
        id: 1,
        mentorId: 1,
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
    ]),
  };

  const bookingServiceMock = {
    create: jest.fn().mockResolvedValue({
      id: 1,
      candidateId: 1,
      coachingPlanId: 1,
      status: BookingStatus.PENDING_PAYMENT,
    }),
  };

  const streamServiceMock = {
    getOrCreateMeetingLink: jest.fn().mockResolvedValue('/meeting/room'),
    createCall: jest.fn(),
    createMeetingRoom: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MentorController, BookingController],
      providers: [
        {
          provide: MentorService,
          useValue: mentorServiceMock,
        },
        {
          provide: BookingService,
          useValue: bookingServiceMock,
        },
        {
          provide: StreamService,
          useValue: streamServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            sub: 1,
            id: 1,
            email: 'candidate@test.com',
            role: 'CANDIDATE',
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleRef.createNestApplication();

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flow: get mentor list -> get mentor detail', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/mentors')
      .expect(200);

    const mentors = listRes.body.data?.items ?? listRes.body.items ?? [];
    expect(mentors).toHaveLength(1);

    const mentorId = mentors[0].id;

    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/mentors/${mentorId}`)
      .expect(200);

    const detail = detailRes.body.data ?? detailRes.body;
    expect(detail.id).toBe(mentorId);
    expect(mentorServiceMock.findById).toHaveBeenCalledWith(mentorId);
  });

  it('flow: create booking with invalid payload should return 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        slotId: 'abc',
        coachingPlanId: 'xyz',
      })
      .expect(400);
  });

  it('flow: create booking with valid payload should return 201', async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const res = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .send({
        slotId: 1,
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        answers: [],
      })
      .expect(201);

    const booking = res.body.data ?? res.body;

    expect(booking.id).toBe(1);
    expect(booking.status).toBe(BookingStatus.PENDING_PAYMENT);
    expect(bookingServiceMock.create).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        coachingPlanId: 1,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      }),
    );
  });
});
