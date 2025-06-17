import { Injectable } from '@nestjs/common';
import { Impact } from '../enums/impact.enum';
import { Priority } from '../enums/priority.enum';
import { Urgency } from '../enums/urgency.enum';

@Injectable()
export class IncidentHelper {
  constructor() {}

  // Priority matrix to determine priority based on impact and urgency
  private readonly PRIORITY_MATRIX = [
    {
      impact: Impact.CRITICAL,
      urgency: Urgency.CRITICAL,
      priority: Priority.CRITICAL,
    },
    {
      impact: Impact.CRITICAL,
      urgency: Urgency.HIGH,
      priority: Priority.CRITICAL,
    },
    {
      impact: Impact.CRITICAL,
      urgency: Urgency.MEDIUM,
      priority: Priority.HIGH,
    },
    {
      impact: Impact.CRITICAL,
      urgency: Urgency.LOW,
      priority: Priority.MEDIUM,
    },

    {
      impact: Impact.HIGH,
      urgency: Urgency.CRITICAL,
      priority: Priority.CRITICAL,
    },
    { impact: Impact.HIGH, urgency: Urgency.HIGH, priority: Priority.HIGH },
    { impact: Impact.HIGH, urgency: Urgency.MEDIUM, priority: Priority.MEDIUM },
    { impact: Impact.HIGH, urgency: Urgency.LOW, priority: Priority.LOW },

    {
      impact: Impact.MEDIUM,
      urgency: Urgency.CRITICAL,
      priority: Priority.HIGH,
    },
    { impact: Impact.MEDIUM, urgency: Urgency.HIGH, priority: Priority.MEDIUM },
    {
      impact: Impact.MEDIUM,
      urgency: Urgency.MEDIUM,
      priority: Priority.MEDIUM,
    },
    { impact: Impact.MEDIUM, urgency: Urgency.LOW, priority: Priority.LOW },

    {
      impact: Impact.LOW,
      urgency: Urgency.CRITICAL,
      priority: Priority.MEDIUM,
    },
    { impact: Impact.LOW, urgency: Urgency.HIGH, priority: Priority.LOW },
    { impact: Impact.LOW, urgency: Urgency.MEDIUM, priority: Priority.LOW },
    { impact: Impact.LOW, urgency: Urgency.LOW, priority: Priority.LOW },
  ];

  // Function to calculate priority based on impact and urgency
  calculatePriority(impact: Impact, urgency: Urgency): Priority {
    const match = this.PRIORITY_MATRIX.find(
      (m) => m.impact === impact && m.urgency === urgency,
    );
    return match?.priority || Priority.MEDIUM;
  }
}
