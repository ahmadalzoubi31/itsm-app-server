import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from '../../../shared/utils/auditable.entity';

@Entity('ldap_config')
export class LdapConfig extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  server: string;

  @Column({ nullable: false })
  port: string;

  @Column({ nullable: false })
  protocol: string;

  @Column({ nullable: false })
  baseDN: string;

  @Column({ nullable: false })
  bindDN: string;

  @Column({ nullable: false, select: false })
  bindPassword: string;

  @Column({ nullable: false })
  userSearchBase: string;

  @Column({ nullable: false })
  userSearchFilter: string;

  @Column({ nullable: false })
  userNameAttribute: string;

  @Column({ nullable: false })
  emailAttribute: string;

  @Column({ default: 'cn' })
  displayNameAttribute: string;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ default: true })
  secureConnection: boolean;

  @Column({ default: false })
  allowSelfSignedCert: boolean;

  @Column({ type: 'json', nullable: true })
  groupMappings: Record<string, string[]>;
}
