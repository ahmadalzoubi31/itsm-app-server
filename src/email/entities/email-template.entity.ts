import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { EmailTemplateTypeEnum } from '../enums';

@Entity('email_templates')
export class EmailTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: EmailTemplateTypeEnum,
  })
  type: EmailTemplateTypeEnum;

  @Column()
  subject: string;

  @Column('text')
  htmlBody: string;

  @Column('text')
  textBody: string;

  @Column('simple-array')
  variables: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'en' })
  language: string;

  @Column({ nullable: true })
  description: string;
} 