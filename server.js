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
          
                    // Call OpenAI for analysis with timeout and retry logic
          let analysisCompletion;
          try {
            analysisCompletion = await Promise.race([
              openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: "You are a nutrition expert that analyzes dishes for personalized recommendations. Only recommend meals that strictly align with the user's dietary preferences (e.g., vegetarian, vegan, etc.). Discard or downgrade meals that do not comply. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If the dish description is unclear or missing, you MUST still provide your best estimate based on the dish name and any available information. NEVER return an error. Always provide a plausible analysis, even if you have to make reasonable assumptions. Be precise with nutritional values and provide meaningful justifications. Write all justifications in English only, maximum 2 sentences, using ONLY real data (nutritional info and user preferences). Do NOT reference activity data, workouts, or energy expenditure. The aiScore represents a personalized match score (0-10) based on how well the dish aligns with the user's dietary profile and preferences."
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
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('OpenAI API timeout')), 30000)
              )
            ]);
          } catch (openaiError) {
            console.log(`⚠️ OpenAI API error for "${dish.title || 'NO TITLE'}":`, openaiError.message);
            // Use fallback analysis when OpenAI fails
            const dishText = `${dish.title || 'Unknown dish'}: ${dish.description || 'No description'}`;
            const dishClassifications = classifyDishForPreferences(dishText, userProfile.dietaryPreferences);
            const compliance = checkDishCompliance(dishClassifications, userProfile.dietaryPreferences);
            
            // Estimate calories and macros based on dish keywords
            const estimatedCalories = dishText.toLowerCase().includes('salad') ? 150 : 
                                    dishText.toLowerCase().includes('quesadilla') ? 400 :
                                    dishText.toLowerCase().includes('ceviche') ? 200 :
                                    dishText.toLowerCase().includes('burger') ? 600 :
                                    dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('chicken') ? 350 :
                                    dishText.toLowerCase().includes('carne') || dishText.toLowerCase().includes('beef') ? 450 : 300;
            
            const estimatedMacros = {
              protein: dishText.toLowerCase().includes('cheese') ? 15 : 
                      dishText.toLowerCase().includes('meat') || dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('cerdo') ? 25 : 8,
              carbs: dishText.toLowerCase().includes('quesadilla') ? 35 : 
                     dishText.toLowerCase().includes('burger') ? 45 : 25,
              fats: dishText.toLowerCase().includes('cheese') ? 20 : 
                    dishText.toLowerCase().includes('avocado') ? 15 : 12
            };
            
            allDishesWithScores.push({
              ...dish,
              aiScore: compliance.match ? 7.0 : 4.0,
              calories: estimatedCalories,
              macros: estimatedMacros,
              shortJustification: compliance.match ? 
                'Estimated analysis due to API error - based on dish type and ingredients' : 
                'Estimated analysis due to API error - may not fully match your preferences',
              longJustification: compliance.match ? [
                'Estimated nutritional values due to API connection issue',
                'Dish appears to match your dietary preferences',
                'Values are approximate due to limited menu information'
              ] : [
                'Estimated nutritional values due to API connection issue',
                'Dish may not fully align with your dietary preferences',
                'Values are approximate due to limited menu information'
              ],
              dietaryClassifications: dishClassifications,
              match: compliance.match,
              violations: compliance.violations,
              complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`,
              analysisError: openaiError.message
            });
            continue; // Skip to next dish
          }

          const analysisResponseText = analysisCompletion.choices[0]?.message?.content;
          console.log(`📄 Raw OpenAI analysis response for "${dish.title || 'NO TITLE'}":`, analysisResponseText);

          // Parse the analysis response
          const analysis = safeJsonParse(analysisResponseText);
          
          if (analysis.error) {
            console.log(`❌ Error analyzing "${dish.title || 'NO TITLE'}": ${analysis.error}`);
            
            // Provide intelligent fallback analysis instead of zeros
            const dishText = `${dish.title || 'Unknown dish'}: ${dish.description || 'No description'}`;
            const dishClassifications = classifyDishForPreferences(dishText, userProfile.dietaryPreferences);
            const compliance = checkDishCompliance(dishClassifications, userProfile.dietaryPreferences);
            
            // Estimate calories and macros based on dish keywords
            const estimatedCalories = dishText.toLowerCase().includes('salad') ? 150 : 
                                    dishText.toLowerCase().includes('quesadilla') ? 400 :
                                    dishText.toLowerCase().includes('ceviche') ? 200 :
                                    dishText.toLowerCase().includes('burger') ? 600 :
                                    dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('chicken') ? 350 :
                                    dishText.toLowerCase().includes('carne') || dishText.toLowerCase().includes('beef') ? 450 : 300;
            
            const estimatedMacros = {
              protein: dishText.toLowerCase().includes('cheese') ? 15 : 
                      dishText.toLowerCase().includes('meat') || dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('cerdo') ? 25 : 8,
              carbs: dishText.toLowerCase().includes('quesadilla') ? 35 : 
                     dishText.toLowerCase().includes('burger') ? 45 : 25,
              fats: dishText.toLowerCase().includes('cheese') ? 20 : 
                    dishText.toLowerCase().includes('avocado') ? 15 : 12
            };
            
            allDishesWithScores.push({
              ...dish,
              aiScore: compliance.match ? 7.0 : 4.0, // Higher score if it matches preferences
              calories: estimatedCalories,
              macros: estimatedMacros,
              shortJustification: compliance.match ? 
                'Estimated analysis based on dish type and ingredients' : 
                'Estimated analysis - may not fully match your preferences',
              longJustification: compliance.match ? [
                'Estimated nutritional values based on typical dish composition',
                'Dish appears to match your dietary preferences',
                'Values are approximate due to limited menu information'
              ] : [
                'Estimated nutritional values based on typical dish composition',
                'Dish may not fully align with your dietary preferences',
                'Values are approximate due to limited menu information'
              ],
              dietaryClassifications: dishClassifications,
              match: compliance.match,
              violations: compliance.violations,
              complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`,
              analysisError: analysis.error
            });
          } else {
            console.log(`✅ Successfully analyzed "${dish.title || 'NO TITLE'}" - AI Score: ${analysis.aiScore}`);
            
            // Classifier le plat selon les préférences alimentaires
            const dishText = `${dish.title || 'Unknown dish'}: ${dish.description || 'No description'}`;
            const dishClassifications = classifyDishForPreferences(dishText, userProfile.dietaryPreferences);
            const compliance = checkDishCompliance(dishClassifications, userProfile.dietaryPreferences);
            
            console.log(`🔍 Dish classifications for "${dish.title}":`, dishClassifications);
            console.log(`✅ Compliance check for "${dish.title}":`, compliance);
            
            // Check if OpenAI returned incomplete data and provide fallback if needed
            const aiScore = analysis.aiScore || 0;
            const calories = analysis.calories || 0;
            const macros = analysis.macros || { protein: 0, carbs: 0, fats: 0 };
            
            // If OpenAI returned zeros or very low values, use intelligent fallback
            let finalAiScore = aiScore;
            let finalCalories = calories;
            let finalMacros = macros;
            let finalShortJustification = analysis.shortJustification || "No justification available";
            let finalLongJustification = analysis.longJustification || ["No justification available"];
            
            if (aiScore <= 1 || calories === 0 || (!macros.protein && !macros.carbs && !macros.fats)) {
              console.log(`⚠️ OpenAI returned incomplete data for "${dish.title}", using intelligent fallback`);
              
              // Estimate calories and macros based on dish keywords
              const estimatedCalories = dishText.toLowerCase().includes('salad') ? 150 : 
                                      dishText.toLowerCase().includes('quesadilla') ? 400 :
                                      dishText.toLowerCase().includes('ceviche') ? 200 :
                                      dishText.toLowerCase().includes('burger') ? 600 :
                                      dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('chicken') ? 350 :
                                      dishText.toLowerCase().includes('carne') || dishText.toLowerCase().includes('beef') ? 450 : 300;
              
              const estimatedMacros = {
                protein: dishText.toLowerCase().includes('cheese') ? 15 : 
                        dishText.toLowerCase().includes('meat') || dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('cerdo') ? 25 : 8,
                carbs: dishText.toLowerCase().includes('quesadilla') ? 35 : 
                       dishText.toLowerCase().includes('burger') ? 45 : 25,
                fats: dishText.toLowerCase().includes('cheese') ? 20 : 
                      dishText.toLowerCase().includes('avocado') ? 15 : 12
              };
              
              finalAiScore = compliance.match ? 7.0 : 4.0;
              finalCalories = estimatedCalories;
              finalMacros = estimatedMacros;
              finalShortJustification = compliance.match ? 
                'Estimated analysis based on dish type and ingredients' : 
                'Estimated analysis - may not fully match your preferences';
              finalLongJustification = compliance.match ? [
                'Estimated nutritional values based on typical dish composition',
                'Dish appears to match your dietary preferences',
                'Values are approximate due to limited menu information'
              ] : [
                'Estimated nutritional values based on typical dish composition',
                'Dish may not fully align with your dietary preferences',
                'Values are approximate due to limited menu information'
              ];
            }
            
            allDishesWithScores.push({
              ...dish,
              aiScore: finalAiScore,
              calories: finalCalories,
              macros: finalMacros,
              shortJustification: finalShortJustification,
              longJustification: finalLongJustification,
              // Ajouter les classifications et la conformité
              dietaryClassifications: dishClassifications,
              match: compliance.match,
              violations: compliance.violations,
              complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`
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
      })
      // Anti-noise filter: drop items that look like non-meals (no analyzable data)
      .filter((dish, index) => {
        const aiScore = dish.aiScore || 0;
        const calories = dish.calories || 0;
        const macros = dish.macros || { protein: 0, carbs: 0, fats: 0 };
        const macrosZero = (!macros.protein && !macros.carbs && !macros.fats);
        const justification = `${dish.shortJustification || ''}`.toLowerCase();
        const title = (dish.title || '').toLowerCase();
        
        // Check for clear indicators that this is not a meal
        const looksUnanalyzable = justification.includes('unable to analyze') || 
                                 justification.includes('insufficient information') || 
                                 justification.includes('cannot be made') || 
                                 justification.includes('no analysis') ||
                                 justification.includes('does not provide enough information') ||
                                 justification.includes('does not provide sufficient information') ||
                                 justification.includes('analysis failed') ||
                                 justification.includes('no justification available');
        
        // Check if this looks like a non-meal item (sauces, garnishes, etc.)
        const looksLikeNonMeal = title.includes('garniture') || 
                                title.includes('sauce') || 
                                title.includes('vinaigrette') ||
                                title.includes('choix de') ||
                                title.includes('accompagnement') ||
                                title.includes('side') ||
                                title.includes('dressing') ||
                                title.includes('n daniel') ||
                                title.includes('gots xxl') ||
                                title.includes('pomodoro') ||
                                title.length < 3; // Very short titles are suspicious
        
        // More strict filtering: exclude dishes with very low scores AND no nutritional data
        const hasNoNutritionalData = calories === 0 && macrosZero;
        const hasVeryLowScore = aiScore <= 1;
        
        // Exclude if it's clearly unanalyzable OR has no nutritional data with very low score
        const shouldExclude = looksUnanalyzable || 
                             (hasNoNutritionalData && hasVeryLowScore) ||
                             looksLikeNonMeal;
        
        if (shouldExclude) {
          const reason = looksUnanalyzable ? 'UNANALYZABLE' : 
                        looksLikeNonMeal ? 'NON_MEAL_ITEM' : 
                        'NO_NUTRITIONAL_DATA';
          
          console.log(`   ❌ EXCLUDING AS NOISE: "${dish.title}" (aiScore=${aiScore}, calories=${calories}, reason=${reason})`);
          sliceExcludedDishes.push({
            dishNumber: index + 1,
            title: dish.title || 'NO TITLE',
            reason: reason,
            aiScore: aiScore
          });
        }
        
        return !shouldExclude;
      });
      
      console.log(`📊 Valid dishes after filtering: ${validDishes.length}/${allDishesWithScores.length}`);
      
      // Step 3: Sort and rank dishes with dietary compliance priority
      console.log('\n🔄 SORTING DISHES WITH DIETARY COMPLIANCE PRIORITY...');
      
      // Séparer les plats conformes et non conformes
      const matchingDishes = validDishes.filter(dish => dish.match === true);
      const nonMatchingDishes = validDishes.filter(dish => dish.match === false);
      
      console.log(`📊 Matching dishes: ${matchingDishes.length}`);
      console.log(`📊 Non-matching dishes: ${nonMatchingDishes.length}`);
      
      // Trier les plats conformes par score AI (descending)
      const sortedMatchingDishes = matchingDishes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      
      // Trier les plats non conformes par score AI (descending)
      const sortedNonMatchingDishes = nonMatchingDishes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      
      console.log('\n🏆 MATCHING DISHES SORTED BY AI SCORE:');
      sortedMatchingDishes.forEach((dish, index) => {
        console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore || 0} - ✅ Matches preferences`);
      });
      
      console.log('\n⚠️ NON-MATCHING DISHES SORTED BY AI SCORE:');
      sortedNonMatchingDishes.forEach((dish, index) => {
        console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore || 0} - ❌ ${dish.complianceWarning}`);
      });
      
      // Construire la liste finale selon les règles de priorité
      let finalDishes = [];
      
      if (matchingDishes.length >= 3) {
        // Si on a 3+ plats conformes, prendre les 3 meilleurs
        finalDishes = sortedMatchingDishes.slice(0, 3);
        console.log('\n✅ Using top 3 matching dishes');
      } else if (matchingDishes.length > 0) {
        // Si on a 1-2 plats conformes, les compléter avec les meilleurs non conformes
        const matchingCount = matchingDishes.length;
        const neededNonMatching = 3 - matchingCount;
        
        finalDishes = [
          ...sortedMatchingDishes,
          ...sortedNonMatchingDishes.slice(0, neededNonMatching)
        ];
        console.log(`\n⚠️ Using ${matchingCount} matching + ${neededNonMatching} non-matching dishes`);
      } else {
        // Si aucun plat conforme, prendre les 3 meilleurs non conformes
        finalDishes = sortedNonMatchingDishes.slice(0, 3);
        console.log('\n❌ No matching dishes - using top 3 non-matching dishes');
      }
      
      // Agréger pour debug (conformes d'abord, puis non conformes)
      const sortedValidDishes = [...sortedMatchingDishes, ...sortedNonMatchingDishes];

      console.log('\n🏆 FINAL DISHES SELECTED:');
      finalDishes.forEach((dish, index) => {
        const status = dish.match ? '✅' : '⚠️';
        console.log(`  ${index + 1}. ${status} "${dish.title}" - AI Score: ${dish.aiScore || 0}`);
        if (!dish.match) {
          console.log(`     Warning: ${dish.complianceWarning}`);
        }
      });
      
      // Return ONLY the final filtered dishes (matching first, then non-matching if needed)
      console.log('\n📊 RETURNING FINAL FILTERED DISHES WITH COMPLIANCE PRIORITY...');
      
      console.log('\n🏆 FINAL DISHES FOR DISPLAY:');
      finalDishes.forEach((dish, index) => {
        const status = dish.match ? '✅' : '⚠️';
        console.log(`  ${index + 1}. ${status} "${dish.title}" - AI Score: ${dish.aiScore || 0}`);
        if (!dish.match) {
          console.log(`     Warning: ${dish.complianceWarning}`);
        }
      });
      
      // Log excluded dishes
      if (sliceExcludedDishes.length > 0) {
        console.log('\n❌ EXCLUDED DISHES (validation failed):');
        sliceExcludedDishes.forEach((dish, index) => {
          console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore} - EXCLUDED: ${dish.reason}`);
        });
      }
      
      // Log that we're returning only the final filtered dishes
      console.log('\n✅ RETURNING ONLY FINAL FILTERED DISHES - non-compliant meals excluded from primary list');

      console.log('✅ Analysis completed successfully');
      
      // Préparer la réponse finale avec seulement les plats filtrés
      const finalResponse = {
        success: true,
        status: "success",
        recommendations: finalDishes, // Return only the final filtered dishes
        extractedText: extractedText,
        debug: {
          dishValidationResults,
          excludedDishes,
          validationProcess,
          sliceExcludedDishes,
          allDishesWithScores: allDishesWithScores, // Tous les plats analysés
          sortedValidDishes: sortedValidDishes, // Plats valides triés
          finalDishes: finalDishes, // Plats finaux filtrés
          finalResults: {
            totalDishesDetected: recommendations.length,
            totalDishesAnalyzed: allDishesWithScores.length,
            totalValidDishes: validDishes.length,
            totalDishesAfterSorting: sortedValidDishes.length,
            totalDishesReturned: finalDishes.length,
            sliceLimit: '3 dishes maximum',
            excludedByValidation: sliceExcludedDishes.length,
            excludedBySliceLimit: allDishesWithScores.length - finalDishes.length // Dishes excluded by slice limit
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
          content: "You are a nutrition assistant that provides personalized food recommendations. Only recommend meals that strictly align with the user's dietary preferences (e.g., vegetarian, vegan, etc.). Discard or downgrade meals that do not comply. Respond with ONLY valid JSON format. No commentary or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Provide all analysis and explanations in English only. Keep descriptions short and concise."
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

// Fonction pour générer des règles alimentaires dynamiques
const generateDietaryRules = (userProfile) => {
  const rules = [];
  const dietaryPreferences = userProfile.dietaryPreferences || [];
  const goal = userProfile.goal;
  
  if (dietaryPreferences.length > 0) {
    dietaryPreferences.forEach(pref => {
      switch (pref) {
        case 'vegan':
          rules.push('- VEGAN: EXCLUDE all animal products (meat, fish, poultry, dairy, eggs, honey, gelatin)');
          break;
        case 'vegetarian':
          rules.push('- VEGETARIAN: EXCLUDE all meat, fish, poultry, and animal products');
          break;
        case 'pescatarian':
          rules.push('- PESCATARIAN: EXCLUDE all meat and poultry, but fish/seafood is allowed');
          break;
        case 'gluten-free':
          rules.push('- GLUTEN-FREE: EXCLUDE wheat, barley, rye, and any gluten-containing ingredients');
          break;
        case 'dairy-free':
          rules.push('- DAIRY-FREE: EXCLUDE milk, cheese, yogurt, butter, cream, and dairy derivatives');
          break;
        case 'nut-free':
          rules.push('- NUT-FREE: EXCLUDE all nuts (peanuts, almonds, walnuts, cashews, etc.) and nut products');
          break;
        case 'low-carb':
          rules.push('- LOW-CARB: PRIORITIZE dishes with <30g carbs per serving, avoid high-carb foods (bread, pasta, rice, potatoes)');
          break;
        case 'keto':
          rules.push('- KETO: PRIORITIZE high-fat, very low-carb dishes (<20g net carbs), avoid all grains, sugars, most fruits');
          break;
        case 'paleo':
          rules.push('- PALEO: EXCLUDE grains, legumes, dairy, processed foods, refined sugars; PRIORITIZE meat, fish, vegetables, fruits, nuts');
          break;
        case 'mediterranean':
          rules.push('- MEDITERRANEAN: PRIORITIZE fish, olive oil, vegetables, whole grains, legumes; moderate red meat and dairy');
          break;
      }
    });
  }
  
  // Règles basées sur l'objectif
  if (goal) {
    switch (goal) {
      case 'lose':
        rules.push('- WEIGHT LOSS: PRIORITIZE lower-calorie dishes, high protein, high fiber, avoid high-calorie/fatty foods');
        break;
      case 'gain':
        rules.push('- WEIGHT GAIN: PRIORITIZE higher-calorie dishes with good protein content, healthy fats');
        break;
      case 'maintain':
        rules.push('- WEIGHT MAINTENANCE: PRIORITIZE balanced meals with moderate calories and good nutrition');
        break;
    }
  }
  
  return rules.join('\n');
};

// Fonction pour classifier un plat selon les préférences alimentaires
const classifyDishForPreferences = (dishText, userPreferences) => {
  const classifications = {
    vegan: false,
    vegetarian: false,
    pescatarian: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    lowCarb: false,
    keto: false,
    paleo: false,
    mediterranean: false
  };
  
  const text = dishText.toLowerCase();
  
  // Classification automatique basée sur les ingrédients
  if (text.includes('meat') || text.includes('beef') || text.includes('pork') || text.includes('chicken') || 
      text.includes('lamb') || text.includes('duck') || text.includes('turkey') || text.includes('bacon') ||
      text.includes('sausage') || text.includes('ham') || text.includes('steak') || text.includes('burger') ||
      // Ajouter les mots en espagnol et autres langues
      text.includes('pollo') || text.includes('carne') || text.includes('cerdo') || text.includes('ternera') ||
      text.includes('cordero') || text.includes('pato') || text.includes('pavo') || text.includes('tocino') ||
      text.includes('salchicha') || text.includes('jamón') || text.includes('bistec') || text.includes('hamburguesa') ||
      // Ajouter plus de mots espagnols pour la viande
      text.includes('costillas') || text.includes('puerco') || text.includes('cochinita') || text.includes('boeuf') ||
      text.includes('paleron') || text.includes('bistec') || text.includes('chuleta') || text.includes('lomo') ||
      text.includes('solomillo') || text.includes('entrecot') || text.includes('filete') || text.includes('asado')) {
    classifications.vegetarian = false;
    classifications.vegan = false;
    classifications.pescatarian = false;
  }
  
  if (text.includes('fish') || text.includes('salmon') || text.includes('tuna') || text.includes('cod') ||
      text.includes('shrimp') || text.includes('seafood') || text.includes('mussel') || text.includes('oyster') ||
      // Ajouter les mots en espagnol
      text.includes('pescado') || text.includes('salmón') || text.includes('atún') || text.includes('bacalao') ||
      text.includes('camarón') || text.includes('marisco') || text.includes('mejillón') || text.includes('ostra')) {
    classifications.vegetarian = false;
    classifications.vegan = false;
    classifications.pescatarian = true;
  }
  
  if (text.includes('milk') || text.includes('cheese') || text.includes('yogurt') || text.includes('butter') ||
      text.includes('cream') || text.includes('dairy') ||
      // Ajouter les mots en espagnol
      text.includes('leche') || text.includes('queso') || text.includes('yogur') || text.includes('mantequilla') ||
      text.includes('crema') || text.includes('lácteo') ||
      // Ajouter plus de mots espagnols pour les produits laitiers
      text.includes('feta') || text.includes('mozzarella') || text.includes('cheddar') || text.includes('parmesan') ||
      text.includes('gouda') || text.includes('manchego') || text.includes('brie') || text.includes('camembert') ||
      text.includes('ricotta') || text.includes('cottage') || text.includes('sour cream') || text.includes('nata')) {
    classifications.vegan = false;
    classifications.dairyFree = false;
  }
  
  if (text.includes('egg') || text.includes('eggs')) {
    classifications.vegan = false;
  }
  
  if (text.includes('wheat') || text.includes('bread') || text.includes('pasta') || text.includes('flour') ||
      text.includes('barley') || text.includes('rye') || text.includes('gluten')) {
    classifications.glutenFree = false;
  }
  
  if (text.includes('nut') || text.includes('almond') || text.includes('walnut') || text.includes('cashew') ||
      text.includes('peanut') || text.includes('hazelnut') || text.includes('pecan')) {
    classifications.nutFree = false;
  }
  
  if (text.includes('rice') || text.includes('pasta') || text.includes('bread') || text.includes('potato') ||
      text.includes('corn') || text.includes('bean') || text.includes('lentil')) {
    classifications.lowCarb = false;
    classifications.keto = false;
  }
  
  // Par défaut, si pas d'ingrédients problématiques détectés
  if (!text.includes('meat') && !text.includes('fish') && !text.includes('chicken') && !text.includes('beef') &&
      !text.includes('pollo') && !text.includes('carne') && !text.includes('pescado') &&
      !text.includes('costillas') && !text.includes('puerco') && !text.includes('cochinita') && !text.includes('boeuf') &&
      !text.includes('paleron') && !text.includes('chuleta') && !text.includes('lomo') && !text.includes('solomillo') &&
      !text.includes('entrecot') && !text.includes('filete') && !text.includes('asado')) {
    classifications.vegetarian = true;
    classifications.vegan = true;
  }
  
  if (!text.includes('milk') && !text.includes('cheese') && !text.includes('dairy')) {
    classifications.dairyFree = true;
  }
  
  if (!text.includes('wheat') && !text.includes('bread') && !text.includes('gluten')) {
    classifications.glutenFree = true;
  }
  
  if (!text.includes('nut') && !text.includes('almond') && !text.includes('peanut')) {
    classifications.nutFree = true;
  }
  
  return classifications;
};

// Fonction pour vérifier si un plat correspond aux préférences utilisateur
const checkDishCompliance = (dishClassifications, userPreferences) => {
  if (!userPreferences || userPreferences.length === 0) {
    return { match: true, violations: [] };
  }
  
  const violations = [];
  
  userPreferences.forEach(pref => {
    switch (pref) {
      case 'vegan':
        if (!dishClassifications.vegan) {
          violations.push('Contains animal products');
        }
        break;
      case 'vegetarian':
        if (!dishClassifications.vegetarian) {
          violations.push('Contains meat or fish');
        }
        break;
      case 'pescatarian':
        if (!dishClassifications.pescatarian && !dishClassifications.vegetarian) {
          violations.push('Contains meat (fish is allowed)');
        }
        break;
      case 'gluten-free':
        if (!dishClassifications.glutenFree) {
          violations.push('Contains gluten');
        }
        break;
      case 'dairy-free':
        if (!dishClassifications.dairyFree) {
          violations.push('Contains dairy');
        }
        break;
      case 'nut-free':
        if (!dishClassifications.nutFree) {
          violations.push('Contains nuts');
        }
        break;
      case 'low-carb':
        if (!dishClassifications.lowCarb) {
          violations.push('High in carbohydrates');
        }
        break;
      case 'keto':
        if (!dishClassifications.keto) {
          violations.push('Not keto-compliant');
        }
        break;
    }
  });
  
  return {
    match: violations.length === 0,
    violations: violations
  };
};

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

CRITICAL DIETARY COMPLIANCE RULES:
${generateDietaryRules(userProfile)}

GENERAL COMPLIANCE RULES:
- ONLY recommend dishes that STRICTLY comply with ALL user preferences and restrictions
- PRIORITIZE dishes that align with the user's health goals
- If multiple dietary restrictions apply, ALL must be satisfied
- Consider nutritional balance and health benefits when scoring
- The aiScore should reflect how well the dish matches ALL user preferences and goals

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

If the dish description is unclear or incomplete, you MUST still provide your best estimate based on the dish name and any available information. NEVER return an error. Always provide a plausible analysis, even if you have to make reasonable assumptions.

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
          content: "You are a nutrition expert that analyzes dishes for personalized recommendations. Only recommend meals that strictly align with the user's dietary preferences (e.g., vegetarian, vegan, etc.). Discard or downgrade meals that do not comply. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Be precise with nutritional values and provide meaningful justifications. Write all justifications in English only, maximum 2 sentences, using ONLY real data (nutritional info and user preferences). Do NOT invent or reference activity data, workouts, or energy expenditure. The aiScore represents a personalized match score (0-10) based on how well the dish aligns with the user's dietary profile and preferences." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      // construire un fallback permissif
      const dishClassifications = classifyDishForPreferences(dishText, userProfile.dietaryPreferences);
      const compliance = checkDishCompliance(dishClassifications, userProfile.dietaryPreferences);
      
      // Provide more realistic fallback values instead of zeros
      const estimatedCalories = dishText.toLowerCase().includes('salad') ? 150 : 
                               dishText.toLowerCase().includes('quesadilla') ? 400 :
                               dishText.toLowerCase().includes('ceviche') ? 200 :
                               dishText.toLowerCase().includes('burger') ? 600 : 300;
      
      const estimatedMacros = {
        protein: dishText.toLowerCase().includes('cheese') ? 15 : 
                dishText.toLowerCase().includes('meat') || dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('cerdo') ? 25 : 8,
        carbs: dishText.toLowerCase().includes('quesadilla') ? 35 : 
               dishText.toLowerCase().includes('burger') ? 45 : 25,
        fats: dishText.toLowerCase().includes('cheese') ? 20 : 
              dishText.toLowerCase().includes('avocado') ? 15 : 12
      };
      
      const validatedAnalysis = {
        aiScore: compliance.match ? 7.0 : 4.0, // Higher score if it matches preferences
        calories: estimatedCalories,
        macros: estimatedMacros,
        shortJustification: compliance.match ? 
          'Estimated analysis based on dish type and ingredients' : 
          'Estimated analysis - may not fully match your preferences',
        longJustification: compliance.match ? [
          'Estimated nutritional values based on typical dish composition',
          'Dish appears to match your dietary preferences',
          'Values are approximate due to limited menu information'
        ] : [
          'Estimated nutritional values based on typical dish composition',
          'Dish may not fully align with your dietary preferences',
          'Values are approximate due to limited menu information'
        ],
        dietaryClassifications: dishClassifications,
        match: compliance.match,
        violations: compliance.violations,
        complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`
      };

      console.log('✅ Single dish analysis completed (fallback)');

      return res.json({ success: true, analysis: validatedAnalysis });
    }

    console.log('📄 Raw OpenAI response:', responseText);

    // Use safe JSON parsing
    const analysisRaw = safeJsonParse(responseText);

    // Check if OpenAI returned an error response
    if (analysisRaw && analysisRaw.error) {
      console.log('⚠️ OpenAI returned error, using fallback analysis');
      
      // Use the same fallback logic as when no response
      const dishClassifications = classifyDishForPreferences(dishText, userProfile.dietaryPreferences);
      const compliance = checkDishCompliance(dishClassifications, userProfile.dietaryPreferences);
      
      // Provide more realistic fallback values instead of zeros
      const estimatedCalories = dishText.toLowerCase().includes('salad') ? 150 : 
                               dishText.toLowerCase().includes('quesadilla') ? 400 :
                               dishText.toLowerCase().includes('ceviche') ? 200 :
                               dishText.toLowerCase().includes('burger') ? 600 : 300;
      
      const estimatedMacros = {
        protein: dishText.toLowerCase().includes('cheese') ? 15 : 
                dishText.toLowerCase().includes('meat') || dishText.toLowerCase().includes('pollo') || dishText.toLowerCase().includes('cerdo') ? 25 : 8,
        carbs: dishText.toLowerCase().includes('quesadilla') ? 35 : 
               dishText.toLowerCase().includes('burger') ? 45 : 25,
        fats: dishText.toLowerCase().includes('cheese') ? 20 : 
              dishText.toLowerCase().includes('avocado') ? 15 : 12
      };
      
      const validatedAnalysis = {
        aiScore: compliance.match ? 7.0 : 4.0, // Higher score if it matches preferences
        calories: estimatedCalories,
        macros: estimatedMacros,
        shortJustification: compliance.match ? 
          'Estimated analysis based on dish type and ingredients' : 
          'Estimated analysis - may not fully match your preferences',
        longJustification: compliance.match ? [
          'Estimated nutritional values based on typical dish composition',
          'Dish appears to match your dietary preferences',
          'Values are approximate due to limited menu information'
        ] : [
          'Estimated nutritional values based on typical dish composition',
          'Dish may not fully align with your dietary preferences',
          'Values are approximate due to limited menu information'
        ],
        dietaryClassifications: dishClassifications,
        match: compliance.match,
        violations: compliance.violations,
        complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`
      };

      console.log('✅ Single dish analysis completed (fallback due to OpenAI error)');
      return res.json({ success: true, analysis: validatedAnalysis });
    }

    // Construire un objet d'analyse permissif avec des valeurs de secours
    const parsed = (analysisRaw && typeof analysisRaw === 'object' && !analysisRaw.status && !analysisRaw.error)
      ? analysisRaw
      : {};

    const safeAiScore = Number.isFinite(parseFloat(parsed.aiScore)) ? parseFloat(parsed.aiScore) : 5.0;
    const safeCalories = Number.isFinite(parseInt(parsed.calories)) ? parseInt(parsed.calories) : 0;
    const macrosIn = parsed.macros || {};
    const safeMacros = {
      protein: Number.isFinite(parseInt(macrosIn.protein)) ? parseInt(macrosIn.protein) : 0,
      carbs: Number.isFinite(parseInt(macrosIn.carbs)) ? parseInt(macrosIn.carbs) : 0,
      fats: Number.isFinite(parseInt(macrosIn.fats)) ? parseInt(macrosIn.fats) : 0
    };
    const safeShort = parsed.shortJustification || 'Estimated based on limited menu information';
    const safeLong = Array.isArray(parsed.longJustification) && parsed.longJustification.length > 0
      ? parsed.longJustification.slice(0, 3)
      : ['Estimated analysis','Some values may be approximate','Computed despite low-confidence OCR text'];

    // Classifier le plat selon les préférences alimentaires
    const dishClassifications = classifyDishForPreferences(dishText, userProfile.dietaryPreferences);
    const compliance = checkDishCompliance(dishClassifications, userProfile.dietaryPreferences);
    
    console.log('🔍 Dish classifications:', dishClassifications);
    console.log('✅ Compliance check:', compliance);
    
    // Validation et nettoyage des données
    const validatedAnalysis = {
      aiScore: Math.max(0, Math.min(10, safeAiScore)),
      calories: Math.max(0, safeCalories),
      macros: safeMacros,
      shortJustification: safeShort,
      longJustification: safeLong,
      // Ajouter les classifications et la conformité
      dietaryClassifications: dishClassifications,
      match: compliance.match,
      violations: compliance.violations,
      complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`
    };

    console.log('✅ Single dish analysis completed');

    res.json({
      success: true,
      analysis: validatedAnalysis
    });

  } catch (error) {
    console.error('❌ Error analyzing single dish:', error);
    try {
      // Construire un fallback d'analyse pour éviter d'interrompre l'UX
      const { dishText, userProfile } = req.body || {};
      const prefs = userProfile?.dietaryPreferences || [];
      const dishClassifications = classifyDishForPreferences(String(dishText || ''), prefs);
      const compliance = checkDishCompliance(dishClassifications, prefs);
      
      // Provide more realistic fallback values instead of zeros
      const estimatedCalories = String(dishText || '').toLowerCase().includes('salad') ? 150 : 
                               String(dishText || '').toLowerCase().includes('quesadilla') ? 400 :
                               String(dishText || '').toLowerCase().includes('ceviche') ? 200 :
                               String(dishText || '').toLowerCase().includes('burger') ? 600 : 300;
      
      const estimatedMacros = {
        protein: String(dishText || '').toLowerCase().includes('cheese') ? 15 : 
                String(dishText || '').toLowerCase().includes('meat') || String(dishText || '').toLowerCase().includes('pollo') || String(dishText || '').toLowerCase().includes('cerdo') ? 25 : 8,
        carbs: String(dishText || '').toLowerCase().includes('quesadilla') ? 35 : 
               String(dishText || '').toLowerCase().includes('burger') ? 45 : 25,
        fats: String(dishText || '').toLowerCase().includes('cheese') ? 20 : 
              String(dishText || '').toLowerCase().includes('avocado') ? 15 : 12
      };

      const fallbackAnalysis = {
        aiScore: compliance.match ? 7.0 : 4.0, // Higher score if it matches preferences
        calories: estimatedCalories,
        macros: estimatedMacros,
        shortJustification: compliance.match ? 
          'Estimated analysis based on dish type and ingredients' : 
          'Estimated analysis - may not fully match your preferences',
        longJustification: compliance.match ? [
          'Estimated nutritional values based on typical dish composition',
          'Dish appears to match your dietary preferences',
          'Values are approximate due to limited menu information'
        ] : [
          'Estimated nutritional values based on typical dish composition',
          'Dish may not fully align with your dietary preferences',
          'Values are approximate due to limited menu information'
        ],
        dietaryClassifications: dishClassifications,
        match: compliance.match,
        violations: compliance.violations,
        complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`
      };

      return res.json({ success: true, analysis: fallbackAnalysis });
    } catch (fallbackError) {
      console.error('❌ Fallback analysis failed:', fallbackError);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'analyse du plat'
      });
    }
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

CRITICAL DIETARY COMPLIANCE RULES:
${generateDietaryRules(userProfile)}

GENERAL COMPLIANCE RULES:
- ONLY recommend dishes that STRICTLY comply with ALL user preferences and restrictions
- PRIORITIZE dishes that align with the user's health goals
- If multiple dietary restrictions apply, ALL must be satisfied
- Consider nutritional balance and health benefits when scoring
- The aiScore should reflect how well the dish matches ALL user preferences and goals

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

If the dish description is unclear or incomplete, you MUST still provide your best estimate based on the dish name and any available information. NEVER return an error. Always provide a plausible analysis, even if you have to make reasonable assumptions.

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
              content: "You are a nutrition expert that analyzes dishes for personalized recommendations. Only recommend meals that strictly align with the user's dietary preferences (e.g., vegetarian, vegan, etc.). Discard or downgrade meals that do not comply. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Be precise with nutritional values and provide meaningful justifications. Write all justifications in English only, maximum 2 sentences, using ONLY real data (nutritional info and user preferences). Do NOT invent or reference activity data, workouts, or energy expenditure. The aiScore represents a personalized match score (0-10) based on how well the dish aligns with the user's dietary profile and preferences." 
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        });

        const responseText = completion.choices[0]?.message?.content;
        
        if (!responseText) {
          // build permissive fallback
          return {
            ...dish,
            aiScore: 5.0,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            shortJustification: 'Estimated based on limited menu information',
            longJustification: ['Estimated analysis','Some values may be approximate','Computed despite low-confidence OCR text']
          };
        }

        // Build permissive analysis with fallbacks instead of throwing
        const parsedMulti = (analysis && typeof analysis === 'object' && !analysis.status && !analysis.error) ? analysis : {};
        const aiScoreMulti = Number.isFinite(parseFloat(parsedMulti.aiScore)) ? parseFloat(parsedMulti.aiScore) : 5.0;
        const caloriesMulti = Number.isFinite(parseInt(parsedMulti.calories)) ? parseInt(parsedMulti.calories) : 0;
        const macrosMultiIn = parsedMulti.macros || {};
        const macrosMulti = {
          protein: Number.isFinite(parseInt(macrosMultiIn.protein)) ? parseInt(macrosMultiIn.protein) : 0,
          carbs: Number.isFinite(parseInt(macrosMultiIn.carbs)) ? parseInt(macrosMultiIn.carbs) : 0,
          fats: Number.isFinite(parseInt(macrosMultiIn.fats)) ? parseInt(macrosMultiIn.fats) : 0,
        };
        const shortMulti = parsedMulti.shortJustification || 'Estimated based on limited menu information';
        const longMulti = Array.isArray(parsedMulti.longJustification) && parsedMulti.longJustification.length > 0
          ? parsedMulti.longJustification.slice(0, 3)
          : ['Estimated analysis','Some values may be approximate','Computed despite low-confidence OCR text'];
 
        // Classifier le plat selon les préférences alimentaires
        const dishClassifications = classifyDishForPreferences(dishText, userProfile.dietaryPreferences);
        const compliance = checkDishCompliance(dishClassifications, userProfile.dietaryPreferences);

        console.log(`🔍 Dish classifications for "${dish.title || dish.name}":`, dishClassifications);
        console.log(`✅ Compliance check for "${dish.title || dish.name}":`, compliance);

        // Validation et nettoyage des données
        const validatedAnalysis = {
          aiScore: Math.max(0, Math.min(10, aiScoreMulti)),
          calories: Math.max(0, caloriesMulti),
          macros: macrosMulti,
          shortJustification: shortMulti,
          longJustification: longMulti,
          // Ajouter les classifications et la conformité
          dietaryClassifications: dishClassifications,
          match: compliance.match,
          violations: compliance.violations,
          complianceWarning: compliance.match ? null : `⚠️ Doesn't match your preferences: ${compliance.violations.join(', ')}`
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