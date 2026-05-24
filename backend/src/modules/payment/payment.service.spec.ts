import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns scaffolded responses for payment CRUD methods', () => {
    expect(service.create({} as any)).toBe('This action adds a new payment');
    expect(service.findAll()).toBe('This action returns all payment');
    expect(service.findOne(5)).toBe('This action returns a #5 payment');
    expect(service.update(5, {} as any)).toBe(
      'This action updates a #5 payment',
    );
    expect(service.remove(5)).toBe('This action removes a #5 payment');
  });
});
