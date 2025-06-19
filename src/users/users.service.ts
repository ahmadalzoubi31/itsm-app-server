import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // hash the password
    createUserDto.password = await hash(createUserDto.password, 10);

    const user = this.usersRepository.create(createUserDto);

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      console.log('🚀 ~ UsersService ~ create ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update the user fields
    Object.assign(user, updateUserDto);

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      console.log('🚀 ~ UsersService ~ update ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.usersRepository.delete(id);
    } catch (error) {
      console.log('🚀 ~ UsersService ~ remove ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find({
        relations: ['permissions'],
      });
    } catch (error) {
      console.log('🚀 ~ UsersService ~ findAll ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { id },
        relations: ['permissions'],
      });
    } catch (error) {
      console.log('🚀 ~ UsersService ~ findOne ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { username },
        relations: ['permissions'],
      });
    } catch (error) {
      console.log('🚀 ~ UsersService ~ findByUsername ~ error:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
