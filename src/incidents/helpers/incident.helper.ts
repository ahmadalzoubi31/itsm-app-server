import { Injectable } from '@nestjs/common';
import { ImpactEnum } from '../constants/impact.constant';
import { PriorityEnum, PRIORITY_MATRIX } from '../constants/priority.constant';
import { UrgencyEnum } from '../constants/urgency.constant';

@Injectable()
export class IncidentHelper {
  constructor() {}

  // Function to calculate priority based on impact and urgency
  calculatePriority(impact: ImpactEnum, urgency: UrgencyEnum): PriorityEnum {
    const match = PRIORITY_MATRIX.find(
      (m) => m.impact === impact && m.urgency === urgency,
    );
    return match?.priority || PriorityEnum.MEDIUM;
  }
}
