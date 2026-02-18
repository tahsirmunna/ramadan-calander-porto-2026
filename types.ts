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

export interface AppSettings {
  language: Language;
  iftarAlarmEnabled: boolean;
  suhoorAlarmEnabled: boolean;
  voiceVolume: number;
}
