
import { CalendarDay, Language, GreetingCard } from './types';
import { Moon, Star, Heart, Sun, CloudMoon, Sparkles, Flower, Coffee, Gift, BookOpen, HandHeart, PartyPopper } from 'lucide-react';

export const GREETING_CARDS: GreetingCard[] = [
  {
    id: '1',
    icon: Moon,
    color: 'text-amber-500',
    messages: {
      [Language.EN]: "Wishing you a blessed Ramadan filled with peace, joy, and prosperity. Ramadan Mubarak!",
      [Language.BN]: "আপনার এবং আপনার পরিবারের জন্য রহমত, বরকত ও মাগফিরাতের বার্তা নিয়ে আসুক পবিত্র রমজান। রমজান মোবারক!",
      [Language.PT]: "Desejo-lhe um Ramadão abençoado, cheio de paz, alegria e prosperidade. Ramadan Mubarak!"
    }
  },
  {
    id: '2',
    icon: Heart,
    color: 'text-rose-500',
    messages: {
      [Language.EN]: "May this holy month bring you closer to Allah and fill your heart with gratitude. Happy Ramadan!",
      [Language.BN]: "পবিত্র এই মাসটি আপনাকে আল্লাহর আরও নিকটবর্তী করুক এবং আপনার হৃদয়কে কৃতজ্ঞতায় ভরিয়ে দিক। শুভ রমজান!",
      [Language.PT]: "Que este mês sagrado o aproxime de Allah e encha o seu coração de gratidão. Feliz Ramadão!"
    }
  },
  {
    id: '3',
    icon: Star,
    color: 'text-yellow-400',
    messages: {
      [Language.EN]: "Ramadan Kareem! May your prayers be answered and your fasts be accepted.",
      [Language.BN]: "রমজান কারীম! আপনার সকল দোয়া কবুল হোক এবং আপনার রোজাগুলো আল্লাহর দরবারে গৃহীত হোক।",
      [Language.PT]: "Ramadan Kareem! Que as suas orações sejam respondidas e os seus jejuns aceites."
    }
  },
  {
    id: '4',
    icon: Sparkles,
    color: 'text-purple-400',
    messages: {
      [Language.EN]: "May the light of Ramadan shine upon you and your family. Have a peaceful month.",
      [Language.BN]: "রমজানের নূর আপনার এবং আপনার পরিবারের উপর বর্ষিত হোক। একটি শান্তিময় মাস কাটুক।",
      [Language.PT]: "Que a luz do Ramadão brilhe sobre si e a sua família. Tenha um mês pacífico."
    }
  },
  {
    id: '5',
    icon: BookOpen,
    color: 'text-emerald-500',
    messages: {
      [Language.EN]: "May Allah guide you to the right path and shower His blessings upon you.",
      [Language.BN]: "আল্লাহ আপনাকে সঠিক পথ দেখান এবং আপনার উপর তাঁর রহমত বর্ষণ করুন।",
      [Language.PT]: "Que Allah o guie para o caminho certo e derrame as Suas bênçãos sobre si."
    }
  },
  {
    id: '6',
    icon: CloudMoon,
    color: 'text-blue-400',
    messages: {
      [Language.EN]: "Sending you warm wishes on this holy month. Remember me in your prayers.",
      [Language.BN]: "এই পবিত্র মাসে আপনাকে উষ্ণ শুভেচ্ছা জানাচ্ছি। আপনার দোয়ায় আমাকে মনে রাখবেন।",
      [Language.PT]: "Envio-lhe votos calorosos neste mês sagrado. Lembre-se de mim nas suas orações."
    }
  },
  {
    id: '7',
    icon: HandHeart,
    color: 'text-orange-500',
    messages: {
      [Language.EN]: "May your charity and good deeds be multiplied in this blessed month.",
      [Language.BN]: "এই বরকতময় মাসে আপনার দান এবং নেক আমল বহুগুণে বৃদ্ধি পাক।",
      [Language.PT]: "Que a sua caridade e boas ações sejam multiplicadas neste mês abençoado."
    }
  },
  {
    id: '8',
    icon: Flower,
    color: 'text-pink-400',
    messages: {
      [Language.EN]: "May the spirit of Ramadan stay in our hearts and light up our souls from within.",
      [Language.BN]: "রমজানের চেতনা আমাদের হৃদয়ে থাকুক এবং আমাদের আত্মাকে ভেতর থেকে আলোকিত করুক।",
      [Language.PT]: "Que o espírito do Ramadão permaneça nos nossos corações e ilumine as nossas almas por dentro."
    }
  },
  {
    id: '9',
    icon: Sun,
    color: 'text-amber-400',
    messages: {
      [Language.EN]: "Wishing you a Ramadan full of celebration and spiritual growth.",
      [Language.BN]: "আপনার রমজান হোক উৎসবমুখর এবং আধ্যাত্মিক উন্নতিতে পরিপূর্ণ।",
      [Language.PT]: "Desejo-lhe um Ramadão cheio de celebração e crescimento espiritual."
    }
  },
  {
    id: '10',
    icon: PartyPopper,
    color: 'text-indigo-400',
    messages: {
      [Language.EN]: "May Allah bless you with happiness and grace your home with warmth and peace.",
      [Language.BN]: "আল্লাহ আপনাকে সুখ দান করুন এবং আপনার ঘরকে উষ্ণতা ও শান্তিতে ভরিয়ে দিন।",
      [Language.PT]: "Que Allah o abençoe com felicidade e agracie o seu lar com calor e paz."
    }
  }
];

export const CALENDAR_DATA: CalendarDay[] = [
  { ramadanDay: 1, date: '2026-02-18', weekday: 'Wednesday', suhoor: '05:53', iftar: '18:16' },
  { ramadanDay: 2, date: '2026-02-19', weekday: 'Thursday', suhoor: '05:51', iftar: '18:17' },
  { ramadanDay: 3, date: '2026-02-20', weekday: 'Friday', suhoor: '05:50', iftar: '18:18' },
  { ramadanDay: 4, date: '2026-02-21', weekday: 'Saturday', suhoor: '05:49', iftar: '18:19' },
  { ramadanDay: 5, date: '2026-02-22', weekday: 'Sunday', suhoor: '05:47', iftar: '18:20' },
  { ramadanDay: 6, date: '2026-02-23', weekday: 'Monday', suhoor: '05:46', iftar: '18:22' },
  { ramadanDay: 7, date: '2026-02-24', weekday: 'Tuesday', suhoor: '05:44', iftar: '18:23' },
  { ramadanDay: 8, date: '2026-02-25', weekday: 'Wednesday', suhoor: '05:43', iftar: '18:24' },
  { ramadanDay: 9, date: '2026-02-26', weekday: 'Thursday', suhoor: '05:41', iftar: '18:25' },
  { ramadanDay: 10, date: '2026-02-27', weekday: 'Friday', suhoor: '05:40', iftar: '18:26' },
  { ramadanDay: 11, date: '2026-02-28', weekday: 'Saturday', suhoor: '05:38', iftar: '18:28' },
  { ramadanDay: 12, date: '2026-03-01', weekday: 'Sunday', suhoor: '05:37', iftar: '18:29' },
  { ramadanDay: 13, date: '2026-03-02', weekday: 'Monday', suhoor: '05:35', iftar: '18:30' },
  { ramadanDay: 14, date: '2026-03-03', weekday: 'Tuesday', suhoor: '05:34', iftar: '18:31' },
  { ramadanDay: 15, date: '2026-03-04', weekday: 'Wednesday', suhoor: '05:32', iftar: '18:32' },
  { ramadanDay: 16, date: '2026-03-05', weekday: 'Thursday', suhoor: '05:31', iftar: '18:33' },
  { ramadanDay: 17, date: '2026-03-06', weekday: 'Friday', suhoor: '05:29', iftar: '18:34' },
  { ramadanDay: 18, date: '2026-03-07', weekday: 'Saturday', suhoor: '05:27', iftar: '18:36' },
  { ramadanDay: 19, date: '2026-03-08', weekday: 'Sunday', suhoor: '05:26', iftar: '18:37' },
  { ramadanDay: 20, date: '2026-03-09', weekday: 'Monday', suhoor: '05:24', iftar: '18:38' },
  { ramadanDay: 21, date: '2026-03-10', weekday: 'Tuesday', suhoor: '05:22', iftar: '18:39' },
  { ramadanDay: 22, date: '2026-03-11', weekday: 'Wednesday', suhoor: '05:22', iftar: '18:39' },
  { ramadanDay: 23, date: '2026-03-12', weekday: 'Thursday', suhoor: '05:21', iftar: '18:40' },
  { ramadanDay: 24, date: '2026-03-13', weekday: 'Friday', suhoor: '05:17', iftar: '18:42' },
  { ramadanDay: 25, date: '2026-03-14', weekday: 'Saturday', suhoor: '05:16', iftar: '18:43' },
  { ramadanDay: 26, date: '2026-03-15', weekday: 'Sunday', suhoor: '05:14', iftar: '18:45' },
  { ramadanDay: 27, date: '2026-03-16', weekday: 'Monday', suhoor: '05:12', iftar: '18:46' },
  { ramadanDay: 28, date: '2026-03-17', weekday: 'Tuesday', suhoor: '05:10', iftar: '18:47' },
  { ramadanDay: 29, date: '2026-03-18', weekday: 'Wednesday', suhoor: '05:08', iftar: '18:48' },
  { ramadanDay: 30, date: '2026-03-19', weekday: 'Thursday', suhoor: '05:07', iftar: '18:49' },
];

export const TRANSLATIONS: Record<Language, any> = {
  [Language.EN]: {
    title: "Mesquita Hazrat Hamza (R.A) - Schedule",
    subTitle: "Porto Muslim Cultural Center",
    suhoor: "Suhoor",
    iftar: "Iftar",
    ramadanMonth: "Ramadan",
    daysRemaining: "Days\nRemaining",
    save: "Save",
    cancel: "Cancel",
    iftarAlarm: "Iftar Adhan",
    suhoorAlarm: "Suhoor Adhan",
    today: "Today",
    volume: "Volume",
    currentTimeLabel: "Current Time",
    alarmsBtn: "Alarms",
    fullCalendar: "Full Calendar",
    close: "Close",
    ramadanDay: "Ramadan Day",
    date: "Date",
    ashra1: "10 Days of Mercy",
    ashra2: "10 Days of Blessing",
    ashra3: "10 Days of Forgiveness",
    ongoing: "Active",
    iftarRemaining: "Iftar in",
    suhoorRemaining: "Suhoor in",
    suhoorEnded: "Suhoor ended",
    iftarEnded: "Iftar ended",
    listenAdhan: "Listen Adhan",
    share: "Share",
    greetings: "Greeting Cards",
    send: "Send Message",
    shareMessage: "Date: {date}\n{day}\nSuhoor: {suhoor}\nIftar: {iftar}\nMesquita Hazrat Hamza (R.A)",
    donate: "Donate",
    donateTitle: "Donate for Ramadan",
    bankName: "Bank Name",
    account: "Account",
    nib: "NIB",
    iban: "IBAN",
    swift: "SWIFT",
    copy: "Copy",
    copied: "Copied!",
    customize: "Customize",
    writeMessage: "Write your message...",
    selectColor: "Select Color",
    preview: "Preview",
    reset: "Reset",
    hadith: "Narrated Abu Huraira: The Prophet said, \"(Allah said), 'Every good deed of Adam's son is for him except fasting; it is for Me. and I shall reward (the fasting person) for it.' Verily, the smell of the mouth of a fasting person is better to Allah than the smell of musk.\" (Sahih al-Bukhari 5927)",
    periods: {
      dawn: "Dawn", morning: "Morning", noon: "Noon", afternoon: "Afternoon", evening: "Evening", night: "Night"
    },
    weekdays: {
      Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday', Thursday: 'Thursday',
      Friday: 'Friday', Saturday: 'Saturday', Sunday: 'Sunday'
    },
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  },
  [Language.BN]: {
    title: "মসজিদ হযরত হামজা (রা:) - সময়সূচী",
    subTitle: "পর্তো মুসলিম কালচারাল সেন্টার",
    suhoor: "সেহরি",
    iftar: "ইফতার",
    ramadanMonth: "রমজান",
    daysRemaining: "রোজার আর\nবাকি আছে",
    save: "সংরক্ষণ",
    cancel: "বাতিল",
    iftarAlarm: "ইফতার আজান",
    suhoorAlarm: "সেহরি আজান",
    today: "আজকে",
    volume: "ভলিউম",
    currentTimeLabel: "বর্তমান সময়",
    alarmsBtn: "এলার্ম",
    fullCalendar: "পূর্ণ ক্যালেন্ডার",
    close: "বন্ধ করুন",
    ramadanDay: "রমজান",
    date: "তারিখ",
    ashra1: "রহমতের ১০ দিন",
    ashra2: "বরকতের ১০ দিন",
    ashra3: "মাগফিরাতের ১০ দিন",
    ongoing: "চলমান",
    iftarRemaining: "ইফতারের বাকি",
    suhoorRemaining: "সেহরির বাকি",
    suhoorEnded: "সেহেরী শেষ",
    iftarEnded: "ইফতার হয়েছে",
    share: "শেয়ার",
    greetings: "শুভেচ্ছা কার্ড",
    send: "মেসেজ পাঠান",
    shareMessage: "তারিখ: {date}\n{day}\nসেহরি: {suhoor}, ইফতার: {iftar}\nমসজিদ হযরত হামজা (রা:)",
    donate: "দান করুন",
    donateTitle: "রমজানের জন্য দান করুন",
    bankName: "ব্যাংক নাম",
    account: "একাউন্ট",
    nib: "NIB",
    iban: "IBAN",
    swift: "SWIFT",
    copy: "কপি",
    copied: "কপি হয়েছে!",
    customize: "কাস্টমাইজ",
    writeMessage: "আপনার বার্তা লিখুন...",
    selectColor: "রঙ নির্বাচন করুন",
    preview: "প্রিভিউ",
    reset: "রিসেট",
    hadith: "আবু হুরায়রা (রাঃ) থেকে বর্ণিতঃ রাসূলুল্লাহ (সাল্লাল্লাহু ‘আলাইহি ওয়া সাল্লাম) বলেছেন, আল্লাহ তা'আলা বলেন, বনী আদমের প্রতিটি আমল তার নিজের জন্য, শুধু রোজা ব্যতীত; কারণ তা আমার জন্য এবং আমিই এর প্রতিদান দেব। নিশ্চয়ই রোজাদারের মুখের গন্ধ আল্লাহর নিকট কস্তুরীর সুগন্ধির চেয়েও অধিক প্রিয়। (সহীহ বুখারী ৫৯২৭)",
    listenAdhan: "আযান শুনুন",
    periods: {
      dawn: "ভোর", morning: "সকাল", noon: "দুপুর", afternoon: "বিকেল", evening: "সন্ধ্যা", night: "রাত"
    },
    weekdays: {
      Monday: 'সোমবার', Tuesday: 'মঙ্গলবার', Wednesday: 'বুধবার', Thursday: 'বৃহস্পতিবার',
      Friday: 'শুক্রবার', Saturday: 'শনিবার', Sunday: 'রবিবার'
    },
    months: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]
  },
  [Language.PT]: {
    title: "Mesquita Hazrat Hamza (R.A) - Horário",
    subTitle: "Centro Cultural Muçulmano do Porto",
    suhoor: "Suhur",
    iftar: "Iftar",
    ramadanMonth: "Ramadão",
    daysRemaining: "Dias\nRestantes",
    save: "Guardar",
    cancel: "Cancelar",
    iftarAlarm: "Adhan de Iftar",
    suhoorAlarm: "Adhan de Suhur",
    today: "Hoje",
    volume: "Volume",
    currentTimeLabel: "Hora Atual",
    alarmsBtn: "Alarmes",
    fullCalendar: "Calendário",
    close: "Fechar",
    ramadanDay: "Dia Ramadão",
    date: "Data",
    ashra1: "10 Days of Mercy",
    ashra2: "10 Days of Blessing",
    ashra3: "10 Days of Forgiveness",
    ongoing: "Em curso",
    iftarRemaining: "Para o Iftar",
    suhoorRemaining: "Para o Suhur",
    suhoorEnded: "Suhur terminou",
    iftarEnded: "Iftar passou",
    listenAdhan: "Ouvir Adhan",
    share: "Partilhar",
    greetings: "Cartões",
    send: "Enviar Mensagem",
    shareMessage: "Data: {date}\n{day}\nSuhur: {suhoor}\nIftar: {iftar}\nMesquita Hazrat Hamza (R.A)",
    donate: "Doar",
    donateTitle: "Doar para o Ramadão",
    bankName: "Nome do Banco",
    account: "Conta",
    nib: "NIB",
    iban: "IBAN",
    swift: "SWIFT",
    copy: "Copiar",
    copied: "Copiado!",
    customize: "Personalizar",
    writeMessage: "Escreva a sua mensagem...",
    selectColor: "Selecionar Cor",
    preview: "Pré-visualizar",
    reset: "Repor",
    hadith: "Narrado por Abu Huraira: O Profeta disse: \"(Allah disse), 'Toda boa ação do filho de Adão é para ele, exceto o jejum; é para Mim, e Eu recompensarei (a pessoa que jejua) por isso.' Em verdade, o cheiro da boca de uma pessoa que jejua é melhor para Allah do que o cheiro do almíscar.\" (Sahih al-Bukhari 5927)",
    periods: {
      dawn: "Madrugada", morning: "Manhã", noon: "Meio-dia", afternoon: "Tarde", evening: "Noite", night: "Noite"
    },
    weekdays: {
      Monday: 'Segunda', Tuesday: 'Terça', Wednesday: 'Quarta', Thursday: 'Quinta',
      Friday: 'Sexta', Saturday: 'Sábado', Sunday: 'Domingo'
    },
    months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
  }
};
