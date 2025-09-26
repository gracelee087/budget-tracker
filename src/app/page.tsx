'use client';

import { useState, useEffect } from 'react';
import { budgetAPI, expenseAPI, isSupabaseConnected } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import Chatbot from '@/components/Chatbot';
import ExpenseForm from '@/components/ExpenseForm';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budget, setBudget] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentBudget, setCurrentBudget] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 현재 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    setSelectedDate(`${year}-${month}`); // 월 형식으로 변경 (YYYY-MM)

    // Supabase 연결 상태 확인
    setIsSupabaseConnected(isSupabaseConnected);
  }, []);

  const handleSetBudget = async () => {
    if (!budget || !selectedDate) {
      setMessage('예산과 날짜를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 임시 사용자 ID (UUID 형식)
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const budgetAmount = parseFloat(budget);

      // 날짜 형식 변환 (YYYY-MM -> YYYY-MM-01)
      const budgetDate = selectedDate.includes('-') && selectedDate.length === 7
        ? `${selectedDate}-01`
        : selectedDate;

      await budgetAPI.setBudget(userId, budgetDate, budgetAmount);
      setMessage(`✅ ${selectedDate.substring(0, 7)} budget set to €${budgetAmount.toLocaleString()}!`);
      setBudget('');

      // Get current budget
      const current = await budgetAPI.getBudget(userId, budgetDate);
      setCurrentBudget(current);
      setRefreshTrigger(prev => prev + 1); // Dashboard refresh trigger
    } catch (error) {
      console.error('Budget setting error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetBudget = async () => {
    if (!selectedDate) {
      setMessage('Please select a date.');
      return;
    }

    setLoading(true);
    try {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      // Date format conversion (YYYY-MM -> YYYY-MM-01)
      const budgetDate = selectedDate.includes('-') && selectedDate.length === 7
        ? `${selectedDate}-01`
        : selectedDate;

      const budget = await budgetAPI.getBudget(userId, budgetDate);
      setCurrentBudget(budget);

      if (budget) {
        setMessage(`📊 ${selectedDate.substring(0, 7)} budget: €${budget.total_budget.toLocaleString()}`);
      } else {
        setMessage(`📊 ${selectedDate.substring(0, 7)} budget not set.`);
      }
    } catch (error) {
      console.error('Budget query error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (expense: any) => {
    console.log('Adding expense:', expense);
    setLoading(true);

    try {
      // Map ExpenseForm IDs to actual names for Supabase storage
      const categoryMapping: { [key: string]: string } = {
        'food': 'Food', 'transport': 'Transportation', 'shopping': 'Shopping', 'medical': 'Medical',
        'communication': 'Communication', 'education': 'Education', 'culture': 'Culture', 'other': 'Other'
      };

      const placeMapping: { [key: string]: string } = {
        'home': 'Home', 'office': 'Office', 'cafe': 'Cafe', 'restaurant': 'Restaurant',
        'mart': 'Mart', 'online': 'Online', 'hospital': 'Hospital', 'school': 'School', 'other': 'Other'
      };

      const purposeMapping: { [key: string]: string } = {
        'meal': 'Meal', 'snack': 'Snack', 'meeting': 'Meeting', 'personal': 'Personal Items',
        'household': 'Household Items', 'clothing': 'Clothing', 'transport': 'Transportation', 'medical': 'Medical',
        'education': 'Education', 'culture': 'Culture', 'other': 'Other'
      };

      // Save with name mapping (expenseAPI.addExpense finds ID by name and saves)
      await expenseAPI.addExpense({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        expense_date: expense.date,
        category_id: categoryMapping[expense.category] || null,
        purpose_id: purposeMapping[expense.purpose] || null,
        place_id: placeMapping[expense.place] || null,
        amount: expense.amount,
        description: expense.description
      });

      setShowExpenseForm(false);
      setMessage('✅ 지출이 추가되었습니다!');
      setRefreshTrigger(prev => prev + 1); // 대시보드 새로고침 트리거
    } catch (error) {
      console.error('지출 추가 오류:', error);
      setMessage(`❌ 지출 추가 중 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard selectedMonth={selectedDate} refreshTrigger={refreshTrigger} />;
      case 'budget':
        return (
          <div className="space-y-6">
            {/* Budget Setup Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                📅 Budget Setup
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Amount (€)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 3000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSetBudget}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {loading ? 'Setting...' : 'Set Budget'}
                </button>

                <button
                  onClick={handleGetBudget}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Get Budget'}
                </button>
              </div>

              {message && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800">{message}</p>
                </div>
              )}

              {currentBudget && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-semibold text-green-800 mb-2">Currently Set Budget</h3>
                  <p className="text-green-700">
                    <strong>{selectedDate}:</strong> €{currentBudget.total_budget.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Set on: {new Date(currentBudget.created_at).toLocaleDateString('en-US')}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Expense Management</h2>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  + Add Expense
                </button>
              </div>
              <p className="text-gray-600">Add and manage your expenses.</p>
            </div>
          </div>
        );
      case 'chatbot':
        return <Chatbot onExpenseAdded={() => setRefreshTrigger(prev => prev + 1)} />;
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reports</h2>
            <p className="text-gray-600">Detailed analysis reports will be displayed here.</p>
          </div>
        );
      default:
        return <Dashboard selectedMonth={selectedDate} refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 네비게이션 */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 연결 상태 표시 */}
        <div className="mb-4">
          {isSupabaseConnected ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              ✅ Supabase 연결됨
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              ⚠️ 로컬 스토리지 모드 (Supabase 미연결)
            </div>
          )}
        </div>

        {/* 메인 콘텐츠 */}
        {renderContent()}

        {/* 지출 추가 모달 */}
        {showExpenseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ExpenseForm
                onSubmit={handleExpenseSubmit}
                onCancel={() => setShowExpenseForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
