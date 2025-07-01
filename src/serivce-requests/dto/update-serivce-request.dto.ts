import { PartialType } from '@nestjs/mapped-types';
import { CreateSerivceRequestDto } from './create-serivce-request.dto';

export class UpdateSerivceRequestDto extends PartialType(CreateSerivceRequestDto) {}
