// src/modules/job-roles/dto/update-job-role.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateJobRoleDto } from './create-job-role.dto';

export class UpdateJobRoleDto extends PartialType(CreateJobRoleDto) {}
