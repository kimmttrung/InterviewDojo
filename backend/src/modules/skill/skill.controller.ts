import { Controller, Get } from '@nestjs/common';
import { SkillService } from './skill.service';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Messages } from '../../common/constants/messages.constant';

@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  @ResponseMessage(Messages.SKILL.FETCHED)
  async findAll() {
    return this.skillService.findAll();
  }
}
