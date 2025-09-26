'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { budgetAPI, expenseAPI, isSupabaseConnected } from '@/lib/supabase';

interface ExpenseData {
   category: string;
   amount: number;
   color: string;
   percentage: number;
}

interface MonthlyData {
   month: string;
   budget: number;
   spent: number;
   remaining: number;
}

interface DashboardProps {
   selectedMonth: string; // YYYY-MM format
   refreshTrigger?: number; // refresh trigger
}

export default function Dashboard({ selectedMonth, refreshTrigger }: DashboardProps) {
   const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
   const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
   const [totalBudget, setTotalBudget] = useState(0);
   const [totalSpent, setTotalSpent] = useState(0);
   const [loading, setLoading] = useState(true);
   const [recentExpenses, setRecentExpenses] = useState<any[]>([]);

   // Color palette (Mint, YNAB style)
   const COLORS = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
   ];

   // 실시간 데이터 로드
   useEffect(() => {
      const loadDashboardData = async () => {
         // selectedMonth가 없으면 데이터 로드하지 않음
         if (!selectedMonth) {
            setLoading(false);
            return;
         }

         setLoading(true);
         try {
            const userId = '550e8400-e29b-41d4-a716-446655440000';

            console.log('🔍 Dashboard data loading started:', { selectedMonth, userId });

            // Query budget for selected month
            const budgetDate = selectedMonth && selectedMonth.includes('-') && selectedMonth.length === 7
               ? `${selectedMonth}-01`
               : selectedMonth;

            console.log('📅 예산 조회:', { budgetDate });
            const budget = await budgetAPI.getBudget(userId, budgetDate);
            const budgetAmount = budget?.total_budget || 0;
            console.log('💰 예산 데이터:', { budget, budgetAmount });
            setTotalBudget(budgetAmount);

            // 선택된 월의 지출 조회
            const startDate = selectedMonth ? `${selectedMonth}-01` : '';
            // 월의 마지막 날짜를 정확히 계산
            let endDate = '';
            if (selectedMonth) {
               const [year, month] = selectedMonth.split('-').map(Number);
               const lastDay = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날
               endDate = `${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;
            }
            console.log('📊 지출 조회:', { startDate, endDate });
            const expenses = await expenseAPI.getExpenses(userId, startDate, endDate);
            console.log('💸 지출 데이터:', expenses);
            console.log('💸 지출 데이터 개수:', expenses.length);
            console.log('💸 지출 데이터 상세:', expenses.map(e => ({
               id: e.id,
               amount: e.amount,
               category: e.category?.name,
               date: e.expense_date
            })));

            // 총 지출 계산
            const totalSpentAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            console.log('💸 총 지출 금액:', totalSpentAmount);
            setTotalSpent(totalSpentAmount);

            // 카테고리별 지출 데이터 생성
            const categoryMap = new Map<string, number>();
            expenses.forEach(expense => {
               const category = expense.category?.name || '기타';
               categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
            });

            const expenseDataArray: ExpenseData[] = Array.from(categoryMap.entries()).map(([category, amount], index) => ({
               category,
               amount,
               color: COLORS[index % COLORS.length],
               percentage: totalSpentAmount > 0 ? (amount / totalSpentAmount) * 100 : 0
            }));

            console.log('📊 카테고리별 데이터:', expenseDataArray);
            setExpenseData(expenseDataArray);

            // 최근 지출 내역 (최대 10개)
            console.log('📋 최근 지출 내역:', expenses.slice(0, 10));
            setRecentExpenses(expenses.slice(0, 10));

            // 월별 데이터 (현재 월만)
            const monthlyDataArray: MonthlyData[] = [{
               month: selectedMonth || 'N/A',
               budget: budgetAmount,
               spent: totalSpentAmount,
               remaining: budgetAmount - totalSpentAmount
            }];
            setMonthlyData(monthlyDataArray);

         } catch (error) {
            console.error('대시보드 데이터 로드 오류:', error);
            console.error('오류 상세:', error);

            // 오류 발생 시 테스트 데이터 표시
            console.log('🧪 테스트 데이터로 대체');
            setTotalBudget(200000);
            setTotalSpent(0);
            setExpenseData([]);
            setRecentExpenses([]);
            setMonthlyData([{
               month: selectedMonth || 'N/A',
               budget: 200000,
               spent: 0,
               remaining: 200000
            }]);
         } finally {
            setLoading(false);
         }
      };

      loadDashboardData();
   }, [selectedMonth, refreshTrigger]); // selectedMonth 또는 refreshTrigger가 변경될 때마다 데이터 로드

   const remainingBudget = totalBudget - totalSpent;
   const budgetPercentage = (totalSpent / totalBudget) * 100;

   if (loading) {
      return (
         <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
               <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
               <div className="h-64 bg-gray-200 rounded"></div>
            </div>
         </div>
      );
   }

   // 데이터가 없을 때의 메시지 (테스트용으로 주석 처리)
   // if (totalBudget === 0 && totalSpent === 0) {
   //    return (
   //       <div className="space-y-6">
   //          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
   //             <div className="text-6xl mb-4">📊</div>
   //             <h3 className="text-2xl font-semibold text-gray-800 mb-2">데이터가 없습니다</h3>
   //             <p className="text-gray-600 mb-6">
   //                예산을 설정하고 지출을 기록해보세요!
   //             </p>
   //             <div className="space-y-2 text-sm text-gray-500">
   //                <p>• 예산 설정 탭에서 월별 예산을 설정하세요</p>
   //                <p>• 지출 관리 탭에서 지출을 추가하세요</p>
   //                <p>• AI 챗봇으로 자연어로 지출을 기록하세요</p>
   //             </div>
   //          </div>
   //       </div>
   //    );
   // }

   return (
      <div className="space-y-6">
         {/* Connection status and data information display */}
         <div className="mb-4 flex flex-wrap gap-2">
            {isSupabaseConnected ? (
               <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  ✅ Supabase Connected
               </div>
            ) : (
               <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                  ⚠️ Local Storage Mode (Supabase Disconnected)
               </div>
            )}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
               📅 {selectedMonth} Data
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
               💰 Budget: €{totalBudget.toLocaleString()}
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
               💸 Expenses: €{totalSpent.toLocaleString()} ({recentExpenses.length} items)
            </div>
         </div>

         {/* Budget Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-blue-100 text-sm">{selectedMonth} Total Budget</p>
                     <p className="text-2xl font-bold">€{totalBudget.toLocaleString()}</p>
                  </div>
                  <div className="text-3xl">💰</div>
               </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-red-100 text-sm">{selectedMonth} Expenses</p>
                     <p className="text-2xl font-bold">€{totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="text-3xl">💸</div>
               </div>
            </div>

            <div className={`bg-gradient-to-r ${remainingBudget >= 0 ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'} rounded-lg p-6 text-white`}>
               <div className="flex items-center justify-between">
                  <div>
                     <p className={`${remainingBudget >= 0 ? 'text-green-100' : 'text-orange-100'} text-sm`}>
                        {remainingBudget >= 0 ? `${selectedMonth} Remaining Budget` : `${selectedMonth} Over Budget`}
                     </p>
                     <p className="text-2xl font-bold">
                        {remainingBudget >= 0 ? '+' : ''}€{remainingBudget.toLocaleString()}
                     </p>
                  </div>
                  <div className="text-3xl">{remainingBudget >= 0 ? '✅' : '⚠️'}</div>
               </div>
            </div>
         </div>

         {/* Budget Progress */}
         <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Usage Rate</h3>
            <div className="space-y-4">
               <div className="flex justify-between text-sm text-gray-600">
                  <span>Usage Rate</span>
                  <span>{budgetPercentage.toFixed(1)}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                     className={`h-3 rounded-full transition-all duration-500 ${budgetPercentage > 100 ? 'bg-red-500' :
                        budgetPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                     style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  ></div>
               </div>
               <div className="flex justify-between text-xs text-gray-500">
                  <span>€0</span>
                  <span>€{totalBudget.toLocaleString()}</span>
               </div>
            </div>
         </div>

         {/* Chart Area */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Expense Pie Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Expenses by Category</h3>
                  <div className="text-sm text-gray-500">
                     {selectedMonth} • {expenseData.length} categories
                  </div>
               </div>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={expenseData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={100}
                           paddingAngle={5}
                           dataKey="amount"
                        >
                           {expenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip
                           formatter={(value: number) => [`€${value.toLocaleString()}`, 'Amount']}
                        />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-4">
                  {expenseData.map((item, index) => (
                     <div key={index} className="flex items-center space-x-2">
                        <div
                           className="w-3 h-3 rounded-full"
                           style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-gray-600">{item.category}</span>
                        <span className="text-sm font-medium">{item.percentage}%</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Monthly Expense Bar Chart */}
            <div className="bg-white rounded-lg shadow-lg p-6">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Monthly Budget vs Expenses</h3>
                  <div className="text-sm text-gray-500">
                     {selectedMonth} Analysis
                  </div>
               </div>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                           formatter={(value: number, name: string) => [
                              `€${value.toLocaleString()}`,
                              name === 'budget' ? 'Budget' : name === 'spent' ? 'Expenses' : 'Remaining'
                           ]}
                        />
                        <Legend />
                        <Bar dataKey="budget" fill="#4ECDC4" name="Budget" />
                        <Bar dataKey="spent" fill="#FF6B6B" name="Expenses" />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* Recent Expense History */}
         <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-800">Recent Expense History</h3>
               <div className="text-sm text-gray-500">
                  {selectedMonth} • Total {recentExpenses.length} items
               </div>
            </div>
            {recentExpenses.length > 0 ? (
               <div className="space-y-3">
                  {recentExpenses.map((expense, index) => (
                     <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                           <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">
                                 {expense.category?.name?.charAt(0) || 'O'}
                              </span>
                           </div>
                           <div>
                              <p className="font-semibold text-gray-800 text-lg">{expense.category?.name || 'Other'}</p>
                              <p className="text-sm text-gray-600">
                                 📍 {expense.place?.name || 'Other'} • 🎯 {expense.purpose?.name || 'Other'}
                              </p>
                              {expense.description && (
                                 <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                              )}
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-gray-800 text-xl">€{expense.amount.toLocaleString()}</p>
                           <p className="text-sm text-gray-500">{expense.expense_date}</p>
                           <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                 {expense.category?.name || 'Other'}
                              </span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="text-center py-12">
                  <div className="text-6xl mb-4">💸</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No expenses recorded yet</h4>
                  <p className="text-gray-500 mb-4">Expenses will be displayed here when added</p>
                  <div className="space-y-2 text-sm text-gray-400">
                     <p>• Add directly from the Expense Management tab</p>
                     <p>• Record using natural language with AI chatbot</p>
                     <p>• Example: "Had kimchi stew for lunch today for €8"</p>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
