import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_skills')
export class UserSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ default: 0 })
  dsa: number;

  @Column({ default: 0 })
  system_design: number;

  @Column({ default: 0 })
  frontend: number;

  @Column({ default: 0 })
  backend: number;
}
