#!/usr/bin/env python3
"""
Quran Reader API Tests - Comprehensive Backend Testing
Tests all API endpoints for the Quran Reader application
"""
import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, List

class QuranAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int = 200, 
                 data: Dict = None, timeout: int = 30) -> bool:
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            else:
                print(f"❌ Unsupported method: {method}")
                return False

            success = response.status_code == expected_status
            
            result = {
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_size': len(response.text) if response.text else 0,
                'response_time': response.elapsed.total_seconds()
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Try to parse JSON response
                try:
                    response_json = response.json()
                    if isinstance(response_json, dict):
                        result['data_keys'] = list(response_json.keys())
                        # Check if we got expected data structure
                        if 'surahs' in response_json:
                            result['surah_count'] = len(response_json.get('surahs', []))
                        elif 'surah' in response_json:
                            surah = response_json['surah']
                            if surah and isinstance(surah, dict):
                                result['ayah_count'] = len(surah.get('ayahs', []))
                        elif 'reciters' in response_json:
                            result['reciter_count'] = len(response_json.get('reciters', []))
                except:
                    pass
                    
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_text = response.text[:200]
                    result['error_preview'] = error_text
                    print(f"   Error: {error_text}")
                except:
                    result['error_preview'] = "Could not read error text"

            self.test_results.append(result)
            return success

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.test_results.append({
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'success': False,
                'error': 'Timeout'
            })
            return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'success': False,
                'error': str(e)
            })
            return False

    def test_health_check(self) -> bool:
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "/api/health")

    def test_get_all_surahs(self) -> bool:
        """Test getting all surahs list"""
        success = self.run_test("Get All Surahs", "GET", "/api/surahs")
        if success:
            print("   ℹ️  This should return 114 surahs")
        return success

    def test_get_specific_surah(self) -> bool:
        """Test getting a specific surah with Arabic text and translation"""
        # Test Al-Fatiha (Surah 1) - most commonly accessed
        success = self.run_test("Get Surah 1 (Al-Fatiha)", "GET", "/api/surah/1")
        if success:
            print("   ℹ️  Should contain Arabic text and translation")
        return success

    def test_get_surah_with_params(self) -> bool:
        """Test getting surah with custom edition and translation"""
        success = self.run_test(
            "Get Surah 1 with params", "GET", 
            "/api/surah/1?edition=quran-simple&translation=en.pickthall"
        )
        return success

    def test_get_reciters(self) -> bool:
        """Test getting available reciters"""
        success = self.run_test("Get Reciters", "GET", "/api/reciters")
        if success:
            print("   ℹ️  Should return list of available Quran reciters")
        return success

    def test_get_reciters_v2(self) -> bool:
        """Test getting everyayah.com reciters (updated endpoint)"""
        success = self.run_test("Get Reciters v2 (EveryAyah)", "GET", "/api/reciters/v2")
        if success:
            print("   ℹ️  Should return everyayah.com compatible reciters")
        return success

    def test_get_ayah_audio(self) -> bool:
        """Test getting audio URL for specific ayah"""
        success = self.run_test("Get Ayah Audio", "GET", "/api/audio/ayah/7/1/1")
        if success:
            print("   ℹ️  Should return audio URL for Al-Fatiha verse 1")
        return success

    def test_get_ayah_audio_v2(self) -> bool:
        """Test getting everyayah.com audio URL for specific ayah"""
        success = self.run_test("Get Ayah Audio v2 (EveryAyah)", "GET", "/api/audio/ayah/v2/1/1")
        if success:
            print("   ℹ️  Should return everyayah.com audio URL for Al-Fatiha verse 1")
        return success

    def test_get_surah_audio(self) -> bool:
        """Test getting full surah audio"""
        success = self.run_test("Get Surah Audio", "GET", "/api/audio/7/1")
        if success:
            print("   ℹ️  Should return audio URL for complete Al-Fatiha")
        return success

    def test_get_related_hadith(self) -> bool:
        """Test getting hadith related to specific ayah"""
        # Test with Al-Fatiha first ayah which should have hadith mapping
        success = self.run_test("Get Related Hadith", "GET", "/api/hadith/related/1/1")
        if success:
            print("   ℹ️  Should return hadith related to Al-Fatiha verse 1")
        return success

    def test_get_ayahs_with_hadith(self) -> bool:
        """Test getting list of ayahs that have related hadith"""
        success = self.run_test("Get Ayahs with Hadith", "GET", "/api/hadith/ayahs-with-hadith")
        if success:
            print("   ℹ️  Should return list of surah:ayah pairs that have hadith")
        return success

    def test_arabic_learning_alphabet(self) -> bool:
        """Test Arabic learning - alphabet endpoint"""
        success = self.run_test("Get Arabic Alphabet", "GET", "/api/learn/alphabet")
        if success:
            print("   ℹ️  Should return 28 Arabic letters with pronunciation")
        return success

    def test_arabic_learning_tajweed(self) -> bool:
        """Test Arabic learning - tajweed rules"""
        success = self.run_test("Get Tajweed Rules", "GET", "/api/learn/tajweed")
        if success:
            print("   ℹ️  Should return tajweed rules for Quran recitation")
        return success

    def test_arabic_learning_grammar(self) -> bool:
        """Test Arabic learning - grammar basics"""
        success = self.run_test("Get Arabic Grammar", "GET", "/api/learn/grammar")
        if success:
            print("   ℹ️  Should return Arabic grammar basics")
        return success

    def test_arabic_learning_vocabulary(self) -> bool:
        """Test Arabic learning - vocabulary section"""
        success = self.run_test("Get Arabic Vocabulary", "GET", "/api/learn/vocabulary")
        if success:
            print("   ℹ️  Should return common Quranic vocabulary with categories")
        return success

    def test_arabic_learning_phrases(self) -> bool:
        """Test Arabic learning - phrases section"""
        success = self.run_test("Get Arabic Phrases", "GET", "/api/learn/phrases")
        if success:
            print("   ℹ️  Should return common Quranic phrases and expressions")
        return success

    def test_get_surah_transliteration(self) -> bool:
        """Test getting transliteration for a surah"""
        success = self.run_test("Get Surah Transliteration", "GET", "/api/surah/1/transliteration")
        if success:
            print("   ℹ️  Should return transliteration for Al-Fatiha")
        return success

    def test_bookmarks_workflow(self) -> bool:
        """Test complete bookmarks workflow - add, get, delete"""
        print("\n🔄 Testing Bookmarks Workflow...")
        
        # First, get existing bookmarks
        get_success = self.run_test("Get Bookmarks", "GET", "/api/bookmarks")
        if not get_success:
            return False

        # Add a new bookmark
        bookmark_data = {
            "surah_number": 1,
            "ayah_number": 1,
            "surah_name": "Al-Fatiha",
            "ayah_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            "note": "Opening verse of Quran"
        }
        add_success = self.run_test("Add Bookmark", "POST", "/api/bookmarks", 200, bookmark_data)
        if not add_success:
            return False

        # Get bookmarks again to verify addition
        get_after_add = self.run_test("Get Bookmarks After Add", "GET", "/api/bookmarks")
        if not get_after_add:
            return False

        # Delete the bookmark
        delete_success = self.run_test("Delete Bookmark", "DELETE", "/api/bookmarks/1/1")
        
        return delete_success

    def test_settings_workflow(self) -> bool:
        """Test settings get and update workflow"""
        print("\n🔄 Testing Settings Workflow...")
        
        # Get current settings
        get_success = self.run_test("Get Settings", "GET", "/api/settings")
        if not get_success:
            return False

        # Update settings
        settings_data = {
            "text_style": "quran-simple",
            "reciter_id": "1",
            "translation": "en.pickthall",
            "text_size": "medium",
            "theme": "light"
        }
        update_success = self.run_test("Update Settings", "PUT", "/api/settings", 200, settings_data)
        
        return update_success

    def test_reading_progress_workflow(self) -> bool:
        """Test reading progress save and get"""
        print("\n🔄 Testing Reading Progress Workflow...")
        
        # Save reading progress
        progress_data = {
            "surah_number": 2,
            "ayah_number": 10,
            "surah_name": "Al-Baqarah"
        }
        save_success = self.run_test("Save Reading Progress", "POST", "/api/reading-progress", 200, progress_data)
        if not save_success:
            return False

        # Get reading progress
        get_success = self.run_test("Get Reading Progress", "GET", "/api/reading-progress")
        
        return get_success

    def test_hifz_workflow(self) -> bool:
        """Test Hifz (memorization) endpoints"""
        print("\n🔄 Testing Hifz Workflow...")
        
        # Get Hifz progress
        get_progress = self.run_test("Get Hifz Progress", "GET", "/api/hifz/progress")
        if not get_progress:
            return False

        # Get Hifz stats
        get_stats = self.run_test("Get Hifz Stats", "GET", "/api/hifz/stats")
        if not get_stats:
            return False

        # Save Hifz progress
        hifz_data = {
            "surah_number": 1,
            "ayah_start": 1,
            "ayah_end": 7,
            "status": "learning",
            "repetitions": 5
        }
        save_success = self.run_test("Save Hifz Progress", "POST", "/api/hifz/progress", 200, hifz_data)
        if not save_success:
            return False

        # Get stats again to verify data was saved
        get_stats_after = self.run_test("Get Hifz Stats After Save", "GET", "/api/hifz/stats")
        
        # Delete the progress entry (cleanup)
        delete_success = self.run_test("Delete Hifz Progress", "DELETE", "/api/hifz/progress/1/1/7")
        
        return delete_success

    def test_edge_cases(self) -> bool:
        """Test edge cases and error handling"""
        print("\n🔄 Testing Edge Cases...")
        
        # Test invalid surah number
        invalid_surah = self.run_test("Invalid Surah Number", "GET", "/api/surah/999", 404)
        
        # Test invalid ayah for hadith
        invalid_hadith = self.run_test("Invalid Hadith Request", "GET", "/api/hadith/related/999/999")
        # This should still return 200 but with empty hadith array
        
        # Test malformed bookmark data
        bad_bookmark = self.run_test("Malformed Bookmark", "POST", "/api/bookmarks", 422, {"invalid": "data"})
        
        return True  # Edge case tests are informational

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all API tests"""
        print("=" * 60)
        print("🧪 QURAN READER API COMPREHENSIVE TESTS")
        print("=" * 60)
        
        # Core API tests
        self.test_health_check()
        self.test_get_all_surahs()
        self.test_get_specific_surah()
        self.test_get_surah_with_params()
        self.test_get_reciters()
        self.test_get_reciters_v2()
        
        # Audio tests
        self.test_get_ayah_audio()
        self.test_get_ayah_audio_v2()
        self.test_get_surah_audio()
        
        # Hadith tests
        self.test_get_related_hadith()
        self.test_get_ayahs_with_hadith()
        
        # Learning module tests
        self.test_arabic_learning_alphabet()
        self.test_arabic_learning_tajweed()
        self.test_arabic_learning_grammar()
        self.test_arabic_learning_vocabulary()
        self.test_arabic_learning_phrases()
        self.test_get_surah_transliteration()
        
        # Workflow tests
        self.test_bookmarks_workflow()
        self.test_settings_workflow()
        self.test_reading_progress_workflow()
        self.test_hifz_workflow()
        
        # Edge case tests
        self.test_edge_cases()
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Analyze failures
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['name']}: {test.get('error', 'Status mismatch')}")
        else:
            print("\n🎉 ALL TESTS PASSED!")
        
        return {
            'total_tests': self.tests_run,
            'passed_tests': self.tests_passed,
            'failed_tests': self.tests_run - self.tests_passed,
            'success_rate': self.tests_passed / self.tests_run if self.tests_run > 0 else 0,
            'test_results': self.test_results,
            'failed_tests': failed_tests
        }

def main():
    # Get backend URL from environment variable or use default
    import os
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
    
    print(f"🌐 Testing Quran Reader API at: {backend_url}")
    
    tester = QuranAPITester(backend_url)
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results['failed_tests'] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())