// src/modules/email/core/workers/email-ingest.worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailChannel } from '../../entities/email-channel.entity';
import { EmailInboundState } from '../../entities/email-inbound-state.entity';
import { EmailMessage } from '../../entities/email-message.entity';
import { EmailRoutingRule } from '../../entities/email-routing-rule.entity';
import { extractCaseNumber } from '@shared/utils/extract-subject-helpers';
import { CaseService } from '@modules/case/case.service';
import { UsersService } from '@modules/iam/users/users.service';
import { Case } from '@modules/case/entities/case.entity';

@Injectable()
export class EmailIngestWorker {
  private readonly log = new Logger('EmailIngest');

  constructor(
    @InjectRepository(EmailChannel) private chRepo: Repository<EmailChannel>,
    @InjectRepository(EmailInboundState)
    private stateRepo: Repository<EmailInboundState>,
    @InjectRepository(EmailMessage) private msgRepo: Repository<EmailMessage>,
    @InjectRepository(EmailRoutingRule)
    private ruleRepo: Repository<EmailRoutingRule>,

    private readonly caseService: CaseService,
    private readonly userService: UsersService,
  ) {
    setInterval(() => this.tick().catch((e) => this.log.error(e)), 15000);
  }

  private async tick() {
    // this.log.debug('Starting polling cycle for inbound channels');
    const inbound = await this.chRepo.find({
      where: { kind: In(['imap', 'pop3'] as any), enabled: true } as any,
    });
    // this.log.debug(`Found ${inbound.length} enabled inbound channels to poll`);
    for (const ch of inbound) await this.pollChannel(ch);
    // this.log.debug('Completed polling cycle');
  }

  private async pollChannel(ch: EmailChannel) {
    this.log.debug(`Polling channel ${ch.id} (${ch.kind})`);
    const st =
      (await this.stateRepo.findOne({ where: { channelId: ch.id } })) ||
      this.stateRepo.create({ channelId: ch.id });
    st.lastPolledAt = new Date();
    await this.stateRepo.save(st);
    // TODO: use IMAP/POP3 client to fetch messages and call this.processMessage(ch, parsed)
  }

  // Core logic: thread or create
  async processMessage(
    ch: EmailChannel,
    m: {
      uid?: string | number;
      messageId?: string;
      inReplyTo?: string;
      references?: string[];
      from?: string;
      to?: string[];
      subject?: string;
      text?: string;
      html?: string;
    },
  ) {
    if (!m.messageId) {
      this.log.warn('Received message without messageId, skipping');
      return;
    }
    this.log.debug(`Processing incoming message ${m.messageId} from ${m.from}`);
    const exists = await this.msgRepo.findOne({
      where: { messageId: m.messageId },
    });
    if (exists) {
      this.log.debug(`Message ${m.messageId} already processed, skipping`);
      return;
    }

    const savedMsg = await this.msgRepo.save(
      this.msgRepo.create({
        channelId: ch.id,
        direction: 'inbound',
        messageId: m.messageId,
        inReplyTo: m.inReplyTo,
        references: m.references,
        fromAddr: m.from,
        toAddrs: m.to,
        subject: m.subject,
        textBody: m.text,
        htmlBody: m.html,
      }),
    );

    // 1) Thread by references
    this.log.debug('Checking for thread references to link to existing case');
    const ids = [
      ...(m.references ?? []),
      ...(m.inReplyTo ? [m.inReplyTo] : []),
    ].filter(Boolean) as string[];
    let caseRow: Case | null = null;
    if (ids.length) {
      this.log.debug(`Found ${ids.length} references to check`);
      const linked = await this.msgRepo.findOne({
        where: { messageId: In(ids) } as any,
      });
      if (linked?.caseId) {
        this.log.log(`Found linked message with case ${linked.caseId}`);
        caseRow = await this.caseService.getCase(linked.caseId);
      }
    }

    // 2) Subject CS-000123
    if (!caseRow) {
      this.log.debug('Checking subject for case number');
      const num = extractCaseNumber(m.subject);
      if (num) {
        this.log.log(`Found case number ${num} in subject`);
        caseRow = await this.caseService.getCaseByNumber(num);
      }
    }

    if (caseRow) {
      this.log.log(`Adding email as comment to existing case ${caseRow.id}`);
      await this.caseService.addComment(caseRow.id, {
        body: m.text || '(no text)',
        createdById: '00000000-0000-0000-0000-000000000000',
        createdByName: m.from || 'Email',
      } as any);
      await this.msgRepo.update(savedMsg.id, { caseId: caseRow.id });
      this.log.debug(`Message ${savedMsg.id} linked to case ${caseRow.id}`);
      return;
    }

    // 3) New case via routing rule
    this.log.debug('Searching for routing rule to create new case');
    const rule = await this.pickRule(ch, m);
    if (!rule?.assignGroupId) {
      this.log.warn(
        `No matching routing rule found for message ${m.messageId}, message will not be processed`,
      );
      return;
    }

    this.log.log(`Found routing rule ${rule.id}, creating new case`);
    let requesterId: string | undefined;
    if (m.from)
      requesterId = (await this.userService.getUserByEmail(m.from)).id;

    const created = await this.caseService.createCase({
      title: m.subject?.slice(0, 200) || 'Email request',
      businessLineId: ch.businessLine.id,
      assignmentGroupId: rule.assignGroupId,
      requesterId: requesterId,
      createdById: requesterId ?? '00000000-0000-0000-0000-000000000000',
      createdByName: requesterId ? 'Requester (email)' : 'Email',
    } as any);

    this.log.log(`Created new case ${created.id} from incoming email`);
    await this.msgRepo.update(savedMsg.id, { caseId: created.id });
  }

  private async pickRule(
    ch: EmailChannel,
    m: { to?: string[]; subject?: string; from?: string },
  ) {
    this.log.debug(
      `Picking routing rule for channel ${ch.id}, from: ${m.from}, subject: ${m.subject}`,
    );
    const rules = await this.ruleRepo.find({
      where: [
        { businessLineId: ch.businessLine.id, channelId: ch.id },
        { businessLineId: ch.businessLine.id, channelId: undefined },
      ],
      order: { id: 'ASC' },
    });
    this.log.debug(`Found ${rules.length} potential routing rules to evaluate`);
    const to = (m.to ?? []).join(',').toLowerCase();
    const subj = (m.subject ?? '').toLowerCase();
    const from = (m.from ?? '').toLowerCase();
    for (const r of rules) {
      this.log.debug(
        `Evaluating rule ${r.id}: toContains=${r.toContains}, subjectIncludes=${r.subjectIncludes}, fromDomain=${r.fromDomain}`,
      );
      if (r.toContains && !to.includes(r.toContains.toLowerCase())) continue;
      if (r.subjectIncludes && !subj.includes(r.subjectIncludes.toLowerCase()))
        continue;
      if (r.fromDomain && !from.endsWith('@' + r.fromDomain.toLowerCase()))
        continue;
      this.log.log(`Matched routing rule ${r.id}`);
      return r;
    }
    this.log.debug('No routing rule matched');
    return null;
  }
}
