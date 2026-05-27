import { IsNumber, Min, Max } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(10000)
  @Max(5000000)
  amount: number;
}
