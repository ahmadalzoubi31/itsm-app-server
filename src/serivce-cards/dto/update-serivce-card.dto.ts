import { PartialType } from '@nestjs/mapped-types';
import { CreateSerivceCardDto } from './create-serivce-card.dto';

export class UpdateSerivceCardDto extends PartialType(CreateSerivceCardDto) {}
