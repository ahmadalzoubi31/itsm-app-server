// src/modules/user-preferences/user-preferences.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTablePreference } from './entities/user-table-preference.entity';
import { UpsertTablePreferenceDto } from './dto/upsert-table-preference.dto';
import { UpsertFilterPreferenceDto } from './dto/upsert-filter-preference.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserTablePreference)
    private readonly prefsRepo: Repository<UserTablePreference>,
  ) {}

  async getTablePreference(
    userId: string,
    preferenceKey: string,
  ): Promise<UserTablePreference | null> {
    console.log('Fetching preference for', userId, preferenceKey);
    return await this.prefsRepo.findOne({
      where: { userId, preferenceKey },
    });
  }

  async upsertTablePreference(
    userId: string,
    dto: UpsertTablePreferenceDto,
  ): Promise<UserTablePreference> {
    const existing = await this.prefsRepo.findOne({
      where: { userId, preferenceKey: dto.preferenceKey },
    });

    if (existing) {
      existing.preferences = dto.preferences;
      return this.prefsRepo.save(existing);
    }

    const newPref = this.prefsRepo.create({
      userId,
      preferenceKey: dto.preferenceKey,
      preferences: dto.preferences,
    });

    return this.prefsRepo.save(newPref);
  }

  async deleteTablePreference(
    userId: string,
    preferenceKey: string,
  ): Promise<void> {
    await this.prefsRepo.delete({ userId, preferenceKey });
  }

  async getFilterPreferences(
    userId: string,
    preferenceKey: string,
  ): Promise<UserTablePreference | null> {
    return await this.prefsRepo.findOne({
      where: { userId, preferenceKey },
    });
  }

  async upsertFilterPreferences(
    userId: string,
    dto: UpsertFilterPreferenceDto,
  ): Promise<UserTablePreference> {
    const existing = await this.prefsRepo.findOne({
      where: { userId, preferenceKey: dto.preferenceKey },
    });

    if (existing) {
      existing.preferences = dto.filters as any;
      return this.prefsRepo.save(existing);
    }

    const newPref = this.prefsRepo.create({
      userId,
      preferenceKey: dto.preferenceKey,
      preferences: dto.filters as any,
    });

    return this.prefsRepo.save(newPref);
  }

  async deleteFilterPreferences(
    userId: string,
    preferenceKey: string,
  ): Promise<void> {
    await this.prefsRepo.delete({ userId, preferenceKey });
  }
}
