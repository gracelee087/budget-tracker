import { createClient } from '@supabase/supabase-js'

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
   console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지 모드로 실행됩니다.');
   console.warn('환경 변수 설정: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
   console.warn('📝 .env.local 파일을 생성하고 다음 내용을 추가하세요:');
   console.warn('NEXT_PUBLIC_SUPABASE_URL=https://nstjnvdccnezqpdzhxtb.supabase.co');
   console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zdGpudmRjY25lenFwZHpoeHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjU3ODEsImV4cCI6MjA3NDQwMTc4MX0.DA-4pgOSUgi0H3jKA1CzVPmr08PZelJwBr6YLEr1h4I');
}

// Supabase 클라이언트 생성
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(
   supabaseUrl,
   supabaseAnonKey
) : null

// Supabase 연결 상태 확인
export const isSupabaseConnected = !!(supabaseUrl && supabaseAnonKey && supabase)

// 디버깅용 로그
console.log('🔗 Supabase 연결 상태:', {
   isConnected: isSupabaseConnected,
   hasUrl: !!supabaseUrl,
   hasKey: !!supabaseAnonKey,
   url: supabaseUrl?.substring(0, 20) + '...',
   key: supabaseAnonKey?.substring(0, 20) + '...'
});

// 타입 정의
export interface User {
   id: string
   email: string
   name?: string
   created_at: string
   updated_at: string
}

export interface Category {
   id: string
   name: string
   description?: string
   color?: string
   created_at: string
}

export interface Place {
   id: string
   name: string
   description?: string
   created_at: string
}

export interface Purpose {
   id: string
   name: string
   description?: string
   created_at: string
}

export interface Budget {
   id: string
   user_id: string
   budget_date: string
   total_budget: number
   created_at: string
   updated_at: string
}

export interface Expense {
   id: string
   user_id: string
   expense_date: string
   category_id?: string
   purpose_id?: string
   place_id?: string
   amount: number
   description?: string
   created_at: string
   updated_at: string
   // 조인된 데이터
   category?: Category
   purpose?: Purpose
   place?: Place
}

// API 함수들
export const budgetAPI = {
   // 예산 설정
   async setBudget(userId: string, budgetDate: string, totalBudget: number) {
      console.log('예산 설정 시도:', { userId, budgetDate, totalBudget });

      // Supabase 연결 확인
      if (!isSupabaseConnected) {
         console.log('로컬 스토리지 모드로 저장');
         const budgetData = {
            id: Date.now().toString(),
            user_id: userId,
            budget_date: budgetDate,
            total_budget: totalBudget,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
         };
         localStorage.setItem(`budget_${userId}_${budgetDate}`, JSON.stringify(budgetData));
         console.log('로컬 스토리지에 저장됨:', budgetData);
         return budgetData;
      }

      // Supabase에 저장
      try {
         if (!supabase) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
         }

         const { data, error } = await supabase
            .from('budgets')
            .upsert({
               user_id: userId,
               budget_date: budgetDate,
               total_budget: totalBudget,
               updated_at: new Date().toISOString()
            })
            .select()
            .single()

         if (error) throw error
         console.log('Supabase에 예산 저장됨:', data);
         return data
      } catch (error) {
         console.error('Supabase 예산 저장 실패:', error);
         throw new Error(`Supabase 오류: ${error.message}`)
      }
   },

   // 예산 조회
   async getBudget(userId: string, budgetDate: string) {
      console.log('예산 조회 시도:', { userId, budgetDate });

      // Supabase 연결 확인
      if (!isSupabaseConnected) {
         console.log('로컬 스토리지 모드로 조회');
         const stored = localStorage.getItem(`budget_${userId}_${budgetDate}`);
         const result = stored ? JSON.parse(stored) : null;
         console.log('로컬 스토리지에서 조회됨:', result);
         return result;
      }

      // Supabase에서 조회
      try {
         if (!supabase) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
         }

         const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId)
            .eq('budget_date', budgetDate)
            .single()

         if (error && error.code !== 'PGRST116') throw error
         console.log('Supabase에서 예산 조회됨:', data);
         return data
      } catch (error) {
         console.error('Supabase 예산 조회 실패:', error);
         throw new Error(`Supabase 오류: ${error.message}`)
      }
   }
}

export const expenseAPI = {
   // 지출 추가
   async addExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) {
      console.log('지출 추가 시도:', expense);

      // Supabase 연결 확인
      if (!isSupabaseConnected) {
         console.log('로컬 스토리지 모드로 저장');
         const expenseData = {
            id: Date.now().toString(),
            ...expense,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
         };

         // 로컬 스토리지에 저장
         const userId = expense.user_id;
         const expenseDate = expense.expense_date;
         const storageKey = `expense_${userId}_${expenseDate}`;

         // 기존 데이터 가져오기
         const existingData = localStorage.getItem(storageKey);
         const expenses = existingData ? JSON.parse(existingData) : [];

         // 새 지출 추가
         expenses.push(expenseData);
         localStorage.setItem(storageKey, JSON.stringify(expenses));

         console.log('로컬 스토리지에 지출 저장됨:', expenseData);
         return expenseData;
      }

      // Supabase에 저장
      try {
         if (!supabase) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
         }

         // 이름으로 ID 조회
         let categoryId = null;
         let purposeId = null;
         let placeId = null;

         if (expense.category_id) {
            console.log('Category ID lookup:', expense.category_id);
            const { data: categoryData, error: categoryError } = await supabase
               .from('categories')
               .select('id')
               .eq('name', expense.category_id)
               .single();

            if (categoryError) {
               console.error('Category lookup error:', categoryError);
               console.error('Looking for category name:', expense.category_id);
               // Try to get all available categories for debugging
               const { data: allCategories } = await supabase.from('categories').select('name');
               console.log('Available categories:', allCategories);
            } else {
               categoryId = categoryData?.id;
               console.log('Category ID found:', categoryId);
            }
         }

         if (expense.purpose_id) {
            console.log('Purpose ID lookup:', expense.purpose_id);
            const { data: purposeData, error: purposeError } = await supabase
               .from('purposes')
               .select('id')
               .eq('name', expense.purpose_id)
               .single();

            if (purposeError) {
               console.error('Purpose lookup error:', purposeError);
               console.error('Looking for purpose name:', expense.purpose_id);
               // Try to get all available purposes for debugging
               const { data: allPurposes } = await supabase.from('purposes').select('name');
               console.log('Available purposes:', allPurposes);
            } else {
               purposeId = purposeData?.id;
               console.log('Purpose ID found:', purposeId);
            }
         }

         if (expense.place_id) {
            console.log('Place ID lookup:', expense.place_id);
            const { data: placeData, error: placeError } = await supabase
               .from('places')
               .select('id')
               .eq('name', expense.place_id)
               .single();

            if (placeError) {
               console.error('Place lookup error:', placeError);
               console.error('Looking for place name:', expense.place_id);
               // Try to get all available places for debugging
               const { data: allPlaces } = await supabase.from('places').select('name');
               console.log('Available places:', allPlaces);
            } else {
               placeId = placeData?.id;
               console.log('Place ID found:', placeId);
            }
         }

         console.log('Final save data:', {
            user_id: expense.user_id,
            expense_date: expense.expense_date,
            category_id: categoryId,
            purpose_id: purposeId,
            place_id: placeId,
            amount: expense.amount,
            description: expense.description
         });

         const { data, error } = await supabase
            .from('expenses')
            .insert({
               user_id: expense.user_id,
               expense_date: expense.expense_date,
               category_id: categoryId,
               purpose_id: purposeId,
               place_id: placeId,
               amount: expense.amount,
               description: expense.description
            })
            .select()
            .single()

         if (error) {
            console.error('Supabase save error:', error);
            throw error;
         }

         console.log('Expense saved to Supabase successfully:', data);
         return data
      } catch (error) {
         console.error('Supabase expense save failed:', error);
         throw new Error(`Supabase error: ${error.message}`)
      }
   },

   // Get expense list
   async getExpenses(userId: string, startDate?: string, endDate?: string) {
      console.log('Expense lookup attempt:', { userId, startDate, endDate });

      // Check Supabase connection
      if (!isSupabaseConnected) {
         console.log('Querying in local storage mode');
         const allKeys = Object.keys(localStorage);
         const expenseKeys = allKeys.filter(key => key.startsWith(`expense_${userId}_`));

         let allExpenses: Expense[] = [];

         for (const key of expenseKeys) {
            const data = localStorage.getItem(key);
            if (data) {
               const expenses = JSON.parse(data);
               allExpenses = allExpenses.concat(expenses);
            }
         }

         // Date filtering
         if (startDate) {
            allExpenses = allExpenses.filter(expense => expense.expense_date >= startDate);
         }
         if (endDate) {
            allExpenses = allExpenses.filter(expense => expense.expense_date <= endDate);
         }

         // Sort by date (newest first)
         allExpenses.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

         console.log('Expenses retrieved from local storage:', allExpenses);
         return allExpenses;
      }

      // Query from Supabase
      try {
         if (!supabase) {
            throw new Error('Supabase client not initialized.');
         }

         // First query basic expense data only
         let query = supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId)
            .order('expense_date', { ascending: false })

         if (startDate) {
            query = query.gte('expense_date', startDate)
         }
         if (endDate) {
            query = query.lte('expense_date', endDate)
         }

         const { data, error } = await query

         if (error) {
            console.error('Supabase expense query error:', error);
            throw error;
         }

         console.log('Expenses retrieved from Supabase:', data);

         // Query category, place, purpose information separately and map
         const expensesWithDetails = await Promise.all((data || []).map(async (expense) => {
            let category = null;
            let purpose = null;
            let place = null;

            // Query category information
            if (expense.category_id) {
               try {
                  const { data: categoryData } = await supabase
                     .from('categories')
                     .select('name, color')
                     .eq('id', expense.category_id)
                     .single();
                  category = categoryData;
               } catch {
                  console.log('Category query failed, trying by name:', expense.category_id);
                  // If it's a name instead of ID
                  const { data: categoryData } = await supabase
                     .from('categories')
                     .select('name, color')
                     .eq('name', expense.category_id)
                     .single();
                  category = categoryData;
               }
            }

            // Query purpose information
            if (expense.purpose_id) {
               try {
                  const { data: purposeData } = await supabase
                     .from('purposes')
                     .select('name')
                     .eq('id', expense.purpose_id)
                     .single();
                  purpose = purposeData;
               } catch {
                  console.log('Purpose query failed, trying by name:', expense.purpose_id);
                  const { data: purposeData } = await supabase
                     .from('purposes')
                     .select('name')
                     .eq('name', expense.purpose_id)
                     .single();
                  purpose = purposeData;
               }
            }

            // Query place information
            if (expense.place_id) {
               try {
                  const { data: placeData } = await supabase
                     .from('places')
                     .select('name')
                     .eq('id', expense.place_id)
                     .single();
                  place = placeData;
               } catch {
                  console.log('Place query failed, trying by name:', expense.place_id);
                  const { data: placeData } = await supabase
                     .from('places')
                     .select('name')
                     .eq('name', expense.place_id)
                     .single();
                  place = placeData;
               }
            }

            return {
               ...expense,
               category: category || { name: expense.category_id || 'Other', color: '#F7DC6F' },
               purpose: purpose || { name: expense.purpose_id || 'Other' },
               place: place || { name: expense.place_id || 'Other' }
            };
         }));

         console.log('Expense data with detailed information:', expensesWithDetails);
         return expensesWithDetails;
      } catch (error) {
         console.error('Supabase expense query failed:', error);
         throw new Error(`Supabase error: ${error.message}`)
      }
   },

   // Expense statistics by category
   async getExpensesByCategory(userId: string, startDate?: string, endDate?: string) {
      // Check Supabase connection
      if (!isSupabaseConnected) {
         console.log('Local storage mode - category statistics not yet supported');
         return [];
      }

      try {
         let query = supabase
            .from('expenses')
            .select(`
               amount,
               category:categories(name, color)
            `)
            .eq('user_id', userId)
            .not('category_id', 'is', null)

         if (startDate) {
            query = query.gte('expense_date', startDate)
         }
         if (endDate) {
            query = query.lte('expense_date', endDate)
         }

         const { data, error } = await query

         if (error) throw error
         return data || []
      } catch (error) {
         console.error('Supabase category statistics query failed:', error);
         throw new Error(`Supabase error: ${error.message}`)
      }
   }
}

export const referenceAPI = {
   // Category list
   async getCategories() {
      // Check Supabase connection
      if (!isSupabaseConnected) {
         console.log('Local storage mode - returning default categories');
         return [
            { id: '1', name: 'Food', color: '#FF6B6B' },
            { id: '2', name: 'Transportation', color: '#4ECDC4' },
            { id: '3', name: 'Shopping', color: '#45B7D1' },
            { id: '4', name: 'Medical', color: '#96CEB4' },
            { id: '5', name: 'Communication', color: '#FFEAA7' },
            { id: '6', name: 'Education', color: '#DDA0DD' },
            { id: '7', name: 'Culture', color: '#98D8C8' },
            { id: '8', name: 'Other', color: '#F7DC6F' }
         ];
      }

      try {
         const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name')

         if (error) throw error
         return data || []
      } catch (error) {
         console.error('Supabase category query failed:', error);
         throw new Error(`Supabase error: ${error.message}`)
      }
   },

   // Place list
   async getPlaces() {
      // Check Supabase connection
      if (!isSupabaseConnected) {
         console.log('Local storage mode - returning default places');
         return [
            { id: '1', name: 'Home' },
            { id: '2', name: 'Office' },
            { id: '3', name: 'Cafe' },
            { id: '4', name: 'Restaurant' },
            { id: '5', name: 'Mart' },
            { id: '6', name: 'Online' },
            { id: '7', name: 'Hospital' },
            { id: '8', name: 'School' },
            { id: '9', name: 'Other' }
         ];
      }

      try {
         const { data, error } = await supabase
            .from('places')
            .select('*')
            .order('name')

         if (error) throw error
         return data || []
      } catch (error) {
         console.error('Supabase place query failed:', error);
         throw new Error(`Supabase error: ${error.message}`)
      }
   },

   // Purpose list
   async getPurposes() {
      // Check Supabase connection
      if (!isSupabaseConnected) {
         console.log('Local storage mode - returning default purposes');
         return [
            { id: '1', name: 'Meal' },
            { id: '2', name: 'Snack' },
            { id: '3', name: 'Meeting' },
            { id: '4', name: 'Personal Items' },
            { id: '5', name: 'Household Items' },
            { id: '6', name: 'Clothing' },
            { id: '7', name: 'Transportation' },
            { id: '8', name: 'Medical' },
            { id: '9', name: 'Education' },
            { id: '10', name: 'Culture' },
            { id: '11', name: 'Other' }
         ];
      }

      try {
         const { data, error } = await supabase
            .from('purposes')
            .select('*')
            .order('name')

         if (error) throw error
         return data || []
      } catch (error) {
         console.error('Supabase purpose query failed:', error);
         throw new Error(`Supabase error: ${error.message}`)
      }
   }
}
