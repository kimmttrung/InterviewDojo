import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserSkill } from '../entities/user-skill.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserSkill)
    private skillRepo: Repository<UserSkill>,
  ) {}

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const skills = await this.skillRepo.findOne({ where: { userId } });

    return {
      ...user,
      skills: skills || { dsa: 0, system_design: 0, frontend: 0, backend: 0 }, // tránh null cho Radar chart
    };
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    await this.userRepo.update(userId, dto);
    return this.userRepo.findOne({ where: { id: userId } });
  }
}
