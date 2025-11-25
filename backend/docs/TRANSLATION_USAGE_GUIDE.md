# Translation Feature Usage Guide

## Overview
The SwachhSetu translation system allows users to submit reports in their native language and receive responses in the same language. It supports 12 Indian languages and uses AI-powered translation via Ollama (Mistral:7b).

---

## 🌍 Supported Languages

1. English (eng)
2. Hindi (hin) - हिंदी
3. Marathi (mar) - मराठी
4. Bengali (ben) - বাংলা
5. Telugu (tel) - తెలుగు
6. Tamil (tam) - தமிழ்
7. Gujarati (guj) - ગુજરાતી
8. Kannada (kan) - ಕನ್ನಡ
9. Malayalam (mal) - മലയാളം
10. Urdu (urd) - اردو
11. Punjabi (pan) - ਪੰਜਾਬੀ
12. Odia (ori) - ଓଡ଼ିଆ

---

## 📋 Prerequisites

### 1. Enable Translation in Environment
```bash
# backend/.env
ENABLE_AI_TRANSLATION=true
MAX_TRANSLATION_LENGTH=5000
```

### 2. Ensure Ollama is Running
```powershell
# Verify Ollama is running
ollama ps

# Should show mistral:7b model
```

### 3. Restart Server
```powershell
cd D:\Project\SwachhSetu\backend
npm start
```

---

## 🚀 How to Use Translation

### Method 1: Via API Endpoint (Direct Translation)

#### Translate Any Text
```powershell
# Translate Hindi to English
curl -X POST http://localhost:5000/api/ai/translate `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "text": "कचरा फैला हुआ है",
    "targetLanguage": "English"
  }'
```

#### Response Format:
```json
{
  "success": true,
  "original": "कचरा फैला हुआ है",
  "translated": "Garbage is scattered",
  "source_lang": "Hindi",
  "target_lang": "English",
  "processing_time_ms": 1834,
  "model_used": "mistral:7b",
  "character_count": 18,
  "timestamp": "2025-11-24T..."
}
```

#### Specify Source Language (Optional):
```powershell
curl -X POST http://localhost:5000/api/ai/translate `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "text": "Garbage is scattered",
    "targetLanguage": "Hindi",
    "sourceLanguage": "English"
  }'
```

---

### Method 2: Automatic Translation in Report Workflow

The translation system automatically works with reports. Here's how:

#### Step 1: User Submits Report in Their Language
```javascript
// Frontend example - User submits in Hindi
const reportData = {
  title: "सड़क पर कचरा",
  description: "मेरे घर के सामने सड़क पर बहुत सारा कचरा फैला हुआ है। कृपया जल्द से जल्द साफ करें।",
  category: "Garbage Collection",
  location: {
    type: "Point",
    coordinates: [77.1025, 28.7041]
  },
  reportedBy: "USER_ID"
};

// POST to /api/reports
fetch('http://localhost:5000/api/reports', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify(reportData)
});
```

#### Step 2: System Auto-Detects Language & Translates
```javascript
// Backend automatically:
// 1. Detects language (Hindi)
// 2. Translates to English for AI processing
// 3. Performs triage with translated text
// 4. Stores both original and translated versions
```

#### Step 3: AI Processes in English
```javascript
// AI triage service uses translated English text
const triageResult = await aiTriageService.triageReport({
  description: "A lot of garbage is scattered on the road in front of my house...",
  // ... other fields
});
```

#### Step 4: System Sends Follow-up in User's Language
```javascript
// When ticket is resolved, follow-up is generated in user's language
// System remembers: userLanguage = "Hindi" from original report

// Follow-up message automatically generated in Hindi:
// "नमस्ते [Name], आपकी शिकायत का समाधान हो गया है..."
```

---

### Method 3: Programmatic Usage in Your Code

#### Import the Service
```javascript
const aiTranslationService = require('./services/aiTranslationService');
```

#### Detect Language
```javascript
const detection = await aiTranslationService.detectLanguage(
  "यह हिंदी में लिखा है"
);

console.log(detection);
// Output:
// {
//   code: 'hin',
//   name: 'Hindi',
//   confidence: 0.9,
//   detected: true
// }
```

#### Translate to English
```javascript
const result = await aiTranslationService.translateToEnglish(
  "कचरा फैला हुआ है"
);

console.log(result.translated);
// Output: "Garbage is scattered"
```

#### Translate to User's Language
```javascript
const result = await aiTranslationService.translateToUserLanguage(
  "Your complaint has been resolved",
  "Hindi"
);

console.log(result.translated);
// Output: "आपकी शिकायत का समाधान हो गया है"
```

#### Batch Translation
```javascript
const texts = [
  "Garbage collection",
  "Road cleaning",
  "Toilet maintenance"
];

const results = await aiTranslationService.batchTranslate(texts, "Hindi");

results.forEach(r => console.log(r.translated));
// Output:
// कचरा संग्रह
// सड़क की सफाई
// शौचालय रखरखाव
```

#### Check Language Support
```javascript
// Get all supported languages
const languages = aiTranslationService.getSupportedLanguages();
console.log(languages);
// ['English', 'Hindi', 'Marathi', ...]

// Check if specific language is supported
const isSupported = aiTranslationService.isLanguageSupported('Tamil');
console.log(isSupported); // true
```

---

## 🔄 Complete Workflow Example

### Scenario: Hindi-speaking user reports garbage issue

```javascript
// 1. USER SUBMITS REPORT IN HINDI
POST /api/reports
{
  "title": "सड़क पर कचरा",
  "description": "बहुत सारा कचरा फैला है",
  "category": "Garbage Collection",
  "reportedBy": "USER_ID"
}

// 2. BACKEND DETECTS LANGUAGE
const detection = await aiTranslationService.detectLanguage(description);
// Result: { code: 'hin', name: 'Hindi', confidence: 0.9 }

// 3. BACKEND TRANSLATES TO ENGLISH FOR PROCESSING
const translation = await aiTranslationService.translateToEnglish(description);
// Result: { translated: "A lot of garbage is scattered" }

// 4. AI TRIAGE PROCESSES ENGLISH TEXT
const triage = await aiTriageService.triageReport({
  description: translation.translated,
  // ...
});
// Result: { category: 'Garbage Collection', severity: 'medium', ... }

// 5. REPORT STORED WITH BOTH VERSIONS
await Report.create({
  title: "सड़क पर कचरा",
  description: "बहुत सारा कचरा फैला है",
  aiAnalysis: {
    ...triage,
    originalLanguage: "Hindi",
    translatedDescription: "A lot of garbage is scattered"
  }
});

// 6. INSPECTOR ASSIGNED (SEES ENGLISH VERSION)
// Admin/Inspector dashboard shows English translation

// 7. TICKET RESOLVED
PATCH /api/reports/:id { status: 'resolved' }

// 8. FOLLOW-UP GENERATED IN HINDI
const followup = await aiFollowupService.generateFollowup({
  userName: "राज कुमार",
  reportTitle: "सड़क पर कचरा",
  resolutionNotes: "Area cleaned successfully",
  userLanguage: "Hindi"  // ← Key: remembers user's language
});

// 9. USER RECEIVES FOLLOW-UP IN HINDI
// SMS/Email/In-app: "नमस्ते राज कुमार, आपकी शिकायत का समाधान हो गया है..."
```

---

## 🧪 Testing Translation

### Test 1: Simple Translation
```powershell
# Create a test script: test-translation.js
# Run: node test-translation.js

const aiTranslationService = require('./services/aiTranslationService');

async function test() {
  // Test Hindi to English
  const result = await aiTranslationService.translate(
    "सड़क पर कचरा पड़ा है",
    "English"
  );
  
  console.log('Original:', result.original);
  console.log('Translated:', result.translated);
  console.log('Language:', result.source_lang, '→', result.target_lang);
}

test();
```

### Test 2: Via API with curl
```powershell
# First, get auth token by logging in
$token = "YOUR_JWT_TOKEN"

# Test translation
curl -X POST http://localhost:5000/api/ai/translate `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    "text": "गंदगी बहुत है",
    "targetLanguage": "English"
  }'
```

### Test 3: Full Report Flow
```powershell
# 1. Create report in Hindi
curl -X POST http://localhost:5000/api/reports `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{
    "title": "शौचालय गंदा है",
    "description": "सार्वजनिक शौचालय बहुत गंदा है और बदबू आ रही है",
    "category": "Public Toilets",
    "reportedBy": "USER_ID"
  }'

# 2. Check if language was detected
curl http://localhost:5000/api/reports/REPORT_ID

# 3. Verify aiAnalysis has originalLanguage and translated text
```

---

## 📊 Translation Logs & Monitoring

### Check Translation Logs
```powershell
# Get AI processing logs
curl http://localhost:5000/api/ai/logs?operation=translation&limit=10
```

### Log Output Format:
```json
{
  "logs": [
    {
      "operation": "translation",
      "reportId": "...",
      "result": {
        "source_lang": "Hindi",
        "target_lang": "English",
        "character_count": 45,
        "processing_time_ms": 1823
      },
      "status": "completed",
      "processingTime": 1823,
      "createdAt": "2025-11-24T..."
    }
  ]
}
```

---

## ⚙️ Configuration Options

### Environment Variables
```bash
# Enable/disable translation
ENABLE_AI_TRANSLATION=true

# Maximum text length (characters)
MAX_TRANSLATION_LENGTH=5000

# Model used for translation
# Default: mistral:7b (configured in ollamaService)
```

### Customizing Translation Service

#### Change Model (if needed)
```javascript
// In aiTranslationService.js, the model is specified:
const response = await ollamaService.generate(prompt, 'mistral:7b', {
  temperature: 0.3,  // Lower = more literal translation
  top_p: 0.9
});

// You can change to llama3:8b or other models if available
```

#### Add Custom Glossary (Future Enhancement)
```javascript
// Create backend/config/translation-glossary.json
{
  "civic_terms": {
    "Garbage Collection": {
      "hi": "कचरा संग्रह",
      "mr": "कचरा संकलन",
      "ta": "குப்பை சேகரிப்பு"
    },
    "Public Toilet": {
      "hi": "सार्वजनिक शौचालय",
      "mr": "सार्वजनिक शौचालय",
      "ta": "பொது கழிவறை"
    }
  }
}

// Then modify buildTranslationPrompt() to include glossary terms
```

---

## 🔧 Troubleshooting

### Issue 1: "Translation service is disabled"
**Solution:** Set `ENABLE_AI_TRANSLATION=true` in `.env` and restart server

### Issue 2: Language not detected correctly
**Problem:** Very short text (< 3 words) may not detect properly  
**Solution:** Provide more text, or explicitly specify `sourceLanguage` in API call

### Issue 3: Translation quality is poor
**Causes:**
- Model not suitable for the language pair
- Text contains too much slang/informal language
- Technical terms without context

**Solutions:**
- Use explicit `sourceLanguage` parameter
- Add domain-specific glossary
- Use hosted translation API (Google/Azure) for production

### Issue 4: Slow translation speed
**Causes:** 
- Ollama model not loaded in memory
- Long text (> 1000 characters)

**Solutions:**
```powershell
# Warm up the model
ollama run mistral:7b

# Or use batch translation with delays
await aiTranslationService.batchTranslate(texts, 'Hindi');
# (includes 300ms delay between requests)
```

### Issue 5: "Text too long" error
**Solution:** Split text into chunks < 5000 characters:
```javascript
function splitText(text, maxLength = 4000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
}

// Translate each chunk
const chunks = splitText(longText);
const results = await aiTranslationService.batchTranslate(chunks, 'Hindi');
const fullTranslation = results.map(r => r.translated).join(' ');
```

---

## 🎯 Best Practices

### 1. Always Store Both Original and Translated
```javascript
// Good practice
await Report.create({
  title: originalTitle,
  description: originalDescription,
  aiAnalysis: {
    originalLanguage: detectedLang,
    translatedTitle: translatedTitle,
    translatedDescription: translatedDescription,
    // ... other AI analysis
  }
});
```

### 2. Remember User's Language Preference
```javascript
// Store in User model
await User.updateOne(
  { _id: userId },
  { preferredLanguage: detectedLang }
);

// Use for all future communications
const userLang = user.preferredLanguage || 'English';
const message = await translateToUserLanguage(englishMessage, userLang);
```

### 3. Graceful Fallback
```javascript
// If translation fails, continue with original
let processText = description;
try {
  const translation = await aiTranslationService.translateToEnglish(description);
  if (translation.success) {
    processText = translation.translated;
  }
} catch (error) {
  console.warn('Translation failed, using original:', error);
  // Continue with original language
}
```

### 4. Cache Common Translations
```javascript
// For common phrases (categories, status messages)
const COMMON_TRANSLATIONS = {
  'Garbage Collection': {
    'Hindi': 'कचरा संग्रह',
    'Marathi': 'कचरा संकलन'
  },
  'Pending': {
    'Hindi': 'लंबित',
    'Marathi': 'प्रलंबित'
  }
};

// Check cache before calling LLM
const cached = COMMON_TRANSLATIONS[text]?.[targetLang];
if (cached) return cached;

// Otherwise, translate via LLM
```

### 5. Validate Language Before Translation
```javascript
const supported = aiTranslationService.isLanguageSupported(targetLang);
if (!supported) {
  return res.status(400).json({
    error: `Language '${targetLang}' not supported`,
    supported: aiTranslationService.getSupportedLanguages()
  });
}
```

---

## 📱 Frontend Integration Example

### React Component with Translation
```jsx
import { useState } from 'react';
import axios from 'axios';

function TranslatableInput() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('English');
  const [translation, setTranslation] = useState('');

  const supportedLanguages = [
    'English', 'Hindi', 'Marathi', 'Bengali', 'Telugu',
    'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu',
    'Punjabi', 'Odia'
  ];

  const handleTranslate = async () => {
    try {
      const response = await axios.post('/api/ai/translate', {
        text,
        targetLanguage: language
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setTranslation(response.data.translated);
    } catch (error) {
      console.error('Translation failed:', error);
    }
  };

  return (
    <div>
      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to translate..."
      />
      
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {supportedLanguages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
      
      <button onClick={handleTranslate}>Translate</button>
      
      {translation && (
        <div>
          <h4>Translation ({language}):</h4>
          <p>{translation}</p>
        </div>
      )}
    </div>
  );
}

export default TranslatableInput;
```

---

## 🚀 Quick Start Checklist

- [ ] ✅ Set `ENABLE_AI_TRANSLATION=true` in `.env`
- [ ] ✅ Verify Ollama is running: `ollama ps`
- [ ] ✅ Verify `mistral:7b` model is available: `ollama list`
- [ ] ✅ Restart backend server: `npm start`
- [ ] ✅ Test translation endpoint with curl
- [ ] ✅ Create a test report in Hindi/other language
- [ ] ✅ Verify AI logs show translation operation
- [ ] ✅ Check follow-up messages are generated in user's language

---

## 📚 Additional Resources

- **Translation Service Code:** `backend/services/aiTranslationService.js`
- **API Routes:** `backend/routes/aiRoutes.js` (line 85-105)
- **AI Worker:** `backend/queues/aiWorker.js` (translation job processing)
- **Test Suite:** `backend/test-ai.js` (translation tests)
- **Supported Languages:** [List of ISO 639-3 codes](https://en.wikipedia.org/wiki/ISO_639-3)

---

## 🎓 Advanced Usage

### Custom Translation Prompt
```javascript
// Modify buildTranslationPrompt() in aiTranslationService.js
// to add domain-specific instructions

buildTranslationPrompt(text, sourceLang, targetLang) {
  return `You are an expert translator for civic/municipal services.

SPECIALIZED VOCABULARY:
- Garbage Collection = कचरा संग्रह (Hindi)
- Public Toilet = सार्वजनिक शौचालय (Hindi)
- Sanitation Worker = स्वच्छता कर्मचारी (Hindi)

TASK: Translate from ${sourceLang} to ${targetLang}...
`;
}
```

### Integration with External Translation API
```javascript
// Add to aiTranslationService.js

async translateViaGoogle(text, targetLang) {
  const { Translate } = require('@google-cloud/translate').v2;
  const translate = new Translate();
  
  const [translation] = await translate.translate(text, targetLang);
  return translation;
}

// Use as fallback or primary based on config
const useGoogle = process.env.USE_GOOGLE_TRANSLATE === 'true';
if (useGoogle) {
  return this.translateViaGoogle(text, targetLang);
} else {
  return this.translate(text, targetLang); // Ollama
}
```

---

**Your translation system is ready to use!** Start with the Quick Start Checklist and test with simple API calls before integrating into your full application workflow.
