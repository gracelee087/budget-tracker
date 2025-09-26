'use client';

import { useState } from 'react';

interface NavigationProps {
   activeTab: string;
   onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
   const tabs = [
      { id: 'dashboard', name: 'Dashboard', icon: '📊' },
      { id: 'budget', name: 'Budget Setup', icon: '💰' },
      { id: 'expenses', name: 'Expense Management', icon: '💸' },
      { id: 'chatbot', name: 'AI Chatbot', icon: '🤖' },
      { id: 'reports', name: 'Reports', icon: '📈' }
   ];

   return (
      <nav className="bg-white shadow-lg rounded-lg mb-6">
         <div className="px-6 py-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                  <div className="text-2xl">💰</div>
                  <h1 className="text-xl font-bold text-gray-800">BudgetMaster</h1>
               </div>

               <div className="flex space-x-1">
                  {tabs.map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === tab.id
                           ? 'bg-blue-500 text-white shadow-md'
                           : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                           }`}
                     >
                        <span className="text-lg">{tab.icon}</span>
                        <span className="font-medium">{tab.name}</span>
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </nav>
   );
}
