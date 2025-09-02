import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceCardDto } from './dto/create-service-card.dto';
import { UpdateServiceCardDto } from './dto/update-service-card.dto';
import { ServiceCard } from './entities/service-card.entity';

@Injectable()
export class ServiceCardsService {
  constructor(
    @InjectRepository(ServiceCard)
    private serviceCardsRepository: Repository<ServiceCard>,
  ) {}

  async create(
    createServiceCardDto: CreateServiceCardDto,
  ): Promise<ServiceCard> {
    const serviceCard =
      this.serviceCardsRepository.create(createServiceCardDto);

    try {
      return await this.serviceCardsRepository.save(serviceCard);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(): Promise<ServiceCard[]> {
    try {
      return await this.serviceCardsRepository.find({
        relations: ['createdBy', 'updatedBy'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findActive(): Promise<ServiceCard[]> {
    try {
      return await this.serviceCardsRepository.find({
        where: { isActive: true },
        relations: ['createdBy', 'updatedBy'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string): Promise<ServiceCard> {
    try {
      const serviceCard = await this.serviceCardsRepository.findOne({
        where: { id },
        relations: ['createdBy', 'updatedBy'],
      });

      if (!serviceCard) {
        throw new NotFoundException('Service card not found');
      }

      return serviceCard;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(
    id: string,
    updateServiceCardDto: UpdateServiceCardDto,
  ): Promise<ServiceCard> {
    const serviceCard = await this.serviceCardsRepository.findOneBy({ id });

    if (!serviceCard) {
      throw new NotFoundException('Service card not found');
    }

    Object.assign(serviceCard, updateServiceCardDto);

    try {
      return await this.serviceCardsRepository.save(serviceCard);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const serviceCard = await this.serviceCardsRepository.findOneBy({ id });

    if (!serviceCard) {
      throw new NotFoundException('Service card not found');
    }

    try {
      await this.serviceCardsRepository.delete(id);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByCategory(category: string): Promise<ServiceCard[]> {
    try {
      return await this.serviceCardsRepository.find({
        where: { category: category as any, isActive: true },
        relations: ['createdBy', 'updatedBy'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
