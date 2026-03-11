# Quran Reader App - Product Requirements Document

## Overview
An in-depth Quran Reader application with multiple text styles, translations, recitations, hadith references, Arabic learning modules, and Hifz (memorization) tools.

## Original Problem Statement
Build an in-depth Quran reader app with:
- Multiple Quranic text styles (Uthmani, IndoPak, Simple)
- Translation and transliteration features
- Line-by-line recitation play option
- Customizable text size, reciter, and translations
- Related Hadith modal for specific ayahs
- Arabic learning module (alphabet, Tajweed, grammar)
- Hifz (memorization) module
- Clean, modern, reader-friendly UI/UX

## User Personas
1. **Muslim Reader** - Daily Quran recitation with preferred translation
2. **Islamic Scholar** - In-depth study with hadith references
3. **Arabic Learner** - Learning to read Quran with grammar understanding
4. **Hafiz Student** - Memorizing Quran with rote learning tools

## Core Requirements (Static)
| Feature | Priority | Status |
|---------|----------|--------|
| Quran Text Display | P0 | ✅ Implemented |
| Multiple Text Editions | P0 | ✅ Implemented (Uthmani, Simple, Indo-Pak) |
| Translation Support | P0 | ✅ Implemented (5 languages) |
| Audio Recitation | P0 | ✅ Fixed (everyayah.com) |
| Line-by-line Audio | P1 | ✅ Implemented |
| Theme Toggle | P1 | ✅ Implemented |
| Text Size Control | P1 | ✅ Implemented |
| Bookmarking | P1 | ✅ Implemented |
| Hadith Modal | P1 | ✅ Implemented (with conditional display) |
| Arabic Alphabet | P1 | ✅ Implemented with speaker icons |
| Tajweed Rules | P1 | ✅ Implemented with color legend |
| Grammar Basics | P1 | ✅ Implemented |
| Vocabulary Section | P1 | ✅ NEW - 20 words with categories |
| Phrases Section | P1 | ✅ NEW - 10 common phrases |
| Hifz Module | P1 | ✅ NEW - Memorization tools |
| Book View Mode | P2 | ✅ NEW - Two-column layout |
| Tajweed Colors | P2 | ✅ NEW - Color-coded text |
| Search Surahs | P2 | ✅ Improved |
| Reading Progress | P2 | ✅ Implemented |
| Transliteration | P2 | ✅ Implemented |

## What's Been Implemented (March 11, 2026)

### Backend (FastAPI)
**Core Quran APIs:**
- `/api/surahs` - Get all 114 surahs with metadata
- `/api/surah/{number}` - Get surah with Arabic + translation
- `/api/surah/{number}/transliteration` - Get transliteration
- `/api/ayah/{surah}/{ayah}` - Get specific ayah
- `/api/editions` - Get available text editions

**Audio APIs (Fixed):**
- `/api/reciters/v2` - Get 8 popular reciters
- `/api/audio/ayah/v2/{surah}/{ayah}` - Line-by-line audio (everyayah.com)

**Hadith APIs:**
- `/api/hadith/related/{surah}/{ayah}` - Related hadith lookup
- `/api/hadith/ayahs-with-hadith` - List of ayahs with hadith (11 famous ayahs)

**User Data APIs:**
- `/api/bookmarks` - CRUD for bookmarks
- `/api/settings` - User preferences
- `/api/reading-progress` - Track reading position

**Learning APIs:**
- `/api/learn/alphabet` - Arabic alphabet (28 letters)
- `/api/learn/tajweed` - Tajweed rules (4 categories)
- `/api/learn/grammar` - Arabic grammar basics
- `/api/learn/vocabulary` - NEW: 20 common Quranic words
- `/api/learn/phrases` - NEW: 10 common phrases

**Hifz APIs (NEW):**
- `/api/hifz/progress` - Track memorization progress
- `/api/hifz/stats` - Memorization statistics

### Frontend (React)
**Main Features:**
- Home page with featured surahs and continue reading
- Surah list with improved search (handles transliteration variations)
- Reader view with Arabic text and translation
- Book View mode with two-column Mushaf-style layout
- Audio player bar with play/pause/next/prev controls
- Settings modal (theme, text style, translation, size, reciter, tajweed, view mode)
- Hadith modal showing related narrations (conditional icon display)
- Bookmarks page with saved verses
- Dark/Light theme support
- Responsive design

**Learn Arabic Module (Enhanced):**
- Alphabet (28 letters with speaker icons for pronunciation)
- Tajweed Rules (4 categories with color legend)
- Grammar (Parts of Speech, Case Endings, Sentence Types, Patterns)
- Vocabulary (20 words categorized: Names of Allah, Worship, Afterlife, etc.)
- Phrases (10 common Islamic phrases with speaker icons)

**Hifz Module (NEW):**
- Stats dashboard (Memorized, Reviewing, Learning, Active Surahs)
- Start new memorization session with surah/ayah selection
- Practice mode with text hide/show toggle
- Repetition counter and progress tracking
- Memorization tips section

### External APIs Used
- Al-Quran Cloud API (alquran.cloud)
- everyayah.com for audio (more reliable)

## Technical Architecture
```
Frontend: React 18 + Tailwind CSS
Backend: FastAPI + Python 3.11
Database: MongoDB
Audio: everyayah.com (direct mp3 URLs)
Pronunciation: Web Speech API
Deployment: Emergent Platform
```

## Prioritized Backlog

### P0 - Critical
- [x] Audio playback fixed (everyayah.com)
- [x] Hadith icon conditional display

### P1 - High Priority
- [x] Book View mode
- [x] Tajweed color coding
- [x] Hifz memorization module
- [x] Enhanced Learn Arabic (Vocabulary, Phrases)
- [x] Speaker icons for pronunciation

### P2 - Medium Priority
- [ ] Word-by-word translation
- [ ] Juz (chapter) navigation
- [ ] Audio progress bar with seek
- [ ] Offline caching

### P3 - Low Priority / Future
- [ ] User accounts for cross-device sync
- [ ] Share ayah as image
- [ ] Reading streak/statistics
- [ ] Prayer times integration
- [ ] Mushaf page view
- [ ] Tafsir (detailed commentary)
- [ ] Quiz mode for learning
- [ ] Community features

## Next Actions
1. Add word-by-word translation feature
2. Implement Juz navigation
3. Add audio seek/progress bar
4. Add more hadith mappings
5. Implement offline caching for frequently read surahs
