import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit, X, Calendar as CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';

interface DiaryEntry {
  id: string;
  date: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  notes: string;
  mood: string;
  water: number;
}

interface DiaryModalProps {
  onClose: () => void;
  onSave: (entry: Omit<DiaryEntry, 'id'>) => void;
  initialData?: DiaryEntry;
  isEdit?: boolean;
}

function DiaryModal({ onClose, onSave, initialData, isEdit = false }: DiaryModalProps) {
  const [formData, setFormData] = useState<Omit<DiaryEntry, 'id'>>(
    initialData || {
      date: format(new Date(), 'yyyy-MM-dd'),
      meals: {
        breakfast: [''],
        lunch: [''],
        dinner: [''],
        snacks: ['']
      },
      notes: '',
      mood: 'good',
      water: 0
    }
  );

  const handleMealChange = (mealType: keyof typeof formData.meals, index: number, value: string) => {
    const newMeals = { ...formData.meals };
    newMeals[mealType][index] = value;
    setFormData({ ...formData, meals: newMeals });
  };

  const addMealItem = (mealType: keyof typeof formData.meals) => {
    const newMeals = { ...formData.meals };
    newMeals[mealType] = [...newMeals[mealType], ''];
    setFormData({ ...formData, meals: newMeals });
  };

  const removeMealItem = (mealType: keyof typeof formData.meals, index: number) => {
    const newMeals = { ...formData.meals };
    newMeals[mealType] = newMeals[mealType].filter((_, i) => i !== index);
    setFormData({ ...formData, meals: newMeals });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Entry' : 'Add New Entry'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {Object.entries(formData.meals).map(([mealType, items]) => (
            <div key={mealType}>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {mealType}
                </label>
                <button
                  type="button"
                  onClick={() => addMealItem(mealType as keyof typeof formData.meals)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Add Item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleMealChange(mealType as keyof typeof formData.meals, index, e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder={`Add ${mealType} item...`}
                    />
                    <button
                      type="button"
                      onClick={() => removeMealItem(mealType as keyof typeof formData.meals, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700">Mood</label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="great">Great</option>
              <option value="good">Good</option>
              <option value="okay">Okay</option>
              <option value="not-great">Not Great</option>
              <option value="bad">Bad</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Water (glasses)</label>
            <input
              type="number"
              min="0"
              value={formData.water}
              onChange={(e) => setFormData({ ...formData, water: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isEdit ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDiaryEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'diary'));
        const diaryEntries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DiaryEntry));
        setEntries(diaryEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error('Error fetching diary entries:', error);
      }
    };

    fetchDiaryEntries();
  }, []);

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (entry: DiaryEntry) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteDoc(doc(db, 'diary', entry.id));
        setEntries(entries.filter(e => e.id !== entry.id));
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const handleSaveNew = async (newEntry: Omit<DiaryEntry, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'diary'), newEntry);
      const savedEntry = { ...newEntry, id: docRef.id };
      setEntries([savedEntry, ...entries]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding diary entry:', error);
    }
  };

  const handleSaveEdit = async (editedEntry: DiaryEntry) => {
    try {
      await updateDoc(doc(db, 'diary', editedEntry.id), editedEntry);
      setEntries(entries.map(entry => 
        entry.id === editedEntry.id ? editedEntry : entry
      ));
      setIsEditModalOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error updating diary entry:', error);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    return (
      format(new Date(entry.date), 'MMMM d, yyyy').toLowerCase().includes(searchLower) ||
      Object.values(entry.meals).some(mealItems =>
        mealItems.some(item => item.toLowerCase().includes(searchLower))
      ) ||
      entry.notes.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Food Diary</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Entry
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-6">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold">
                  {format(new Date(entry.date), 'MMMM d, yyyy')}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(entry)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(entry)}
                  className="text-red-600 hover:text-red-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(entry.meals).map(([mealType, items]) => (
                <div key={mealType} className="space-y-2">
                  <h3 className="font-medium capitalize">{mealType}</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium">Mood</h3>
                <p className="text-gray-600 capitalize">{entry.mood}</p>
              </div>
              <div>
                <h3 className="font-medium">Water</h3>
                <p className="text-gray-600">{entry.water} glasses</p>
              </div>
              {entry.notes && (
                <div className="md:col-span-3">
                  <h3 className="font-medium">Notes</h3>
                  <p className="text-gray-600">{entry.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <DiaryModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNew}
        />
      )}

      {isEditModalOpen && selectedEntry && (
        <DiaryModal
          initialData={selectedEntry}
          isEdit
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEntry(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
