# Quran Reader App - Product Requirements Document

## Overview
An in-depth Quran Reader application with multiple text styles, translations, recitations, hadith references, and Arabic learning modules.

## Original Problem Statement
Build an in-depth Quran reader app with:
- Multiple Quranic text styles (Uthmani, IndoPak, Simple)
- Translation and transliteration features
- Line-by-line recitation play option
- Customizable text size, reciter, and translations
- Related Hadith modal for specific ayahs
- Arabic learning module (alphabet, Tajweed, grammar)
- Clean, modern, reader-friendly UI/UX

## User Personas
1. **Muslim Reader** - Daily Quran recitation with preferred translation
2. **Islamic Scholar** - In-depth study with hadith references
3. **Arabic Learner** - Learning to read Quran with grammar understanding
4. **New Muslim/Convert** - Simple translation-focused reading

## Core Requirements (Static)
| Feature | Priority | Status |
|---------|----------|--------|
| Quran Text Display | P0 | ✅ Implemented |
| Multiple Text Editions | P0 | ✅ Implemented |
| Translation Support | P0 | ✅ Implemented |
| Audio Recitation | P0 | ✅ Implemented |
| Line-by-line Audio | P1 | ✅ Implemented |
| Theme Toggle | P1 | ✅ Implemented |
| Text Size Control | P1 | ✅ Implemented |
| Bookmarking | P1 | ✅ Implemented |
| Hadith Modal | P1 | ✅ Implemented |
| Arabic Alphabet | P1 | ✅ Implemented |
| Tajweed Rules | P1 | ✅ Implemented |
| Grammar Basics | P1 | ✅ Implemented |
| Search Surahs | P2 | ✅ Implemented |
| Reading Progress | P2 | ✅ Implemented |

## What's Been Implemented (March 11, 2026)

### Backend (FastAPI)
- `/api/surahs` - Get all 114 surahs with metadata
- `/api/surah/{number}` - Get surah with Arabic + translation
- `/api/ayah/{surah}/{ayah}` - Get specific ayah
- `/api/editions` - Get available text editions
- `/api/reciters` - Get available reciters
- `/api/audio/{reciter}/{surah}` - Get surah audio
- `/api/audio/ayah/{reciter}/{surah}/{ayah}` - Line-by-line audio
- `/api/hadith/related/{surah}/{ayah}` - Related hadith lookup
- `/api/bookmarks` - CRUD for bookmarks
- `/api/settings` - User preferences
- `/api/reading-progress` - Track reading position
- `/api/learn/alphabet` - Arabic alphabet with pronunciation
- `/api/learn/tajweed` - Tajweed rules
- `/api/learn/grammar` - Arabic grammar basics

### Frontend (React)
- Home page with featured surahs and continue reading
- Surah list with search functionality
- Reader view with Arabic text and translation
- Audio player bar with play/pause/next/prev controls
- Settings modal (theme, text style, translation, size, reciter)
- Hadith modal showing related narrations
- Learn Arabic module with 3 sections:
  - Alphabet (28 letters with pronunciation)
  - Tajweed Rules (4 categories, expandable)
  - Grammar (Parts of Speech, Case Endings, Sentence Types, Patterns)
- Bookmarks page with saved verses
- Dark/Light theme support
- Responsive design

### External APIs Used
- Al-Quran Cloud API (alquran.cloud)
- Quran.com API (api.quran.com)

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Offline support / caching for frequently read surahs
- [ ] Audio progress bar with seek capability

### P1 - High Priority
- [ ] IndoPak text style (requires additional API endpoint)
- [ ] Transliteration text (requires transliteration edition)
- [ ] Word-by-word translation
- [ ] Juz (chapter) navigation

### P2 - Medium Priority
- [ ] User accounts for cross-device sync
- [ ] Notes feature for bookmarks
- [ ] Share ayah as image
- [ ] Reading streak/statistics
- [ ] Qibla direction finder

### P3 - Low Priority / Future
- [ ] Prayer times integration
- [ ] Mushaf page view (traditional layout)
- [ ] Tafsir (detailed commentary)
- [ ] Quiz mode for learning
- [ ] Community features (discussions)

## Technical Architecture
```
Frontend: React 18 + Tailwind CSS
Backend: FastAPI + Python 3.11
Database: MongoDB
External APIs: Al-Quran Cloud, Quran.com
Deployment: Emergent Platform
```

## Next Actions
1. Add transliteration support (requires API edition)
2. Implement audio progress bar with seek
3. Add more hadith mappings for famous verses
4. Expand grammar section with exercises
5. Add prayer times feature
