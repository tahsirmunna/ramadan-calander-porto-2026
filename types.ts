export enum Language {
  EN = 'en',
  BN = 'bn',
  PT = 'pt'
}

export interface CalendarDay {
  ramadanDay: number;
  date: string; // ISO string or simple DD-MM-YYYY
  weekday: string;
  suhoor: string;
  iftar: string;
}

export interface GreetingCard {
  id: string;
  icon: any; // Lucide icon component
  color: string; // Tailwind color class for the icon
  messages: Record<Language, string>;
}

export interface AppSettings {
  language: Language;
  iftarAlarmEnabled: boolean;
  suhoorAlarmEnabled: boolean;
  voiceVolume: number;
}
