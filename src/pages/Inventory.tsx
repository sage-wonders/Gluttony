import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // Ensure unit is part of the interface
  category: string;
  expirationDate?: string;
  location?: string;
  notes?: string;
}

interface ItemModalProps {
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => void;
  initialData?: InventoryItem;
  isEdit?: boolean;
}

function ItemModal({ onClose, onSave, initialData, isEdit = false }: ItemModalProps) {
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>(
    initialData || {
      name: '',
      quantity: 0,
      unit: '', // Ensure unit is initialized
      category: '',
      expirationDate: '',
      location: '',
      notes: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                <option value="Produce">Produce</option>
                <option value="Meat">Meat</option>
                <option value="Dairy">Dairy</option>
                <option value="Snacks">Snacks</option>
                <option value="Frozen">Frozen</option>
                <option value="Spices">Spices</option>
                <option value="Staples">Staples</option>
                <option value="Condiments">Condiments</option>
                <option value="Beverages">Beverages</option>
                <option value="Baking">Baking</option>
                <option value="Pre-made">Pre-made</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit/Weight</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., kg, lbs, pieces"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Pantry, Fridge"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about the item..."
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
              {isEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as InventoryItem));
        setInventory(items);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    fetchInventory();
  }, []);

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'inventory', item.id));
        setInventory(inventory.filter(i => i.id !== item.id));
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleSaveNew = async (newItem: Omit<InventoryItem, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), newItem);
      setInventory([...inventory, { ...newItem, id: docRef.id }]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  const handleSaveEdit = async (editedItem: Omit<InventoryItem, 'id'>) => {
    if (!selectedItem) return;
    
    try {
      await updateDoc(doc(db, 'inventory', selectedItem.id), editedItem);
      setInventory(inventory.map(item => 
        item.id === selectedItem.id ? { ...editedItem, id: selectedItem.id } : item
      ));
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(inventory.map(item => item.category)));

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expirationDate = new Date(date);
    const today = new Date();
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 7 && daysUntilExpiration >= 0;
  };

  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      <div className="mb-6 flex gap-4 flex-col md:flex-row">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="hidden md:block">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit/Weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.expirationDate && (isExpiringSoon(item.expirationDate) || isExpired(item.expirationDate)) && (
                        <AlertCircle className={`w-4 h-4 ml-2 ${
                          isExpired(item.expirationDate) ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                      )}
                    </div>
                    {item.notes && (
                      <div className="text-sm text-gray-500">{item.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-sm rounded-full bg-gray-100">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.location || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`${
                      isExpired(item.expirationDate)
                        ? 'text-red-600'
                        : isExpiringSoon(item.expirationDate)
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}>
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString()
                        : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden">
          {filteredInventory.map((item) => (
            <div key={item.id} className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div className="text-lg font-medium text-gray-900">{item.name}</div>
                {item.expirationDate && (isExpiringSoon(item.expirationDate) || isExpired(item.expirationDate)) && (
                  <AlertCircle className={`w-4 h-4 ml-2 ${
                    isExpired(item.expirationDate) ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                )}
              </div>
              {item.notes && (
                <div className="text-sm text-gray-500 mt-2">{item.notes}</div>
              )}
              <div className="mt-2">
                <span className="px-2 py-1 text-sm rounded-full bg-gray-100">{item.category}</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-700">Quantity: {item.quantity}</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-700">Unit/Weight: {item.unit}</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-700">Location: {item.location || '-'}</span>
              </div>
              <div className="mt-2">
                <span className={`text-sm ${
                  isExpired(item.expirationDate)
                    ? 'text-red-600'
                    : isExpiringSoon(item.expirationDate)
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`}>
                  Expiration: {item.expirationDate
                    ? new Date(item.expirationDate).toLocaleDateString()
                    : '-'}
                </span>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAddModalOpen && (
        <ItemModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNew}
        />
      )}

      {isEditModalOpen && selectedItem && (
        <ItemModal
          initialData={selectedItem}
          isEdit
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
