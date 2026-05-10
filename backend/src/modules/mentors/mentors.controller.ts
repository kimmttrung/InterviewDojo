import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MentorsService } from './mentors.service';

@ApiTags('Mentors')
@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  findAll() {
    return this.mentorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mentorsService.findOne(id);
  }

  @Get(':id/available-slots')
  findAvailableSlots(@Param('id', ParseIntPipe) id: number) {
    return this.mentorsService.findAvailableSlots(id);
  }
}
