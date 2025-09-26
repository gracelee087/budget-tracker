'use client';

import { useState, useRef, useEffect } from 'react';
import { llm } from '@/lib/huggingface';
import { expenseAPI, referenceAPI } from '@/lib/supabase';

interface Message {
   id: string;
   text: string;
   isUser: boolean;
   timestamp: Date;
   parsedData?: any;
}

interface ChatbotProps {
   onExpenseAdded?: () => void; // Callback when expense is added
}

export default function Chatbot({ onExpenseAdded }: ChatbotProps) {
   const [messages, setMessages] = useState<Message[]>([
      {
         id: '1',
         text: 'Hello! I\'ll help you record your expenses. For example, say "Had kimchi stew for lunch today for €8".',
         isUser: false,
         timestamp: new Date()
      }
   ]);
   const [inputText, setInputText] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [categories, setCategories] = useState<any[]>([]);
   const [places, setPlaces] = useState<any[]>([]);
   const [purposes, setPurposes] = useState<any[]>([]);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   // Scroll to bottom
   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

   useEffect(() => {
      scrollToBottom();
   }, [messages]);

   // Load reference data
   useEffect(() => {
      const loadReferenceData = async () => {
         try {
            const [cats, pls, purps] = await Promise.all([
               referenceAPI.getCategories(),
               referenceAPI.getPlaces(),
               referenceAPI.getPurposes()
            ]);
            setCategories(cats);
            setPlaces(pls);
            setPurposes(purps);
         } catch (error) {
            console.error('Reference data loading error:', error);
         }
      };

      loadReferenceData();
   }, []);

   const addMessage = (text: string, isUser: boolean, parsedData?: any) => {
      const newMessage: Message = {
         id: Date.now().toString(),
         text,
         isUser,
         timestamp: new Date(),
         parsedData
      };
      setMessages(prev => [...prev, newMessage]);
   };

   // Handle delete commands
   const handleDeleteCommand = async (parsed: any): Promise<string> => {
      console.log('Delete command processing:', parsed);

      try {
         const userId = '550e8400-e29b-41d4-a716-446655440000'; // UUID format
         let deletedCount = 0;

         if (parsed.category === 'DELETE_TODAY') {
            // Delete today's data
            const today = parsed.date;
            const todayKey = `expense_${userId}_${today}`;
            const todayData = localStorage.getItem(todayKey);

            if (todayData) {
               const expenses = JSON.parse(todayData);
               deletedCount = expenses.length;
               localStorage.removeItem(todayKey);
            }

            return `🗑️ Today's (${today}) expenses ${deletedCount} items have been deleted.`;
         }

         if (parsed.category === 'DELETE_YESTERDAY') {
            // Delete yesterday's data
            const yesterday = parsed.date;
            const yesterdayKey = `expense_${userId}_${yesterday}`;
            const yesterdayData = localStorage.getItem(yesterdayKey);

            if (yesterdayData) {
               const expenses = JSON.parse(yesterdayData);
               deletedCount = expenses.length;
               localStorage.removeItem(yesterdayKey);
            }

            return `🗑️ Yesterday's (${yesterday}) expenses ${deletedCount} items have been deleted.`;
         }

         if (parsed.category.startsWith('DELETE_') && parsed.category !== 'DELETE_ALL') {
            // Delete specific category
            const category = parsed.category.replace('DELETE_', '');

            // Check all dates' data to delete the specific category
            const allKeys = Object.keys(localStorage);
            const expenseKeys = allKeys.filter(key => key.startsWith(`expense_${userId}_`));

            for (const key of expenseKeys) {
               const data = localStorage.getItem(key);
               if (data) {
                  const expenses = JSON.parse(data);
                  const filteredExpenses = expenses.filter((expense: any) => expense.category !== category);

                  if (filteredExpenses.length !== expenses.length) {
                     deletedCount += expenses.length - filteredExpenses.length;
                     if (filteredExpenses.length > 0) {
                        localStorage.setItem(key, JSON.stringify(filteredExpenses));
                     } else {
                        localStorage.removeItem(key);
                     }
                  }
               }
            }

            return `🗑️ "${category}" category expenses ${deletedCount} items have been deleted.`;
         }

         if (parsed.category === 'DELETE_ALL') {
            // Delete all data
            const allKeys = Object.keys(localStorage);
            const expenseKeys = allKeys.filter(key => key.startsWith(`expense_${userId}_`));

            for (const key of expenseKeys) {
               const data = localStorage.getItem(key);
               if (data) {
                  const expenses = JSON.parse(data);
                  deletedCount += expenses.length;
               }
               localStorage.removeItem(key);
            }

            return `🗑️ All expense data ${deletedCount} items have been deleted.`;
         }

         return `❌ No data found to delete.`;
      } catch (error) {
         console.error('Delete error:', error);
         return `❌ An error occurred while deleting: ${error}`;
      }
   };

   const handleSendMessage = async () => {
      if (!inputText.trim() || isLoading) return;

      const userMessage = inputText.trim();
      setInputText('');
      setIsLoading(true);

      // Add user message
      addMessage(userMessage, true);

      try {
         // Parse with LLM
         const parsed = await llm.parseExpense(userMessage);

         // Handle delete commands
         if (parsed.category.startsWith('DELETE_')) {
            const deleteResult = await handleDeleteCommand(parsed);
            addMessage(deleteResult, false, parsed);
            return;
         }

         // Generate response with parsed data
         let responseText = '';

         if (parsed.amount > 0) {
            responseText = `✅ Expense recorded!\n\n`;
            responseText += `📅 Date: ${parsed.date}\n`;
            responseText += `💰 Amount: €${parsed.amount.toLocaleString()}\n`;
            responseText += `📂 Category: ${parsed.category}\n`;
            responseText += `📍 Place: ${parsed.place}\n`;
            responseText += `🎯 Purpose: ${parsed.purpose}\n\n`;
            responseText += `💾 Automatically saved!`;

            // Actually save to database
            try {
               await expenseAPI.addExpense({
                  user_id: '550e8400-e29b-41d4-a716-446655440000', // UUID format
                  expense_date: parsed.date,
                  category_id: parsed.category, // Pass as name (expenseAPI will find ID by name)
                  purpose_id: parsed.purpose, // Pass as name
                  place_id: parsed.place, // Pass as name
                  amount: parsed.amount,
                  description: parsed.description
               });
               console.log('Expense successfully saved!');

               // Dashboard refresh trigger
               if (onExpenseAdded) {
                  onExpenseAdded();
               }
            } catch (error) {
               console.error('Save error:', error);
               responseText = responseText.replace('💾 Automatically saved!', `⚠️ Error while saving: ${error}`);
            }
         } else {
            responseText = `❌ Amount not found. Please include amount like "€8".`;
         }

         addMessage(responseText, false, parsed);
      } catch (error) {
         addMessage(`❌ An error occurred: ${error}`, false);
      } finally {
         setIsLoading(false);
      }
   };

   const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
         e.preventDefault();
         handleSendMessage();
      }
   };

   const suggestions = [
      "Had kimchi stew for lunch today for €8",
      "Paid €1.5 for subway",
      "Bought americano at cafe for €4.5",
      "Grocery shopping at mart for €25",
      "Delete today's data",
      "Delete yesterday's data",
      "Delete food expenses",
      "Delete all data"
   ];

   return (
      <div className="bg-white rounded-lg shadow-lg h-96 flex flex-col">
         {/* Header */}
         <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">🤖 Expense Recording Chatbot</h3>
            <p className="text-sm text-gray-600">Record expenses using natural language</p>
         </div>

         {/* Message Area */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
               <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
               >
                  <div
                     className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.isUser
                        ? 'bg-white text-gray-900 border-2 border-gray-400 font-medium'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                  >
                     <p className="whitespace-pre-line">{message.text}</p>
                     {message.parsedData && (
                        <div className="mt-2 p-2 bg-white bg-opacity-20 rounded text-xs">
                           <div>💰 €{message.parsedData.amount.toLocaleString()}</div>
                           <div>📂 {message.parsedData.category}</div>
                           <div>📍 {message.parsedData.place}</div>
                        </div>
                     )}
                  </div>
               </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                     <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span>Analyzing...</span>
                     </div>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* Suggestion Buttons */}
         <div className="p-4 border-t border-gray-200">
            <div className="mb-3">
               <p className="text-sm text-gray-600 mb-2">💡 Examples:</p>
               <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                     <button
                        key={index}
                        onClick={() => setInputText(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                     >
                        {suggestion}
                     </button>
                  ))}
               </div>
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
               <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter expense in natural language..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                  disabled={isLoading}
               />
               <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  Send
               </button>
            </div>
         </div>
      </div>
   );
}
