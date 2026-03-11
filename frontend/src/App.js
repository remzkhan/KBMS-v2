import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Book, Play, Pause, SkipBack, SkipForward, Settings, Moon, Sun, 
  Search, Bookmark, BookOpen, ChevronRight, ChevronLeft, X, Volume2,
  GraduationCap, Languages, Type, Clock, Star, Menu, Home,
  FileText, VolumeX, RotateCcw, Check, Eye, EyeOff, Brain,
  RefreshCw, Award, Repeat, BookMarked, Layers
} from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ==================== API FUNCTIONS ====================
const api = {
  getSurahs: () => fetch(`${API_URL}/api/surahs`).then(r => r.json()),
  getSurah: (num, edition, translation) => 
    fetch(`${API_URL}/api/surah/${num}?edition=${edition}&translation=${translation}`).then(r => r.json()),
  getSurahTransliteration: (num) => 
    fetch(`${API_URL}/api/surah/${num}/transliteration`).then(r => r.json()),
  getReciters: () => fetch(`${API_URL}/api/reciters/v2`).then(r => r.json()),
  getAyahAudio: (surahNum, ayahNum, reciter) => 
    fetch(`${API_URL}/api/audio/ayah/v2/${surahNum}/${ayahNum}?reciter=${reciter}`).then(r => r.json()),
  getRelatedHadith: (surahNum, ayahNum) => 
    fetch(`${API_URL}/api/hadith/related/${surahNum}/${ayahNum}`).then(r => r.json()),
  getAyahsWithHadith: () => fetch(`${API_URL}/api/hadith/ayahs-with-hadith`).then(r => r.json()),
  getBookmarks: () => fetch(`${API_URL}/api/bookmarks`).then(r => r.json()),
  addBookmark: (bookmark) => 
    fetch(`${API_URL}/api/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookmark)
    }).then(r => r.json()),
  deleteBookmark: (surahNum, ayahNum) => 
    fetch(`${API_URL}/api/bookmarks/${surahNum}/${ayahNum}`, { method: 'DELETE' }).then(r => r.json()),
  getSettings: () => fetch(`${API_URL}/api/settings`).then(r => r.json()),
  updateSettings: (settings) => 
    fetch(`${API_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(r => r.json()),
  saveProgress: (progress) => 
    fetch(`${API_URL}/api/reading-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress)
    }).then(r => r.json()),
  getProgress: () => fetch(`${API_URL}/api/reading-progress`).then(r => r.json()),
  getAlphabet: () => fetch(`${API_URL}/api/learn/alphabet`).then(r => r.json()),
  getTajweed: () => fetch(`${API_URL}/api/learn/tajweed`).then(r => r.json()),
  getGrammar: () => fetch(`${API_URL}/api/learn/grammar`).then(r => r.json()),
  getVocabulary: () => fetch(`${API_URL}/api/learn/vocabulary`).then(r => r.json()),
  getPhrases: () => fetch(`${API_URL}/api/learn/phrases`).then(r => r.json()),
  // Hifz APIs
  getHifzProgress: () => fetch(`${API_URL}/api/hifz/progress`).then(r => r.json()),
  saveHifzProgress: (progress) => 
    fetch(`${API_URL}/api/hifz/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress)
    }).then(r => r.json()),
  deleteHifzProgress: (surah, start, end) => 
    fetch(`${API_URL}/api/hifz/progress/${surah}/${start}/${end}`, { method: 'DELETE' }).then(r => r.json()),
  getHifzStats: () => fetch(`${API_URL}/api/hifz/stats`).then(r => r.json()),
};

// ==================== CONSTANTS ====================
const TEXT_EDITIONS = [
  { id: 'quran-uthmani', name: 'Uthmani', description: 'Standard Arabic script' },
  { id: 'quran-simple', name: 'Simple', description: 'Simplified Arabic' },
  { id: 'quran-simple-clean', name: 'Clean', description: 'Clean simplified text' },
  { id: 'quran-wordbyword', name: 'Indo-Pak', description: 'South Asian style' },
];

const TRANSLATIONS = [
  { id: 'en.sahih', name: 'English (Sahih International)', language: 'English' },
  { id: 'en.pickthall', name: 'English (Pickthall)', language: 'English' },
  { id: 'en.yusufali', name: 'English (Yusuf Ali)', language: 'English' },
  { id: 'ur.jalandhry', name: 'Urdu (Jalandhry)', language: 'Urdu' },
  { id: 'ur.ahmedali', name: 'Urdu (Ahmed Ali)', language: 'Urdu' },
  { id: 'hi.hindi', name: 'Hindi', language: 'Hindi' },
  { id: 'id.indonesian', name: 'Indonesian', language: 'Indonesian' },
  { id: 'ms.basmeih', name: 'Malay (Basmeih)', language: 'Malaysian' },
];

const TEXT_SIZES = [
  { id: 'small', name: 'S', arabicClass: 'arabic-text-sm', translationClass: 'text-sm' },
  { id: 'medium', name: 'M', arabicClass: 'arabic-text-md', translationClass: 'text-base' },
  { id: 'large', name: 'L', arabicClass: 'arabic-text-lg', translationClass: 'text-lg' },
  { id: 'xlarge', name: 'XL', arabicClass: 'arabic-text-xl', translationClass: 'text-xl' },
];

const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'Mishary Rashid Alafasy' },
  { id: 'Abdul_Basit_Murattal_128kbps', name: 'Abdul Basit Abdul Samad' },
  { id: 'Husary_128kbps', name: 'Mahmoud Khalil Al-Husary' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Mohamed Siddiq El-Minshawi' },
  { id: 'Maher_AlMuaiqly_128kbps', name: 'Maher Al Muaiqly' },
  { id: 'Sudais_128kbps', name: 'Abdul Rahman Al-Sudais' },
  { id: 'Shuraym_128kbps', name: 'Saud Al-Shuraim' },
  { id: 'Saad_AlGhamdi_128kbps', name: 'Saad Al-Ghamdi' },
];

// Tajweed color classes for different rules
const TAJWEED_COLORS = {
  ghunnah: '#10B981', // Green - Ghunnah (nasalization)
  ikhfa: '#3B82F6',   // Blue - Ikhfa (hiding)
  idgham: '#8B5CF6',  // Purple - Idgham (merging)
  iqlab: '#F59E0B',   // Amber - Iqlab (conversion)
  qalqalah: '#EF4444', // Red - Qalqalah (echo)
  madd: '#EC4899',    // Pink - Madd (elongation)
};

// ==================== MAIN APP ====================
function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [transliterationData, setTransliterationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [readingProgress, setReadingProgress] = useState(null);
  const [ayahsWithHadith, setAyahsWithHadith] = useState([]);
  
  // Settings
  const [settings, setSettings] = useState({
    text_style: 'quran-uthmani',
    reciter_id: 'Alafasy_128kbps',
    translation: 'en.sahih',
    text_size: 'large',
    theme: 'dark',
    show_tajweed: true,
    show_transliteration: false,
    view_mode: 'scroll'
  });
  
  // Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);
  
  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showHadith, setShowHadith] = useState(false);
  const [hadithData, setHadithData] = useState(null);
  const [selectedAyahForHadith, setSelectedAyahForHadith] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Learning
  const [learnTab, setLearnTab] = useState('alphabet');
  const [alphabetData, setAlphabetData] = useState([]);
  const [tajweedData, setTajweedData] = useState([]);
  const [grammarData, setGrammarData] = useState(null);
  const [vocabularyData, setVocabularyData] = useState([]);
  const [phrasesData, setPhrasesData] = useState([]);

  // Hifz
  const [hifzProgress, setHifzProgress] = useState([]);
  const [hifzStats, setHifzStats] = useState(null);

  // Initialize
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const loadInitialData = async () => {
    try {
      const [surahRes, bookmarkRes, settingsRes, progressRes, hadithAyahsRes] = await Promise.all([
        api.getSurahs(),
        api.getBookmarks(),
        api.getSettings(),
        api.getProgress(),
        api.getAyahsWithHadith()
      ]);
      
      setSurahs(surahRes.surahs || []);
      setBookmarks(bookmarkRes.bookmarks || []);
      setAyahsWithHadith(hadithAyahsRes.ayahs || []);
      if (settingsRes.settings) {
        const s = settingsRes.settings;
        setSettings(prev => ({ ...prev, ...s }));
        setDarkMode(s.theme === 'dark');
      }
      if (progressRes.progress) {
        setReadingProgress(progressRes.progress);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const loadSurah = async (surahNumber) => {
    setLoading(true);
    setTransliterationData(null);
    try {
      const [res, transRes] = await Promise.all([
        api.getSurah(surahNumber, settings.text_style, settings.translation),
        api.getSurahTransliteration(surahNumber).catch(() => null)
      ]);
      
      setSurahData(res.surah);
      if (transRes?.transliteration) {
        setTransliterationData(transRes.transliteration);
      }
      setSelectedSurah(surahNumber);
      setCurrentView('reader');
      setCurrentAyah(null);
      setIsPlaying(false);
      
      // Save progress
      if (res.surah) {
        api.saveProgress({
          surah_number: surahNumber,
          ayah_number: 1,
          surah_name: res.surah.englishName
        });
      }
    } catch (err) {
      console.error('Failed to load surah:', err);
    }
    setLoading(false);
  };

  // Audio functions with better error handling
  const playAyah = useCallback(async (ayahNumber) => {
    if (!selectedSurah) return;
    
    setAudioError(false);
    try {
      const res = await api.getAyahAudio(selectedSurah, ayahNumber, settings.reciter_id);
      if (res.audio?.url) {
        setAudioUrl(res.audio.url);
        setCurrentAyah(ayahNumber);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Failed to get audio:', err);
      setAudioError(true);
    }
  }, [selectedSurah, settings.reciter_id]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => setAudioError(true));
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentAyah(null);
    setIsPlaying(false);
    setAudioUrl(null);
  };

  const playNextAyah = useCallback(() => {
    if (currentAyah && surahData && currentAyah < surahData.numberOfAyahs) {
      playAyah(currentAyah + 1);
    }
  }, [currentAyah, surahData, playAyah]);

  const playPrevAyah = () => {
    if (currentAyah && currentAyah > 1) {
      playAyah(currentAyah - 1);
    }
  };

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => setAudioError(true));
    }
  }, [audioUrl]);

  // Handle audio end - play next ayah
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => playNextAyah();
      const handleError = () => setAudioError(true);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [playNextAyah]);

  // Bookmark functions
  const toggleBookmark = async (ayah) => {
    const exists = bookmarks.find(b => 
      b.surah_number === selectedSurah && b.ayah_number === ayah.number
    );
    
    if (exists) {
      await api.deleteBookmark(selectedSurah, ayah.number);
    } else {
      await api.addBookmark({
        surah_number: selectedSurah,
        ayah_number: ayah.number,
        surah_name: surahData?.englishName || '',
        ayah_text: ayah.arabic?.substring(0, 100) || ''
      });
    }
    
    const res = await api.getBookmarks();
    setBookmarks(res.bookmarks || []);
  };

  const isBookmarked = (surahNum, ayahNum) => {
    return bookmarks.some(b => b.surah_number === surahNum && b.ayah_number === ayahNum);
  };

  // Check if ayah has hadith
  const hasHadith = (surahNum, ayahNum) => {
    return ayahsWithHadith.some(h => h.surah === surahNum && h.ayah === ayahNum);
  };

  // Hadith modal
  const openHadithModal = async (ayah) => {
    setSelectedAyahForHadith(ayah);
    try {
      const res = await api.getRelatedHadith(selectedSurah, ayah.number);
      setHadithData(res);
    } catch (err) {
      console.error('Failed to load hadith:', err);
    }
    setShowHadith(true);
  };

  // Settings update
  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await api.updateSettings(newSettings);
    
    if (key === 'theme') {
      setDarkMode(value === 'dark');
    }
    
    // Reload surah if text style or translation changed
    if ((key === 'text_style' || key === 'translation') && selectedSurah) {
      loadSurah(selectedSurah);
    }
  };

  // Learning data
  const loadLearningData = async (tab) => {
    setLearnTab(tab);
    try {
      if (tab === 'alphabet' && alphabetData.length === 0) {
        const res = await api.getAlphabet();
        setAlphabetData(res.alphabet || []);
      } else if (tab === 'tajweed' && tajweedData.length === 0) {
        const res = await api.getTajweed();
        setTajweedData(res.tajweed_rules || []);
      } else if (tab === 'grammar' && !grammarData) {
        const res = await api.getGrammar();
        setGrammarData(res.grammar || null);
      } else if (tab === 'vocabulary' && vocabularyData.length === 0) {
        const res = await api.getVocabulary();
        setVocabularyData(res.vocabulary || []);
      } else if (tab === 'phrases' && phrasesData.length === 0) {
        const res = await api.getPhrases();
        setPhrasesData(res.phrases || []);
      }
    } catch (err) {
      console.error('Failed to load learning data:', err);
    }
  };

  // Hifz data
  const loadHifzData = async () => {
    try {
      const [progressRes, statsRes] = await Promise.all([
        api.getHifzProgress(),
        api.getHifzStats()
      ]);
      setHifzProgress(progressRes.progress || []);
      setHifzStats(statsRes.stats || null);
    } catch (err) {
      console.error('Failed to load Hifz data:', err);
    }
  };

  // Filter surahs - search by English name, Arabic name, translation, and number
  const filteredSurahs = surahs.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    // Normalize search - remove common variations
    const normalizedQuery = query
      .replace(/aa/g, 'a')
      .replace(/ee/g, 'i')
      .replace(/oo/g, 'u');
    
    const normalizedEnglish = (s.englishName || '').toLowerCase()
      .replace(/aa/g, 'a')
      .replace(/ee/g, 'i')
      .replace(/oo/g, 'u');
    
    const normalizedTranslation = (s.englishNameTranslation || '').toLowerCase();
    
    return (
      s.englishName?.toLowerCase().includes(query) ||
      normalizedEnglish.includes(normalizedQuery) ||
      normalizedTranslation.includes(query) ||
      s.name?.includes(searchQuery) ||
      s.number?.toString() === query
    );
  });

  const getTextSizeClass = () => {
    return TEXT_SIZES.find(s => s.id === settings.text_size) || TEXT_SIZES[2];
  };

  // Play pronunciation for learning
  const playPronunciation = (text) => {
    // Use Web Speech API for pronunciation
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`} style={{ backgroundColor: 'var(--background)' }}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-30 glass border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container-fluid">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button 
                data-testid="mobile-menu-btn"
                className="icon-btn md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
                <Book className="text-primary" size={28} style={{ color: 'var(--primary)' }} />
                <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>Quran Reader</span>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <NavButton active={currentView === 'home'} onClick={() => setCurrentView('home')}>Home</NavButton>
              <NavButton active={currentView === 'surahs'} onClick={() => setCurrentView('surahs')}>Surahs</NavButton>
              <NavButton active={currentView === 'learn'} onClick={() => { setCurrentView('learn'); loadLearningData('alphabet'); }}>Learn Arabic</NavButton>
              <NavButton active={currentView === 'hifz'} onClick={() => { setCurrentView('hifz'); loadHifzData(); }}>Hifz</NavButton>
              <NavButton active={currentView === 'bookmarks'} onClick={() => setCurrentView('bookmarks')}>Bookmarks</NavButton>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button 
                data-testid="theme-toggle"
                className="icon-btn"
                onClick={() => updateSetting('theme', darkMode ? 'light' : 'dark')}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                data-testid="settings-btn"
                className="icon-btn"
                onClick={() => setShowSettings(true)}
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <div className="container-fluid flex flex-col gap-3">
              <MobileNavItem icon={<Home size={18} />} onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}>Home</MobileNavItem>
              <MobileNavItem icon={<Book size={18} />} onClick={() => { setCurrentView('surahs'); setMobileMenuOpen(false); }}>Surahs</MobileNavItem>
              <MobileNavItem icon={<GraduationCap size={18} />} onClick={() => { setCurrentView('learn'); loadLearningData('alphabet'); setMobileMenuOpen(false); }}>Learn Arabic</MobileNavItem>
              <MobileNavItem icon={<Brain size={18} />} onClick={() => { setCurrentView('hifz'); loadHifzData(); setMobileMenuOpen(false); }}>Hifz</MobileNavItem>
              <MobileNavItem icon={<Bookmark size={18} />} onClick={() => { setCurrentView('bookmarks'); setMobileMenuOpen(false); }}>Bookmarks</MobileNavItem>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pb-24">
        {currentView === 'home' && (
          <HomeView 
            surahs={surahs}
            readingProgress={readingProgress}
            onSelectSurah={loadSurah}
            onNavigate={setCurrentView}
            onLoadHifz={loadHifzData}
          />
        )}
        
        {currentView === 'surahs' && (
          <SurahListView 
            surahs={filteredSurahs}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectSurah={loadSurah}
          />
        )}
        
        {currentView === 'reader' && (
          <ReaderView 
            surahData={surahData}
            transliterationData={transliterationData}
            loading={loading}
            settings={settings}
            textSizeClass={getTextSizeClass()}
            currentAyah={currentAyah}
            isPlaying={isPlaying}
            onPlayAyah={playAyah}
            onToggleBookmark={toggleBookmark}
            isBookmarked={(num) => isBookmarked(selectedSurah, num)}
            hasHadith={(num) => hasHadith(selectedSurah, num)}
            onOpenHadith={openHadithModal}
            onBack={() => setCurrentView('surahs')}
            onPrevSurah={() => selectedSurah > 1 && loadSurah(selectedSurah - 1)}
            onNextSurah={() => selectedSurah < 114 && loadSurah(selectedSurah + 1)}
          />
        )}
        
        {currentView === 'learn' && (
          <LearnView 
            learnTab={learnTab}
            onTabChange={loadLearningData}
            alphabetData={alphabetData}
            tajweedData={tajweedData}
            grammarData={grammarData}
            vocabularyData={vocabularyData}
            phrasesData={phrasesData}
            onPlayPronunciation={playPronunciation}
          />
        )}

        {currentView === 'hifz' && (
          <HifzView 
            surahs={surahs}
            hifzProgress={hifzProgress}
            hifzStats={hifzStats}
            onSelectSurah={loadSurah}
            onRefresh={loadHifzData}
          />
        )}
        
        {currentView === 'bookmarks' && (
          <BookmarksView 
            bookmarks={bookmarks}
            onSelectBookmark={(b) => loadSurah(b.surah_number)}
            onDeleteBookmark={async (b) => {
              await api.deleteBookmark(b.surah_number, b.ayah_number);
              const res = await api.getBookmarks();
              setBookmarks(res.bookmarks || []);
            }}
          />
        )}
      </main>

      {/* Audio Player Bar */}
      {currentAyah && currentView === 'reader' && (
        <AudioPlayerBar 
          surahData={surahData}
          currentAyah={currentAyah}
          isPlaying={isPlaying}
          audioError={audioError}
          onTogglePlay={togglePlayPause}
          onPrev={playPrevAyah}
          onNext={playNextAyah}
          onStop={stopAudio}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          settings={settings}
          onUpdateSetting={updateSetting}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Hadith Modal */}
      {showHadith && (
        <HadithModal 
          hadithData={hadithData}
          ayah={selectedAyahForHadith}
          surahName={surahData?.englishName}
          onClose={() => setShowHadith(false)}
        />
      )}
    </div>
  );
}

// ==================== NAVIGATION COMPONENTS ====================
function NavButton({ active, onClick, children }) {
  return (
    <button 
      className={`nav-link ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MobileNavItem({ icon, onClick, children }) {
  return (
    <button className="text-left py-2 flex items-center gap-3" onClick={onClick} style={{ color: 'var(--text)' }}>
      {icon} {children}
    </button>
  );
}

// ==================== HOME VIEW ====================
function HomeView({ surahs, readingProgress, onSelectSurah, onNavigate, onLoadHifz }) {
  const featuredSurahs = [1, 36, 55, 67, 112, 114];
  
  return (
    <div className="container-fluid py-12">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text)' }}>
          Read the Holy Quran
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
          Explore the divine words with multiple translations, recitations, and learn Arabic along the way.
        </p>
        
        {readingProgress && (
          <div className="mt-8 inline-flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            <span>Continue reading: <strong>{readingProgress.surah_name}</strong></span>
            <button 
              data-testid="continue-reading-btn"
              className="btn-primary text-sm py-2 px-4"
              onClick={() => onSelectSurah(readingProgress.surah_number)}
            >
              Continue
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
        <QuickActionCard icon={<Book />} title="Browse Surahs" description="Explore all 114 chapters" onClick={() => onNavigate('surahs')} />
        <QuickActionCard icon={<GraduationCap />} title="Learn Arabic" description="Master alphabet & grammar" onClick={() => onNavigate('learn')} />
        <QuickActionCard icon={<Brain />} title="Hifz" description="Memorization tools" onClick={() => { onNavigate('hifz'); onLoadHifz(); }} />
        <QuickActionCard icon={<Bookmark />} title="Bookmarks" description="Your saved verses" onClick={() => onNavigate('bookmarks')} />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Featured Surahs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredSurahs.map((num, idx) => {
            const surah = surahs.find(s => s.number === num);
            if (!surah) return null;
            return <SurahCard key={surah.number} surah={surah} onClick={() => onSelectSurah(surah.number)} delay={idx * 100} />;
          })}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, onClick }) {
  return (
    <button className="learn-card text-left w-full" onClick={onClick}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(4, 120, 87, 0.1)' }}>
        {React.cloneElement(icon, { size: 24, style: { color: 'var(--primary)' } })}
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{description}</p>
    </button>
  );
}

// ==================== SURAH LIST VIEW ====================
function SurahListView({ surahs, searchQuery, onSearchChange, onSelectSurah }) {
  return (
    <div className="container-fluid py-8">
      <div className="relative max-w-md mx-auto mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input 
          data-testid="surah-search-input"
          type="text"
          placeholder="Search surahs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {surahs.map((surah, idx) => (
          <SurahCard key={surah.number} surah={surah} onClick={() => onSelectSurah(surah.number)} delay={Math.min(idx * 30, 300)} />
        ))}
      </div>

      {surahs.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          No surahs found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}

function SurahCard({ surah, onClick, delay = 0 }) {
  return (
    <button 
      data-testid={`surah-card-${surah.number}`}
      className="surah-card card p-4 text-left w-full animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="surah-number flex-shrink-0">{surah.number}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate" style={{ color: 'var(--text)' }}>{surah.englishName}</h3>
            <span className="font-arabic text-xl flex-shrink-0" style={{ color: 'var(--primary)' }} dir="rtl">{surah.name}</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{surah.englishNameTranslation}</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="badge badge-primary">{surah.numberOfAyahs} verses</span>
            <span className="badge badge-secondary">{surah.revelationType}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ==================== READER VIEW ====================
function ReaderView({ 
  surahData, transliterationData, loading, settings, textSizeClass, currentAyah, isPlaying,
  onPlayAyah, onToggleBookmark, isBookmarked, hasHadith, onOpenHadith, onBack,
  onPrevSurah, onNextSurah
}) {
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(settings.show_transliteration);
  const [viewMode, setViewMode] = useState(settings.view_mode || 'scroll');
  const [currentPage, setCurrentPage] = useState(0);
  const ayahsPerPage = viewMode === 'reading' ? 5 : 10;
  
  if (loading) {
    return (
      <div className="container-fluid py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!surahData) {
    return <div className="container-fluid py-16 text-center" style={{ color: 'var(--muted)' }}>Select a surah to start reading</div>;
  }

  const totalPages = Math.ceil((surahData.ayahs?.length || 0) / ayahsPerPage);
  const displayedAyahs = (viewMode === 'reading' || viewMode === 'book')
    ? surahData.ayahs?.slice(currentPage * ayahsPerPage, (currentPage + 1) * ayahsPerPage)
    : surahData.ayahs;

  // Reading mode - immersive full document style
  if (viewMode === 'reading') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
        {/* Minimal Header */}
        <div className="sticky top-0 z-20 glass border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="container-fluid py-3 flex items-center justify-between">
            <button className="icon-btn" onClick={onBack}>
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{surahData.englishName}</span>
              <span className="mx-2" style={{ color: 'var(--muted)' }}>•</span>
              <span className="font-arabic" style={{ color: 'var(--primary)' }}>{surahData.name}</span>
            </div>
            <button 
              className="icon-btn"
              onClick={() => setViewMode('scroll')}
              title="Exit Reading Mode"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Reading Content - RTL Document Style */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8" dir="rtl">
          {/* Bismillah */}
          {surahData.number !== 1 && surahData.number !== 9 && (
            <div className="text-center py-8 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="font-arabic text-3xl" style={{ color: 'var(--primary)' }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          )}

          {/* Continuous Text Flow */}
          <div className="reading-content">
            {displayedAyahs?.map((ayah, idx) => (
              <span key={ayah.number} className="inline">
                <span 
                  className={`font-arabic ${textSizeClass.arabicClass} leading-[2.5] cursor-pointer hover:text-primary transition-colors ${currentAyah === ayah.number ? 'text-primary' : ''}`}
                  style={{ color: currentAyah === ayah.number ? 'var(--primary)' : 'var(--text)' }}
                  onClick={() => onPlayAyah(ayah.number)}
                >
                  {ayah.arabic}
                </span>
                <span 
                  className="inline-flex items-center justify-center w-8 h-8 mx-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                >
                  {ayah.number}
                </span>
                {' '}
              </span>
            ))}
          </div>

          {/* Translation Section */}
          {showTranslation && (
            <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }} dir="ltr">
              <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text)' }}>Translation</h3>
              <div className="space-y-4">
                {displayedAyahs?.map((ayah) => (
                  <div key={ayah.number} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(4, 120, 87, 0.1)', color: 'var(--primary)' }}>
                      {ayah.number}
                    </span>
                    <p className={`${textSizeClass.translationClass} leading-relaxed`} style={{ color: 'var(--text)' }}>
                      {ayah.translation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div className="sticky bottom-0 glass border-t py-4" style={{ borderColor: 'var(--border)' }}>
            <div className="container-fluid flex items-center justify-center gap-4">
              <button 
                className="btn-secondary"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronRight size={18} className="inline" /> السابق
              </button>
              <span style={{ color: 'var(--muted)' }}>صفحة {currentPage + 1} من {totalPages}</span>
              <button 
                className="btn-primary"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                التالي <ChevronLeft size={18} className="inline" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-fluid py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button data-testid="back-to-surahs" className="icon-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{surahData.englishName}</h1>
          <p className="font-arabic text-xl" style={{ color: 'var(--primary)' }} dir="rtl">{surahData.name}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {surahData.englishNameTranslation} • {surahData.numberOfAyahs} verses • {surahData.revelationType}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button data-testid="prev-surah-btn" className="icon-btn" onClick={onPrevSurah} disabled={surahData.number <= 1}>
            <ChevronLeft size={20} />
          </button>
          <button data-testid="next-surah-btn" className="icon-btn" onClick={onNextSurah} disabled={surahData.number >= 114}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Display Options */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        <button 
          className={`tab ${showTranslation ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => setShowTranslation(!showTranslation)}
        >
          <Languages size={16} className="inline mr-2" />Translation
        </button>
        <button 
          className={`tab ${showTransliteration ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => setShowTransliteration(!showTransliteration)}
        >
          <Type size={16} className="inline mr-2" />Transliteration
        </button>
        <button 
          className={`tab ${viewMode === 'reading' ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => setViewMode('reading')}
        >
          <BookOpen size={16} className="inline mr-2" />Reading Mode
        </button>
      </div>

      {/* Bismillah */}
      {surahData.number !== 1 && surahData.number !== 9 && (
        <div className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
      )}

      {/* Ayahs */}
      <div className="max-w-3xl mx-auto space-y-4">
        {displayedAyahs?.map((ayah, idx) => {
          const transliteration = transliterationData?.find(t => t.number === ayah.number);
          return (
            <AyahCard 
              key={ayah.number}
              ayah={ayah}
              index={idx}
              textSizeClass={textSizeClass}
              showTranslation={showTranslation}
              showTransliteration={showTransliteration}
              transliteration={transliteration?.text}
              showTajweed={settings.show_tajweed}
              isPlaying={currentAyah === ayah.number && isPlaying}
              isBookmarked={isBookmarked(ayah.number)}
              hasHadith={hasHadith(ayah.number)}
              onPlay={() => onPlayAyah(ayah.number)}
              onToggleBookmark={() => onToggleBookmark(ayah)}
              onOpenHadith={() => onOpenHadith(ayah)}
              viewMode={viewMode}
            />
          );
        })}
      </div>

      {/* Surah Navigation */}
      <div className="flex items-center justify-between max-w-3xl mx-auto mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <button className="btn-secondary" onClick={onPrevSurah} disabled={surahData.number <= 1}>
          <ChevronLeft size={18} className="inline mr-1" /> Previous Surah
        </button>
        <button className="btn-primary" onClick={onNextSurah} disabled={surahData.number >= 114}>
          Next Surah <ChevronRight size={18} className="inline ml-1" />
        </button>
      </div>
    </div>
  );
}

function AyahCard({ 
  ayah, index, textSizeClass, showTranslation, showTransliteration, transliteration,
  showTajweed, isPlaying, isBookmarked, hasHadith, onPlay, onToggleBookmark, onOpenHadith, viewMode
}) {
  // Apply tajweed colors (simplified - in production would use proper tajweed analysis)
  const getTajweedText = (text) => {
    if (!showTajweed || !text) return text;
    
    // This is a simplified visualization - real tajweed would require proper analysis
    // Highlighting common tajweed patterns
    let coloredText = text;
    
    // Ghunnah (noon/meem with shaddah) - green
    coloredText = coloredText.replace(/(نّ|مّ)/g, '<span class="tajweed-ghunnah">$1</span>');
    
    // Qalqalah letters at end - red
    coloredText = coloredText.replace(/(قْ|طْ|بْ|جْ|دْ)(\s|$)/g, '<span class="tajweed-qalqalah">$1</span>$2');
    
    return coloredText;
  };

  return (
    <div 
      data-testid={`ayah-card-${ayah.number}`}
      className={`ayah-container animate-fade-in ${isPlaying ? 'ayah-playing' : ''} ${viewMode === 'book' ? 'book-ayah' : ''}`}
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Arabic Text */}
      <div 
        className={`arabic-text ${textSizeClass.arabicClass} mb-4`} 
        lang="ar" 
        dir="rtl"
        dangerouslySetInnerHTML={{ __html: showTajweed ? getTajweedText(ayah.arabic) : ayah.arabic }}
      />
      <span className="verse-number">{ayah.number}</span>

      {/* Transliteration */}
      {showTransliteration && transliteration && (
        <p className="text-base italic mb-3" style={{ color: 'var(--secondary)' }}>
          {transliteration}
        </p>
      )}

      {/* Translation */}
      {showTranslation && (
        <p className={`${textSizeClass.translationClass} leading-relaxed`} style={{ color: 'var(--text)', opacity: 0.9 }}>
          {ayah.translation}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <button 
          data-testid={`play-ayah-${ayah.number}`}
          className="icon-btn icon-btn-primary"
          onClick={onPlay}
          title="Play recitation"
        >
          {isPlaying ? <Volume2 size={18} /> : <Play size={18} />}
        </button>
        <button 
          data-testid={`bookmark-ayah-${ayah.number}`}
          className="icon-btn"
          onClick={onToggleBookmark}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          style={{ color: isBookmarked ? 'var(--secondary)' : 'var(--muted)' }}
        >
          <Bookmark size={18} fill={isBookmarked ? 'var(--secondary)' : 'none'} />
        </button>
        {hasHadith && (
          <button 
            data-testid={`hadith-ayah-${ayah.number}`}
            className="icon-btn"
            onClick={onOpenHadith}
            title="Related Hadith"
            style={{ color: 'var(--secondary)' }}
          >
            <FileText size={18} />
          </button>
        )}
        {ayah.sajda && <span className="badge badge-secondary ml-2"><Star size={12} className="mr-1" /> Sajda</span>}
      </div>
    </div>
  );
}

// ==================== LEARN VIEW ====================
function LearnView({ learnTab, onTabChange, alphabetData, tajweedData, grammarData, vocabularyData, phrasesData, onPlayPronunciation }) {
  return (
    <div className="container-fluid py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Learn Arabic</h1>
        <p style={{ color: 'var(--muted)' }}>Master the language of the Quran</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {['alphabet', 'tajweed', 'grammar', 'vocabulary', 'phrases'].map(tab => (
          <button 
            key={tab}
            data-testid={`learn-tab-${tab}`}
            className={`tab ${learnTab === tab ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => onTabChange(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {learnTab === 'alphabet' && <AlphabetSection data={alphabetData} onPlay={onPlayPronunciation} />}
      {learnTab === 'tajweed' && <TajweedSection data={tajweedData} />}
      {learnTab === 'grammar' && <GrammarSection data={grammarData} onPlay={onPlayPronunciation} />}
      {learnTab === 'vocabulary' && <VocabularySection data={vocabularyData} onPlay={onPlayPronunciation} />}
      {learnTab === 'phrases' && <PhrasesSection data={phrasesData} onPlay={onPlayPronunciation} />}
    </div>
  );
}

function AlphabetSection({ data, onPlay }) {
  const [selectedLetter, setSelectedLetter] = useState(null);

  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-7 lg:grid-cols-10 gap-4 mb-8">
        {data.map((letter, idx) => (
          <button
            key={idx}
            data-testid={`letter-${letter.name}`}
            className={`letter-card ${selectedLetter?.name === letter.name ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedLetter(letter)}
          >
            <span className="letter">{letter.letter}</span>
            <span className="name">{letter.name}</span>
          </button>
        ))}
      </div>

      {selectedLetter && (
        <div className="max-w-2xl mx-auto card p-6 animate-fade-in">
          <div className="text-center mb-6">
            <span className="font-arabic text-6xl" style={{ color: 'var(--primary)' }}>{selectedLetter.letter}</span>
            <h3 className="text-2xl font-bold mt-2" style={{ color: 'var(--text)' }}>{selectedLetter.name}</h3>
            <button 
              className="icon-btn icon-btn-primary mt-2"
              onClick={() => onPlay(selectedLetter.letter)}
              title="Listen to pronunciation"
            >
              <Volume2 size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <InfoRow label="Transliteration" value={selectedLetter.transliteration} />
            <InfoRow label="Position" value={selectedLetter.position} />
            <div className="pt-4">
              <span className="block mb-2" style={{ color: 'var(--muted)' }}>Sound Description</span>
              <p style={{ color: 'var(--text)' }}>{selectedLetter.sound}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="settings-item">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="font-semibold" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function TajweedSection({ data }) {
  const [expandedCategory, setExpandedCategory] = useState(0);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tajweed Color Legend */}
      <div className="card p-4 mb-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Tajweed Color Legend</h3>
        <div className="flex flex-wrap gap-4">
          <ColorLegend color="#10B981" label="Ghunnah (Nasalization)" />
          <ColorLegend color="#3B82F6" label="Ikhfa (Hiding)" />
          <ColorLegend color="#8B5CF6" label="Idgham (Merging)" />
          <ColorLegend color="#F59E0B" label="Iqlab (Conversion)" />
          <ColorLegend color="#EF4444" label="Qalqalah (Echo)" />
          <ColorLegend color="#EC4899" label="Madd (Elongation)" />
        </div>
      </div>

      {data.map((category, idx) => (
        <div key={idx} className="mb-6">
          <button
            data-testid={`tajweed-category-${idx}`}
            className="w-full text-left p-4 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={() => setExpandedCategory(expandedCategory === idx ? null : idx)}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{category.category}</h3>
            <ChevronRight size={20} style={{ color: 'var(--muted)', transform: expandedCategory === idx ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {expandedCategory === idx && (
            <div className="mt-2 space-y-3 animate-fade-in">
              {category.rules.map((rule, rIdx) => (
                <div key={rIdx} className="tajweed-card">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="rule-name">{rule.name}</span>
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>({rule.meaning})</span>
                  </div>
                  <p className="mb-3" style={{ color: 'var(--text)' }}>{rule.description}</p>
                  {rule.example && <div className="rule-arabic font-arabic text-xl" dir="rtl">{rule.example}</div>}
                  {rule.letters && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>Letters:</span>
                      {rule.letters.map((l, i) => (
                        <span key={i} className="font-arabic text-lg px-2 py-1 rounded" style={{ backgroundColor: 'var(--background)', color: 'var(--primary)' }}>{l}</span>
                      ))}
                    </div>
                  )}
                  {rule.duration && <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Duration: <span className="font-semibold">{rule.duration}</span></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ColorLegend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
      <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  );
}

function GrammarSection({ data, onPlay }) {
  const [activeSection, setActiveSection] = useState('parts_of_speech');

  if (!data) return <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading...</div>;

  const sections = [
    { id: 'parts_of_speech', label: 'Parts of Speech' },
    { id: 'case_endings', label: 'Case Endings' },
    { id: 'sentence_types', label: 'Sentence Types' },
    { id: 'common_patterns', label: 'Common Patterns' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {sections.map(s => (
          <button
            key={s.id}
            className={`tab whitespace-nowrap ${activeSection === s.id ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'parts_of_speech' && (
        <div className="space-y-6">
          {data.parts_of_speech?.map((part, idx) => (
            <div key={idx} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="font-arabic text-3xl" style={{ color: 'var(--primary)' }}>{part.name.split(' ')[0]}</span>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{part.english}</h3>
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>{part.name}</span>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => onPlay(part.name.split(' ')[0])} title="Listen">
                  <Volume2 size={18} />
                </button>
              </div>
              <p className="mb-4" style={{ color: 'var(--text)' }}>{part.description}</p>
              {part.examples && (
                <div className="flex flex-wrap gap-2">
                  {part.examples.map((ex, i) => (
                    <span key={i} className="badge badge-primary font-arabic text-lg px-3 py-1">{ex}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSection === 'case_endings' && (
        <div className="grid md:grid-cols-3 gap-6">
          {data.case_endings?.map((ending, idx) => (
            <div key={idx} className="card p-6 text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(4, 120, 87, 0.1)' }}>
                <span className="font-arabic text-2xl" style={{ color: 'var(--primary)' }}>{ending.marker}</span>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>{ending.english}</h3>
              <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{ending.name}</p>
              <p className="text-sm mb-3" style={{ color: 'var(--text)' }}>{ending.usage}</p>
              <div className="font-arabic text-lg p-2 rounded" style={{ backgroundColor: 'var(--background)', color: 'var(--secondary)' }} dir="rtl">{ending.example}</div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'sentence_types' && (
        <div className="grid md:grid-cols-2 gap-6">
          {data.sentence_types?.map((type, idx) => (
            <div key={idx} className="card p-6">
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>{type.english}</h3>
              <p className="font-arabic text-xl mb-3" style={{ color: 'var(--primary)' }} dir="rtl">{type.name}</p>
              <p className="mb-3" style={{ color: 'var(--muted)' }}><strong>Structure:</strong> {type.structure}</p>
              <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--background)' }}>
                <span className="font-arabic text-lg" style={{ color: 'var(--secondary)' }} dir="rtl">{type.example}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{type.notes}</p>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'common_patterns' && (
        <div className="grid md:grid-cols-3 gap-6">
          {data.common_patterns?.map((pattern, idx) => (
            <div key={idx} className="card p-6">
              <div className="font-arabic text-3xl text-center mb-4" style={{ color: 'var(--primary)' }} dir="rtl">{pattern.pattern}</div>
              <p className="text-center font-semibold mb-4" style={{ color: 'var(--text)' }}>{pattern.meaning}</p>
              <div className="space-y-2">
                {pattern.examples?.map((ex, i) => (
                  <div key={i} className="text-center p-2 rounded" style={{ backgroundColor: 'var(--background)' }}>
                    <span className="font-arabic" style={{ color: 'var(--secondary)' }}>{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VocabularySection({ data, onPlay }) {
  const categories = [...new Set(data.map(v => v.category))];
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

  const filteredVocab = selectedCategory ? data.filter(v => v.category === selectedCategory) : data;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            className={`tab whitespace-nowrap ${selectedCategory === cat ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredVocab.map((word, idx) => (
          <div key={idx} className="card p-4 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-arabic text-2xl" style={{ color: 'var(--primary)' }}>{word.arabic}</span>
                <button className="icon-btn" onClick={() => onPlay(word.arabic)} title="Listen">
                  <Volume2 size={16} />
                </button>
              </div>
              <p className="text-sm italic" style={{ color: 'var(--muted)' }}>{word.transliteration}</p>
              <p className="font-semibold mt-1" style={{ color: 'var(--text)' }}>{word.meaning}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{word.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhrasesSection({ data, onPlay }) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {data.map((phrase, idx) => (
        <div key={idx} className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-arabic text-2xl mb-2" style={{ color: 'var(--primary)' }} dir="rtl">{phrase.arabic}</p>
              <p className="text-lg italic mb-1" style={{ color: 'var(--secondary)' }}>{phrase.transliteration}</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>{phrase.meaning}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{phrase.usage}</p>
              <span className="badge badge-primary mt-2">{phrase.category}</span>
            </div>
            <button className="icon-btn icon-btn-primary flex-shrink-0" onClick={() => onPlay(phrase.arabic)} title="Listen">
              <Volume2 size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== HIFZ VIEW ====================
function HifzView({ surahs, hifzProgress, hifzStats, onSelectSurah, onRefresh }) {
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahStart, setAyahStart] = useState(1);
  const [ayahEnd, setAyahEnd] = useState(5);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentPracticeAyah, setCurrentPracticeAyah] = useState(0);
  const [showText, setShowText] = useState(true);
  const [repetitions, setRepetitions] = useState(0);
  const [practiceAyahs, setPracticeAyahs] = useState([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const practiceAudioRef = useRef(null);

  const surahInfo = surahs.find(s => s.number === selectedSurah);

  const startPractice = async () => {
    if (!selectedSurah) return;
    
    setLoadingAyahs(true);
    try {
      // Fetch the ayahs for practice
      const res = await api.getSurah(selectedSurah, 'quran-uthmani', 'en.sahih');
      if (res.surah?.ayahs) {
        const ayahs = res.surah.ayahs.filter(
          a => a.number >= ayahStart && a.number <= ayahEnd
        );
        setPracticeAyahs(ayahs);
      }
      
      // Save progress
      await api.saveHifzProgress({
        surah_number: selectedSurah,
        ayah_start: ayahStart,
        ayah_end: ayahEnd,
        status: 'learning',
        repetitions: 0
      });
      
      setPracticeMode(true);
      setCurrentPracticeAyah(ayahStart);
      setRepetitions(0);
      onRefresh();
    } catch (err) {
      console.error('Failed to load ayahs:', err);
    }
    setLoadingAyahs(false);
  };

  const getCurrentAyahData = () => {
    return practiceAyahs.find(a => a.number === currentPracticeAyah);
  };

  const playCurrentAyah = async () => {
    const ayahData = getCurrentAyahData();
    if (!ayahData || !selectedSurah) return;
    
    try {
      const res = await api.getAyahAudio(selectedSurah, currentPracticeAyah, 'Alafasy_128kbps');
      if (res.audio?.url && practiceAudioRef.current) {
        practiceAudioRef.current.src = res.audio.url;
        practiceAudioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  };

  const stopAudio = () => {
    if (practiceAudioRef.current) {
      practiceAudioRef.current.pause();
      practiceAudioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
  };

  const completeRepetition = async () => {
    const newReps = repetitions + 1;
    setRepetitions(newReps);
    
    // After 10 repetitions, mark as memorized
    const status = newReps >= 10 ? 'memorized' : newReps >= 5 ? 'reviewing' : 'learning';
    
    await api.saveHifzProgress({
      surah_number: selectedSurah,
      ayah_start: ayahStart,
      ayah_end: ayahEnd,
      status,
      repetitions: newReps
    });
    onRefresh();
  };

  const exitPractice = () => {
    stopAudio();
    setPracticeMode(false);
    setPracticeAyahs([]);
  };

  // Audio ended handler
  useEffect(() => {
    const audio = practiceAudioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlayingAudio(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  return (
    <div className="container-fluid py-8">
      {/* Hidden audio element for practice */}
      <audio ref={practiceAudioRef} />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          <Brain className="inline mr-2" size={32} /> Hifz - Memorization
        </h1>
        <p style={{ color: 'var(--muted)' }}>Memorize the Quran using proven rote learning techniques</p>
      </div>

      {/* Stats */}
      {hifzStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
          <StatCard icon={<Check />} label="Memorized" value={`${hifzStats.total_ayahs_memorized} ayahs`} color="var(--primary)" />
          <StatCard icon={<RefreshCw />} label="Reviewing" value={`${hifzStats.total_ayahs_reviewing} ayahs`} color="var(--secondary)" />
          <StatCard icon={<BookMarked />} label="Learning" value={`${hifzStats.total_ayahs_learning} ayahs`} color="var(--muted)" />
          <StatCard icon={<Layers />} label="Surahs" value={`${hifzStats.surahs_in_progress} active`} color="#8B5CF6" />
        </div>
      )}

      {!practiceMode ? (
        <>
          {/* Surah Selection */}
          <div className="max-w-2xl mx-auto card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Start New Memorization Session</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm" style={{ color: 'var(--muted)' }}>Select Surah</label>
                <select 
                  className="select-dropdown w-full"
                  value={selectedSurah || ''}
                  onChange={(e) => {
                    const num = parseInt(e.target.value);
                    setSelectedSurah(num);
                    setAyahStart(1);
                    const s = surahs.find(s => s.number === num);
                    setAyahEnd(Math.min(5, s?.numberOfAyahs || 5));
                  }}
                >
                  <option value="">Choose a Surah...</option>
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>{s.number}. {s.englishName} ({s.numberOfAyahs} ayahs)</option>
                  ))}
                </select>
              </div>

              {selectedSurah && surahInfo && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm" style={{ color: 'var(--muted)' }}>Start Ayah</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={surahInfo.numberOfAyahs}
                        value={ayahStart}
                        onChange={(e) => setAyahStart(Math.max(1, parseInt(e.target.value) || 1))}
                        className="search-input text-center"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm" style={{ color: 'var(--muted)' }}>End Ayah</label>
                      <input 
                        type="number" 
                        min={ayahStart} 
                        max={surahInfo.numberOfAyahs}
                        value={ayahEnd}
                        onChange={(e) => setAyahEnd(Math.max(ayahStart, parseInt(e.target.value) || ayahStart))}
                        className="search-input text-center"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                    <p style={{ color: 'var(--muted)' }}>
                      You will memorize <strong style={{ color: 'var(--primary)' }}>{ayahEnd - ayahStart + 1} ayahs</strong> from {surahInfo.englishName}
                    </p>
                  </div>

                  <button 
                    className="btn-primary w-full" 
                    onClick={startPractice}
                    disabled={loadingAyahs}
                  >
                    {loadingAyahs ? (
                      <span>Loading...</span>
                    ) : (
                      <><Brain className="inline mr-2" size={18} /> Start Memorization</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress List */}
          {hifzProgress.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Your Progress</h3>
              <div className="space-y-3">
                {hifzProgress.map((p, idx) => {
                  const s = surahs.find(s => s.number === p.surah_number);
                  return (
                    <div key={idx} className="card p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text)' }}>{s?.englishName || `Surah ${p.surah_number}`}</p>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Ayahs {p.ayah_start}-{p.ayah_end} • {p.repetitions} reps</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${p.status === 'memorized' ? 'badge-primary' : p.status === 'reviewing' ? 'badge-secondary' : ''}`}>
                          {p.status}
                        </span>
                        <button 
                          className="btn-primary text-sm py-2 px-3"
                          onClick={async () => {
                            setSelectedSurah(p.surah_number);
                            setAyahStart(p.ayah_start);
                            setAyahEnd(p.ayah_end);
                            setRepetitions(p.repetitions || 0);
                            
                            // Load ayahs
                            setLoadingAyahs(true);
                            try {
                              const res = await api.getSurah(p.surah_number, 'quran-uthmani', 'en.sahih');
                              if (res.surah?.ayahs) {
                                const ayahs = res.surah.ayahs.filter(
                                  a => a.number >= p.ayah_start && a.number <= p.ayah_end
                                );
                                setPracticeAyahs(ayahs);
                              }
                              setPracticeMode(true);
                              setCurrentPracticeAyah(p.ayah_start);
                            } catch (err) {
                              console.error('Failed to load ayahs:', err);
                            }
                            setLoadingAyahs(false);
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Memorization Tips */}
          <div className="max-w-2xl mx-auto mt-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Memorization Tips</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <TipCard title="Start Small" description="Begin with 3-5 ayahs per session. Quality over quantity." />
              <TipCard title="Repeat 10-20 Times" description="Recite each ayah 10-20 times until it flows naturally." />
              <TipCard title="Listen First" description="Listen to a reciter before attempting to memorize." />
              <TipCard title="Review Daily" description="Review previously memorized portions every day." />
              <TipCard title="Connect Ayahs" description="Once you know 2 ayahs, practice them together." />
              <TipCard title="Morning is Best" description="The mind is freshest after Fajr prayer." />
            </div>
          </div>
        </>
      ) : (
        /* Practice Mode */
        <div className="max-w-3xl mx-auto">
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {surahInfo?.englishName} • Ayahs {ayahStart}-{ayahEnd}
              </h3>
              <button className="icon-btn" onClick={exitPractice}>
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
              <span className="badge badge-primary">Repetitions: {repetitions}</span>
              <span className="badge badge-secondary">
                {repetitions >= 10 ? 'Memorized!' : repetitions >= 5 ? 'Reviewing' : 'Learning'}
              </span>
              <button 
                className={`tab ${showText ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => setShowText(!showText)}
              >
                {showText ? <Eye size={16} className="inline mr-2" /> : <EyeOff size={16} className="inline mr-2" />}
                {showText ? 'Hide Text' : 'Show Text'}
              </button>
            </div>

            {/* Current Ayah Display */}
            <div className="text-center py-8 px-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--background)' }}>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Ayah {currentPracticeAyah}</p>
              
              {showText ? (
                <div>
                  <p className="font-arabic text-3xl md:text-4xl leading-[2]" style={{ color: 'var(--primary)' }} dir="rtl">
                    {getCurrentAyahData()?.arabic || 'Loading...'}
                  </p>
                  {getCurrentAyahData()?.translation && (
                    <p className="mt-4 text-lg" style={{ color: 'var(--text)', opacity: 0.8 }}>
                      {getCurrentAyahData()?.translation}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-8">
                  <EyeOff size={48} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
                  <p className="text-xl" style={{ color: 'var(--muted)' }}>Text hidden - recite from memory</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Click "Show Text" to check yourself</p>
                </div>
              )}
            </div>

            {/* Audio & Navigation Controls */}
            <div className="flex items-center justify-center gap-4">
              <button 
                className="icon-btn"
                disabled={currentPracticeAyah <= ayahStart}
                onClick={() => { stopAudio(); setCurrentPracticeAyah(p => p - 1); }}
              >
                <SkipBack size={20} />
              </button>
              
              <button 
                className={`icon-btn ${isPlayingAudio ? '' : 'icon-btn-primary'} w-14 h-14`}
                onClick={isPlayingAudio ? stopAudio : playCurrentAyah}
              >
                {isPlayingAudio ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button 
                className="icon-btn"
                disabled={currentPracticeAyah >= ayahEnd}
                onClick={() => { stopAudio(); setCurrentPracticeAyah(p => p + 1); }}
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentPracticeAyah - ayahStart + 1) / (ayahEnd - ayahStart + 1)) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm mt-2" style={{ color: 'var(--muted)' }}>
                Ayah {currentPracticeAyah - ayahStart + 1} of {ayahEnd - ayahStart + 1}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="btn-secondary" onClick={() => setRepetitions(0)}>
              <RotateCcw size={18} className="inline mr-2" /> Reset Reps
            </button>
            <button className="btn-primary" onClick={completeRepetition}>
              <Check size={18} className="inline mr-2" /> Complete Round ({repetitions + 1})
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h4 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>How to Practice:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
              <li>Listen to the ayah by clicking the play button</li>
              <li>Repeat after the reciter multiple times</li>
              <li>Hide the text and try to recite from memory</li>
              <li>Click "Complete Round" after each full recitation</li>
              <li>After 10 repetitions, the ayah is marked as memorized</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card p-4 text-center">
      <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        {React.cloneElement(icon, { size: 20, style: { color } })}
      </div>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="font-semibold" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  );
}

function TipCard({ title, description }) {
  return (
    <div className="card p-4">
      <h4 className="font-semibold mb-1" style={{ color: 'var(--primary)' }}>{title}</h4>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{description}</p>
    </div>
  );
}

// ==================== BOOKMARKS VIEW ====================
function BookmarksView({ bookmarks, onSelectBookmark, onDeleteBookmark }) {
  if (bookmarks.length === 0) {
    return (
      <div className="container-fluid py-16 text-center">
        <Bookmark size={48} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>No Bookmarks Yet</h2>
        <p style={{ color: 'var(--muted)' }}>Save your favorite verses while reading</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Your Bookmarks</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {bookmarks.map((bookmark, idx) => (
          <div key={idx} className="card p-4 flex items-start gap-4">
            <div className="surah-number flex-shrink-0">{bookmark.surah_number}:{bookmark.ayah_number}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{bookmark.surah_name}</h3>
              <p className="font-arabic text-lg mt-1 truncate" style={{ color: 'var(--muted)' }} dir="rtl">{bookmark.ayah_text}...</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="btn-primary text-sm py-2 px-4" onClick={() => onSelectBookmark(bookmark)}>Read</button>
              <button className="icon-btn" onClick={() => onDeleteBookmark(bookmark)} style={{ color: 'var(--muted)' }}><X size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== AUDIO PLAYER BAR ====================
function AudioPlayerBar({ surahData, currentAyah, isPlaying, audioError, onTogglePlay, onPrev, onNext, onStop }) {
  return (
    <div className="audio-bar" data-testid="audio-player-bar">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span style={{ color: 'var(--muted)' }}>{audioError ? 'Audio Error' : 'Now Playing'}</span>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>{surahData?.englishName} - Ayah {currentAyah}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button data-testid="audio-prev" className="icon-btn" onClick={onPrev} disabled={currentAyah <= 1}>
            <SkipBack size={20} />
          </button>
          <button data-testid="audio-play-pause" className={`icon-btn ${audioError ? '' : 'icon-btn-primary'} w-12 h-12`} onClick={onTogglePlay}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button data-testid="audio-next" className="icon-btn" onClick={onNext} disabled={currentAyah >= surahData?.numberOfAyahs}>
            <SkipForward size={20} />
          </button>
          <button data-testid="audio-stop" className="icon-btn ml-4" onClick={onStop}>
            <VolumeX size={20} />
          </button>
        </div>
        
        <div className="hidden md:block text-sm" style={{ color: 'var(--muted)' }}>
          {currentAyah} / {surahData?.numberOfAyahs}
        </div>
      </div>
    </div>
  );
}

// ==================== SETTINGS MODAL ====================
function SettingsModal({ settings, onUpdateSetting, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="card p-6 w-full max-w-md m-4 max-h-[85vh] overflow-y-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
        data-testid="settings-modal"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Settings</h2>
          <button data-testid="close-settings" className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <SettingSection title="Theme">
            <div className="flex gap-2">
              <SettingButton active={settings.theme === 'light'} onClick={() => onUpdateSetting('theme', 'light')}>
                <Sun size={18} /> Light
              </SettingButton>
              <SettingButton active={settings.theme === 'dark'} onClick={() => onUpdateSetting('theme', 'dark')}>
                <Moon size={18} /> Dark
              </SettingButton>
            </div>
          </SettingSection>

          {/* Text Style */}
          <SettingSection title="Arabic Text Style">
            <select 
              className="select-dropdown w-full"
              value={settings.text_style}
              onChange={e => onUpdateSetting('text_style', e.target.value)}
            >
              {TEXT_EDITIONS.map(e => (
                <option key={e.id} value={e.id}>{e.name} - {e.description}</option>
              ))}
            </select>
          </SettingSection>

          {/* Translation */}
          <SettingSection title="Translation">
            <select 
              className="select-dropdown w-full"
              value={settings.translation}
              onChange={e => onUpdateSetting('translation', e.target.value)}
            >
              {TRANSLATIONS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </SettingSection>

          {/* Text Size */}
          <SettingSection title="Text Size">
            <div className="flex gap-2">
              {TEXT_SIZES.map(s => (
                <SettingButton key={s.id} active={settings.text_size === s.id} onClick={() => onUpdateSetting('text_size', s.id)}>
                  {s.name}
                </SettingButton>
              ))}
            </div>
          </SettingSection>

          {/* Reciter */}
          <SettingSection title="Reciter">
            <select 
              className="select-dropdown w-full"
              value={settings.reciter_id}
              onChange={e => onUpdateSetting('reciter_id', e.target.value)}
            >
              {RECITERS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </SettingSection>

          {/* Tajweed Colors */}
          <SettingSection title="Tajweed Colors">
            <div className="flex gap-2">
              <SettingButton active={settings.show_tajweed} onClick={() => onUpdateSetting('show_tajweed', true)}>
                <Eye size={18} /> Show
              </SettingButton>
              <SettingButton active={!settings.show_tajweed} onClick={() => onUpdateSetting('show_tajweed', false)}>
                <EyeOff size={18} /> Hide
              </SettingButton>
            </div>
          </SettingSection>

          {/* View Mode */}
          <SettingSection title="View Mode">
            <div className="flex gap-2">
              <SettingButton active={settings.view_mode === 'scroll'} onClick={() => onUpdateSetting('view_mode', 'scroll')}>
                <Layers size={18} /> Scroll
              </SettingButton>
              <SettingButton active={settings.view_mode === 'book'} onClick={() => onUpdateSetting('view_mode', 'book')}>
                <BookOpen size={18} /> Book
              </SettingButton>
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
}

function SettingSection({ title, children }) {
  return (
    <div>
      <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>{title}</label>
      {children}
    </div>
  );
}

function SettingButton({ active, onClick, children }) {
  return (
    <button 
      className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all`}
      style={{ 
        borderColor: active ? 'var(--primary)' : 'var(--border)', 
        backgroundColor: active ? 'rgba(4, 120, 87, 0.1)' : 'var(--surface)',
        color: active ? 'var(--primary)' : 'var(--text)'
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ==================== HADITH MODAL ====================
function HadithModal({ hadithData, ayah, surahName, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="card p-6 w-full max-w-2xl m-4 max-h-[80vh] overflow-y-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
        data-testid="hadith-modal"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Related Hadith</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{surahName} - Ayah {ayah?.number}</p>
          </div>
          <button data-testid="close-hadith" className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--background)' }}>
          <p className="font-arabic text-xl leading-loose" style={{ color: 'var(--primary)' }} dir="rtl">{ayah?.arabic}</p>
        </div>

        {hadithData?.hadith?.length > 0 ? (
          <div className="space-y-4">
            {hadithData.hadith.map((h, idx) => (
              <div key={idx} className="hadith-card">
                <div className="collection">{h.collection} - {h.book} #{h.number}</div>
                <p className="text">{h.text}</p>
                <p className="narrator">— {h.narrator}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
            <FileText size={48} className="mx-auto mb-4" />
            <p>{hadithData?.message || 'No related hadith found for this ayah.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
