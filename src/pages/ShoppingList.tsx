import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit, X, ExternalLink, ChevronDown, ChevronUp, Trash } from 'lucide-react';

interface ProductVariant {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  store: string;
  storeUrl?: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  products: ProductVariant[];
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
}

interface AddModalProps {
  onClose: () => void;
  onSave: (item: Omit<ShoppingItem, 'id'>) => void;
}

interface EditModalProps {
  item: ShoppingItem;
  onClose: () => void;
  onSave: (item: ShoppingItem) => void;
}

function AddItemModal({ onClose, onSave }: AddModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState<Omit<ProductVariant, 'id'>[]>([]);
  const [currentProduct, setCurrentProduct] = useState({
    productName: '',
    price: 0,
    quantity: 0,
    unit: '',
    store: '',
    storeUrl: ''
  });

  const handleAddProduct = () => {
    const pricePerUnit = currentProduct.price / currentProduct.quantity;
    setProducts([...products, { ...currentProduct, pricePerUnit }]);
    setCurrentProduct({
      productName: '',
      price: 0,
      quantity: 0,
      unit: '',
      store: '',
      storeUrl: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      category,
      completed: false,
      products: products.map((p, index) => ({ ...p, id: `temp-${index}` }))
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Add Shopping Item</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Item Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Product Variants</h3>
          
          <div className="space-y-4 mb-4">
            {products.map((product, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">{product.productName}</span>
                  <button
                    type="button"
                    onClick={() => setProducts(products.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>${product.price.toFixed(2)} for {product.quantity} {product.unit}</p>
                  <p>${product.pricePerUnit.toFixed(2)} per {product.unit}</p>
                  <p>Store: {product.store}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input
                  type="text"
                  value={currentProduct.productName}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, productName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <input
                  type="text"
                  value={currentProduct.unit}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, unit: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <input
                  type="text"
                  value={currentProduct.store}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, store: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store URL (optional)</label>
                <input
                  type="url"
                  value={currentProduct.storeUrl}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, storeUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add Product Variant
            </button>
          </div>
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
            Save Item
          </button>
        </div>
      </form>
    </div>
  );
}

function EditItemModal({ item, onClose, onSave }: EditModalProps) {
  const [editedItem, setEditedItem] = useState<ShoppingItem>(item);
  const [currentProduct, setCurrentProduct] = useState({
    productName: '',
    price: 0,
    quantity: 0,
    unit: '',
    store: '',
    storeUrl: ''
  });

  const handleAddProduct = () => {
    const pricePerUnit = currentProduct.price / currentProduct.quantity;
    setEditedItem({
      ...editedItem,
      products: [...editedItem.products, { ...currentProduct, id: `temp-${Date.now()}`, pricePerUnit }]
    });
    setCurrentProduct({
      productName: '',
      price: 0,
      quantity: 0,
      unit: '',
      store: '',
      storeUrl: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedItem);
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Shopping Item</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Item Name</label>
          <input
            type="text"
            value={editedItem.name}
            onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            value={editedItem.category}
            onChange={(e) => setEditedItem({ ...editedItem, category: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Product Variants</h3>
          
          <div className="space-y-4 mb-4">
            {editedItem.products.map((product, index) => (
              <div key={product.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">{product.productName}</span>
                  <button
                    type="button"
                    onClick={() => setEditedItem({
                      ...editedItem,
                      products: editedItem.products.filter((_, i) => i !== index)
                    })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>${product.price.toFixed(2)} for {product.quantity} {product.unit}</p>
                  <p>${product.pricePerUnit.toFixed(2)} per {product.unit}</p>
                  <p>
                    Store: {product.store}
                    {product.storeUrl && (
                      <a
                        href={product.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 inline" />
                      </a>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input
                  type="text"
                  value={currentProduct.productName}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, productName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentProduct.price}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <input
                  type="text"
                  value={currentProduct.unit}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, unit: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <input
                  type="text"
                  value={currentProduct.store}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, store: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store URL (optional)</label>
                <input
                  type="url"
                  value={currentProduct.storeUrl}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, storeUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add Product Variant
            </button>
          </div>
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
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export function ShoppingList() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showVariants, setShowVariants] = useState<{ [key: string]: boolean }>({});

  // Function to fetch items for a specific list
  const fetchItems = async (listId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'shoppingLists', listId, 'items'));
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ShoppingItem));
      setItems(itemsData.sort((a, b) => a.name.localeCompare(b.name))); // Sort items alphabetically
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  useEffect(() => {
    const fetchShoppingLists = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'shoppingLists'));
        const lists = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ShoppingList));
        setShoppingLists(lists);
        if (lists.length > 0) {
          setCurrentList(lists[0]);
          fetchItems(lists[0].id); // Fetch items for the first list by default
        }
      } catch (error) {
        console.error('Error fetching shopping lists:', error);
      }
    };

    fetchShoppingLists();
  }, []);

  // Handle list selection from dropdown
  const handleListSelect = (list: ShoppingList) => {
    setCurrentList(list);
    setIsListDropdownOpen(false);
    fetchItems(list.id); // Fetch items for the selected list
  };

  // Handle adding a new list
  const handleAddList = async (listName: string) => {
    try {
      const newList = { name: listName, items: [] };
      const docRef = await addDoc(collection(db, 'shoppingLists'), newList);
      const newListWithId = { ...newList, id: docRef.id };
      setShoppingLists([...shoppingLists, newListWithId]);
      setCurrentList(newListWithId);
      fetchItems(newListWithId.id); // Fetch items for the newly created list
    } catch (error) {
      console.error('Error adding shopping list:', error);
    }
  };

  // Handle adding a new item to the current list
  const handleAddItem = async (newItem: Omit<ShoppingItem, 'id'>) => {
    if (!currentList) return;
    try {
      const docRef = await addDoc(collection(db, 'shoppingLists', currentList.id, 'items'), newItem);
      const newItemWithId = { ...newItem, id: docRef.id };
      setItems([...items, newItemWithId].sort((a, b) => a.name.localeCompare(b.name))); // Sort items alphabetically
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding shopping item:', error);
    }
  };

  // Handle saving edits to an item
  const handleSaveEdit = async (editedItem: ShoppingItem) => {
    if (!currentList) return;
    try {
      await updateDoc(doc(db, 'shoppingLists', currentList.id, 'items', editedItem.id), editedItem);
      setItems(items.map(item => item.id === editedItem.id ? editedItem : item).sort((a, b) => a.name.localeCompare(b.name))); // Sort items alphabetically
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating shopping item:', error);
    }
  };

  // Handle toggling item completion
  const toggleComplete = async (item: ShoppingItem) => {
    if (!currentList) return;
    try {
      const updatedItem = { ...item, completed: !item.completed };
      await updateDoc(doc(db, 'shoppingLists', currentList.id, 'items', item.id), { completed: !item.completed });
      setItems(items.map(i => i.id === item.id ? updatedItem : i).sort((a, b) => a.name.localeCompare(b.name))); // Sort items alphabetically
    } catch (error) {
      console.error('Error toggling item completion:', error);
    }
  };

  // Handle toggling variant visibility
  const toggleVariantVisibility = (itemId: string) => {
    setShowVariants(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Handle selecting items for deletion
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle deleting selected items
  const handleDeleteSelected = async () => {
    if (!currentList || selectedItems.length === 0) return;
    try {
      for (const itemId of selectedItems) {
        await deleteDoc(doc(db, 'shoppingLists', currentList.id, 'items', itemId));
      }
      setItems(items.filter(item => !selectedItems.includes(item.id)).sort((a, b) => a.name.localeCompare(b.name))); // Sort items alphabetically
      setSelectedItems([]);
    } catch (error) {
      console.error('Error deleting selected items:', error);
    }
  };

  // Handle deleting a single item
  const handleDeleteItem = async (itemId: string) => {
    if (!currentList) return;
    try {
      await deleteDoc(doc(db, 'shoppingLists', currentList.id, 'items', itemId));
      setItems(items.filter(item => item.id !== itemId).sort((a, b) => a.name.localeCompare(b.name))); // Sort items alphabetically
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping List</h1>
        <div className="relative">
          <button
            onClick={() => setIsListDropdownOpen(!isListDropdownOpen)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {currentList ? currentList.name : 'Select List'}
            {isListDropdownOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {isListDropdownOpen && (
            <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
              {shoppingLists.map(list => (
                <div
                  key={list.id}
                  onClick={() => handleListSelect(list)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {list.name}
                </div>
              ))}
              <div
                onClick={() => {
                  const listName = prompt('Enter new list name');
                  if (listName) {
                    handleAddList(listName);
                  }
                }}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                + New List
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash className="w-5 h-5" />
            Delete Selected
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="h-5 w-5 text-blue-600"
                  />
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleComplete(item)}
                    className="h-5 w-5 text-blue-600"
                  />
                  <span className={item.completed ? 'line-through text-gray-500' : 'font-medium'}>
                    {item.name}
                  </span>
                  <span className="text-sm text-gray-500">{item.category}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleVariantVisibility(item.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {showVariants[item.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setIsEditModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {showVariants[item.id] && item.products && item.products.length > 0 && (
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Product Options:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {item.products.map((product) => (
                      <div key={product.id} className="bg-gray-50 p-3 rounded">
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-gray-600">
                          <p>${product.price.toFixed(2)} for {product.quantity} {product.unit}</p>
                          <p>${product.pricePerUnit.toFixed(2)} per {product.unit}</p>
                          <p className="flex items-center">
                            Store: {product.store}
                            {product.storeUrl && (
                              <a
                                href={product.storeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <AddItemModal
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddItem}
          />
        </div>
      )}

      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <EditItemModal
            item={selectedItem}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            onSave={handleSaveEdit}
          />
        </div>
      )}
    </div>
  );
}
