import { MusicEvent } from './event';

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  events: MusicEvent[];
}

export interface CalendarViewData {
  currentMonth: string;
  weekDays: string[];
  days: CalendarDay[];
}
