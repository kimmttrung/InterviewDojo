import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-coaching-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
