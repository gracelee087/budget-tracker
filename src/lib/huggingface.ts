// Hugging Face LLM API Integration

import expenseCategories from './expense-categories.json';

interface ParsedExpense {
   date: string;
   category: string;
   purpose: string;
   place: string;
   amount: number;
   description: string;
}

export class HuggingFaceLLM {
   private apiKey: string;
   private baseUrl = 'https://api-inference.huggingface.co/models';

   constructor(apiKey: string) {
      this.apiKey = apiKey;
   }

   // Parse natural language into structured data
   async parseExpense(text: string): Promise<ParsedExpense> {
      try {
         // Check for delete commands
         const deleteCommand = this.parseDeleteCommand(text);
         if (deleteCommand) {
            return deleteCommand;
         }

         // Use dataset-based parsing (most accurate)
         const parsed = this.parseWithDataset(text);

         // Optional: Enhanced parsing with Hugging Face API (if available)
         if (this.apiKey && this.apiKey !== 'placeholder-key') {
            try {
               const enhanced = await this.enhanceWithLLM(text, parsed);
               return enhanced;
            } catch (error) {
               console.log('LLM enhancement failed, using dataset result:', error);
               return parsed;
            }
         }

         return parsed;
      } catch (error) {
         console.error('LLM parsing error:', error);
         // Return basic parsing result on error
         return this.parseWithRules(text);
      }
   }

   // Dataset-based parsing (most accurate)
   private parseWithDataset(text: string): ParsedExpense {
      const lowerText = text.toLowerCase();

      // Calculate today's date based on Berlin timezone
      const now = new Date();
      const berlinTime = this.getBerlinTime(now);
      const dateStr = berlinTime.toISOString().split('T')[0];

      // Extract amount
      let amount = 0;
      const amountRegex = /[€$]?(\d+(?:\.\d{2})?)/g;
      const amounts = text.match(amountRegex);
      if (amounts) {
         const allNumbers = amounts.map(a => parseFloat(a.replace(/[€$]/g, '')));
         amount = Math.max(...allNumbers);
      }

      // Find best matching category using dataset
      let bestCategory = 'Other';
      let bestCategoryScore = 0;

      for (const [categoryName, categoryData] of Object.entries(expenseCategories.categories)) {
         let score = 0;
         for (const keyword of categoryData.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
               score += 1;
            }
         }
         if (score > bestCategoryScore) {
            bestCategoryScore = score;
            bestCategory = categoryName;
         }
      }

      // Find best matching place using dataset
      let bestPlace = 'Other';
      let bestPlaceScore = 0;

      for (const [placeName, placeData] of Object.entries(expenseCategories.places)) {
         let score = 0;
         for (const keyword of placeData.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
               score += 1;
            }
         }
         if (score > bestPlaceScore) {
            bestPlaceScore = score;
            bestPlace = placeName;
         }
      }

      // Find best matching purpose using dataset
      let bestPurpose = 'Other';
      let bestPurposeScore = 0;

      for (const [purposeName, purposeData] of Object.entries(expenseCategories.purposes)) {
         let score = 0;
         for (const keyword of purposeData.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
               score += 1;
            }
         }
         if (score > bestPurposeScore) {
            bestPurposeScore = score;
            bestPurpose = purposeName;
         }
      }

      console.log('=== DATASET PARSING ===');
      console.log('Input text:', text);
      console.log('Category matches:', bestCategory, '(score:', bestCategoryScore + ')');
      console.log('Place matches:', bestPlace, '(score:', bestPlaceScore + ')');
      console.log('Purpose matches:', bestPurpose, '(score:', bestPurposeScore + ')');

      return {
         date: dateStr,
         category: bestCategory,
         purpose: bestPurpose,
         place: bestPlace,
         amount,
         description: text
      };
   }

   // Rule-based parsing (basic)
   private parseWithRules(text: string): ParsedExpense {
      // Calculate today's date based on Berlin timezone
      const now = new Date();
      const berlinTime = this.getBerlinTime(now);
      const dateStr = berlinTime.toISOString().split('T')[0];

      console.log('Current Berlin time:', berlinTime.toLocaleString('de-DE'));
      console.log('Base date:', dateStr);

      // Extract date from natural language
      const extractedDate = this.extractDateFromText(text, berlinTime);
      console.log('Extracted date:', extractedDate);

      // Extract amount (very simple method)
      let amount = 0;

      console.log('Input text:', text);

      // Find all numbers
      const allNumbers = text.match(/\d+/g);
      console.log('Found all numbers:', allNumbers);

      if (allNumbers && allNumbers.length > 0) {
         // Use the largest number as amount
         const numbers = allNumbers.map(n => parseInt(n));
         amount = Math.max(...numbers);
         console.log('Numbers:', numbers, '→ Max value:', amount);
      }

      console.log('=== PARSING DEBUG ===');
      console.log('Input text:', text);
      console.log('Text to lowercase:', text.toLowerCase());

      // Extract category with priority-based matching
      let category = 'Other';
      let matchedKeywords = [];

      // Priority 1: Food (most specific keywords first)
      if (text.includes('eat') || text.includes('food') || text.includes('lunch') || text.includes('dinner') ||
         text.includes('breakfast') || text.includes('meal') || text.includes('restaurant') ||
         text.includes('cafe') || text.includes('coffee') || text.includes('drink') ||
         text.includes('kimchi') || text.includes('stew') || text.includes('pizza') ||
         text.includes('burger') || text.includes('sandwich') || text.includes('salad')) {
         category = 'Food';
         matchedKeywords = ['eat', 'food', 'lunch', 'dinner', 'breakfast', 'meal', 'restaurant', 'cafe', 'coffee', 'drink', 'kimchi', 'stew', 'pizza', 'burger', 'sandwich', 'salad'].filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
      }
      // Priority 2: Transportation
      else if (text.includes('transport') || text.includes('subway') || text.includes('bus') ||
         text.includes('taxi') || text.includes('gas') || text.includes('train') ||
         text.includes('metro') || text.includes('uber') || text.includes('lyft') ||
         text.includes('drive') || text.includes('car') || text.includes('bike')) {
         category = 'Transportation';
         matchedKeywords = ['transport', 'subway', 'bus', 'taxi', 'gas', 'train', 'metro', 'uber', 'lyft', 'drive', 'car', 'bike'].filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
      }
      // Priority 3: Medical
      else if (text.includes('hospital') || text.includes('medicine') || text.includes('medical') ||
         text.includes('doctor') || text.includes('pharmacy') || text.includes('clinic') ||
         text.includes('health') || text.includes('treatment') || text.includes('prescription')) {
         category = 'Medical';
         matchedKeywords = ['hospital', 'medicine', 'medical', 'doctor', 'pharmacy', 'clinic', 'health', 'treatment', 'prescription'].filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
      }
      // Priority 4: Shopping (more specific shopping keywords)
      else if (text.includes('shopping') || text.includes('clothes') || text.includes('shoes') ||
         text.includes('store') || text.includes('mall') || text.includes('buy') ||
         text.includes('purchase') || text.includes('shop') || text.includes('retail') ||
         (text.includes('online') && (text.includes('shop') || text.includes('buy') || text.includes('purchase')))) {
         category = 'Shopping';
         matchedKeywords = ['shopping', 'clothes', 'shoes', 'store', 'mall', 'buy', 'purchase', 'shop', 'retail'].filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
         if (text.includes('online') && (text.includes('shop') || text.includes('buy') || text.includes('purchase'))) {
            matchedKeywords.push('online+shopping');
         }
      }
      // Priority 5: Communication (more specific communication keywords)
      else if (text.includes('phone') || text.includes('internet') || text.includes('communication') ||
         text.includes('mobile') || text.includes('wifi') || text.includes('data') ||
         text.includes('call') || text.includes('message') || text.includes('text') ||
         (text.includes('online') && (text.includes('call') || text.includes('message') || text.includes('internet')))) {
         category = 'Communication';
         matchedKeywords = ['phone', 'internet', 'communication', 'mobile', 'wifi', 'data', 'call', 'message', 'text'].filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
         if (text.includes('online') && (text.includes('call') || text.includes('message') || text.includes('internet'))) {
            matchedKeywords.push('online+communication');
         }
      }
      // Priority 6: Education
      else if (text.includes('book') || text.includes('school') || text.includes('education') ||
         text.includes('study') || text.includes('course') || text.includes('university') ||
         text.includes('college') || text.includes('learn') || text.includes('class')) {
         category = 'Education';
         matchedKeywords = ['book', 'school', 'education', 'study', 'course', 'university', 'college', 'learn', 'class'].filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
      }
      // Priority 7: Culture
      else if (text.includes('movie') || text.includes('cinema') || text.includes('culture') ||
         text.includes('entertainment') || text.includes('game') || text.includes('music') ||
         text.includes('theater') || text.includes('concert') || text.includes('show')) {
         category = 'Culture';
         matchedKeywords = ['movie', 'cinema', 'culture', 'entertainment', 'game', 'music', 'theater', 'concert', 'show'].filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
      }

      console.log('Matched keywords:', matchedKeywords);
      console.log('Selected category:', category);

      // Extract place
      let place = 'Other';
      if (text.includes('home') || text.includes('house') || text.includes('apartment')) {
         place = 'Home';
      } else if (text.includes('office') || text.includes('work') || text.includes('company')) {
         place = 'Office';
      } else if (text.includes('cafe') || text.includes('coffee') || text.includes('starbucks')) {
         place = 'Cafe';
      } else if (text.includes('restaurant') || text.includes('dining') || text.includes('food')) {
         place = 'Restaurant';
      } else if (text.includes('mart') || text.includes('supermarket') || text.includes('grocery') || text.includes('store')) {
         place = 'Mart';
      } else if (text.includes('online') || text.includes('internet') || text.includes('website') || text.includes('app')) {
         place = 'Online';
      } else if (text.includes('hospital') || text.includes('clinic') || text.includes('medical')) {
         place = 'Hospital';
      } else if (text.includes('school') || text.includes('university') || text.includes('college')) {
         place = 'School';
      }

      // Extract purpose
      let purpose = 'Other';
      if (text.includes('meal') || text.includes('lunch') || text.includes('dinner') || text.includes('breakfast') || text.includes('eat')) {
         purpose = 'Meal';
      } else if (text.includes('snack') || text.includes('dessert') || text.includes('candy') || text.includes('coffee') || text.includes('drink')) {
         purpose = 'Snack';
      } else if (text.includes('meeting') || text.includes('business') || text.includes('work') || text.includes('party') || text.includes('gathering')) {
         purpose = 'Meeting';
      } else if (text.includes('personal') || text.includes('cosmetics') || text.includes('supplies') || text.includes('clothes') || text.includes('shoes')) {
         purpose = 'Personal Items';
      } else if (text.includes('household') || text.includes('cleaning') || text.includes('home')) {
         purpose = 'Household Items';
      } else if (text.includes('clothing') || text.includes('clothes') || text.includes('shoes') || text.includes('fashion')) {
         purpose = 'Clothing';
      } else if (text.includes('transport') || text.includes('travel') || text.includes('commute')) {
         purpose = 'Transportation';
      } else if (text.includes('medical') || text.includes('health') || text.includes('medicine') || text.includes('doctor')) {
         purpose = 'Medical';
      } else if (text.includes('education') || text.includes('study') || text.includes('book') || text.includes('course')) {
         purpose = 'Education';
      } else if (text.includes('culture') || text.includes('entertainment') || text.includes('movie') || text.includes('game')) {
         purpose = 'Culture';
      }

      console.log('Parsing text:', text);
      console.log('Detected category:', category);
      console.log('Detected place:', place);
      console.log('Detected purpose:', purpose);

      return {
         date: extractedDate,
         category,
         purpose,
         place,
         amount,
         description: text
      };
   }

   // Parse delete commands
   private parseDeleteCommand(text: string): ParsedExpense | null {
      const deleteKeywords = ['delete', 'remove', 'clear', 'erase', 'delete today', 'delete yesterday', 'delete all'];
      const isDeleteCommand = deleteKeywords.some(keyword => text.includes(keyword));

      if (!isDeleteCommand) {
         return null;
      }

      console.log('Delete command detected:', text);

      // Delete specific date
      if (text.includes('today')) {
         const today = this.getBerlinTime(new Date());
         return {
            date: today.toISOString().split('T')[0],
            category: 'DELETE_TODAY',
            purpose: 'DELETE_TODAY',
            place: 'DELETE_TODAY',
            amount: 0,
            description: text
         };
      }

      if (text.includes('yesterday')) {
         const yesterday = new Date(this.getBerlinTime(new Date()).getTime() - (24 * 60 * 60 * 1000));
         return {
            date: yesterday.toISOString().split('T')[0],
            category: 'DELETE_YESTERDAY',
            purpose: 'DELETE_YESTERDAY',
            place: 'DELETE_YESTERDAY',
            amount: 0,
            description: text
         };
      }

      // Delete specific keywords (e.g., "delete food expenses")
      const categories = ['Food', 'Transportation', 'Shopping', 'Medical', 'Communication', 'Education', 'Culture', 'Other'];
      for (const category of categories) {
         if (text.includes(category.toLowerCase())) {
            return {
               date: this.getBerlinTime(new Date()).toISOString().split('T')[0],
               category: `DELETE_${category}`,
               purpose: `DELETE_${category}`,
               place: `DELETE_${category}`,
               amount: 0,
               description: text
            };
         }
      }

      // Delete all
      return {
         date: this.getBerlinTime(new Date()).toISOString().split('T')[0],
         category: 'DELETE_ALL',
         purpose: 'DELETE_ALL',
         place: 'DELETE_ALL',
         amount: 0,
         description: text
      };
   }

   // Calculate Berlin time (considering summer/winter time)
   private getBerlinTime(utcDate: Date): Date {
      // Simple method: determine summer/winter time based on current month
      const month = utcDate.getMonth() + 1; // 1-12

      // Summer time (last Sunday of March ~ last Sunday of October): UTC+2
      // Winter time (last Sunday of October ~ last Sunday of March): UTC+1
      // Simply distinguish by month (not accurate but approximate)
      let offset = 1; // Default winter time UTC+1

      if (month >= 4 && month <= 9) {
         offset = 2; // Summer time UTC+2
      }

      return new Date(utcDate.getTime() + (offset * 60 * 60 * 1000));
   }

   // Extract date from natural language
   private extractDateFromText(text: string, baseDate: Date): string {
      const today = baseDate;
      const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
      const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
      const currentYear = today.getFullYear();

      console.log('Extracting date...', text);

      // Relative date expressions (recent)
      if (text.includes('yesterday') || text.includes('last day')) {
         console.log('→ Recognized as yesterday');
         return yesterday.toISOString().split('T')[0];
      }
      if (text.includes('tomorrow') || text.includes('next day')) {
         console.log('→ Recognized as tomorrow');
         return tomorrow.toISOString().split('T')[0];
      }
      if (text.includes('today') || text.includes('this day')) {
         console.log('→ Recognized as today');
         return today.toISOString().split('T')[0];
      }

      // Last year related expressions
      if (text.includes('last year')) {
         console.log('→ Recognized as last year');
         const lastYear = currentYear - 1;

         // Expressions like "last year December"
         const lastYearMonthMatch = text.match(/last year\s*(\d{1,2})/);
         if (lastYearMonthMatch) {
            const month = parseInt(lastYearMonthMatch[1]);
            const extractedDate = new Date(lastYear, month - 1, 1);
            console.log(`→ Last year ${month}:`, extractedDate.toISOString().split('T')[0]);
            return extractedDate.toISOString().split('T')[0];
         }

         // Expressions like "last year December 25"
         const lastYearMonthDayMatch = text.match(/last year\s*(\d{1,2})\/(\d{1,2})/);
         if (lastYearMonthDayMatch) {
            const month = parseInt(lastYearMonthDayMatch[1]);
            const day = parseInt(lastYearMonthDayMatch[2]);
            const extractedDate = new Date(lastYear, month - 1, day);
            console.log(`→ Last year ${month}/${day}:`, extractedDate.toISOString().split('T')[0]);
            return extractedDate.toISOString().split('T')[0];
         }

         // Simple "last year"
         const lastYearDate = new Date(lastYear, 0, 1);
         console.log(`→ Last year January 1:`, lastYearDate.toISOString().split('T')[0]);
         return lastYearDate.toISOString().split('T')[0];
      }

      // This year/current year related expressions
      if (text.includes('this year') || text.includes('current year')) {
         console.log('→ Recognized as this year');

         // Expressions like "this year March"
         const thisYearMonthMatch = text.match(/(?:this year|current year)\s*(\d{1,2})/);
         if (thisYearMonthMatch) {
            const month = parseInt(thisYearMonthMatch[1]);
            const extractedDate = new Date(currentYear, month - 1, 1);
            console.log(`→ This year ${month}:`, extractedDate.toISOString().split('T')[0]);
            return extractedDate.toISOString().split('T')[0];
         }

         // Expressions like "this year March 15"
         const thisYearMonthDayMatch = text.match(/(?:this year|current year)\s*(\d{1,2})\/(\d{1,2})/);
         if (thisYearMonthDayMatch) {
            const month = parseInt(thisYearMonthDayMatch[1]);
            const day = parseInt(thisYearMonthDayMatch[2]);
            const extractedDate = new Date(currentYear, month - 1, day);
            console.log(`→ This year ${month}/${day}:`, extractedDate.toISOString().split('T')[0]);
            return extractedDate.toISOString().split('T')[0];
         }
      }

      // Absolute date expressions (e.g., 1/15, 1-15, etc.)
      const monthDayMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
      if (monthDayMatch) {
         const month = parseInt(monthDayMatch[1]);
         const day = parseInt(monthDayMatch[2]);
         const year = currentYear;
         const extractedDate = new Date(year, month - 1, day);
         console.log(`→ ${year}/${month}/${day}:`, extractedDate.toISOString().split('T')[0]);
         return extractedDate.toISOString().split('T')[0];
      }

      // Year included expressions (e.g., 2023/12/25)
      const fullDateMatch = text.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
      if (fullDateMatch) {
         const year = parseInt(fullDateMatch[1]);
         const month = parseInt(fullDateMatch[2]);
         const day = parseInt(fullDateMatch[3]);
         const extractedDate = new Date(year, month - 1, day);
         console.log(`→ ${year}/${month}/${day}:`, extractedDate.toISOString().split('T')[0]);
         return extractedDate.toISOString().split('T')[0];
      }

      // Default: today
      console.log('→ Default (today)');
      return today.toISOString().split('T')[0];
   }

   // Enhanced parsing with Hugging Face LLM
   private async enhanceWithLLM(text: string, basicParsed: ParsedExpense): Promise<ParsedExpense> {
      try {
         const prompt = `Extract expense information from the following English text:
"${text}"

Please respond in the following JSON format:
{
  "date": "YYYY-MM-DD",
  "category": "Food|Transportation|Shopping|Medical|Communication|Education|Culture|Other",
  "purpose": "Meal|Snack|Party|Personal Items|Household Items|Clothing|Transport|Medical|Education|Culture|Other",
  "place": "Home|Office|Cafe|Restaurant|Mart|Online|Hospital|School|Other",
  "amount": number,
  "description": "original text"
}`;

         const response = await fetch(`${this.baseUrl}/microsoft/DialoGPT-medium`, {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${this.apiKey}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               inputs: prompt,
               parameters: {
                  max_length: 200,
                  temperature: 0.1
               }
            })
         });

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
         }

         const result = await response.json();

         // Try to parse LLM result
         try {
            const llmResult = JSON.parse(result[0]?.generated_text || '{}');
            return {
               ...basicParsed,
               ...llmResult,
               amount: llmResult.amount || basicParsed.amount
            };
         } catch {
            // Return basic result if JSON parsing fails
            return basicParsed;
         }
      } catch (error) {
         console.error('LLM API error:', error);
         return basicParsed;
      }
   }
}

// Singleton instance
export const llm = new HuggingFaceLLM(
   process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || 'placeholder-key'
);
