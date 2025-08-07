import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import OpenAI from 'openai';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuration multer pour les uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Initialiser les clients API
let visionClient = null; // We'll use direct REST API calls instead
let openai;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized with API key');
  } else {
    console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
    openai = null;
  }
} catch (error) {
  console.warn('⚠️ OpenAI client initialization failed:', error.message);
  console.warn('⚠️ OpenAI features will be disabled');
  openai = null;
}

/**
 * Extract text from image using Google Vision API REST endpoint
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromImage(base64Image) {
  console.log('🔍 Checking Google Vision API key...');
  console.log('🔑 API Key exists:', !!process.env.GOOGLE_VISION_API_KEY);
  console.log('🔑 API Key starts with:', process.env.GOOGLE_VISION_API_KEY ? process.env.GOOGLE_VISION_API_KEY.substring(0, 10) + '...' : 'NOT FOUND');
  
  if (!process.env.GOOGLE_VISION_API_KEY) {
    throw new Error('Google Vision API key not configured');
  }

  const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;
  
  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 1
          }
        ],
        imageContext: {
          languageHints: ['fr', 'en']
        }
      }
    ]
  };

  const response = await fetch(visionApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Vision API error: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.responses || !result.responses[0]) {
    throw new Error('No response received from Vision API');
  }

  const visionResponse = result.responses[0];

  if (visionResponse.error) {
    throw new Error(`Vision API error: ${visionResponse.error.message}`);
  }

  if (!visionResponse.textAnnotations || visionResponse.textAnnotations.length === 0) {
    throw new Error('No text detected in image');
  }

  return visionResponse.textAnnotations[0].description;
}

/**
 * Safe JSON parser with error handling and cleaning
 * @param {string} jsonString - The JSON string to parse
 * @returns {Object} - Parsed JSON or fallback error object
 */
function safeJsonParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error('❌ JSON parsing error:', parseError);
    console.error('Failed to parse:', jsonString);
    
    // Attempt to clean the JSON string
    let cleanedString = jsonString.trim();
    
    // Remove markdown code blocks
    if (cleanedString.startsWith('```json')) {
      cleanedString = cleanedString.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (cleanedString.startsWith('```')) {
      cleanedString = cleanedString.replace(/```\n?/, '').replace(/```\n?/, '');
    }
    
    // Remove trailing commas
    cleanedString = cleanedString.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unclosed strings
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let cleanedChars = [];
    
    for (let i = 0; i < cleanedString.length; i++) {
      const char = cleanedString[i];
      
      if (escapeNext) {
        cleanedChars.push(char);
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        cleanedChars.push(char);
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        cleanedChars.push(char);
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
      
      cleanedChars.push(char);
    }
    
    // Close unclosed strings and structures
    if (inString) {
      cleanedChars.push('"');
    }
    
    while (braceCount > 0) {
      cleanedChars.push('}');
      braceCount--;
    }
    
    while (bracketCount > 0) {
      cleanedChars.push(']');
      bracketCount--;
    }
    
    cleanedString = cleanedChars.join('');
    
    // Try parsing again
    try {
      return JSON.parse(cleanedString);
    } catch (secondError) {
      console.error('❌ Second JSON parsing attempt failed:', secondError);
      console.error('Raw response that failed to parse:', jsonString);
      
      // Try to extract partial data from the response
      const partialMatches = jsonString.match(/\{[^}]*"title"[^}]*"description"[^}]*"tags"[^}]*"price"[^}]*\}/g);
      if (partialMatches && partialMatches.length > 0) {
        console.log('✅ Found partial data, attempting to parse individual objects...');
        try {
          const partialData = partialMatches.map(match => {
            try {
              return JSON.parse(match);
            } catch {
              return null;
            }
          }).filter(item => item !== null);
          
          if (partialData.length > 0) {
            console.log(`✅ Successfully parsed ${partialData.length} partial items`);
            return {
              status: "partial",
              message: "Menu analyzed with partial results",
              recommendations: partialData
            };
          }
        } catch (partialError) {
          console.error('❌ Partial parsing failed:', partialError);
        }
      }
      
      // Return fallback error object
      return {
        status: "error",
        message: "Unable to analyze menu",
        error: parseError.message
      };
    }
  }
}

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// New comprehensive endpoint for image analysis
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  // Initialize debugData at the beginning to avoid ReferenceError
  let debugData = {
    rawOcrText: '',
    ocrAnalysis: {
      totalLines: 0,
      nonEmptyLines: 0,
      linesBreakdown: []
    },
    potentialDishes: []
  };
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        status: "error",
        message: "No image provided" 
      });
    }

    console.log('📸 Processing image for analysis...');
    
    // Convert image to base64
    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString('base64');

    // Step 1: Extract text using Google Vision API
    let extractedText = '';
    
    try {
      extractedText = await extractTextFromImage(base64Image);
      console.log('✅ Text extracted successfully');
      console.log('Text length:', extractedText.length);
      console.log('Text preview:', extractedText.substring(0, 200));
    } catch (visionError) {
      console.error('❌ Vision API error:', visionError);
      return res.json({
        status: "error",
        message: "Unable to extract text from image. Please check Vision API credentials."
      });
    }

    // Step 2: Get user profile from request body
    const userProfile = req.body.userProfile ? JSON.parse(req.body.userProfile) : {};

    // Step 3: Extract dishes using OpenAI (more reliable than regex detection)
    console.log('🔍 EXTRACTING DISHES USING OPENAI FROM OCR TEXT...');
    
    let recommendations = []; // Define recommendations variable in the outer scope
    
    // Use OpenAI to extract dishes from OCR text
    const dishExtractionPrompt = `Extract ALL dishes from this menu text. Look for dish names, prices, and descriptions.

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

EXTRACTION RULES:
1. Look for dish names (usually in CAPS or bold)
2. Look for prices (numbers with €, $, £ or just numbers)
3. Look for descriptions (text after dish names)
4. Ignore section headers like "CEVICHES", "QUESADILLAS", "DRINKS", "MENU", "DESSERTS"
5. Extract ALL dishes you can find, not just 3

Return a JSON array of dishes in this exact format:
[
  {
    "title": "Dish name (extract the actual dish name, not section headers)",
    "description": "Full description of the dish",
    "price": "price if found, otherwise null",
    "tags": ["extracted", "menu"]
  }
]

Menu text:
${extractedText}

Output ONLY the JSON response, nothing else.`;

    try {
      const extractionCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a menu parsing expert. Extract dishes from menu text and return ONLY valid JSON. Ignore section headers, focus on actual dishes."
          },
          {
            role: "user",
            content: dishExtractionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const extractionResponse = extractionCompletion.choices[0]?.message?.content;
      console.log('📄 Raw dish extraction response:', extractionResponse);

      // Parse the extraction response
      const extractedDishes = safeJsonParse(extractionResponse);
      
      if (!Array.isArray(extractedDishes)) {
        throw new Error('Invalid dish extraction response format');
      }

      // Convert to recommendations format
      recommendations = extractedDishes.map((dish, index) => ({
        title: dish.title || `Dish ${index + 1}`,
        description: dish.description || 'Extracted from menu',
        tags: Array.isArray(dish.tags) ? dish.tags : ['extracted', 'menu'],
        price: dish.price || null
      }));

      console.log('📋 DISHES EXTRACTED BY OPENAI:', recommendations.length);
      recommendations.forEach((dish, index) => {
        console.log(`  ${index + 1}. "${dish.title}" - Price: ${dish.price || 'N/A'} - Description: ${dish.description.substring(0, 50)}...`);
      });

    } catch (extractionError) {
      console.error('❌ Error extracting dishes with OpenAI:', extractionError);
      
      // Fallback to basic extraction if OpenAI fails
      console.log('🔄 Falling back to basic extraction...');
      const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
      recommendations = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip section headers
        if (line.includes('CEVICHES') || line.includes('QUESADILLAS') || 
            line.includes('DRINKS') || line.includes('MENU') || line.includes('DESSERTS')) {
          continue;
        }
        
        // Look for dish names (all caps, reasonable length)
        if (/^[A-Z][A-Z\s]+$/.test(line) && line.length >= 3 && line.length <= 50) {
          const nextLine = lines[i + 1] || '';
          const priceMatch = nextLine.match(/^\d+\.?\d*/);
          
          recommendations.push({
            title: line,
            description: nextLine && !priceMatch ? nextLine : 'Extracted from menu',
            tags: ['extracted', 'menu'],
            price: priceMatch ? priceMatch[0] : null
          });
        }
      }
      
      console.log('📋 BASIC EXTRACTION FALLBACK:', recommendations.length);
    }

    // Validate recommendations format
    if (!Array.isArray(recommendations)) {
      return res.json({
        status: "error",
        message: "Invalid recommendations format",
        extractedText: extractedText
      });
    }

    // Log total dishes detected by OCR
    console.log('🔍 TOTAL DISHES DETECTED BY OCR:', recommendations.length);
    console.log('📋 All dishes extracted from menu:', recommendations);
      
      // Step 1: Analyze ALL dishes with AI before any filtering
      console.log('🤖 ANALYZING ALL DISHES WITH AI BEFORE FILTERING...');
      const allDishesWithScores = [];
      
      for (let i = 0; i < recommendations.length; i++) {
        const dish = recommendations[i];
        console.log(`\n🍽️ Analyzing dish ${i + 1}/${recommendations.length}: "${dish.title || 'NO TITLE'}"`);
        
        try {
          // Create dish text for analysis
          const dishText = `${dish.title || 'Unknown dish'}: ${dish.description || 'No description'}`;
          console.log(`📝 Dish text for analysis: "${dishText}"`);
          
          // Call OpenAI for analysis
          const analysisCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a nutrition expert that analyzes dishes for personalized recommendations. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If the dish description is unclear or missing, you MUST still provide your best estimate based on the dish name and any available information. NEVER return an error. Always provide a plausible analysis, even if you have to make reasonable assumptions. Be precise with nutritional values and provide meaningful justifications. Write all justifications in English only, maximum 2 sentences, using ONLY real data (nutritional info and user preferences). Do NOT reference activity data, workouts, or energy expenditure. The aiScore represents a personalized match score (0-10) based on how well the dish aligns with the user's dietary profile and preferences."
              },
              {
                role: "user",
                content: `Analyze this dish for a user with the following profile: ${JSON.stringify(userProfile, null, 2)}.

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

If the dish description is unclear or missing, you MUST still provide your best estimate based on the dish name and any available information. NEVER return an error. Always provide a plausible analysis, even if you have to make reasonable assumptions.

Return a JSON object with exactly these fields:
{
  "aiScore": 0-10 (float, personalized match score based on user profile & needs),
  "calories": integer (kcal),
  "macros": {
    "protein": integer (grams),
    "carbs": integer (grams), 
    "fats": integer (grams)
  },
  "shortJustification": "Maximum 2 sentences in English, focusing on nutritional data and user preferences. Use ONLY real data: calories, macros, dietary preferences, allergies, constraints. Do NOT reference activity data, workouts, or energy expenditure. Examples: 'High in protein and fully plant-based, perfectly matching your vegan preference.' or 'Balanced meal with moderate carbs and healthy fats, great for a light lunch.'",
  "longJustification": [
    "First bullet point about nutritional benefits (based on macros/calories)",
    "Second bullet point about user preference match (dietary preferences/allergies)",
    "Third bullet point about dietary constraints alignment (if applicable)"
  ]
}

Dish: ${dishText}

Output ONLY the JSON response, nothing else.`
              }
            ],
            temperature: 0.7,
            max_tokens: 200
          });

          const analysisResponseText = analysisCompletion.choices[0]?.message?.content;
          console.log(`📄 Raw OpenAI analysis response for "${dish.title || 'NO TITLE'}":`, analysisResponseText);

          // Parse the analysis response
          const analysis = safeJsonParse(analysisResponseText);
          
          if (analysis.error) {
            console.log(`❌ Error analyzing "${dish.title || 'NO TITLE'}": ${analysis.error}`);
            allDishesWithScores.push({
              ...dish,
              aiScore: 0,
              calories: 0,
              macros: { protein: 0, carbs: 0, fats: 0 },
              shortJustification: "Unable to analyze",
              longJustification: ["Analysis failed"],
              analysisError: analysis.error
            });
          } else {
            console.log(`✅ Successfully analyzed "${dish.title || 'NO TITLE'}" - AI Score: ${analysis.aiScore}`);
            allDishesWithScores.push({
              ...dish,
              aiScore: analysis.aiScore || 0,
              calories: analysis.calories || 0,
              macros: analysis.macros || { protein: 0, carbs: 0, fats: 0 },
              shortJustification: analysis.shortJustification || "No justification available",
              longJustification: analysis.longJustification || ["No justification available"]
            });
          }
        } catch (error) {
          console.error(`❌ Error analyzing dish "${dish.title || 'NO TITLE'}":`, error);
          allDishesWithScores.push({
            ...dish,
            aiScore: 0,
            calories: 0,
            macros: { protein: 0, carbs: 0, fats: 0 },
            shortJustification: "Analysis not available",
            longJustification: ["Analysis not available"]
          });
        }
      }
      
      // Log all dishes with their AI scores
      console.log('\n📊 ALL DISHES WITH AI SCORES:');
      allDishesWithScores.forEach((dish, index) => {
        console.log(`  ${index + 1}. "${dish.title || 'NO TITLE'}" - AI Score: ${dish.aiScore || 0} - Calories: ${dish.calories || 0}`);
      });
      
      // Step 2: Now filter and validate dishes
      console.log(`\n📊 TOTAL DISHES DETECTED BY OCR: ${recommendations.length}`);
      console.log('📋 All dishes extracted from menu:', recommendations);
      console.log('\n🔍 FILTERING AND VALIDATING DISHES...');
      console.log('📊 DISH VALIDATION RESULTS:');
      
      const dishValidationResults = [];
      const excludedDishes = [];
      
      allDishesWithScores.forEach((dish, index) => {
        console.log(`\n🍽️ DISH ${index + 1}: "${dish.title || 'NO TITLE'}"`);
        console.log(`     - Raw text from OCR: ${extractedText.substring(0, 200)}...`);
        console.log(`     - Description: ${dish.description || 'NO DESCRIPTION'}`);
        console.log(`     - Tags: ${JSON.stringify(dish.tags || [])}`);
        console.log(`     - Price: ${dish.price || 'NO PRICE'}`);
        console.log(`     - AI Score: ${dish.aiScore || 0}`);
        
        // Validation détaillée
        const hasTitle = !!dish.title;
        const hasDescription = !!dish.description;
        const hasTags = Array.isArray(dish.tags) && dish.tags.length > 0;
        const hasPrice = !!dish.price;
        const titleLength = dish.title ? dish.title.length : 0;
        const descriptionLength = dish.description ? dish.description.length : 0;
        
        console.log(`     - Has title: ${hasTitle} (length: ${titleLength})`);
        console.log(`     - Has description: ${hasDescription} (length: ${descriptionLength})`);
        console.log(`     - Has tags: ${hasTags} (count: ${dish.tags ? dish.tags.length : 0})`);
        console.log(`     - Has price: ${hasPrice}`);
        
        // Raisons d'exclusion potentielles
        const exclusionReasons = [];
        if (!hasTitle) exclusionReasons.push('NO TITLE');
        if (!hasDescription) exclusionReasons.push('NO DESCRIPTION');
        if (!hasTags) exclusionReasons.push('NO TAGS');
        if (!hasPrice) exclusionReasons.push('NO PRICE');
        if (titleLength < 3) exclusionReasons.push('TITLE TOO SHORT');
        if (descriptionLength < 10) exclusionReasons.push('DESCRIPTION TOO SHORT');
        
        const dishValidation = {
          dishNumber: index + 1,
          title: dish.title || 'NO TITLE',
          description: dish.description || 'NO DESCRIPTION',
          tags: dish.tags || [],
          price: dish.price || 'NO PRICE',
          validation: {
            hasTitle,
            hasDescription,
            hasTags,
            hasPrice,
            titleLength,
            descriptionLength,
            tagsCount: dish.tags ? dish.tags.length : 0
          },
          exclusionReasons
        };
        
        dishValidationResults.push(dishValidation);
        
        if (exclusionReasons.length > 0) {
          console.log(`     ❌ POTENTIAL EXCLUSION REASONS: ${exclusionReasons.join(', ')}`);
          excludedDishes.push({
            dishNumber: index + 1,
            title: dish.title || 'NO TITLE',
            exclusionReasons
          });
        } else {
          console.log(`     ✅ VALID DISH - No exclusion reasons`);
        }
      });
      
      // Step 3: Filter and validate dishes (now using already analyzed dishes)
      console.log('\n�� VALIDATION AND FILTERING PROCESS:');
      console.log(`📊 Total dishes analyzed: ${allDishesWithScores.length}`);
      
      const validationProcess = [];
      const sliceExcludedDishes = [];
      
      // Filter dishes based on validation criteria
      const validDishes = allDishesWithScores.filter((dish, index) => {
        const hasTitle = !!dish.title && dish.title.length >= 2;
        const hasDescription = !!dish.description && dish.description.length >= 3;
        
        // More permissive validation: only require title and minimal description
        const isValid = hasTitle && hasDescription;
        
        console.log(`\n🔧 VALIDATING DISH ${index + 1}: "${dish.title || 'NO TITLE'}"`);
        console.log(`   - Has title (≥2 chars): ${hasTitle} (length: ${dish.title ? dish.title.length : 0})`);
        console.log(`   - Has description (≥3 chars): ${hasDescription} (length: ${dish.description ? dish.description.length : 0})`);
        console.log(`   - AI Score: ${dish.aiScore || 0}`);
        console.log(`   - Is valid: ${isValid ? '✅ YES' : '❌ NO'}`);
        
        if (!isValid) {
          const reasons = [];
          if (!hasTitle) reasons.push('NO_TITLE_OR_TOO_SHORT');
          if (!hasDescription) reasons.push('NO_DESCRIPTION_OR_TOO_SHORT');
          
          sliceExcludedDishes.push({
            dishNumber: index + 1,
            title: dish.title || 'NO TITLE',
            reason: reasons.join(', '),
            aiScore: dish.aiScore || 0
          });
        }
        
        return isValid;
      });
      
      console.log(`📊 Valid dishes after filtering: ${validDishes.length}/${allDishesWithScores.length}`);
      
      // Sort valid dishes by AI score (descending)
      console.log('\n🔄 SORTING VALID DISHES BY AI SCORE (DESCENDING)...');
      const sortedValidDishes = validDishes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      
      console.log('\n🏆 ALL VALID DISHES SORTED BY AI SCORE:');
      sortedValidDishes.forEach((dish, index) => {
        console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore || 0} - Calories: ${dish.calories || 0}`);
      });
      
      // Return ALL analyzed dishes instead of just top 3
      console.log('\n📊 RETURNING ALL ANALYZED DISHES (no slice limit)...');
      const allAnalyzedDishes = sortedValidDishes;
      
      console.log('\n🏆 ALL ANALYZED DISHES FOR DISPLAY:');
      allAnalyzedDishes.forEach((dish, index) => {
        console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore || 0} - Calories: ${dish.calories || 0}`);
      });
      
      // Log excluded dishes
      if (sliceExcludedDishes.length > 0) {
        console.log('\n❌ EXCLUDED DISHES (validation failed):');
        sliceExcludedDishes.forEach((dish, index) => {
          console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore} - EXCLUDED: ${dish.reason}`);
        });
      }
      
      // No dishes excluded by slice limit since we return all dishes
      console.log('\n✅ NO DISHES EXCLUDED BY SLICE LIMIT - returning all analyzed dishes');

      console.log('✅ Analysis completed successfully');
      
      // Préparer la réponse finale avec toutes les données de debug
      const finalResponse = {
        success: true,
        status: "success",
        recommendations: allAnalyzedDishes, // Return all dishes instead of just top 3
        extractedText: extractedText,
        debug: {
          dishValidationResults,
          excludedDishes,
          validationProcess,
          sliceExcludedDishes,
          allDishesWithScores: allDishesWithScores, // Tous les plats analysés
          sortedValidDishes: sortedValidDishes, // Plats valides triés
          allAnalyzedDishes: allAnalyzedDishes, // Tous les plats analysés (pas de limite)
          finalResults: {
            totalDishesDetected: recommendations.length,
            totalDishesAnalyzed: allDishesWithScores.length,
            totalValidDishes: validDishes.length,
            totalDishesAfterSorting: sortedValidDishes.length,
            totalDishesReturned: allAnalyzedDishes.length,
            sliceLimit: 'none', // No slice limit
            excludedByValidation: sliceExcludedDishes.length,
            excludedBySliceLimit: 0 // No dishes excluded by slice
          }
        }
      };
      
      res.json(finalResponse);

    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);
      
      // Préparer une réponse d'erreur avec les données de debug disponibles
      const errorResponse = {
        success: false,
        status: "error",
        message: "Unable to generate recommendations. Please check OpenAI API credentials.",
        extractedText: extractedText || "Text extraction failed"
      };
      
      // Ajouter les données de debug si disponibles
      errorResponse.debug = {
        error: openaiError.message
      };
      
      return res.json(errorResponse);
    }
});



// Route pour les recommandations avec OpenAI
app.post('/api/openai/recommendations', async (req, res) => {
  try {
    const { menuText, userProfile } = req.body;

    if (!menuText) {
      return res.status(400).json({ error: 'Menu text is required' });
    }

    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' });
    }

    console.log('🤖 Generating recommendations with OpenAI...');
    console.log('Menu text length:', menuText.length);

    // Construction du prompt
    const prompt = `You are a nutrition assistant. Based on the following menu and user profile, select the 3 best dishes that match their health and dietary needs.

Menu:
${menuText}

User Profile:
- Age: ${userProfile.age || 'Not provided'}
- Weight: ${userProfile.weight || 'Not provided'} kg
- Height: ${userProfile.height || 'Not provided'} cm
- Activity Level: ${userProfile.activityLevel || 'Not provided'}
- Goal: ${userProfile.goal || 'Not provided'}
- Dietary Preferences: ${userProfile.dietaryPreferences ? userProfile.dietaryPreferences.join(', ') : 'Not provided'}

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

ANALYSIS INSTRUCTIONS:
1. Look for any text that could be dish names, even if incomplete or unclear
2. Look for numbers that could be prices (€, $, £, ¥ symbols or just numbers)
3. Look for food-related words like: menu, plat, entrée, dessert, salade, viande, poisson, pasta, pizza, burger, steak, etc.
4. Even if the text is partially unclear, try to extract ANY recognizable dish information
5. If you find ANY dish-like text, create a dish entry with the best possible information

If the menu text is completely empty, contains no recognizable food words, or is completely unreadable, respond with:
{ "error": "Unable to analyze" }

Otherwise, return ALL recognizable dishes in this exact JSON format (fill with best available information):
[
  {
    "title": "Dish name (or best guess)",
    "description": "Brief description or 'Extracted from menu'",
    "tags": ["extracted", "menu"],
    "price": "price if found, otherwise null"
  }
]

IMPORTANT: Extract ALL dishes you can identify from the menu text. Do NOT limit to 3 dishes. Be very tolerant of unclear text. If you see ANY food-related content, try to extract it. Even short dish names should be included. Only return "Unable to analyze" if the text is completely empty or contains no food-related words at all.

Provide all analysis and explanations in English. Avoid French or other languages.
Output ONLY the JSON response, nothing else.`;

    // Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a nutrition assistant that provides personalized food recommendations. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Provide all analysis and explanations in English only. Keep descriptions short and concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response received from OpenAI API');
    }

    console.log('📄 Raw OpenAI response:', responseText);

    // Use safe JSON parsing
    const recommendations = safeJsonParse(responseText);
    
    // Check if parsing returned an error
    if (recommendations.status === "error") {
      return res.json({
        success: false,
        error: recommendations.message
      });
    }

    // Check if OpenAI returned an error
    if (typeof recommendations === 'object' && recommendations.error) {
      return res.json({
        success: false,
        error: "Unable to analyze menu"
      });
    }

    // Validate recommendations format
    if (!Array.isArray(recommendations)) {
      return res.json({
        success: false,
        error: "Invalid response format from AI"
      });
    }

    // Clean and validate recommendations
    const validatedRecommendations = recommendations.map((dish, index) => ({
      id: index + 1,
      title: dish.title || `Dish ${index + 1}`,
      description: dish.description || 'No description available',
      tags: Array.isArray(dish.tags) ? dish.tags : [],
      price: dish.price || null
    }));
    
    console.log('✅ Recommendations generated successfully');

    res.json({
      success: true,
      recommendations: validatedRecommendations
    });

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération des recommandations'
    });
  }
});

// Route pour analyser un plat individuel
app.post('/api/analyze-dish', async (req, res) => {
  try {
    const { dishText, userProfile } = req.body;
    
    if (!dishText) {
      return res.status(400).json({
        success: false,
        error: 'Dish text is required'
      });
    }

    console.log('🍽️ Analyzing single dish...');
    console.log('Dish text:', dishText);
    console.log('User profile:', userProfile);

    if (!openai) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI service not available'
      });
    }

    // Construction du prompt pour OpenAI
    const prompt = `Analyze this dish for a user with the following profile: ${JSON.stringify(userProfile, null, 2)}.

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

If analysis is not possible or the dish description is unclear, respond with:
{ "error": "Unable to analyze" }

Otherwise, return a JSON object with exactly these fields:

{
  "aiScore": 0-10 (float, personalized match score based on user profile & needs),
  "calories": integer (kcal),
  "macros": {
    "protein": integer (grams),
    "carbs": integer (grams), 
    "fats": integer (grams)
  },
  "shortJustification": "Maximum 2 sentences in English, focusing on nutritional data and user preferences. Use ONLY real data: calories, macros, dietary preferences, allergies, constraints. Do NOT reference activity data, workouts, or energy expenditure. Examples: 'High in protein and fully plant-based, perfectly matching your vegan preference.' or 'Balanced meal with moderate carbs and healthy fats, great for a light lunch.'",
  "longJustification": [
    "First bullet point about nutritional benefits (based on macros/calories)",
    "Second bullet point about user preference match (dietary preferences/allergies)",
    "Third bullet point about dietary constraints alignment (if applicable)"
  ]
}

IMPORTANT RULES FOR JUSTIFICATIONS:
- Write in English only
- Maximum 2 sentences for shortJustification
- Use ONLY real data: dish nutritional info (calories, macros) and user profile (dietary preferences, allergies, constraints)
- Do NOT invent or reference activity data, workouts, energy expenditure, or fitness goals
- Be impactful and concise
- Focus on what we actually know about the dish and user preferences

Dish: ${dishText}

Output ONLY the JSON response, nothing else.`;

    // Appel à OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a nutrition expert that analyzes dishes for personalized recommendations. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Be precise with nutritional values and provide meaningful justifications. Write all justifications in English only, maximum 2 sentences, using ONLY real data (nutritional info and user preferences). Do NOT invent or reference activity data, workouts, or energy expenditure. The aiScore represents a personalized match score (0-10) based on how well the dish aligns with the user's dietary profile and preferences." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response received from OpenAI API');
    }

    console.log('📄 Raw OpenAI response:', responseText);

    // Use safe JSON parsing
    const analysis = safeJsonParse(responseText);
    
    // Check if parsing returned an error
    if (analysis.status === "error") {
      throw new Error(analysis.message);
    }

    // Check if OpenAI returned an error
    if (typeof analysis === 'object' && analysis.error) {
      throw new Error("Unable to analyze dish");
    }

    // Validation des champs requis
    const requiredFields = ['aiScore', 'calories', 'macros', 'shortJustification', 'longJustification'];
    const missingFields = requiredFields.filter(field => !(field in analysis));
    if (missingFields.length > 0) {
      throw new Error(`Missing fields in analysis: ${missingFields.join(', ')}`);
    }

    // Validation des macros
    const requiredMacros = ['protein', 'carbs', 'fats'];
    const missingMacros = requiredMacros.filter(macro => !(macro in analysis.macros));
    if (missingMacros.length > 0) {
      throw new Error(`Missing macronutrients: ${missingMacros.join(', ')}`);
    }

    // Validation et nettoyage des données
    const validatedAnalysis = {
      aiScore: Math.max(0, Math.min(10, parseFloat(analysis.aiScore) || 0)),
      calories: Math.max(0, parseInt(analysis.calories) || 0),
      macros: {
        protein: Math.max(0, parseInt(analysis.macros.protein) || 0),
        carbs: Math.max(0, parseInt(analysis.macros.carbs) || 0),
        fats: Math.max(0, parseInt(analysis.macros.fats) || 0)
      },
      shortJustification: analysis.shortJustification || 'Analysis not available',
      longJustification: Array.isArray(analysis.longJustification) 
        ? analysis.longJustification.slice(0, 3) 
        : ['Detailed analysis not available']
    };

    console.log('✅ Single dish analysis completed');

    res.json({
      success: true,
      analysis: validatedAnalysis
    });

  } catch (error) {
    console.error('❌ Error analyzing single dish:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'analyse du plat'
    });
  }
});

// Route pour analyser plusieurs plats
app.post('/api/analyze-dishes', async (req, res) => {
  try {
    const { dishes, userProfile } = req.body;

    if (!dishes || !Array.isArray(dishes)) {
      return res.status(400).json({ 
        success: false,
        error: 'Dishes array is required' 
      });
    }

    if (!userProfile) {
      return res.status(400).json({ 
        success: false,
        error: 'User profile is required' 
      });
    }

    console.log('🍽️ Analyzing multiple dishes...');
    console.log('Number of dishes:', dishes.length);

    // Analyser tous les plats en parallèle
    const analysisPromises = dishes.map(async (dish, index) => {
      try {
        const dishText = `${dish.title || dish.name}: ${dish.description || ''}`;
        
        // Construction du prompt pour OpenAI
        const prompt = `Analyze this dish for a user with the following profile: ${JSON.stringify(userProfile, null, 2)}.

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

If analysis is not possible or the dish description is unclear, respond with:
{ "error": "Unable to analyze" }

Otherwise, return a JSON object with exactly these fields:

{
  "aiScore": 0-10 (float, personalized match score based on user profile & needs),
  "calories": integer (kcal),
  "macros": {
    "protein": integer (grams),
    "carbs": integer (grams), 
    "fats": integer (grams)
  },
  "shortJustification": "Maximum 2 sentences in English, focusing on nutritional data and user preferences. Use ONLY real data: calories, macros, dietary preferences, allergies, constraints. Do NOT reference activity data, workouts, or energy expenditure. Examples: 'High in protein and fully plant-based, perfectly matching your vegan preference.' or 'Balanced meal with moderate carbs and healthy fats, great for a light lunch.'",
  "longJustification": [
    "First bullet point about nutritional benefits (based on macros/calories)",
    "Second bullet point about user preference match (dietary preferences/allergies)",
    "Third bullet point about dietary constraints alignment (if applicable)"
  ]
}

IMPORTANT RULES FOR JUSTIFICATIONS:
- Write in English only
- Maximum 2 sentences for shortJustification
- Use ONLY real data: dish nutritional info (calories, macros) and user profile (dietary preferences, allergies, constraints)
- Do NOT invent or reference activity data, workouts, energy expenditure, or fitness goals
- Be impactful and concise
- Focus on what we actually know about the dish and user preferences

Dish: ${dishText}

Output ONLY the JSON response, nothing else.`;

        // Appel à OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "You are a nutrition expert that analyzes dishes for personalized recommendations. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Be precise with nutritional values and provide meaningful justifications. Write all justifications in English only, maximum 2 sentences, using ONLY real data (nutritional info and user preferences). Do NOT invent or reference activity data, workouts, or energy expenditure. The aiScore represents a personalized match score (0-10) based on how well the dish aligns with the user's dietary profile and preferences." 
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        });

        const responseText = completion.choices[0]?.message?.content;
        
        if (!responseText) {
          throw new Error('No response received from OpenAI API');
        }

        // Use safe JSON parsing
        const analysis = safeJsonParse(responseText);
        
        // Check if parsing returned an error
        if (analysis.status === "error") {
          throw new Error(analysis.message);
        }

        // Check if OpenAI returned an error
        if (typeof analysis === 'object' && analysis.error) {
          throw new Error("Unable to analyze dish");
        }

        // Validation des champs requis
        const requiredFields = ['aiScore', 'calories', 'macros', 'shortJustification', 'longJustification'];
        const missingFields = requiredFields.filter(field => !(field in analysis));
        if (missingFields.length > 0) {
          throw new Error(`Missing fields in analysis: ${missingFields.join(', ')}`);
        }

        // Validation des macros
        const requiredMacros = ['protein', 'carbs', 'fats'];
        const missingMacros = requiredMacros.filter(macro => !(macro in analysis.macros));
        if (missingMacros.length > 0) {
          throw new Error(`Missing macronutrients: ${missingMacros.join(', ')}`);
        }

        // Validation et nettoyage des données
        const validatedAnalysis = {
          aiScore: Math.max(0, Math.min(10, parseFloat(analysis.aiScore) || 0)),
          calories: Math.max(0, parseInt(analysis.calories) || 0),
          macros: {
            protein: Math.max(0, parseInt(analysis.macros.protein) || 0),
            carbs: Math.max(0, parseInt(analysis.macros.carbs) || 0),
            fats: Math.max(0, parseInt(analysis.macros.fats) || 0)
          },
          shortJustification: analysis.shortJustification || 'Analysis not available',
          longJustification: Array.isArray(analysis.longJustification) 
            ? analysis.longJustification.slice(0, 3) 
            : ['Detailed analysis not available']
        };

        return {
          ...dish,
          ...validatedAnalysis,
          protein: validatedAnalysis.macros.protein,
          carbs: validatedAnalysis.macros.carbs,
          fats: validatedAnalysis.macros.fats
        };
      } catch (error) {
        console.error(`Error analyzing dish ${index}:`, error);
        return {
          ...dish,
          aiScore: 5.0,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          shortJustification: 'Analysis not available',
          longJustification: ['Analysis not available']
        };
      }
    });

    const analyses = await Promise.all(analysisPromises);
    
    console.log('✅ Multiple dish analysis completed');

    res.json({
      success: true,
      analyses: analyses
    });

  } catch (error) {
    console.error('❌ Error analyzing multiple dishes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'analyse des plats'
    });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📸 Vision API: http://localhost:${PORT}/api/vision/extract-text`);
  console.log(`🤖 OpenAI API: http://localhost:${PORT}/api/openai/recommendations`);
  console.log(`🔄 Analyze Image: http://localhost:${PORT}/analyze-image`);
  console.log(`🍽️ Dish Analysis: http://localhost:${PORT}/api/analyze-dish`);
  console.log(`🍽️ Multiple Dishes: http://localhost:${PORT}/api/analyze-dishes`);
}); 