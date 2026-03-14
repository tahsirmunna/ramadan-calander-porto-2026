
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
  Share2,
  HandHeart,
  Copy,
  Maximize2
} from 'lucide-react';

import { Language, AppSettings } from './types';
import { CALENDAR_DATA, TRANSLATIONS } from './constants';

const ADHAN_NORMAL_URLS = [
  'https://ia800203.us.archive.org/20/items/Adhan_201509/Adhan.mp3',
  'https://www.islamcan.com/audio/adhan/azan20.mp3',
  'https://ia801300.us.archive.org/19/items/Adhan_Makkah/Adhan_Makkah.mp3'
];
const ADHAN_FAJR_URLS = [
  'https://www.islamcan.com/audio/adhan/azan2.mp3',
  'https://ia800203.us.archive.org/20/items/Adhan_201509/Adhan.mp3',
  'https://ia801300.us.archive.org/19/items/Adhan_Makkah/Adhan_Fajr.mp3'
];
const ADHAN_FALLBACK_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';

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
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCountdownPopup, setShowCountdownPopup] = useState(false);
  const [showEidSchedule, setShowEidSchedule] = useState(false);
  const [popupType, setPopupType] = useState<'suhoor' | 'iftar' | null>(null);
  const [lastPopupClosedTime, setLastPopupClosedTime] = useState<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS[Language.EN];
  const isBengali = settings.language === Language.BN;

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
          console.log('Wake Lock was released');
        });
        
        console.log('Wake Lock is active');
      } catch (err: any) {
        // Silently handle permission policy errors as they might be platform-restricted
        if (err.name !== 'NotAllowedError') {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    }
  };

  useEffect(() => {
    // Attempt on mount
    requestWakeLock();
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef<number>(0);

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
    const prefetchAdhan = () => {
      // Use Audio elements for preloading to avoid CORS fetch issues
      const preload = (urls: string[]) => {
        urls.forEach(url => {
          const audio = new Audio(url);
          audio.preload = 'auto';
          audio.load();
        });
      };
      
      preload(ADHAN_NORMAL_URLS);
      preload(ADHAN_FAJR_URLS);
      
      const fallbackAudio = new Audio(ADHAN_FALLBACK_URL);
      fallbackAudio.preload = 'auto';
      fallbackAudio.load();
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
    // Check if we should show popup on load/day change
    const now = new Date();
    const todayData = CALENDAR_DATA[currentDayIndex];
    if (!todayData || !isTodayDate(todayData.date)) return;

    const checkInitialPopup = (targetTimeStr: string, type: 'suhoor' | 'iftar') => {
      const [h, m] = targetTimeStr.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(h, m, 0, 0);
      
      const diff = targetDate.getTime() - now.getTime();
      const minutesLeft = Math.floor(diff / 60000);

      // If within 15 minutes and not yet passed (or just passed within a minute margin if needed, but let's stick to future)
      if (minutesLeft <= 15 && minutesLeft >= 0) {
        setPopupType(type);
        setShowCountdownPopup(true);
      }
    };

    checkInitialPopup(todayData.iftar, 'iftar');
    checkInitialPopup(todayData.suhoor, 'suhoor');
  }, [currentDayIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkAlarms(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [settings, currentDayIndex, showCountdownPopup, popupType, lastPopupClosedTime, isAudioPlaying]);

  const lastAlarmFiredRef = useRef<string | null>(localStorage.getItem('lastAlarmFiredId'));

  const checkAlarms = (now: Date) => {
    const timeStr = now.toTimeString().slice(0, 5);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const alarmKey = `${todayStr}-${timeStr}`;

    // Find actual today's data for alarms
    const actualTodayData = CALENDAR_DATA.find(d => d.date === todayStr);
    
    // Use currentDayIndex data for UI-related popup logic
    const uiData = CALENDAR_DATA[currentDayIndex];
    if (!uiData) return;
    
    // Check for 15 minutes remaining (Popup logic)
    const checkFifteenMinutesLeft = (targetTimeStr: string, type: 'suhoor' | 'iftar') => {
      if (!isTodayDate(uiData.date)) return;
      
      const [h, m] = targetTimeStr.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(h, m, 0, 0);
      
      const diff = targetDate.getTime() - now.getTime();
      const minutesLeft = Math.floor(diff / 60000);
      
      if (diff <= 0) {
        // If time reached, only close if audio is NOT playing AND we are past the alarm minute
        // or if the alarm for this type is disabled.
        const isAlarmEnabled = type === 'iftar' ? settings.iftarAlarmEnabled : settings.suhoorAlarmEnabled;
        const isPastAlarmMinute = diff < -60000;
        
        if (showCountdownPopup && popupType === type) {
          // CRITICAL: Never close the popup automatically if audio is playing
          if (isAudioPlaying) return;

          if (isPastAlarmMinute || !isAlarmEnabled) {
            setShowCountdownPopup(false);
            setPopupType(null);
          }
        }
      } else if (minutesLeft <= 15 && minutesLeft >= 0 && !showCountdownPopup) {
         const timeSinceClose = lastPopupClosedTime ? now.getTime() - lastPopupClosedTime : Infinity;
         
         if (minutesLeft === 15 && now.getSeconds() === 0) {
            setPopupType(type);
            setShowCountdownPopup(true);
         } else if (timeSinceClose >= 5 * 60 * 1000) {
            setPopupType(type);
            setShowCountdownPopup(true);
            setLastPopupClosedTime(Date.now()); 
         }
      }
    };

    checkFifteenMinutesLeft(uiData.iftar, 'iftar');
    checkFifteenMinutesLeft(uiData.suhoor, 'suhoor');

    // Alarm logic - triggers once per minute
    if (actualTodayData && lastAlarmFiredRef.current !== alarmKey) {
      const isIftarTime = timeStr === actualTodayData.iftar;
      const isSuhoorTime = timeStr === actualTodayData.suhoor;

      if (settings.iftarAlarmEnabled && isIftarTime) {
        playAdhan('normal');
        setPopupType('iftar');
        setShowCountdownPopup(true);
        lastAlarmFiredRef.current = alarmKey;
        localStorage.setItem('lastAlarmFiredId', alarmKey);
      } else if (settings.suhoorAlarmEnabled && isSuhoorTime) {
        playAdhan('fajr');
        setPopupType('suhoor');
        setShowCountdownPopup(true);
        lastAlarmFiredRef.current = alarmKey;
        localStorage.setItem('lastAlarmFiredId', alarmKey);
      }
    }
  };

  const stopCurrentAudio = (keepPopup = false, willPlayNext = false) => {
    playbackIdRef.current++;
    
    if (adhanAudioRef.current) {
      const audio = adhanAudioRef.current;
      audio.pause();
      audio.src = "";
      audio.removeAttribute('src');
      try {
        audio.load();
      } catch (e) {}
    }

    if (!willPlayNext) {
      setIsAudioPlaying(false);
    }
    
    // Close popup when audio is stopped manually
    if (!keepPopup) {
      setShowCountdownPopup(false);
      setPopupType(null);
    }
  };

  const playAdhan = async (type: 'normal' | 'fajr' = 'normal', isPreview = false) => {
    if (isAudioPlaying && isPreview) { 
      stopCurrentAudio(); 
      return; 
    }
    
    setIsAudioPlaying(true);
    stopCurrentAudio(true, true);
    const currentPlaybackId = playbackIdRef.current;

    // If not a preview (actual alarm), ensure popup is shown
    if (!isPreview) {
      setPopupType(type === 'fajr' ? 'suhoor' : 'iftar');
      setShowCountdownPopup(true);
    }
    
    const urls = type === 'fajr' ? ADHAN_FAJR_URLS : ADHAN_NORMAL_URLS;
    const allUrls = [...urls, ADHAN_FALLBACK_URL];

    if (!adhanAudioRef.current) {
      adhanAudioRef.current = new Audio();
    }
    const audio = adhanAudioRef.current;
    audio.volume = settings.voiceVolume;

    const tryPlay = async (index: number): Promise<boolean> => {
      if (currentPlaybackId !== playbackIdRef.current) return false;
      if (index >= allUrls.length) {
        setIsAudioPlaying(false);
        if (!isPreview) {
          setShowCountdownPopup(false);
          setPopupType(null);
        }
        return false;
      }

      return new Promise((resolve) => {
        const url = allUrls[index];
        audio.src = url;
        
        const onEnded = () => {
          cleanup();
          if (currentPlaybackId !== playbackIdRef.current) {
            resolve(false);
            return;
          }
          setIsAudioPlaying(false);
          if (!isPreview) {
            setShowCountdownPopup(false);
            setPopupType(null);
          }
          resolve(true);
        };

        const onError = async () => {
          cleanup();
          if (currentPlaybackId !== playbackIdRef.current) {
            resolve(false);
            return;
          }
          console.warn(`Adhan playback failed for ${url}, trying next...`);
          resolve(await tryPlay(index + 1));
        };

        const cleanup = () => {
          audio.removeEventListener('ended', onEnded);
          audio.removeEventListener('error', onError);
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        audio.play().then(() => {
          if (currentPlaybackId !== playbackIdRef.current) {
            audio.pause();
            audio.src = "";
            cleanup();
            resolve(false);
          }
        }).catch(async (err) => {
          cleanup();
          if (currentPlaybackId !== playbackIdRef.current) {
            resolve(false);
            return;
          }
          console.warn(`Adhan play() failed for ${url}:`, err);
          resolve(await tryPlay(index + 1));
        });
      });
    };

    await tryPlay(0);
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
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
    <div className={`min-h-screen text-slate-100 flex flex-col items-center p-4 md:p-8 transition-all duration-700 ${isBengali ? 'font-bengali' : ''}`} onClick={() => { getAudioContext(); requestWakeLock(); }}>
      
      <div className="absolute top-0 left-0 w-full flex justify-between px-10 pointer-events-none opacity-40 md:opacity-100">
        <Lantern className="float-animation" />
        <Lantern className="float-animation" style={{ animationDelay: '1s' }} />
      </div>

      <header className="w-full max-w-4xl flex flex-col items-center gap-6 mb-8 md:mb-12 z-30 -mt-2 md:-mt-4">
        <div className="flex flex-row items-center text-left gap-4">
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] float-animation">
            <Moon className="text-amber-500 w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div>
            <h1 className={`text-lg md:text-3xl font-black tracking-tight leading-tight mb-1 ${isBengali ? 'font-bengali-bold text-amber-500' : 'text-white'}`}>{t.title}</h1>
            <div className="flex items-center justify-start gap-2">
              <MapPin className="w-3 h-3 text-slate-500" />
              <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-80">{t.subTitle}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800/50 backdrop-blur-md shadow-2xl">
          <button onClick={() => { setShowDonate(true); setShowFullCalendar(false); }} className={`p-3 rounded-xl transition-all flex items-center gap-2 hover:bg-slate-800/60 text-slate-400 hover:text-amber-500`}>
            <HandHeart className="w-5 h-5" />
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{t.donate}</span>
          </button>

          <div className="w-px h-6 bg-slate-800/50 mx-1"></div>

          <button onClick={() => { setShowFullCalendar(!showFullCalendar); }} className={`p-3 rounded-xl transition-all flex items-center gap-2 ${showFullCalendar ? 'bg-amber-500/20 text-amber-500' : 'hover:bg-slate-800/60 text-slate-400 hover:text-amber-500'}`}>
            {showFullCalendar ? <LayoutGrid className="w-5 h-5" /> : <List className="w-5 h-5" />}
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{t.fullCalendar}</span>
          </button>

          <div className="w-px h-6 bg-slate-800/50 mx-1"></div>
          
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-amber-500 transition-all flex items-center gap-2 group">
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className={`hidden md:inline text-[10px] font-black uppercase tracking-widest ${isBengali ? 'font-bengali-bold' : ''}`}>{t.alarmsBtn}</span>
          </button>
          
          <div className="w-px h-6 bg-slate-800/50 mx-1"></div>
          
          <div className="relative">
            <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="p-3 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-amber-500 transition-all flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{settings.language.toUpperCase()}</span>
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

          {isAudioPlaying && (
            <>
              <div className="w-px h-6 bg-slate-800/50 mx-1"></div>
              <button 
                onClick={() => stopCurrentAudio()} 
                className="p-3 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all flex items-center gap-2 animate-pulse"
              >
                <VolumeX className="w-5 h-5" />
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{t.stopAlarm}</span>
              </button>
            </>
          )}
        </div>

        <button 
          onClick={() => setShowEidSchedule(true)} 
          className="w-full max-w-4xl p-4 md:p-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 transition-all flex items-center justify-center gap-3 group shadow-lg shadow-amber-500/5"
        >
          <Maximize2 className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          <span className={`text-xs md:text-base font-black uppercase tracking-[0.2em] ${isBengali ? 'font-bengali-bold' : ''}`}>
            {t.eidSchedule}
          </span>
        </button>
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
                <div className="bg-gradient-to-br from-emerald-400/20 via-emerald-950/40 to-slate-950/80 p-5 md:p-8 lg:p-14 rounded-[2rem] md:rounded-[4rem] border border-emerald-400/30 text-center flex flex-col items-center shadow-[0_0_40px_rgba(52,211,153,0.1)] group/item relative">
                  <div className="bg-emerald-400/10 p-1.5 md:p-4 rounded-full mb-1.5 md:mb-6">
                    <Sun className="w-5 h-5 md:w-10 md:h-10 text-emerald-400" />
                  </div>
                  <span className={`text-[10px] md:text-xl lg:text-2xl font-black uppercase tracking-widest text-emerald-100 mb-0.5 md:mb-4`}>{t.suhoor}</span>
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-6xl lg:text-8xl xl:text-[10rem] font-black text-white drop-shadow-[0_0_20px_rgba(52,211,153,0.4)] leading-none">
                        {isAfterIftarToday() ? getTimeParts(CALENDAR_DATA[currentDayIndex + 1]?.suhoor || currentData.suhoor).time : getTimeParts(currentData.suhoor).time}
                      </span>
                    </div>
                    <span className="text-[9px] md:text-lg lg:text-xl font-bold text-emerald-400/80 mt-1.5 md:mt-5 px-2.5 py-0.5 md:py-1 bg-emerald-500/10 rounded-md border border-emerald-500/10">
                      {isAfterIftarToday() ? t.today : t.periods.dawn}
                    </span>
                  </div>
                  <div className="mt-3 md:mt-10 flex flex-col items-center justify-center min-h-[1rem] gap-4">
                    {getSuhoorCountdown() ? (
                      <>
                        <button 
                          onClick={() => { setPopupType('suhoor'); setShowCountdownPopup(true); }}
                          className="group/btn relative overflow-hidden bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-400 px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
                        >
                          <div className="absolute inset-0 bg-emerald-400/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                          <span className="relative z-10 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
                            {t.suhoorCounter}
                            <Maximize2 className="w-3 h-3 md:w-4 md:h-4" />
                          </span>
                        </button>
                      </>
                    ) : (isTodayDate(currentData.date) && !isAfterIftarToday() && <span className="text-[7px] md:text-base font-bold text-rose-300 bg-rose-500/10 px-3 md:px-6 py-1 md:py-2.5 rounded-full">{t.suhoorEnded}</span>)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-400/20 via-orange-950/40 to-slate-950/80 p-5 md:p-8 lg:p-14 rounded-[2rem] md:rounded-[4rem] border border-orange-400/30 text-center flex flex-col items-center shadow-[0_0_40px_rgba(251,146,60,0.1)] group/item relative">
                  <div className="bg-orange-400/10 p-1.5 md:p-4 rounded-full mb-1.5 md:mb-6">
                    <Moon className="w-5 h-5 md:w-10 md:h-10 text-orange-400" />
                  </div>
                  <span className={`text-[10px] md:text-xl lg:text-2xl font-black uppercase tracking-widest text-orange-100 mb-0.5 md:mb-4`}>{t.iftar}</span>
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-6xl lg:text-8xl xl:text-[10rem] font-black text-white drop-shadow-[0_0_20px_rgba(251,146,60,0.4)] leading-none">{getTimeParts(currentData.iftar).time}</span>
                    </div>
                    <span className="text-[9px] md:text-lg lg:text-xl font-bold text-orange-400/80 mt-1.5 md:mt-5 px-2.5 py-0.5 md:py-1 bg-orange-500/10 rounded-md border border-orange-500/10">{t.periods.evening}</span>
                  </div>
                  <div className="mt-3 md:mt-10 flex flex-col items-center justify-center min-h-[1rem] gap-4">
                    {getCountdown(currentData.iftar, currentData.date) ? (
                      <>
                        <button 
                          onClick={() => { setPopupType('iftar'); setShowCountdownPopup(true); }}
                          className="group/btn relative overflow-hidden bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 hover:text-white border border-orange-500/30 hover:border-orange-400 px-4 py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-orange-500/20"
                        >
                          <div className="absolute inset-0 bg-orange-400/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                          <span className="relative z-10 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
                            {t.iftarCounter}
                            <Maximize2 className="w-3 h-3 md:w-4 md:h-4" />
                          </span>
                        </button>
                      </>
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

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => playAdhan('normal', true)}
                  className={`w-full p-4 md:p-6 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest md:tracking-[0.2em] transition-all flex items-center justify-center gap-3 md:gap-4 ${isAudioPlaying ? 'bg-amber-500 text-slate-950 scale-[0.98]' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 shadow-xl border border-slate-700/50'}`}
                >
                  {isAudioPlaying ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />}
                  <span className={isBengali ? 'text-sm md:text-lg font-bengali-bold' : 'text-xs md:text-base'}>{t.listenAdhan}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCountdownPopup && popupType && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300 overflow-y-auto">
          <div className="min-h-screen w-full flex flex-col items-center p-4 py-12 md:p-12">
            <button 
              onClick={() => { stopCurrentAudio(); setShowCountdownPopup(false); setPopupType(null); setLastPopupClosedTime(Date.now()); }}
              className="fixed top-4 right-4 p-2 md:p-4 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all z-[210]"
            >
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            
            <div className="flex flex-col items-center w-full max-w-4xl">
              {/* Language Switcher - Compact on mobile */}
              <div className="flex items-center gap-1.5 mb-6 md:mb-10 bg-slate-900/40 p-1 rounded-xl border border-slate-800/50 backdrop-blur-md">
                {(Object.values(Language) as Language[]).map(lang => (
                  <button 
                    key={lang} 
                    onClick={() => setSettings(s => ({...s, language: lang}))}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${settings.language === lang ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {lang === Language.EN ? 'EN' : lang === Language.BN ? 'বাংলা' : 'PT'}
                  </button>
                ))}
              </div>

              <div className={`mb-4 md:mb-8 p-3 md:p-6 rounded-full ${popupType === 'iftar' ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`}>
                {popupType === 'iftar' ? (
                  <Moon className="w-10 h-10 md:w-20 md:h-20 text-orange-500 animate-pulse" />
                ) : (
                  <Sun className="w-10 h-10 md:w-20 md:h-20 text-emerald-400 animate-pulse" />
                )}
              </div>
              
              <h2 className={`text-base md:text-3xl font-black uppercase tracking-[0.2em] mb-2 md:mb-4 ${popupType === 'iftar' ? 'text-orange-500' : 'text-emerald-400'}`}>
                {popupType === 'iftar' ? t.iftarRemaining : t.suhoorRemaining}
              </h2>
              
              <div className="mb-6 md:mb-12 w-full flex justify-center">
                <span className={`text-[18vw] md:text-[12vw] lg:text-[10rem] font-black leading-none font-mono tracking-tighter ${popupType === 'iftar' ? 'text-white drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'text-white drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]'}`}>
                  {(popupType === 'iftar' 
                    ? getCountdown(currentData.iftar, currentData.date) 
                    : getSuhoorCountdown()) || "00:00:00"}
                </span>
              </div>
              
              <div className="flex flex-col items-center gap-1 md:gap-2 bg-slate-900/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 mb-6 md:mb-10 w-full max-w-[280px] md:max-w-sm">
                <span className="text-[9px] md:text-sm font-bold text-slate-500 uppercase tracking-widest">
                  {popupType === 'iftar' ? t.iftar : t.suhoor}
                </span>
                <span className="text-2xl md:text-4xl font-black text-slate-300 font-mono">
                  {popupType === 'iftar' 
                    ? getTimeParts(currentData.iftar).time 
                    : (isAfterIftarToday() && currentDayIndex + 1 < CALENDAR_DATA.length 
                        ? getTimeParts(CALENDAR_DATA[currentDayIndex + 1].suhoor).time 
                        : getTimeParts(currentData.suhoor).time)
                  }
                </span>
              </div>

              {isAudioPlaying && (
                <button 
                  onClick={() => stopCurrentAudio()}
                  className="mb-8 flex items-center gap-3 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-base font-black uppercase tracking-widest shadow-2xl shadow-rose-500/20 transition-all animate-bounce"
                >
                  <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
                  {t.stopAlarm || "Stop Alarm"}
                </button>
              )}

              {popupType === 'iftar' && (
                <div className="w-full max-w-xl mx-auto p-5 md:p-8 bg-orange-500/5 border border-orange-500/10 rounded-3xl backdrop-blur-sm mb-8">
                  <p className={`text-xs md:text-lg text-orange-200/80 leading-relaxed italic text-center ${isBengali ? 'font-bengali' : ''}`}>
                    "{t.iftarMessage}"
                  </p>
                </div>
              )}

              <div className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 mb-10">
                <img 
                  src={popupType === 'iftar' 
                    ? "https://www.prayertimenyc.com/wp-content/uploads/2017/05/iftar-dua.jpg" 
                    : "https://i.pinimg.com/736x/f8/71/ff/f871ff145c4d10a48382032f66097b36.jpg"}
                  alt={popupType === 'iftar' ? "Iftar Dua" : "Suhoor Dua"}
                  className="w-full h-auto object-contain bg-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showEidSchedule && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setShowEidSchedule(false)}></div>
          <div className="bg-slate-900 border border-slate-700/50 w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative z-[160] animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-amber-500">{t.eidSchedule}</h2>
              <button onClick={() => setShowEidSchedule(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.eidScheduleData.title}</h3>
                <p className="text-amber-500 font-bold tracking-[0.15em] text-sm md:text-base uppercase">{t.eidScheduleData.location}</p>
                <p className={`text-emerald-400 font-bold text-xs md:text-sm uppercase tracking-widest ${isBengali ? 'font-bengali' : ''}`}>{t.eidScheduleData.prayerLocation}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">{t.eidScheduleData.addressLabel}</p>
                <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800 max-w-md mx-auto">
                  <a 
                    href={t.eidScheduleData.mapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-amber-100 hover:text-amber-500 transition-colors break-all text-left group/map"
                  >
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 group-hover/map:scale-110 transition-transform" />
                    <span>{t.eidScheduleData.address}</span>
                  </a>
                  <button onClick={() => handleCopy(t.eidScheduleData.address, "eid-addr")} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors relative shrink-0">
                    {copiedField === "eid-addr" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/40 rounded-3xl border border-slate-800/50 p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-center py-3 border-b border-slate-800/50">
                  <p className="text-xl md:text-2xl font-black text-emerald-400 font-mono">{t.eidScheduleData.fajr}</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {t.eidScheduleData.prayers.map((prayer: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-colors group">
                      <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-200">{prayer.label}</span>
                      <span className="text-xl md:text-2xl font-black text-amber-500 font-mono">{prayer.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                  <p className={`text-xs md:text-sm text-amber-200/70 leading-relaxed text-center italic ${isBengali ? 'font-bengali' : ''}`}>
                    {t.eidScheduleData.announcement}
                  </p>
                </div>
                
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <p className="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-[0.2em] text-center">
                    {t.eidScheduleData.fitra}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDonate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowDonate(false)}></div>
          <div className="bg-slate-900 border border-slate-700/50 w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative z-110 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-amber-500">{t.donateTitle}</h2>
              <button onClick={() => setShowDonate(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="space-y-6">
              <div className="rounded-3xl border border-amber-500/20 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-4xl font-black text-amber-500 mb-3 tracking-tight">MESQUITA HAZRAT HAMZA (R.A)</h3>
                  <div className="h-px w-24 bg-amber-500/30 mx-auto mb-3"></div>
                  <p className="text-slate-300 font-bold tracking-[0.15em] text-xs md:text-sm uppercase">CENTRO CULTURAL MUÇULMANO DO PORTO</p>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-5 rotate-12 pointer-events-none">
                  <Moon className="w-40 h-40 text-amber-500" />
                </div>
              </div>

              <div className="bg-slate-950/40 rounded-3xl border border-slate-800/50 p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.beneficiary}</p>
                  <p className="text-lg md:text-xl font-bold text-white">CENTRO CULTURAL MUÇULMANOS DO PORTO - CCMP</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.bankName}</p>
                  <p className="text-lg md:text-xl font-mono text-white">NOVO BANCO</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.account}</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <p className="text-sm md:text-base font-mono text-amber-100 break-all">000668516241</p>
                    <button onClick={() => handleCopy("000668516241", "acc")} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors relative">
                      {copiedField === "acc" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.nib}</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <p className="text-sm md:text-base font-mono text-amber-100 break-all">000700000066851624123</p>
                    <button onClick={() => handleCopy("000700000066851624123", "nib")} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors relative">
                      {copiedField === "nib" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.iban}</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <p className="text-sm md:text-base font-mono text-amber-100 break-all">PT50000700000066851624123</p>
                    <button onClick={() => handleCopy("PT50000700000066851624123", "iban")} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors relative">
                      {copiedField === "iban" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.swift}</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <p className="text-sm md:text-base font-mono text-amber-100 break-all">BESCPTPL</p>
                    <button onClick={() => handleCopy("BESCPTPL", "swift")} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors relative">
                      {copiedField === "swift" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
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
