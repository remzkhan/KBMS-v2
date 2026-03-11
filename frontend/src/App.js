import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Book, Play, Pause, SkipBack, SkipForward, Settings, Moon, Sun, 
  Search, Bookmark, BookOpen, ChevronRight, ChevronLeft, X, Volume2,
  GraduationCap, Languages, Type, User, Clock, Star, Menu, Home,
  FileText, VolumeX
} from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ==================== API FUNCTIONS ====================
const api = {
  getSurahs: () => fetch(`${API_URL}/api/surahs`).then(r => r.json()),
  getSurah: (num, edition, translation) => 
    fetch(`${API_URL}/api/surah/${num}?edition=${edition}&translation=${translation}`).then(r => r.json()),
  getReciters: () => fetch(`${API_URL}/api/reciters`).then(r => r.json()),
  getSurahAudio: (reciterId, surahNum) => 
    fetch(`${API_URL}/api/audio/${reciterId}/${surahNum}`).then(r => r.json()),
  getAyahAudio: (reciterId, surahNum, ayahNum) => 
    fetch(`${API_URL}/api/audio/ayah/${reciterId}/${surahNum}/${ayahNum}`).then(r => r.json()),
  getRelatedHadith: (surahNum, ayahNum) => 
    fetch(`${API_URL}/api/hadith/related/${surahNum}/${ayahNum}`).then(r => r.json()),
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
};

// ==================== CONSTANTS ====================
const TEXT_EDITIONS = [
  { id: 'quran-uthmani', name: 'Uthmani', description: 'Standard Arabic script' },
  { id: 'quran-simple', name: 'Simple', description: 'Simplified Arabic' },
  { id: 'quran-simple-clean', name: 'Clean', description: 'Clean simplified text' },
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
  { id: 'small', name: 'Small', arabicClass: 'arabic-text-sm', translationClass: 'text-sm' },
  { id: 'medium', name: 'Medium', arabicClass: 'arabic-text-md', translationClass: 'text-base' },
  { id: 'large', name: 'Large', arabicClass: 'arabic-text-lg', translationClass: 'text-lg' },
  { id: 'xlarge', name: 'Extra Large', arabicClass: 'arabic-text-xl', translationClass: 'text-xl' },
];

// ==================== MAIN APP ====================
function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reciters, setReciters] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [readingProgress, setReadingProgress] = useState(null);
  
  // Settings
  const [settings, setSettings] = useState({
    text_style: 'quran-uthmani',
    reciter_id: '7',
    translation: 'en.sahih',
    text_size: 'large',
    theme: 'dark'
  });
  
  // Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
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
      const [surahRes, reciterRes, bookmarkRes, settingsRes, progressRes] = await Promise.all([
        api.getSurahs(),
        api.getReciters(),
        api.getBookmarks(),
        api.getSettings(),
        api.getProgress()
      ]);
      
      setSurahs(surahRes.surahs || []);
      setReciters(reciterRes.reciters || []);
      setBookmarks(bookmarkRes.bookmarks || []);
      if (settingsRes.settings) {
        setSettings(settingsRes.settings);
        setDarkMode(settingsRes.settings.theme === 'dark');
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
    try {
      const res = await api.getSurah(surahNumber, settings.text_style, settings.translation);
      setSurahData(res.surah);
      setSelectedSurah(surahNumber);
      setCurrentView('reader');
      
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

  // Audio functions
  const playAyah = useCallback(async (ayahNumber) => {
    if (!selectedSurah) return;
    
    try {
      const res = await api.getAyahAudio(settings.reciter_id, selectedSurah, ayahNumber);
      if (res.audio?.url) {
        setAudioUrl(res.audio.url);
        setCurrentAyah(ayahNumber);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Failed to get audio:', err);
    }
  }, [selectedSurah, settings.reciter_id]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl]);

  // Handle audio end - play next ayah
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        playNextAyah();
      };
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
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
      }
    } catch (err) {
      console.error('Failed to load learning data:', err);
    }
  };

  // Filter surahs - search by English name, Arabic name, translation, and number
  const filteredSurahs = surahs.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      s.englishName?.toLowerCase().includes(query) ||
      s.englishNameTranslation?.toLowerCase().includes(query) ||
      s.name?.includes(searchQuery) ||  // Arabic text search (case-sensitive)
      s.number?.toString() === query
    );
  });

  const getTextSizeClass = () => {
    return TEXT_SIZES.find(s => s.id === settings.text_size) || TEXT_SIZES[2];
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`} style={{ backgroundColor: 'var(--background)' }}>
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
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
              <div className="flex items-center gap-2">
                <Book className="text-primary" size={28} style={{ color: 'var(--primary)' }} />
                <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>Quran Reader</span>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                data-testid="nav-home"
                className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => setCurrentView('home')}
              >
                Home
              </button>
              <button 
                data-testid="nav-surahs"
                className={`nav-link ${currentView === 'surahs' ? 'active' : ''}`}
                onClick={() => setCurrentView('surahs')}
              >
                Surahs
              </button>
              <button 
                data-testid="nav-learn"
                className={`nav-link ${currentView === 'learn' ? 'active' : ''}`}
                onClick={() => { setCurrentView('learn'); loadLearningData('alphabet'); }}
              >
                Learn Arabic
              </button>
              <button 
                data-testid="nav-bookmarks"
                className={`nav-link ${currentView === 'bookmarks' ? 'active' : ''}`}
                onClick={() => setCurrentView('bookmarks')}
              >
                Bookmarks
              </button>
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
            <div className="container-fluid flex flex-col gap-4">
              <button 
                data-testid="mobile-nav-home"
                className="text-left py-2"
                onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
              >
                <Home size={18} className="inline mr-3" /> Home
              </button>
              <button 
                data-testid="mobile-nav-surahs"
                className="text-left py-2"
                onClick={() => { setCurrentView('surahs'); setMobileMenuOpen(false); }}
              >
                <Book size={18} className="inline mr-3" /> Surahs
              </button>
              <button 
                data-testid="mobile-nav-learn"
                className="text-left py-2"
                onClick={() => { setCurrentView('learn'); loadLearningData('alphabet'); setMobileMenuOpen(false); }}
              >
                <GraduationCap size={18} className="inline mr-3" /> Learn Arabic
              </button>
              <button 
                data-testid="mobile-nav-bookmarks"
                className="text-left py-2"
                onClick={() => { setCurrentView('bookmarks'); setMobileMenuOpen(false); }}
              >
                <Bookmark size={18} className="inline mr-3" /> Bookmarks
              </button>
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
            loading={loading}
            settings={settings}
            textSizeClass={getTextSizeClass()}
            currentAyah={currentAyah}
            isPlaying={isPlaying}
            onPlayAyah={playAyah}
            onToggleBookmark={toggleBookmark}
            isBookmarked={(num) => isBookmarked(selectedSurah, num)}
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
          />
        )}
        
        {currentView === 'bookmarks' && (
          <BookmarksView 
            bookmarks={bookmarks}
            onSelectBookmark={(b) => {
              loadSurah(b.surah_number);
            }}
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
          onTogglePlay={togglePlayPause}
          onPrev={playPrevAyah}
          onNext={playNextAyah}
          onStop={() => {
            setCurrentAyah(null);
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.src = '';
            }
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          settings={settings}
          reciters={reciters}
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

// ==================== HOME VIEW ====================
function HomeView({ surahs, readingProgress, onSelectSurah, onNavigate }) {
  const featuredSurahs = [1, 36, 55, 67, 112, 114]; // Al-Fatiha, Yasin, Rahman, Mulk, Ikhlas, Nas
  
  return (
    <div className="container-fluid py-12">
      {/* Hero Section */}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <QuickActionCard 
          icon={<Book />}
          title="Browse Surahs"
          description="Explore all 114 chapters of the Holy Quran"
          onClick={() => onNavigate('surahs')}
          testId="browse-surahs-card"
        />
        <QuickActionCard 
          icon={<GraduationCap />}
          title="Learn Arabic"
          description="Master the alphabet, Tajweed rules, and grammar"
          onClick={() => onNavigate('learn')}
          testId="learn-arabic-card"
        />
        <QuickActionCard 
          icon={<Bookmark />}
          title="Your Bookmarks"
          description="Access your saved verses and notes"
          onClick={() => onNavigate('bookmarks')}
          testId="bookmarks-card"
        />
      </div>

      {/* Featured Surahs */}
      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Featured Surahs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredSurahs.map((num, idx) => {
            const surah = surahs.find(s => s.number === num);
            if (!surah) return null;
            return (
              <SurahCard 
                key={surah.number}
                surah={surah}
                onClick={() => onSelectSurah(surah.number)}
                delay={idx * 100}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, onClick, testId }) {
  return (
    <button 
      data-testid={testId}
      className="learn-card text-left w-full"
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(4, 120, 87, 0.1)' }}>
        {React.cloneElement(icon, { size: 24, style: { color: 'var(--primary)' } })}
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
      <p style={{ color: 'var(--muted)' }}>{description}</p>
    </button>
  );
}

// ==================== SURAH LIST VIEW ====================
function SurahListView({ surahs, searchQuery, onSearchChange, onSelectSurah }) {
  return (
    <div className="container-fluid py-8">
      {/* Search */}
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

      {/* Surah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {surahs.map((surah, idx) => (
          <SurahCard 
            key={surah.number}
            surah={surah}
            onClick={() => onSelectSurah(surah.number)}
            delay={Math.min(idx * 50, 500)}
          />
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
        <div className="surah-number flex-shrink-0">
          {surah.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate" style={{ color: 'var(--text)' }}>{surah.englishName}</h3>
            <span className="font-arabic text-xl flex-shrink-0" style={{ color: 'var(--primary)' }} dir="rtl">{surah.name}</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {surah.englishNameTranslation}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
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
  surahData, loading, settings, textSizeClass, currentAyah, isPlaying,
  onPlayAyah, onToggleBookmark, isBookmarked, onOpenHadith, onBack,
  onPrevSurah, onNextSurah
}) {
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  
  if (loading) {
    return (
      <div className="container-fluid py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!surahData) {
    return (
      <div className="container-fluid py-16 text-center" style={{ color: 'var(--muted)' }}>
        Select a surah to start reading
      </div>
    );
  }

  return (
    <div className="container-fluid py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          data-testid="back-to-surahs"
          className="icon-btn"
          onClick={onBack}
        >
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
          <button 
            data-testid="prev-surah-btn"
            className="icon-btn"
            onClick={onPrevSurah}
            disabled={surahData.number <= 1}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            data-testid="next-surah-btn"
            className="icon-btn"
            onClick={onNextSurah}
            disabled={surahData.number >= 114}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Display Options */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button 
          data-testid="toggle-translation"
          className={`tab ${showTranslation ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => setShowTranslation(!showTranslation)}
        >
          <Languages size={16} className="inline mr-2" />
          Translation
        </button>
        <button 
          data-testid="toggle-transliteration"
          className={`tab ${showTransliteration ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => setShowTransliteration(!showTransliteration)}
        >
          <Type size={16} className="inline mr-2" />
          Transliteration
        </button>
      </div>

      {/* Bismillah */}
      {surahData.number !== 1 && surahData.number !== 9 && (
        <div className="bismillah">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      )}

      {/* Ayahs */}
      <div className="max-w-3xl mx-auto space-y-4">
        {surahData.ayahs?.map((ayah, idx) => (
          <AyahCard 
            key={ayah.number}
            ayah={ayah}
            index={idx}
            textSizeClass={textSizeClass}
            showTranslation={showTranslation}
            showTransliteration={showTransliteration}
            isPlaying={currentAyah === ayah.number && isPlaying}
            isBookmarked={isBookmarked(ayah.number)}
            onPlay={() => onPlayAyah(ayah.number)}
            onToggleBookmark={() => onToggleBookmark(ayah)}
            onOpenHadith={() => onOpenHadith(ayah)}
          />
        ))}
      </div>

      {/* Surah Navigation */}
      <div className="flex items-center justify-between max-w-3xl mx-auto mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <button 
          data-testid="prev-surah-bottom"
          className="btn-secondary"
          onClick={onPrevSurah}
          disabled={surahData.number <= 1}
        >
          <ChevronLeft size={18} className="inline mr-1" /> Previous Surah
        </button>
        <button 
          data-testid="next-surah-bottom"
          className="btn-primary"
          onClick={onNextSurah}
          disabled={surahData.number >= 114}
        >
          Next Surah <ChevronRight size={18} className="inline ml-1" />
        </button>
      </div>
    </div>
  );
}

function AyahCard({ 
  ayah, index, textSizeClass, showTranslation, showTransliteration,
  isPlaying, isBookmarked, onPlay, onToggleBookmark, onOpenHadith
}) {
  return (
    <div 
      data-testid={`ayah-card-${ayah.number}`}
      className={`ayah-container animate-fade-in ${isPlaying ? 'ayah-playing' : ''}`}
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Arabic Text */}
      <div className={`arabic-text ${textSizeClass.arabicClass} mb-4`} lang="ar" dir="rtl">
        {ayah.arabic}
        <span className="verse-number mx-2">{ayah.number}</span>
      </div>

      {/* Transliteration (placeholder - would need actual transliteration data) */}
      {showTransliteration && (
        <p className="text-base italic mb-3" style={{ color: 'var(--muted)' }}>
          {/* Transliteration would be fetched from API with transliteration edition */}
          [Transliteration not available - select transliteration edition in settings]
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
          title={isPlaying ? 'Playing' : 'Play recitation'}
        >
          {isPlaying ? <Volume2 size={18} /> : <Play size={18} />}
        </button>
        <button 
          data-testid={`bookmark-ayah-${ayah.number}`}
          className={`icon-btn ${isBookmarked ? '' : ''}`}
          onClick={onToggleBookmark}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          style={{ color: isBookmarked ? 'var(--secondary)' : 'var(--muted)' }}
        >
          <Bookmark size={18} fill={isBookmarked ? 'var(--secondary)' : 'none'} />
        </button>
        <button 
          data-testid={`hadith-ayah-${ayah.number}`}
          className="icon-btn"
          onClick={onOpenHadith}
          title="Related Hadith"
        >
          <FileText size={18} />
        </button>
        {ayah.sajda && (
          <span className="badge badge-secondary ml-2">
            <Star size={12} className="mr-1" /> Sajda
          </span>
        )}
      </div>
    </div>
  );
}

// ==================== LEARN VIEW ====================
function LearnView({ learnTab, onTabChange, alphabetData, tajweedData, grammarData }) {
  return (
    <div className="container-fluid py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Learn Arabic</h1>
        <p style={{ color: 'var(--muted)' }}>Master the language of the Quran</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        <button 
          data-testid="learn-tab-alphabet"
          className={`tab ${learnTab === 'alphabet' ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => onTabChange('alphabet')}
        >
          Alphabet
        </button>
        <button 
          data-testid="learn-tab-tajweed"
          className={`tab ${learnTab === 'tajweed' ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => onTabChange('tajweed')}
        >
          Tajweed Rules
        </button>
        <button 
          data-testid="learn-tab-grammar"
          className={`tab ${learnTab === 'grammar' ? 'tab-active' : 'tab-inactive'}`}
          onClick={() => onTabChange('grammar')}
        >
          Grammar
        </button>
      </div>

      {/* Content */}
      {learnTab === 'alphabet' && <AlphabetSection data={alphabetData} />}
      {learnTab === 'tajweed' && <TajweedSection data={tajweedData} />}
      {learnTab === 'grammar' && <GrammarSection data={grammarData} />}
    </div>
  );
}

function AlphabetSection({ data }) {
  const [selectedLetter, setSelectedLetter] = useState(null);

  return (
    <div>
      <div className="grid grid-cols-4 md:grid-cols-7 lg:grid-cols-10 gap-4 mb-8">
        {data.map((letter, idx) => (
          <button
            key={idx}
            data-testid={`letter-${letter.name}`}
            className={`letter-card ${selectedLetter?.name === letter.name ? 'border-primary' : ''}`}
            onClick={() => setSelectedLetter(letter)}
            style={{ borderColor: selectedLetter?.name === letter.name ? 'var(--primary)' : undefined }}
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
          </div>
          <div className="space-y-4">
            <div className="settings-item">
              <span style={{ color: 'var(--muted)' }}>Transliteration</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{selectedLetter.transliteration}</span>
            </div>
            <div className="settings-item">
              <span style={{ color: 'var(--muted)' }}>Position</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{selectedLetter.position}</span>
            </div>
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

function TajweedSection({ data }) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  return (
    <div className="max-w-3xl mx-auto">
      {data.map((category, idx) => (
        <div key={idx} className="mb-6">
          <button
            data-testid={`tajweed-category-${idx}`}
            className="w-full text-left p-4 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={() => setExpandedCategory(expandedCategory === idx ? null : idx)}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{category.category}</h3>
            <ChevronRight 
              size={20} 
              style={{ 
                color: 'var(--muted)',
                transform: expandedCategory === idx ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s'
              }} 
            />
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
                  {rule.example && (
                    <div className="rule-arabic">{rule.example}</div>
                  )}
                  {rule.letters && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>Letters:</span>
                      {rule.letters.map((l, i) => (
                        <span key={i} className="font-arabic text-lg" style={{ color: 'var(--primary)' }}>{l}</span>
                      ))}
                    </div>
                  )}
                  {rule.duration && (
                    <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                      Duration: <span className="font-semibold">{rule.duration}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GrammarSection({ data }) {
  const [activeSection, setActiveSection] = useState('parts_of_speech');

  if (!data) {
    return <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading grammar data...</div>;
  }

  const sections = [
    { id: 'parts_of_speech', label: 'Parts of Speech' },
    { id: 'case_endings', label: 'Case Endings' },
    { id: 'sentence_types', label: 'Sentence Types' },
    { id: 'common_patterns', label: 'Common Patterns' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Section Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {sections.map(s => (
          <button
            key={s.id}
            data-testid={`grammar-section-${s.id}`}
            className={`tab whitespace-nowrap ${activeSection === s.id ? 'tab-active' : 'tab-inactive'}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Parts of Speech */}
      {activeSection === 'parts_of_speech' && (
        <div className="space-y-6">
          {data.parts_of_speech?.map((part, idx) => (
            <div key={idx} className="card p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="font-arabic text-3xl" style={{ color: 'var(--primary)' }}>{part.name.split(' ')[0]}</span>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{part.english}</h3>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{part.name}</span>
                </div>
              </div>
              <p className="mb-4" style={{ color: 'var(--text)' }}>{part.description}</p>
              {part.examples && (
                <div className="flex flex-wrap gap-2">
                  {part.examples.map((ex, i) => (
                    <span key={i} className="badge badge-primary font-arabic">{ex}</span>
                  ))}
                </div>
              )}
              {part.types && (
                <div className="mt-4 space-y-2">
                  {part.types.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: 'var(--background)' }}>
                      <span className="font-semibold" style={{ color: 'var(--primary)' }}>{t.name}</span>
                      <span style={{ color: 'var(--muted)' }}>-</span>
                      <span style={{ color: 'var(--text)' }}>{t.meaning}</span>
                      <span className="font-arabic" style={{ color: 'var(--secondary)' }}>{t.example}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Case Endings */}
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
              <div className="font-arabic text-lg" style={{ color: 'var(--secondary)' }} dir="rtl">{ending.example}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sentence Types */}
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

      {/* Common Patterns */}
      {activeSection === 'common_patterns' && (
        <div className="grid md:grid-cols-3 gap-6">
          {data.common_patterns?.map((pattern, idx) => (
            <div key={idx} className="card p-6">
              <div className="font-arabic text-3xl text-center mb-4" style={{ color: 'var(--primary)' }} dir="rtl">
                {pattern.pattern}
              </div>
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

// ==================== BOOKMARKS VIEW ====================
function BookmarksView({ bookmarks, onSelectBookmark, onDeleteBookmark }) {
  if (bookmarks.length === 0) {
    return (
      <div className="container-fluid py-16 text-center">
        <Bookmark size={48} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>No Bookmarks Yet</h2>
        <p style={{ color: 'var(--muted)' }}>Save your favorite verses while reading to access them here</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Your Bookmarks</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {bookmarks.map((bookmark, idx) => (
          <div 
            key={idx}
            data-testid={`bookmark-${bookmark.surah_number}-${bookmark.ayah_number}`}
            className="card p-4 flex items-start gap-4"
          >
            <div className="surah-number flex-shrink-0">
              {bookmark.surah_number}:{bookmark.ayah_number}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{bookmark.surah_name}</h3>
              <p className="font-arabic text-lg mt-1 truncate" style={{ color: 'var(--muted)' }} dir="rtl">
                {bookmark.ayah_text}...
              </p>
              {bookmark.note && (
                <p className="text-sm mt-2 italic" style={{ color: 'var(--muted)' }}>{bookmark.note}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                data-testid={`goto-bookmark-${idx}`}
                className="btn-primary text-sm py-2 px-4"
                onClick={() => onSelectBookmark(bookmark)}
              >
                Read
              </button>
              <button 
                data-testid={`delete-bookmark-${idx}`}
                className="icon-btn"
                onClick={() => onDeleteBookmark(bookmark)}
                style={{ color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== AUDIO PLAYER BAR ====================
function AudioPlayerBar({ surahData, currentAyah, isPlaying, onTogglePlay, onPrev, onNext, onStop }) {
  return (
    <div className="audio-bar" data-testid="audio-player-bar">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span style={{ color: 'var(--muted)' }}>Now Playing</span>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>
              {surahData?.englishName} - Ayah {currentAyah}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            data-testid="audio-prev"
            className="icon-btn"
            onClick={onPrev}
            disabled={currentAyah <= 1}
          >
            <SkipBack size={20} />
          </button>
          <button 
            data-testid="audio-play-pause"
            className="icon-btn icon-btn-primary w-12 h-12"
            onClick={onTogglePlay}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button 
            data-testid="audio-next"
            className="icon-btn"
            onClick={onNext}
            disabled={currentAyah >= surahData?.numberOfAyahs}
          >
            <SkipForward size={20} />
          </button>
          <button 
            data-testid="audio-stop"
            className="icon-btn ml-4"
            onClick={onStop}
          >
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
function SettingsModal({ settings, reciters, onUpdateSetting, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="card p-6 w-full max-w-md m-4 max-h-[80vh] overflow-y-auto animate-fade-in"
        onClick={e => e.stopPropagation()}
        data-testid="settings-modal"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Settings</h2>
          <button data-testid="close-settings" className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Theme</label>
            <div className="flex gap-2">
              <button 
                data-testid="theme-light"
                className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${settings.theme === 'light' ? 'border-primary' : ''}`}
                style={{ borderColor: settings.theme === 'light' ? 'var(--primary)' : 'var(--border)', backgroundColor: 'var(--surface)' }}
                onClick={() => onUpdateSetting('theme', 'light')}
              >
                <Sun size={18} /> Light
              </button>
              <button 
                data-testid="theme-dark"
                className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 ${settings.theme === 'dark' ? 'border-primary' : ''}`}
                style={{ borderColor: settings.theme === 'dark' ? 'var(--primary)' : 'var(--border)', backgroundColor: 'var(--surface)' }}
                onClick={() => onUpdateSetting('theme', 'dark')}
              >
                <Moon size={18} /> Dark
              </button>
            </div>
          </div>

          {/* Text Style */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Arabic Text Style</label>
            <select 
              data-testid="text-style-select"
              className="select-dropdown w-full"
              value={settings.text_style}
              onChange={e => onUpdateSetting('text_style', e.target.value)}
            >
              {TEXT_EDITIONS.map(e => (
                <option key={e.id} value={e.id}>{e.name} - {e.description}</option>
              ))}
            </select>
          </div>

          {/* Translation */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Translation</label>
            <select 
              data-testid="translation-select"
              className="select-dropdown w-full"
              value={settings.translation}
              onChange={e => onUpdateSetting('translation', e.target.value)}
            >
              {TRANSLATIONS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Text Size */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Text Size</label>
            <div className="flex gap-2">
              {TEXT_SIZES.map(s => (
                <button 
                  key={s.id}
                  data-testid={`text-size-${s.id}`}
                  className={`flex-1 p-2 rounded-lg border text-sm ${settings.text_size === s.id ? 'border-primary' : ''}`}
                  style={{ borderColor: settings.text_size === s.id ? 'var(--primary)' : 'var(--border)', backgroundColor: 'var(--surface)' }}
                  onClick={() => onUpdateSetting('text_size', s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Reciter */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Reciter</label>
            <select 
              data-testid="reciter-select"
              className="select-dropdown w-full"
              value={settings.reciter_id}
              onChange={e => onUpdateSetting('reciter_id', e.target.value)}
            >
              {reciters.slice(0, 20).map(r => (
                <option key={r.id} value={r.id}>{r.reciter_name} - {r.style}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
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
          <button data-testid="close-hadith" className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Ayah Reference */}
        <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'var(--background)' }}>
          <p className="font-arabic text-xl leading-loose" style={{ color: 'var(--primary)' }} dir="rtl">
            {ayah?.arabic}
          </p>
        </div>

        {/* Hadith List */}
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
            <p>{hadithData?.message || 'No related hadith found for this specific ayah.'}</p>
            <p className="text-sm mt-2">Try checking the first ayah of the surah for general hadith about this chapter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
