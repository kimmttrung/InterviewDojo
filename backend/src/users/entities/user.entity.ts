import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  target_role: string;

  // === Fields mới theo AC PATCH /users/me ===
  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  target_company: string;

  @Column({ nullable: true })
  current_level: string;
  // ===========================================

  @Column({ nullable: true })
  experience_years: number;

  @Column({
    type: 'varchar',
    default: 'offline',
  })
  status: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({
    type: 'numeric',
    default: 0,
  })
  credit_balance: number;

  @CreateDateColumn()
  created_at: Date;
}
