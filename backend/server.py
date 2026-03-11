"""
Quran Reader API - FastAPI Backend
Provides endpoints for Quran data, audio, translations, hadith, and user preferences
"""
import os
import httpx
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Quran Reader API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "quran_reader")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
bookmarks_collection = db["bookmarks"]
user_settings_collection = db["user_settings"]
reading_history_collection = db["reading_history"]

# External APIs
ALQURAN_BASE = "https://api.alquran.cloud/v1"
QURANCOM_BASE = "https://api.quran.com/api/v4"

# Pydantic Models
class Bookmark(BaseModel):
    surah_number: int
    ayah_number: int
    surah_name: str
    ayah_text: str
    note: Optional[str] = None

class UserSettings(BaseModel):
    text_style: str = "uthmani"
    reciter_id: str = "7"
    translation: str = "en.sahih"
    transliteration: str = "en.transliteration"
    text_size: str = "large"
    theme: str = "dark"
    show_tajweed: bool = True
    view_mode: str = "scroll"  # scroll, book

class ReadingProgress(BaseModel):
    surah_number: int
    ayah_number: int
    surah_name: str

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== QURAN DATA ====================

@app.get("/api/surahs")
async def get_all_surahs():
    """Get list of all 114 surahs with metadata"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{ALQURAN_BASE}/surah")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch surahs")
        data = response.json()
        return {"surahs": data.get("data", [])}

@app.get("/api/surah/{surah_number}")
async def get_surah(
    surah_number: int,
    edition: str = Query("quran-uthmani", description="Text edition"),
    translation: str = Query("en.sahih", description="Translation edition")
):
    """Get a surah with Arabic text and translation"""
    # Validate surah number range
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=404, detail=f"Surah {surah_number} not found. Valid range is 1-114.")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Fetch Arabic text and translation in parallel
        editions = f"{edition},{translation}"
        response = await client.get(f"{ALQURAN_BASE}/surah/{surah_number}/editions/{editions}")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail=f"Surah {surah_number} not found")
        data = response.json()
        
        if data.get("code") != 200:
            raise HTTPException(status_code=404, detail="Surah not found")
        
        result = data.get("data", [])
        if len(result) >= 2:
            arabic_data = result[0]
            translation_data = result[1]
            
            # Combine ayahs
            combined_ayahs = []
            for i, ar_ayah in enumerate(arabic_data.get("ayahs", [])):
                tr_ayah = translation_data.get("ayahs", [])[i] if i < len(translation_data.get("ayahs", [])) else {}
                combined_ayahs.append({
                    "number": ar_ayah.get("numberInSurah"),
                    "arabic": ar_ayah.get("text"),
                    "translation": tr_ayah.get("text", ""),
                    "juz": ar_ayah.get("juz"),
                    "page": ar_ayah.get("page"),
                    "sajda": ar_ayah.get("sajda", False)
                })
            
            return {
                "surah": {
                    "number": arabic_data.get("number"),
                    "name": arabic_data.get("name"),
                    "englishName": arabic_data.get("englishName"),
                    "englishNameTranslation": arabic_data.get("englishNameTranslation"),
                    "revelationType": arabic_data.get("revelationType"),
                    "numberOfAyahs": arabic_data.get("numberOfAyahs"),
                    "ayahs": combined_ayahs
                }
            }
        
        return {"surah": result[0] if result else None}

@app.get("/api/ayah/{surah_number}/{ayah_number}")
async def get_ayah(
    surah_number: int,
    ayah_number: int,
    edition: str = "quran-uthmani",
    translation: str = "en.sahih"
):
    """Get a specific ayah with translation"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        editions = f"{edition},{translation}"
        response = await client.get(f"{ALQURAN_BASE}/ayah/{surah_number}:{ayah_number}/editions/{editions}")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch ayah")
        data = response.json()
        
        if data.get("code") != 200:
            raise HTTPException(status_code=404, detail="Ayah not found")
        
        result = data.get("data", [])
        if len(result) >= 2:
            return {
                "ayah": {
                    "number": result[0].get("numberInSurah"),
                    "arabic": result[0].get("text"),
                    "translation": result[1].get("text"),
                    "surah": result[0].get("surah"),
                    "juz": result[0].get("juz"),
                    "page": result[0].get("page")
                }
            }
        return {"ayah": None}

# ==================== TEXT EDITIONS ====================

@app.get("/api/editions")
async def get_editions():
    """Get available Quran text editions"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{ALQURAN_BASE}/edition")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch editions")
        data = response.json()
        
        # Filter to text editions (not audio)
        all_editions = data.get("data", [])
        text_editions = [e for e in all_editions if e.get("format") == "text" and e.get("type") == "quran"]
        translation_editions = [e for e in all_editions if e.get("format") == "text" and e.get("type") == "translation"]
        
        return {
            "quran_editions": text_editions[:10],  # Top 10 Arabic editions
            "translations": translation_editions
        }

# ==================== AUDIO / RECITERS ====================

@app.get("/api/reciters/v2")
async def get_reciters_v2():
    """Get available reciters with everyayah.com support"""
    reciters = [
        {"id": "Alafasy_128kbps", "name": "Mishary Rashid Alafasy", "style": "Murattal"},
        {"id": "Abdul_Basit_Murattal_128kbps", "name": "Abdul Basit Abdul Samad", "style": "Murattal"},
        {"id": "Husary_128kbps", "name": "Mahmoud Khalil Al-Husary", "style": "Murattal"},
        {"id": "Minshawy_Murattal_128kbps", "name": "Mohamed Siddiq El-Minshawi", "style": "Murattal"},
        {"id": "Maher_AlMuaiqly_128kbps", "name": "Maher Al Muaiqly", "style": "Murattal"},
        {"id": "Sudais_128kbps", "name": "Abdul Rahman Al-Sudais", "style": "Murattal"},
        {"id": "Shuraym_128kbps", "name": "Saud Al-Shuraim", "style": "Murattal"},
        {"id": "Saad_AlGhamdi_128kbps", "name": "Saad Al-Ghamdi", "style": "Murattal"},
    ]
    return {"reciters": reciters}

@app.get("/api/audio/ayah/v2/{surah_number}/{ayah_number}")
async def get_ayah_audio_v2(surah_number: int, ayah_number: int, reciter: str = "Alafasy_128kbps"):
    """Get audio URL for a specific ayah using everyayah.com (more reliable)"""
    reciters_map = {
        "Alafasy_128kbps": "Alafasy_128kbps",
        "Abdul_Basit_Murattal_128kbps": "Abdul_Basit_Murattal_128kbps",
        "Husary_128kbps": "Husary_128kbps",
        "Minshawy_Murattal_128kbps": "Minshawy_Murattal_128kbps",
        "Maher_AlMuaiqly_128kbps": "Maher_AlMuaiqly_128kbps",
        "Sudais_128kbps": "Sudais_128kbps",
        "Shuraym_128kbps": "Shuraym_128kbps",
        "Saad_AlGhamdi_128kbps": "Saad_AlGhamdi_128kbps"
    }
    
    reciter_folder = reciters_map.get(reciter, "Alafasy_128kbps")
    padded_surah = str(surah_number).zfill(3)
    padded_ayah = str(ayah_number).zfill(3)
    
    audio_url = f"https://everyayah.com/data/{reciter_folder}/{padded_surah}{padded_ayah}.mp3"
    
    return {
        "audio": {
            "url": audio_url,
            "surah": surah_number,
            "ayah": ayah_number,
            "reciter": reciter_folder
        }
    }

@app.get("/api/reciters")
async def get_reciters():
    """Get available Quran reciters"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{QURANCOM_BASE}/resources/recitations")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch reciters")
        data = response.json()
        return {"reciters": data.get("recitations", [])}

@app.get("/api/audio/{reciter_id}/{surah_number}")
async def get_surah_audio(reciter_id: int, surah_number: int):
    """Get audio URL for a surah"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{QURANCOM_BASE}/chapter_recitations/{reciter_id}/{surah_number}")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch audio")
        data = response.json()
        audio_file = data.get("audio_file", {})
        return {
            "audio": {
                "url": audio_file.get("audio_url"),
                "duration": audio_file.get("duration"),
                "format": audio_file.get("format")
            }
        }

@app.get("/api/audio/ayah/{reciter_id}/{surah_number}/{ayah_number}")
async def get_ayah_audio(reciter_id: int, surah_number: int, ayah_number: int):
    """Get audio URL for a specific ayah - line by line recitation"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{QURANCOM_BASE}/recitations/{reciter_id}/by_ayah/{surah_number}:{ayah_number}")
        if response.status_code != 200:
            # Fallback: construct direct URL for popular reciters
            # Most reciters follow pattern: reciter_folder/surah_ayah.mp3
            base_urls = {
                7: "https://verses.quran.com/Alafasy/mp3",  # Mishary Rashid
                1: "https://verses.quran.com/AbdulBaset/Murattal/mp3",  # Abdul Basit
            }
            if reciter_id in base_urls:
                padded_surah = str(surah_number).zfill(3)
                padded_ayah = str(ayah_number).zfill(3)
                return {
                    "audio": {
                        "url": f"{base_urls[reciter_id]}/{padded_surah}{padded_ayah}.mp3",
                        "surah": surah_number,
                        "ayah": ayah_number
                    }
                }
            raise HTTPException(status_code=500, detail="Failed to fetch ayah audio")
        
        data = response.json()
        audio_files = data.get("audio_files", [])
        if audio_files:
            return {
                "audio": {
                    "url": audio_files[0].get("url"),
                    "surah": surah_number,
                    "ayah": ayah_number
                }
            }
        return {"audio": None}

# ==================== HADITH ====================

@app.get("/api/hadith/related/{surah_number}/{ayah_number}")
async def get_related_hadith(surah_number: int, ayah_number: int):
    """Get hadith related to a specific ayah"""
    # Using local hadith mapping since public APIs are limited
    # This maps famous ayahs to related hadith
    hadith_mapping = {
        (1, 1): [
            {
                "collection": "Sahih Muslim",
                "book": "Prayer",
                "number": 395,
                "text": "The Prophet (ﷺ) said: 'Allah said: I have divided prayer between Myself and My servant into two halves, and My servant shall have what he has asked for. When the servant says: All praise is due to Allah, the Lord of the worlds, Allah says: My servant has praised Me...'",
                "narrator": "Abu Hurayrah"
            }
        ],
        (2, 255): [  # Ayatul Kursi
            {
                "collection": "Sahih al-Bukhari",
                "book": "Virtues of the Quran",
                "number": 5010,
                "text": "The Prophet (ﷺ) said: 'Whoever recites Ayat al-Kursi at the end of every obligatory prayer, nothing will prevent him from entering Paradise except death.'",
                "narrator": "Abu Umamah"
            }
        ],
        (36, 1): [  # Surah Yasin
            {
                "collection": "Sunan Abu Dawud",
                "book": "Funerals",
                "number": 3121,
                "text": "The Prophet (ﷺ) said: 'Recite Surah Ya-Sin over your dying ones.'",
                "narrator": "Ma'qil ibn Yasar"
            }
        ],
        (112, 1): [  # Surah Ikhlas
            {
                "collection": "Sahih al-Bukhari",
                "book": "Virtues of the Quran",
                "number": 5013,
                "text": "The Prophet (ﷺ) said: 'Is it difficult for any of you to recite one third of the Quran in one night?' They said, 'How can one recite one third of the Quran?' He said, 'Say: He is Allah, the One (Surah al-Ikhlas) equals one third of the Quran.'",
                "narrator": "Abu Said Al-Khudri"
            }
        ],
        (67, 1): [  # Surah Mulk
            {
                "collection": "Jami at-Tirmidhi",
                "book": "Virtues of the Quran",
                "number": 2891,
                "text": "The Prophet (ﷺ) said: 'There is a surah in the Quran which is only thirty verses. It will intercede for its reciter until he is forgiven: Blessed is He in Whose Hand is the dominion (Surah al-Mulk).'",
                "narrator": "Abu Hurayrah"
            }
        ],
        (18, 1): [  # Surah Kahf
            {
                "collection": "Sahih Muslim",
                "book": "The Book of Prayer - Travellers",
                "number": 809,
                "text": "The Prophet (ﷺ) said: 'Whoever memorizes ten verses from the beginning of Surah al-Kahf will be protected from the Dajjal.'",
                "narrator": "Abu Darda"
            }
        ],
        (55, 13): [  # Surah Rahman
            {
                "collection": "Jami at-Tirmidhi",
                "book": "Tafsir",
                "number": 3291,
                "text": "Jabir said: 'The Prophet (ﷺ) went out to his companions and recited Surah ar-Rahman to them from beginning to end. They remained silent. He said: I recited it to the Jinn on the night of the Jinn, and their response was better than yours. Every time I recited the verse \"Which of the favors of your Lord will you deny?\" they said: None of Your favors do we deny, our Lord! Praise be to You.'",
                "narrator": "Jabir ibn Abdullah"
            }
        ]
    }
    
    key = (surah_number, ayah_number)
    related = hadith_mapping.get(key, [])
    
    # Also check if any hadith relates to first ayah of the surah
    if not related and ayah_number != 1:
        surah_key = (surah_number, 1)
        related = hadith_mapping.get(surah_key, [])
    
    return {
        "surah": surah_number,
        "ayah": ayah_number,
        "hadith": related,
        "message": "Related hadith found" if related else "No specific hadith mapping found for this ayah"
    }

# ==================== BOOKMARKS ====================

@app.post("/api/bookmarks")
async def add_bookmark(bookmark: Bookmark):
    """Add a bookmark"""
    bookmark_dict = bookmark.model_dump()
    bookmark_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Check for duplicate
    existing = bookmarks_collection.find_one({
        "surah_number": bookmark.surah_number,
        "ayah_number": bookmark.ayah_number
    }, {"_id": 0})
    
    if existing:
        return {"message": "Bookmark already exists", "bookmark": existing}
    
    bookmarks_collection.insert_one(bookmark_dict)
    # Return without _id
    return {"message": "Bookmark added", "bookmark": {k: v for k, v in bookmark_dict.items() if k != "_id"}}

@app.get("/api/bookmarks")
async def get_bookmarks():
    """Get all bookmarks"""
    bookmarks = list(bookmarks_collection.find({}, {"_id": 0}).sort("created_at", -1))
    return {"bookmarks": bookmarks}

@app.delete("/api/bookmarks/{surah_number}/{ayah_number}")
async def delete_bookmark(surah_number: int, ayah_number: int):
    """Delete a bookmark"""
    result = bookmarks_collection.delete_one({
        "surah_number": surah_number,
        "ayah_number": ayah_number
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"message": "Bookmark deleted"}

# ==================== USER SETTINGS ====================

@app.get("/api/settings")
async def get_settings():
    """Get user settings"""
    settings = user_settings_collection.find_one({"user": "default"}, {"_id": 0})
    if not settings:
        default_settings = UserSettings().model_dump()
        default_settings["user"] = "default"
        user_settings_collection.insert_one(default_settings)
        return {"settings": {k: v for k, v in default_settings.items() if k != "_id"}}
    return {"settings": settings}

@app.put("/api/settings")
async def update_settings(settings: UserSettings):
    """Update user settings"""
    settings_dict = settings.model_dump()
    settings_dict["user"] = "default"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    user_settings_collection.update_one(
        {"user": "default"},
        {"$set": settings_dict},
        upsert=True
    )
    return {"message": "Settings updated", "settings": settings_dict}

# ==================== READING PROGRESS ====================

@app.post("/api/reading-progress")
async def save_reading_progress(progress: ReadingProgress):
    """Save reading progress"""
    progress_dict = progress.model_dump()
    progress_dict["user"] = "default"
    progress_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    reading_history_collection.update_one(
        {"user": "default"},
        {"$set": progress_dict},
        upsert=True
    )
    return {"message": "Progress saved", "progress": progress_dict}

@app.get("/api/reading-progress")
async def get_reading_progress():
    """Get last reading progress"""
    progress = reading_history_collection.find_one({"user": "default"}, {"_id": 0})
    return {"progress": progress}

# ==================== ARABIC LEARNING ====================

@app.get("/api/learn/alphabet")
async def get_arabic_alphabet():
    """Get Arabic alphabet with pronunciation guide"""
    alphabet = [
        {"letter": "ا", "name": "Alif", "transliteration": "a/aa", "position": "beginning/middle/end", "sound": "Long 'a' sound like 'father'"},
        {"letter": "ب", "name": "Ba", "transliteration": "b", "position": "all", "sound": "Like English 'b'"},
        {"letter": "ت", "name": "Ta", "transliteration": "t", "position": "all", "sound": "Like English 't'"},
        {"letter": "ث", "name": "Tha", "transliteration": "th", "position": "all", "sound": "Soft 'th' as in 'think'"},
        {"letter": "ج", "name": "Jeem", "transliteration": "j", "position": "all", "sound": "Like English 'j'"},
        {"letter": "ح", "name": "Ha", "transliteration": "ḥ", "position": "all", "sound": "Breathy 'h' from throat"},
        {"letter": "خ", "name": "Kha", "transliteration": "kh", "position": "all", "sound": "Like German 'ch' in 'Bach'"},
        {"letter": "د", "name": "Dal", "transliteration": "d", "position": "all", "sound": "Like English 'd'"},
        {"letter": "ذ", "name": "Dhal", "transliteration": "dh", "position": "all", "sound": "Hard 'th' as in 'this'"},
        {"letter": "ر", "name": "Ra", "transliteration": "r", "position": "all", "sound": "Rolled 'r' like Spanish"},
        {"letter": "ز", "name": "Zay", "transliteration": "z", "position": "all", "sound": "Like English 'z'"},
        {"letter": "س", "name": "Seen", "transliteration": "s", "position": "all", "sound": "Like English 's'"},
        {"letter": "ش", "name": "Sheen", "transliteration": "sh", "position": "all", "sound": "Like English 'sh'"},
        {"letter": "ص", "name": "Sad", "transliteration": "ṣ", "position": "all", "sound": "Emphatic 's'"},
        {"letter": "ض", "name": "Dad", "transliteration": "ḍ", "position": "all", "sound": "Emphatic 'd'"},
        {"letter": "ط", "name": "Ta", "transliteration": "ṭ", "position": "all", "sound": "Emphatic 't'"},
        {"letter": "ظ", "name": "Dha", "transliteration": "ẓ", "position": "all", "sound": "Emphatic 'th'"},
        {"letter": "ع", "name": "Ain", "transliteration": "'", "position": "all", "sound": "Voiced pharyngeal (unique to Arabic)"},
        {"letter": "غ", "name": "Ghain", "transliteration": "gh", "position": "all", "sound": "Like French 'r' gargled"},
        {"letter": "ف", "name": "Fa", "transliteration": "f", "position": "all", "sound": "Like English 'f'"},
        {"letter": "ق", "name": "Qaf", "transliteration": "q", "position": "all", "sound": "Deep 'k' from throat"},
        {"letter": "ك", "name": "Kaf", "transliteration": "k", "position": "all", "sound": "Like English 'k'"},
        {"letter": "ل", "name": "Lam", "transliteration": "l", "position": "all", "sound": "Like English 'l'"},
        {"letter": "م", "name": "Meem", "transliteration": "m", "position": "all", "sound": "Like English 'm'"},
        {"letter": "ن", "name": "Noon", "transliteration": "n", "position": "all", "sound": "Like English 'n'"},
        {"letter": "ه", "name": "Ha", "transliteration": "h", "position": "all", "sound": "Like English 'h'"},
        {"letter": "و", "name": "Waw", "transliteration": "w/oo", "position": "all", "sound": "Like English 'w' or long 'oo'"},
        {"letter": "ي", "name": "Ya", "transliteration": "y/ee", "position": "all", "sound": "Like English 'y' or long 'ee'"}
    ]
    return {"alphabet": alphabet, "total": len(alphabet)}

@app.get("/api/learn/tajweed")
async def get_tajweed_rules():
    """Get Tajweed rules for Quran recitation"""
    rules = [
        {
            "category": "Noon Sakinah & Tanween",
            "rules": [
                {
                    "name": "Izhar (إظهار)",
                    "meaning": "Clear pronunciation",
                    "description": "When Noon Sakinah or Tanween is followed by throat letters (ء ه ع ح غ خ), pronounce clearly without merging.",
                    "example": "مَنْ آمَنَ",
                    "letters": ["ء", "ه", "ع", "ح", "غ", "خ"]
                },
                {
                    "name": "Idgham (إدغام)",
                    "meaning": "Merging",
                    "description": "When Noon Sakinah or Tanween is followed by (ي ر م ل و ن), merge the sounds.",
                    "example": "مِن رَّبِّهِم",
                    "letters": ["ي", "ر", "م", "ل", "و", "ن"]
                },
                {
                    "name": "Iqlab (إقلاب)",
                    "meaning": "Conversion",
                    "description": "When Noon Sakinah or Tanween is followed by Ba (ب), convert noon to Meem.",
                    "example": "مِن بَعْدِ",
                    "letters": ["ب"]
                },
                {
                    "name": "Ikhfa (إخفاء)",
                    "meaning": "Hiding",
                    "description": "When Noon Sakinah or Tanween is followed by remaining 15 letters, hide the sound between Izhar and Idgham.",
                    "example": "مِن قَبْلُ",
                    "letters": ["ت", "ث", "ج", "د", "ذ", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ف", "ق", "ك"]
                }
            ]
        },
        {
            "category": "Meem Sakinah",
            "rules": [
                {
                    "name": "Ikhfa Shafawi",
                    "meaning": "Labial hiding",
                    "description": "When Meem Sakinah is followed by Ba (ب), hide with slight nasalization.",
                    "example": "تَرْمِيهِم بِحِجَارَةٍ"
                },
                {
                    "name": "Idgham Shafawi",
                    "meaning": "Labial merging",
                    "description": "When Meem Sakinah is followed by another Meem, merge completely.",
                    "example": "لَهُم مَّا"
                },
                {
                    "name": "Izhar Shafawi",
                    "meaning": "Labial clarity",
                    "description": "When Meem Sakinah is followed by any letter except Ba or Meem, pronounce clearly.",
                    "example": "أَمْوَالُهُمْ"
                }
            ]
        },
        {
            "category": "Madd (Elongation)",
            "rules": [
                {
                    "name": "Madd Asli/Tabee'i",
                    "meaning": "Natural elongation",
                    "description": "Basic elongation of 2 counts for Alif, Waw, and Ya.",
                    "duration": "2 counts"
                },
                {
                    "name": "Madd Muttasil",
                    "meaning": "Connected elongation",
                    "description": "When hamza comes after madd letter in same word.",
                    "duration": "4-5 counts",
                    "example": "جَاءَ"
                },
                {
                    "name": "Madd Munfasil",
                    "meaning": "Separated elongation",
                    "description": "When hamza comes after madd letter but in next word.",
                    "duration": "2-4 counts",
                    "example": "بِمَا أُنزِلَ"
                },
                {
                    "name": "Madd Lazim",
                    "meaning": "Necessary elongation",
                    "description": "When sukoon follows madd letter in same word.",
                    "duration": "6 counts",
                    "example": "الحَاقَّة"
                }
            ]
        },
        {
            "category": "Qalqalah (Echo)",
            "rules": [
                {
                    "name": "Qalqalah Sughra",
                    "meaning": "Minor echo",
                    "description": "When Qalqalah letters (ق ط ب ج د) have sukoon in middle of word.",
                    "letters": ["ق", "ط", "ب", "ج", "د"]
                },
                {
                    "name": "Qalqalah Kubra",
                    "meaning": "Major echo",
                    "description": "When Qalqalah letters appear at end of word during stop.",
                    "example": "الْفَلَقْ"
                }
            ]
        }
    ]
    return {"tajweed_rules": rules}

@app.get("/api/learn/grammar")
async def get_arabic_grammar():
    """Get Arabic grammar basics for understanding Quran"""
    grammar = {
        "parts_of_speech": [
            {
                "name": "Ism (اسم)",
                "english": "Noun",
                "description": "A word that gives meaning by itself and is not bound by time.",
                "examples": ["كِتَاب (book)", "رَجُل (man)", "اللّٰه (Allah)"],
                "signs": ["Accepts tanween", "Can have Al (ال)", "Can be preceded by preposition"]
            },
            {
                "name": "Fi'l (فعل)",
                "english": "Verb",
                "description": "A word indicating an action with time reference.",
                "types": [
                    {"name": "Maadi (ماضي)", "meaning": "Past tense", "example": "كَتَبَ (he wrote)"},
                    {"name": "Mudari (مضارع)", "meaning": "Present/Future tense", "example": "يَكْتُبُ (he writes/will write)"},
                    {"name": "Amr (أمر)", "meaning": "Command", "example": "اُكْتُبْ (write!)"}
                ]
            },
            {
                "name": "Harf (حرف)",
                "english": "Particle",
                "description": "A word that only gives meaning with other words.",
                "examples": ["مِن (from)", "إِلَى (to)", "عَلَى (on)", "فِي (in)"]
            }
        ],
        "case_endings": [
            {
                "name": "Raf' (رفع)",
                "english": "Nominative",
                "marker": "Dammah (ُ)",
                "usage": "Subject (Fa'il), Predicate (Khabar)",
                "example": "جَاءَ الرَّجُلُ (The man came)"
            },
            {
                "name": "Nasb (نصب)",
                "english": "Accusative",
                "marker": "Fathah (َ)",
                "usage": "Object (Maf'ul), After certain particles",
                "example": "رَأَيْتُ الرَّجُلَ (I saw the man)"
            },
            {
                "name": "Jarr (جر)",
                "english": "Genitive",
                "marker": "Kasrah (ِ)",
                "usage": "After prepositions, Mudaf Ilayh",
                "example": "مِنَ الرَّجُلِ (from the man)"
            }
        ],
        "sentence_types": [
            {
                "name": "Jumlah Ismiyyah (جملة إسمية)",
                "english": "Nominal Sentence",
                "structure": "Mubtada (Subject) + Khabar (Predicate)",
                "example": "اللّٰهُ أَكْبَرُ (Allah is Greatest)",
                "notes": "Starts with a noun"
            },
            {
                "name": "Jumlah Fi'liyyah (جملة فعلية)",
                "english": "Verbal Sentence",
                "structure": "Fi'l (Verb) + Fa'il (Subject) + Maf'ul (Object)",
                "example": "خَلَقَ اللّٰهُ السَّمَاوَاتِ (Allah created the heavens)",
                "notes": "Starts with a verb"
            }
        ],
        "common_patterns": [
            {
                "pattern": "فَاعِل",
                "meaning": "Doer/Agent",
                "examples": ["كَاتِب (writer)", "قَارِئ (reader)", "عَالِم (scholar)"]
            },
            {
                "pattern": "مَفْعُول",
                "meaning": "Object/Passive participle",
                "examples": ["مَكْتُوب (written)", "مَقْرُوء (read)", "مَعْلُوم (known)"]
            },
            {
                "pattern": "فَعِيل",
                "meaning": "Intensive/Adjective",
                "examples": ["كَرِيم (generous)", "عَظِيم (great)", "رَحِيم (merciful)"]
            }
        ]
    }
    return {"grammar": grammar}

# ==================== HIFZ (MEMORIZATION) ====================

hifz_progress_collection = db["hifz_progress"]

class HifzProgress(BaseModel):
    surah_number: int
    ayah_start: int
    ayah_end: int
    status: str = "learning"  # learning, reviewing, memorized
    repetitions: int = 0
    last_practiced: Optional[str] = None
    accuracy_score: Optional[float] = None

@app.get("/api/hifz/progress")
async def get_hifz_progress():
    """Get all Hifz memorization progress"""
    progress = list(hifz_progress_collection.find({"user": "default"}, {"_id": 0}))
    return {"progress": progress}

@app.post("/api/hifz/progress")
async def save_hifz_progress(progress: HifzProgress):
    """Save or update Hifz progress"""
    progress_dict = progress.model_dump()
    progress_dict["user"] = "default"
    progress_dict["last_practiced"] = datetime.now(timezone.utc).isoformat()
    
    hifz_progress_collection.update_one(
        {
            "user": "default",
            "surah_number": progress.surah_number,
            "ayah_start": progress.ayah_start,
            "ayah_end": progress.ayah_end
        },
        {"$set": progress_dict},
        upsert=True
    )
    return {"message": "Progress saved", "progress": progress_dict}

@app.delete("/api/hifz/progress/{surah_number}/{ayah_start}/{ayah_end}")
async def delete_hifz_progress(surah_number: int, ayah_start: int, ayah_end: int):
    """Delete Hifz progress entry"""
    result = hifz_progress_collection.delete_one({
        "user": "default",
        "surah_number": surah_number,
        "ayah_start": ayah_start,
        "ayah_end": ayah_end
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    return {"message": "Progress deleted"}

@app.get("/api/hifz/stats")
async def get_hifz_stats():
    """Get Hifz statistics"""
    all_progress = list(hifz_progress_collection.find({"user": "default"}, {"_id": 0}))
    
    total_ayahs_memorized = 0
    total_ayahs_learning = 0
    total_ayahs_reviewing = 0
    surahs_in_progress = set()
    
    for p in all_progress:
        count = p.get("ayah_end", 0) - p.get("ayah_start", 0) + 1
        surahs_in_progress.add(p.get("surah_number"))
        if p.get("status") == "memorized":
            total_ayahs_memorized += count
        elif p.get("status") == "reviewing":
            total_ayahs_reviewing += count
        else:
            total_ayahs_learning += count
    
    return {
        "stats": {
            "total_ayahs_memorized": total_ayahs_memorized,
            "total_ayahs_learning": total_ayahs_learning,
            "total_ayahs_reviewing": total_ayahs_reviewing,
            "surahs_in_progress": len(surahs_in_progress),
            "total_entries": len(all_progress)
        }
    }

# ==================== HADITH AYAHS LIST ====================

@app.get("/api/hadith/ayahs-with-hadith")
async def get_ayahs_with_hadith():
    """Get list of all ayahs that have related hadith"""
    # Return the list of surah:ayah combinations that have hadith
    ayahs_with_hadith = [
        {"surah": 1, "ayah": 1, "name": "Al-Faatiha"},
        {"surah": 2, "ayah": 255, "name": "Ayatul Kursi"},
        {"surah": 18, "ayah": 1, "name": "Surah Al-Kahf"},
        {"surah": 36, "ayah": 1, "name": "Surah Yasin"},
        {"surah": 55, "ayah": 13, "name": "Surah Ar-Rahman"},
        {"surah": 67, "ayah": 1, "name": "Surah Al-Mulk"},
        {"surah": 112, "ayah": 1, "name": "Surah Al-Ikhlas"},
        # Adding more famous ayahs
        {"surah": 2, "ayah": 1, "name": "Alif Lam Meem"},
        {"surah": 2, "ayah": 286, "name": "Last verses of Al-Baqarah"},
        {"surah": 3, "ayah": 190, "name": "Signs of Allah"},
        {"surah": 59, "ayah": 22, "name": "Names of Allah"},
    ]
    return {"ayahs": ayahs_with_hadith}

# ==================== TRANSLITERATION ====================

@app.get("/api/surah/{surah_number}/transliteration")
async def get_surah_transliteration(surah_number: int):
    """Get transliteration for a surah"""
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=404, detail=f"Surah {surah_number} not found")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{ALQURAN_BASE}/surah/{surah_number}/en.transliteration")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch transliteration")
        data = response.json()
        
        if data.get("code") != 200:
            raise HTTPException(status_code=404, detail="Transliteration not found")
        
        surah_data = data.get("data", {})
        ayahs = surah_data.get("ayahs", [])
        
        return {
            "surah": surah_number,
            "transliteration": [
                {"number": a.get("numberInSurah"), "text": a.get("text")}
                for a in ayahs
            ]
        }

# ==================== ENHANCED LEARN ARABIC ====================

@app.get("/api/learn/vocabulary")
async def get_arabic_vocabulary():
    """Get common Quranic vocabulary with audio"""
    vocabulary = [
        {
            "arabic": "اللّٰه",
            "transliteration": "Allah",
            "meaning": "God, The One True God",
            "usage": "Most frequently used name for God in the Quran",
            "category": "Names of Allah"
        },
        {
            "arabic": "رَبّ",
            "transliteration": "Rabb",
            "meaning": "Lord, Sustainer, Cherisher",
            "usage": "Refers to Allah as the Lord who nurtures all creation",
            "category": "Names of Allah"
        },
        {
            "arabic": "رَحْمٰن",
            "transliteration": "Rahman",
            "meaning": "The Most Gracious",
            "usage": "One of the names of Allah, denoting His all-encompassing mercy",
            "category": "Names of Allah"
        },
        {
            "arabic": "رَحِيم",
            "transliteration": "Raheem",
            "meaning": "The Most Merciful",
            "usage": "One of the names of Allah, denoting His special mercy to believers",
            "category": "Names of Allah"
        },
        {
            "arabic": "الْحَمْدُ",
            "transliteration": "Al-Hamd",
            "meaning": "The Praise, All Praise",
            "usage": "Used to praise and thank Allah",
            "category": "Worship"
        },
        {
            "arabic": "صَلَاة",
            "transliteration": "Salah",
            "meaning": "Prayer",
            "usage": "The ritual prayer performed five times daily",
            "category": "Worship"
        },
        {
            "arabic": "زَكَاة",
            "transliteration": "Zakah",
            "meaning": "Charity, Purification",
            "usage": "Obligatory charity, one of the five pillars of Islam",
            "category": "Worship"
        },
        {
            "arabic": "صَوْم",
            "transliteration": "Sawm",
            "meaning": "Fasting",
            "usage": "Abstaining from food and drink from dawn to sunset",
            "category": "Worship"
        },
        {
            "arabic": "جَنَّة",
            "transliteration": "Jannah",
            "meaning": "Paradise, Garden",
            "usage": "The eternal abode of the righteous",
            "category": "Afterlife"
        },
        {
            "arabic": "نَار",
            "transliteration": "Naar",
            "meaning": "Fire, Hellfire",
            "usage": "The punishment for the wicked",
            "category": "Afterlife"
        },
        {
            "arabic": "مَلَك",
            "transliteration": "Malak",
            "meaning": "Angel",
            "usage": "Beings created from light who carry out Allah's commands",
            "category": "Creation"
        },
        {
            "arabic": "رَسُول",
            "transliteration": "Rasool",
            "meaning": "Messenger",
            "usage": "A prophet who received a scripture from Allah",
            "category": "Prophets"
        },
        {
            "arabic": "نَبِيّ",
            "transliteration": "Nabi",
            "meaning": "Prophet",
            "usage": "One who receives revelation from Allah",
            "category": "Prophets"
        },
        {
            "arabic": "كِتَاب",
            "transliteration": "Kitab",
            "meaning": "Book, Scripture",
            "usage": "Often refers to the Quran or previous scriptures",
            "category": "Scripture"
        },
        {
            "arabic": "آيَة",
            "transliteration": "Ayah",
            "meaning": "Sign, Verse",
            "usage": "A verse of the Quran or a sign from Allah",
            "category": "Scripture"
        },
        {
            "arabic": "سُورَة",
            "transliteration": "Surah",
            "meaning": "Chapter",
            "usage": "A chapter of the Quran",
            "category": "Scripture"
        },
        {
            "arabic": "تَقْوَى",
            "transliteration": "Taqwa",
            "meaning": "God-consciousness, Piety",
            "usage": "Being aware of Allah and avoiding sin",
            "category": "Character"
        },
        {
            "arabic": "صَبْر",
            "transliteration": "Sabr",
            "meaning": "Patience, Perseverance",
            "usage": "Steadfastness in face of difficulty",
            "category": "Character"
        },
        {
            "arabic": "شُكْر",
            "transliteration": "Shukr",
            "meaning": "Gratitude, Thanks",
            "usage": "Being thankful to Allah for His blessings",
            "category": "Character"
        },
        {
            "arabic": "تَوْبَة",
            "transliteration": "Tawbah",
            "meaning": "Repentance",
            "usage": "Turning back to Allah and seeking forgiveness",
            "category": "Character"
        }
    ]
    return {"vocabulary": vocabulary}

@app.get("/api/learn/phrases")
async def get_common_phrases():
    """Get common Quranic phrases and expressions"""
    phrases = [
        {
            "arabic": "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ",
            "transliteration": "Bismillah ir-Rahman ir-Raheem",
            "meaning": "In the name of Allah, the Most Gracious, the Most Merciful",
            "usage": "Said before starting any action or recitation",
            "category": "Common Phrases"
        },
        {
            "arabic": "الْحَمْدُ لِلّٰهِ",
            "transliteration": "Alhamdulillah",
            "meaning": "All praise is due to Allah",
            "usage": "Expression of gratitude",
            "category": "Common Phrases"
        },
        {
            "arabic": "سُبْحَانَ اللّٰهِ",
            "transliteration": "Subhanallah",
            "meaning": "Glory be to Allah",
            "usage": "Expression of amazement or glorification",
            "category": "Common Phrases"
        },
        {
            "arabic": "اللّٰهُ أَكْبَرُ",
            "transliteration": "Allahu Akbar",
            "meaning": "Allah is the Greatest",
            "usage": "Proclamation of Allah's greatness",
            "category": "Common Phrases"
        },
        {
            "arabic": "لَا إِلٰهَ إِلَّا اللّٰهُ",
            "transliteration": "La ilaha illallah",
            "meaning": "There is no god but Allah",
            "usage": "Declaration of faith (Shahada)",
            "category": "Shahada"
        },
        {
            "arabic": "إِنَّا لِلّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ",
            "transliteration": "Inna lillahi wa inna ilayhi raji'un",
            "meaning": "Indeed we belong to Allah, and indeed to Him we will return",
            "usage": "Said upon hearing news of death or calamity",
            "category": "Condolence"
        },
        {
            "arabic": "مَا شَاءَ اللّٰهُ",
            "transliteration": "Masha'Allah",
            "meaning": "What Allah has willed",
            "usage": "Said to express appreciation without envy",
            "category": "Common Phrases"
        },
        {
            "arabic": "إِنْ شَاءَ اللّٰهُ",
            "transliteration": "Insha'Allah",
            "meaning": "If Allah wills",
            "usage": "Said when speaking of future events",
            "category": "Common Phrases"
        },
        {
            "arabic": "أَسْتَغْفِرُ اللّٰهَ",
            "transliteration": "Astaghfirullah",
            "meaning": "I seek forgiveness from Allah",
            "usage": "Seeking forgiveness for sins",
            "category": "Repentance"
        },
        {
            "arabic": "جَزَاكَ اللّٰهُ خَيْرًا",
            "transliteration": "Jazakallahu khairan",
            "meaning": "May Allah reward you with good",
            "usage": "Expression of gratitude to someone",
            "category": "Gratitude"
        }
    ]
    return {"phrases": phrases}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
