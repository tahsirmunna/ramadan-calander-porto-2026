
import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  Sun, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Globe, 
  X,
  Volume2,
  Calendar,
  Check,
  Play,
  VolumeX,
  Sparkles,
  MapPin,
  List,
  LayoutGrid,
  Linkedin,
  Share2
} from 'lucide-react';
import { Language, AppSettings } from './types';
import { CALENDAR_DATA, TRANSLATIONS } from './constants';

const ADHAN_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';
const ADHAN_FALLBACK_URL = 'https://ia800203.us.archive.org/20/items/Adhan_201509/Adhan.mp3';

const Lantern = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={`w-12 h-16 text-amber-500/40 ${className}`} viewBox="0 0 100 150" fill="currentColor" style={style}>
    <path d="M50 5 L40 25 L60 25 Z" />
    <rect x="35" y="25" width="30" height="5" rx="2" />
    <path d="M30 30 L70 30 L80 80 L20 80 Z" opacity="0.8" />
    <rect x="45" y="40" width="10" height="30" rx="2" opacity="0.6" />
    <path d="M20 80 L80 80 L70 110 L30 110 Z" />
    <circle cx="50" cy="120" r="10" opacity="0.4" />
    <path d="M50 0 L50 5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const DEFAULT_SETTINGS: AppSettings = {
  language: Language.BN,
  iftarAlarmEnabled: true,
  suhoorAlarmEnabled: true,
  voiceVolume: 0.8
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('ramadan_settings');
      if (saved) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to parse settings", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS[Language.EN];
  const isBengali = settings.language === Language.BN;
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const adhanBufferRef = useRef<AudioBuffer | null>(null);
  const adhanAudioFallbackRef = useRef<HTMLAudioElement | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const formatValue = (value: string | number) => {
    const valStr = value.toString();
    if (!isBengali) return valStr;
    const map: Record<string, string> = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return valStr.split('').map(char => map[char] || char).join('');
  };

  const getAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const isTodayDate = (dateStr: string) => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return dateStr === todayStr;
  };

  const getTimeParts = (timeInput: string | Date, includeSeconds = false) => {
    let hour: number;
    let minute: number;
    let second: number = 0;

    if (typeof timeInput === 'string') {
      const parts = timeInput.split(':');
      hour = parseInt(parts[0]) || 0;
      minute = parseInt(parts[1]) || 0;
    } else {
      hour = timeInput.getHours();
      minute = timeInput.getMinutes();
      second = timeInput.getSeconds();
    }

    let period = '';
    const p = t.periods;
    if (hour >= 4 && hour < 6) period = p.dawn;
    else if (hour >= 6 && hour < 12) period = p.morning;
    else if (hour >= 12 && hour < 15) period = p.noon;
    else if (hour >= 15 && hour < 18) period = p.afternoon;
    else if (hour >= 18 && hour < 20) period = p.evening;
    else period = p.night;

    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    const displaySecond = second.toString().padStart(2, '0');

    return {
      period,
      time: `${formatValue(displayHour)}:${formatValue(displayMinute)}${includeSeconds ? ':' + formatValue(displaySecond) : ''}`
    };
  };

  const getOrdinalDay = (day: number) => {
    if (settings.language === Language.BN) {
      const ordinals: Record<number, string> = {
        1: '১ম', 2: '২য়', 3: '৩য়', 4: '৪র্থ', 5: '৫ম',
        6: '৬ষ্ঠ', 7: '৭ম', 8: '৮ম', 9: '৯ম', 10: '১০ম'
      };
      return `${ordinals[day] || formatValue(day) + 'তম'} ${t.ramadanMonth}`;
    }
    if (settings.language === Language.PT) return `${day}º ${t.ramadanMonth}`;
    const j = day % 10, k = day % 100;
    if (j === 1 && k !== 11) return `${day}st ${t.ramadanMonth}`;
    if (j === 2 && k !== 12) return `${day}nd ${t.ramadanMonth}`;
    if (j === 3 && k !== 13) return `${day}rd ${t.ramadanMonth}`;
    return `${day}th ${t.ramadanMonth}`;
  };

  useEffect(() => {
    const prefetchAdhan = async () => {
      try {
        const response = await fetch(ADHAN_URL);
        if (!response.ok) throw new Error("Primary Adhan failed");
        const arrayBuffer = await response.arrayBuffer();
        const ctx = await getAudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        adhanBufferRef.current = audioBuffer;
      } catch (err) {
        console.warn("Adhan prefetch failed, falling back to element playback", err);
        adhanAudioFallbackRef.current = new Audio(ADHAN_URL);
        adhanAudioFallbackRef.current.addEventListener('error', () => {
           if (adhanAudioFallbackRef.current) adhanAudioFallbackRef.current.src = ADHAN_FALLBACK_URL;
        });
        adhanAudioFallbackRef.current.load();
      }
    };
    setTimeout(prefetchAdhan, 2000);
  }, []);

  useEffect(() => {
    localStorage.setItem('ramadan_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const foundIndex = CALENDAR_DATA.findIndex(d => d.date === todayStr);
    setCurrentDayIndex(foundIndex !== -1 ? foundIndex : 0);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkAlarms(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [settings, currentDayIndex]);

  const checkAlarms = (now: Date) => {
    const todayData = CALENDAR_DATA[currentDayIndex];
    if (!todayData) return;
    const timeStr = now.toTimeString().slice(0, 5);
    
    if (settings.iftarAlarmEnabled && timeStr === todayData.iftar && now.getSeconds() === 0 && isTodayDate(todayData.date)) {
      playAdhan();
    }
    
    if (settings.suhoorAlarmEnabled && timeStr === todayData.suhoor && now.getSeconds() === 0 && isTodayDate(todayData.date)) {
      playAdhan();
    }
  };

  const stopCurrentAudio = () => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch(e) {}
      currentSourceRef.current = null;
    }
    if (adhanAudioFallbackRef.current) {
      adhanAudioFallbackRef.current.pause();
      adhanAudioFallbackRef.current.currentTime = 0;
    }
    setIsPreviewing(false);
  };

  const playAdhan = async (isPreview = false) => {
    if (isPreview && isPreviewing) { 
      stopCurrentAudio(); 
      return; 
    }
    
    stopCurrentAudio();
    if (isPreview) setIsPreviewing(true);
    
    const ctx = await getAudioContext();
    if (adhanBufferRef.current) {
      const source = ctx.createBufferSource();
      source.buffer = adhanBufferRef.current;
      const gainNode = ctx.createGain();
      gainNode.gain.value = settings.voiceVolume;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.onended = () => setIsPreviewing(false);
      source.start();
      currentSourceRef.current = source;
    } else {
      const audio = adhanAudioFallbackRef.current || new Audio(ADHAN_URL);
      audio.volume = settings.voiceVolume;
      audio.onended = () => setIsPreviewing(false);
      try {
        await audio.play();
      } catch (err) {
        audio.src = ADHAN_FALLBACK_URL;
        try { await audio.play(); } catch(e) { setIsPreviewing(false); }
      }
    }
  };

  const currentData = CALENDAR_DATA[currentDayIndex] || CALENDAR_DATA[0];
  const daysRemaining = Math.max(0, 30 - currentData.ramadanDay);

  const getLocalizedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const mIdx = parseInt(month) - 1;
    const monthName = t.months[mIdx];
    if (settings.language === Language.BN) return `${formatValue(day)} ${monthName}, ${formatValue(year)}`;
    if (settings.language === Language.PT) return `${day} de ${monthName}`;
    return `${monthName} ${day}`;
  };

  const isAfterIftarToday = () => {
    if (!isTodayDate(currentData.date)) return false;
    const [h, m] = currentData.iftar.split(':').map(Number);
    const iftarTime = new Date();
    iftarTime.setHours(h, m, 0, 0);
    return currentTime.getTime() > iftarTime.getTime();
  };

  const getCountdown = (timeStr: string, dateStr: string) => {
    if (!timeStr || !dateStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const targetDate = new Date(dateStr);
    targetDate.setHours(h, m, 0, 0);
    const diff = targetDate.getTime() - currentTime.getTime();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${formatValue(pad(hours))}:${formatValue(pad(minutes))}:${formatValue(pad(seconds))}`;
  };

  const getSuhoorCountdown = () => {
    const afterIftar = isAfterIftarToday();
    const isToday = isTodayDate(currentData.date);
    if (isToday && afterIftar) {
      const tomorrowIndex = currentDayIndex + 1;
      if (tomorrowIndex < CALENDAR_DATA.length) {
        const tomorrow = CALENDAR_DATA[tomorrowIndex];
        return getCountdown(tomorrow.suhoor, tomorrow.date);
      }
    }
    return getCountdown(currentData.suhoor, currentData.date);
  };

  const getAshraLabel = () => {
    const day = currentData.ramadanDay;
    if (day <= 10) return t.ashra1;
    if (day <= 20) return t.ashra2;
    return t.ashra3;
  };

  const handleShare = async () => {
    const dayOrdinal = getOrdinalDay(currentData.ramadanDay);
    const suhoorTime = getTimeParts(currentData.suhoor).time;
    const iftarTime = getTimeParts(currentData.iftar).time;
    const dateFormatted = getLocalizedDate(currentData.date);
    
    const message = t.shareMessage
      .replace('{date}', dateFormatted)
      .replace('{day}', dayOrdinal)
      .replace('{suhoor}', suhoorTime)
      .replace('{iftar}', iftarTime);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.title,
          text: message,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${message}\n${window.location.href}`);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
    }
  };

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col items-center p-4 md:p-8 transition-all duration-700 ${isBengali ? 'font-bengali' : ''}`} onClick={() => getAudioContext()}>
      
      <div className="absolute top-0 left-0 w-full flex justify-between px-10 pointer-events-none opacity-40 md:opacity-100">
        <Lantern className="float-animation" />
        <Lantern className="float-animation" style={{ animationDelay: '1s' }} />
      </div>

      <header className="w-full max-w-4xl flex justify-between items-center mb-5 md:mb-10 z-30">
        <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
          <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0 float-animation">
            <Moon className="text-amber-500 w-7 h-7 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-base md:text-2xl font-black tracking-tight leading-tight ${isBengali ? 'font-bengali-bold text-amber-500' : 'text-white'}`}>{t.title}</h1>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-slate-500" />
              <p className="text-[6.5px] md:text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-80 whitespace-nowrap">{t.subTitle}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowFullCalendar(!showFullCalendar)} className="bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 p-2.5 rounded-2xl transition-all shadow-xl backdrop-blur-md">
            {showFullCalendar ? <LayoutGrid className="w-5 h-5 text-amber-500" /> : <List className="w-5 h-5 text-amber-500" />}
          </button>
          
          <button onClick={() => setIsSettingsOpen(true)} className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 md:px-5 py-2.5 rounded-2xl transition-all shadow-xl backdrop-blur-md flex items-center gap-2 group">
            <Bell className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform" />
            <span className={`hidden sm:inline text-[10px] md:text-[11px] font-black uppercase tracking-widest text-amber-200 ${isBengali ? 'font-bengali-bold' : ''}`}>{t.alarmsBtn}</span>
          </button>
          
          <div className="relative">
            <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 px-3 py-2.5 rounded-2xl transition-all flex items-center gap-2 shadow-xl backdrop-blur-md">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300">{settings.language.toUpperCase()}</span>
            </button>
            {isLangMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)}></div>
                <div className="absolute right-0 top-full mt-4 w-44 bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
                  {(Object.values(Language) as Language[]).map(lang => (
                    <button key={lang} onClick={() => { setSettings(s => ({...s, language: lang})); setIsLangMenuOpen(false); }} className={`w-full text-left px-6 py-4 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-between ${settings.language === lang ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400'}`}>
                      <span>{lang === Language.EN ? 'English' : lang === Language.BN ? 'বাংলা' : 'Português'}</span>
                      {settings.language === lang && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl z-10 flex flex-col gap-4 md:gap-8">
        {!showFullCalendar ? (
          <>
            <div className="glass-panel rounded-[2rem] md:rounded-[3.5rem] p-4 md:p-14 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 p-12 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity"><Sparkles className="w-40 h-40 text-amber-500" /></div>
              
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-10 gap-4 md:gap-10 relative z-10">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 mb-1.5 md:mb-5">
                    <div className="inline-flex items-center gap-2 md:gap-3 bg-amber-500/10 px-3 md:px-5 py-1 md:py-2 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                      <span className={`text-[8px] md:text-[13px] font-bold uppercase tracking-[0.2em] text-amber-400`}>{getLocalizedDate(currentData.date)} • {t.weekdays[currentData.weekday]}</span>
                    </div>
                    
                    <button 
                      onClick={handleShare}
                      className="bg-amber-500/10 hover:bg-amber-500/20 px-2 md:px-3 py-1 md:py-2 rounded-full border border-amber-500/20 transition-all flex items-center gap-1.5 md:gap-2 group/share shadow-lg"
                      title={t.share}
                    >
                      <Share2 className="w-3 h-3 md:w-5 md:h-5 text-amber-500 group-hover/share:scale-110 transition-transform" />
                      <span className="text-[7px] md:text-xs font-black uppercase tracking-widest text-amber-200/80">{showCopied ? t.copied : t.share}</span>
                    </button>
                  </div>

                  <h2 className={`text-2xl md:text-8xl font-black text-white leading-tight ${isBengali ? 'font-bengali-bold' : ''}`}>{getOrdinalDay(currentData.ramadanDay)}</h2>
                  <div className="flex items-center gap-2 md:gap-3 mt-1 justify-center md:justify-start">
                    <p className={`text-[7px] md:text-sm font-bold text-amber-500/80 tracking-[0.1em] uppercase`}>{getAshraLabel()}</p>
                    
                    <span className={`text-[6px] md:text-[10px] font-black flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all bg-emerald-400/15 text-emerald-400 border-emerald-400/30 animate-pulse`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400`}></span>
                      <span className={isBengali ? 'font-bengali-bold' : ''}>{t.ongoing}</span>
                    </span>
                  </div>
                </div>
                
                <div className="bg-slate-950/40 border border-slate-800/50 p-2.5 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center gap-0 backdrop-blur-2xl shadow-inner min-w-[120px] md:min-w-[220px]">
                  <span className={`text-[6px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-0.5`}>{t.currentTimeLabel}</span>
                  <div className="flex flex-col items-center">
                    <span className="text-lg md:text-5xl font-black text-white tracking-tighter leading-none">{getTimeParts(currentTime, true).time}</span>
                    <span className="text-[8px] md:text-sm font-bold text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10 mt-1">{getTimeParts(currentTime).period}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-14 mb-5 md:mb-10 relative z-10">
                <div className="bg-gradient-to-br from-emerald-400/20 via-emerald-950/40 to-slate-950/80 p-5 md:p-14 rounded-[2rem] md:rounded-[4rem] border border-emerald-400/30 text-center flex flex-col items-center shadow-[0_0_40px_rgba(52,211,153,0.1)] group/item relative">
                  <div className="bg-emerald-400/10 p-1.5 md:p-4 rounded-full mb-1.5 md:mb-6">
                    <Sun className="w-5 h-5 md:w-10 md:h-10 text-emerald-400" />
                  </div>
                  <span className={`text-[10px] md:text-2xl font-black uppercase tracking-widest text-emerald-100 mb-0.5 md:mb-4`}>{t.suhoor}</span>
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-[10rem] font-black text-white drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] leading-none">
                        {isAfterIftarToday() ? getTimeParts(CALENDAR_DATA[currentDayIndex + 1]?.suhoor || currentData.suhoor).time : getTimeParts(currentData.suhoor).time}
                      </span>
                    </div>
                    <span className="text-[9px] md:text-xl font-bold text-emerald-400/80 mt-1.5 md:mt-5 px-2.5 py-0.5 md:py-1 bg-emerald-500/10 rounded-md border border-emerald-500/10">
                      {isAfterIftarToday() ? t.today : t.periods.dawn}
                    </span>
                  </div>
                  <div className="mt-3 md:mt-10 flex items-center justify-center min-h-[1rem]">
                    {getSuhoorCountdown() ? (
                      <span className="text-[7px] md:text-base font-bold text-emerald-200 bg-emerald-500/10 px-3 md:px-6 py-1 md:py-2.5 rounded-full border border-emerald-500/20">{t.suhoorRemaining}: {getSuhoorCountdown()}</span>
                    ) : (isTodayDate(currentData.date) && !isAfterIftarToday() && <span className="text-[7px] md:text-base font-bold text-rose-300 bg-rose-500/10 px-3 md:px-6 py-1 md:py-2.5 rounded-full">{t.suhoorEnded}</span>)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-400/20 via-orange-950/40 to-slate-950/80 p-5 md:p-14 rounded-[2rem] md:rounded-[4rem] border border-orange-400/30 text-center flex flex-col items-center shadow-[0_0_40px_rgba(251,146,60,0.1)] group/item relative">
                  <div className="bg-orange-400/10 p-1.5 md:p-4 rounded-full mb-1.5 md:mb-6">
                    <Moon className="w-5 h-5 md:w-10 md:h-10 text-orange-400" />
                  </div>
                  <span className={`text-[10px] md:text-2xl font-black uppercase tracking-widest text-orange-100 mb-0.5 md:mb-4`}>{t.iftar}</span>
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-[10rem] font-black text-white drop-shadow-[0_0_20px_rgba(251,146,60,0.4)] leading-none">{getTimeParts(currentData.iftar).time}</span>
                    </div>
                    <span className="text-[9px] md:text-xl font-bold text-orange-400/80 mt-1.5 md:mt-5 px-2.5 py-0.5 md:py-1 bg-orange-500/10 rounded-md border border-orange-500/10">{t.periods.evening}</span>
                  </div>
                  <div className="mt-3 md:mt-10 flex items-center justify-center min-h-[1rem]">
                    {getCountdown(currentData.iftar, currentData.date) ? (
                      <span className="text-[7px] md:text-base font-bold text-orange-200 bg-orange-500/10 px-3 md:px-6 py-1 md:py-2.5 rounded-full border border-orange-500/20">{t.iftarRemaining}: {getCountdown(currentData.iftar, currentData.date)}</span>
                    ) : (isTodayDate(currentData.date) && <span className="text-[7px] md:text-base font-bold text-orange-300 bg-orange-500/10 px-3 md:px-6 py-1 md:py-2.5 rounded-full">{t.iftarEnded}</span>)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 md:gap-8 bg-slate-950/30 p-1.5 rounded-[1.5rem] md:rounded-full border border-slate-800/40 relative z-10">
                <button onClick={() => setCurrentDayIndex(p => Math.max(0, p - 1))} className="w-8 h-8 md:w-14 md:h-14 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded-xl md:rounded-full flex items-center justify-center transition-all">
                  <ChevronLeft className="w-4 h-4 md:w-10 md:h-10" />
                </button>
                <div className="flex-1 flex flex-col items-center">
                  <button onClick={() => { 
                    const d = new Date();
                    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const idx = CALENDAR_DATA.findIndex(d => d.date === todayStr);
                    setCurrentDayIndex(idx !== -1 ? idx : 0); 
                  }} className="text-[6px] md:text-[11px] font-black uppercase tracking-widest text-amber-500 mb-1">{t.today}</button>
                  <div className="w-full bg-slate-900 h-1 md:h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all duration-700" style={{ width: `${((currentDayIndex + 1) / CALENDAR_DATA.length) * 100}%` }}></div>
                  </div>
                </div>
                <button onClick={() => setCurrentDayIndex(p => Math.min(CALENDAR_DATA.length - 1, p + 1))} className="w-8 h-8 md:w-14 md:h-14 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded-xl md:rounded-full flex items-center justify-center transition-all">
                  <ChevronRight className="w-4 h-4 md:w-10 md:h-10" />
                </button>
              </div>
            </div>

            <div className="w-full glass-panel border-amber-500/10 px-6 py-4 md:py-8 rounded-[2rem] flex items-center justify-between group">
              <div className="flex items-center gap-3 md:gap-4">
                <Calendar className="w-6 h-6 md:w-10 md:h-10 text-amber-500/40" />
                <p className={`text-amber-100 font-black text-sm md:text-xl whitespace-pre-line leading-tight`}>{t.daysRemaining}</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className={`text-4xl md:text-9xl font-black text-amber-500 leading-none`}>{formatValue(daysRemaining)}</span>
                <span className="text-[10px] md:text-3xl font-black text-slate-500 mt-1 md:mt-4 opacity-60 leading-none tracking-widest">( - {formatValue(1)} )</span>
              </div>
            </div>
          </>
        ) : (
          <div className="glass-panel rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-4xl font-black text-amber-500">{t.fullCalendar}</h2>
                <button onClick={() => setShowFullCalendar(false)} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
             </div>
             <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-800/60 text-slate-300 text-[10px] md:text-sm font-black uppercase tracking-widest">
                     <th className="px-4 py-4">{t.ramadanDay}</th>
                     <th className="px-4 py-4">{t.date}</th>
                     <th className="px-4 py-4 text-emerald-400">{t.suhoor}</th>
                     <th className="px-4 py-4 text-orange-400">{t.iftar}</th>
                   </tr>
                 </thead>
                 <tbody className="text-slate-200">
                   {CALENDAR_DATA.map((day, idx) => {
                     const isToday = isTodayDate(day.date);
                     return (
                       <tr 
                         key={day.ramadanDay} 
                         onClick={() => { setCurrentDayIndex(idx); setShowFullCalendar(false); }}
                         className={`border-t border-slate-800 hover:bg-slate-700/40 cursor-pointer transition-colors ${isToday ? 'bg-amber-500/10' : ''}`}
                       >
                         <td className="px-4 py-4 font-bold">{formatValue(day.ramadanDay)}</td>
                         <td className="px-4 py-4">
                           <div className="flex flex-col">
                             <span className="text-[10px] md:text-sm font-bold">{getLocalizedDate(day.date)}</span>
                             <span className="text-[8px] md:text-xs text-slate-500">{t.weekdays[day.weekday]}</span>
                           </div>
                         </td>
                         <td className="px-4 py-4 font-mono text-emerald-300/80">{formatValue(day.suhoor)}</td>
                         <td className="px-4 py-4 font-mono text-orange-300/80">{formatValue(day.iftar)}</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => { stopCurrentAudio(); setIsSettingsOpen(false); }}></div>
          <div className="bg-slate-900 border border-slate-700/50 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative z-110 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white">{t.alarmsBtn}</h2>
              <button onClick={() => { stopCurrentAudio(); setIsSettingsOpen(false); }} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-3xl border border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-500/10 p-2 rounded-xl"><Moon className="w-5 h-5 text-orange-500" /></div>
                </div>
                <button 
                  onClick={() => setSettings(s => ({...s, iftarAlarmEnabled: !s.iftarAlarmEnabled}))}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.iftarAlarmEnabled ? 'bg-orange-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.iftarAlarmEnabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-3xl border border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/10 p-2 rounded-xl"><Sun className="w-5 h-5 text-emerald-400" /></div>
                </div>
                <button 
                  onClick={() => setSettings(s => ({...s, suhoorAlarmEnabled: !s.suhoorAlarmEnabled}))}
                  className={`w-14 h-8 rounded-full transition-all relative ${settings.suhoorAlarmEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.suhoorAlarmEnabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-3xl border border-slate-800/50 space-y-4">
                <div className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-slate-400" /><span className="text-xs font-black uppercase tracking-widest text-slate-400">{t.volume}</span></div>
                <input 
                  type="range" min="0" max="1" step="0.1" 
                  value={settings.voiceVolume} 
                  onChange={(e) => setSettings(s => ({...s, voiceVolume: parseFloat(e.target.value)}))}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none accent-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => playAdhan(true)}
                  className={`w-full p-6 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${isPreviewing ? 'bg-amber-500 text-slate-950 scale-[0.98]' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 shadow-xl border border-slate-700/50'}`}
                >
                  {isPreviewing ? <VolumeX className="w-6 h-6" /> : <Play className="w-6 h-6 text-amber-500" />}
                  <span className={isBengali ? 'text-lg font-bengali-bold' : ''}>{t.listenAdhan}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-8 pb-10 text-center z-30">
        <div className="mb-6 px-4">
          <p className="text-[10px] md:text-xs text-amber-500/70 italic font-medium tracking-wide">
            {t.hadith}
          </p>
        </div>
        <div className="flex justify-center items-center">
          <a 
            href="https://www.linkedin.com/in/tahsirmunna" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-slate-800/20 hover:bg-amber-500/10 border border-slate-800/50 hover:border-amber-500/30 px-5 py-3 rounded-2xl transition-all hover:scale-105 shadow-2xl backdrop-blur-sm"
          >
            <p className="text-[10px] md:text-[13px] font-black tracking-[0.2em] md:tracking-[0.4em] uppercase text-slate-400 group-hover:text-amber-500 transition-colors">
              © TAHSIR AHMED MUNNA
            </p>
            <Linkedin className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </a>
        </div>
      </footer>
    </div>
  );
}
