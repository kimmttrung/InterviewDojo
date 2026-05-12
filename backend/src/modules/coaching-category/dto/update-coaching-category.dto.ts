import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryCoachingDto } from './create-coaching-category.dto';

export class UpdateCategoryCoachingDto extends PartialType(
  CreateCategoryCoachingDto,
) {}
