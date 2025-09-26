'use client';

import { useState, useEffect } from 'react';

interface ExpenseFormProps {
   onSubmit: (expense: any) => void;
   onCancel: () => void;
}

export default function ExpenseForm({ onSubmit, onCancel }: ExpenseFormProps) {
   const [formData, setFormData] = useState({
      amount: '',
      category: '',
      purpose: '',
      place: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
   });

   const [categories] = useState([
      { id: 'food', name: 'Food', color: '#FF6B6B', icon: '🍽️' },
      { id: 'transport', name: 'Transportation', color: '#4ECDC4', icon: '🚇' },
      { id: 'shopping', name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
      { id: 'medical', name: 'Medical', color: '#96CEB4', icon: '🏥' },
      { id: 'communication', name: 'Communication', color: '#FFEAA7', icon: '📱' },
      { id: 'education', name: 'Education', color: '#DDA0DD', icon: '📚' },
      { id: 'culture', name: 'Culture', color: '#98D8C8', icon: '🎬' },
      { id: 'other', name: 'Other', color: '#F7DC6F', icon: '📦' }
   ]);

   const [places] = useState([
      { id: 'home', name: 'Home', icon: '🏠' },
      { id: 'office', name: 'Office', icon: '🏢' },
      { id: 'cafe', name: 'Cafe', icon: '☕' },
      { id: 'restaurant', name: 'Restaurant', icon: '🍴' },
      { id: 'mart', name: 'Mart', icon: '🛒' },
      { id: 'online', name: 'Online', icon: '💻' },
      { id: 'hospital', name: 'Hospital', icon: '🏥' },
      { id: 'school', name: 'School', icon: '🎓' },
      { id: 'other', name: 'Other', icon: '📍' }
   ]);

   const [purposes] = useState([
      { id: 'meal', name: 'Meal', icon: '🍽️' },
      { id: 'snack', name: 'Snack', icon: '🍿' },
      { id: 'meeting', name: 'Meeting', icon: '👥' },
      { id: 'personal', name: 'Personal Items', icon: '🧴' },
      { id: 'household', name: 'Household Items', icon: '🧽' },
      { id: 'clothing', name: 'Clothing', icon: '👕' },
      { id: 'transport', name: 'Transportation', icon: '🚇' },
      { id: 'medical', name: 'Medical', icon: '🏥' },
      { id: 'education', name: 'Education', icon: '📚' },
      { id: 'culture', name: 'Culture', icon: '🎬' },
      { id: 'other', name: 'Other', icon: '📦' }
   ]);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.amount && formData.category && formData.purpose && formData.place) {
         onSubmit({
            ...formData,
            amount: parseFloat(formData.amount)
         });
      }
   };

   const selectedCategory = categories.find(c => c.id === formData.category);
   const selectedPlace = places.find(p => p.id === formData.place);
   const selectedPurpose = purposes.find(p => p.id === formData.purpose);

   return (
      <div className="bg-white rounded-lg shadow-lg p-6">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add Expense</h2>
            <button
               onClick={onCancel}
               className="text-gray-400 hover:text-gray-600 text-2xl"
            >
               ×
            </button>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (€) *
               </label>
               <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="e.g. 8"
                  required
               />
            </div>

            {/* Date Input */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
               </label>
               <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
               />
            </div>

            {/* Category Selection */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category *
               </label>
               <div className="grid grid-cols-4 gap-3">
                  {categories.map((category) => (
                     <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: category.id })}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${formData.category === category.id
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-200 hover:border-gray-300'
                           }`}
                     >
                        <div className="text-center">
                           <div className="text-2xl mb-1">{category.icon}</div>
                           <div className="text-sm font-medium text-gray-700">{category.name}</div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            {/* Place Selection */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                  Place *
               </label>
               <div className="grid grid-cols-3 gap-3">
                  {places.map((place) => (
                     <button
                        key={place.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, place: place.id })}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${formData.place === place.id
                           ? 'border-green-500 bg-green-50'
                           : 'border-gray-200 hover:border-gray-300'
                           }`}
                     >
                        <div className="text-center">
                           <div className="text-xl mb-1">{place.icon}</div>
                           <div className="text-sm font-medium text-gray-700">{place.name}</div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            {/* Purpose Selection */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                  Purpose *
               </label>
               <div className="grid grid-cols-3 gap-3">
                  {purposes.map((purpose) => (
                     <button
                        key={purpose.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, purpose: purpose.id })}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${formData.purpose === purpose.id
                           ? 'border-purple-500 bg-purple-50'
                           : 'border-gray-200 hover:border-gray-300'
                           }`}
                     >
                        <div className="text-center">
                           <div className="text-xl mb-1">{purpose.icon}</div>
                           <div className="text-sm font-medium text-gray-700">{purpose.name}</div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            {/* Description Input */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
               </label>
               <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter additional description for the expense"
               />
            </div>

            {/* Selected Items Summary */}
            {(selectedCategory || selectedPlace || selectedPurpose) && (
               <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Items</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                     {selectedCategory && (
                        <div className="flex items-center space-x-2">
                           <span>{selectedCategory.icon}</span>
                           <span className="text-gray-600">{selectedCategory.name}</span>
                        </div>
                     )}
                     {selectedPlace && (
                        <div className="flex items-center space-x-2">
                           <span>{selectedPlace.icon}</span>
                           <span className="text-gray-600">{selectedPlace.name}</span>
                        </div>
                     )}
                     {selectedPurpose && (
                        <div className="flex items-center space-x-2">
                           <span>{selectedPurpose.icon}</span>
                           <span className="text-gray-600">{selectedPurpose.name}</span>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
               <button
                  type="submit"
                  disabled={!formData.amount || !formData.category || !formData.purpose || !formData.place}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                  Add Expense
               </button>
               <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
               >
                  Cancel
               </button>
            </div>
         </form>
      </div>
   );
}
