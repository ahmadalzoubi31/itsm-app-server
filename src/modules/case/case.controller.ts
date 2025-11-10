import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/auth/jwt.guard';
import { CaseService } from './case.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateCommentDto } from './dto/add-comment.dto';
import { ListCasesQuery } from './dto/list-cases.query';
import { AssignCaseDto } from './dto/assign-case.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CASE_STATUS_OPTIONS } from '@shared/constants';

@ApiTags('Cases')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('cases')
export class CaseController {
  private readonly logger = new Logger(CaseController.name);

  constructor(private readonly svc: CaseService) {
    this.logger.log('CaseController initialized');
  }

  @Post()
  create(@Body() dto: CreateCaseDto) {
    return this.svc.createCase(dto);
  }

  @Get()
  list(@Query() q: ListCasesQuery) {
    return this.svc.listCases(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getCase(id);
  }

  @Get('number/:number')
  getByNumber(@Param('number') number: string) {
    return this.svc.getCaseByNumber(number);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.svc.updateCase(id, dto);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.svc.addComment(id, dto);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.svc.listComments(id);
  }

  @ApiOperation({
    summary: 'Assign case',
    description: 'Set assignee and/or assignment group.',
  })
  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignCaseDto) {
    return this.svc.assignCase(id, dto);
  }

  @ApiOperation({
    summary: 'Change status',
    description: `Allowed: ${CASE_STATUS_OPTIONS.map((s) => s.label).join(' → ')}`,
  })
  @Post(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.svc.changeStatus(id, dto.status);
  }

  @ApiOperation({
    summary: 'Upload attachment',
    description: 'Max 10 MB; allowed types: pdf, png, jpg, txt.',
  })
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.addAttachment(id, file);
  }

  @ApiOperation({
    summary: 'List attachments',
    description: 'Attachments metadata for a case.',
  })
  @Get(':id/attachments')
  listAttachments(@Param('id') id: string) {
    return this.svc.listAttachments(id);
  }
}
