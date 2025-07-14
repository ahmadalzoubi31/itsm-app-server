import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingTypeEnum } from './constants/type.constant';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepo: Repository<Settings>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getByType(type: SettingTypeEnum): Promise<any> {
    const found = await this.settingsRepo.findOne({
      where: { type },
    });
    if (!found) return new NotFoundException(`Setting not found: ${type}`);
    return found.jsonValue;
  }

  async upsertByType(dto: CreateSettingDto) {
    let setting = await this.settingsRepo.findOne({
      where: { type: dto.type },
    });

    if (!setting) {
      setting = this.settingsRepo.create(dto);
    } else {
      // update the setting
      this.eventEmitter.emit('sync.settings.updated', dto);
      setting = this.settingsRepo.merge(setting, dto);
    }
    return this.settingsRepo.save(setting);
  }
}
