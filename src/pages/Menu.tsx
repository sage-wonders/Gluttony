import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit, X, Clock, Users, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  category: string;
  image: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: { name: string; quantity: string; unit: string }[];
  instructions: string[];
  mealType: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  mealType: string;
  recipes: Recipe[];
}

interface RecipeSelectionModalProps {
  onClose: () => void;
  onSave: (selectedRecipes: Recipe[]) => void;
  initialSelectedRecipes?: Recipe[];
  availableRecipes: Recipe[];
}

function RecipeSelectionModal({ onClose, onSave, initialSelectedRecipes = [], availableRecipes }: RecipeSelectionModalProps) {
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set(initialSelectedRecipes.map(r => r.id))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const categories = Array.from(new Set(availableRecipes.map(r => r.category)));
  
  const filteredRecipes = availableRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRecipeToggle = (recipe: Recipe) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipe.id)) {
      newSelected.delete(recipe.id);
    } else {
      newSelected.add(recipe.id);
    }
    setSelectedRecipes(newSelected);
  };

  const handleSave = () => {
    const selectedRecipesList = availableRecipes.filter(r => selectedRecipes.has(r.id));
    onSave(selectedRecipesList);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Select Recipes</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search recipes..."
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

          <div className="text-sm text-gray-600">
            {selectedRecipes.size} recipes selected
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                selectedRecipes.has(recipe.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleRecipeToggle(recipe)}
            >
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Prep: {recipe.prepTime}</span>
                    <span>Cook: {recipe.cookTime}</span>
                    <span>Serves: {recipe.servings}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={selectedRecipes.size === 0}
          >
            Add Selected Recipes
          </button>
        </div>
      </div>
    </div>
  );
}

interface MenuModalProps {
  onClose: () => void;
  onSave: (menu: Omit<MenuItem, 'id'>) => void;
  initialData?: MenuItem;
  isEdit?: boolean;
  availableRecipes: Recipe[];
}

function MenuModal({ onClose, onSave, initialData, isEdit = false, availableRecipes }: MenuModalProps) {
  const [formData, setFormData] = useState<Partial<MenuItem>>(
    initialData || {
      name: '',
      description: '',
      mealType: 'Breakfast',
      recipes: []
    }
  );
  const [isRecipeSelectionOpen, setIsRecipeSelectionOpen] = useState(false);

  const mealTypes = ['Breakfast', 'Lunch', 'Appetizers', 'Dinner', 'Desserts', 'Beverages'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Omit<MenuItem, 'id'>);
  };

  const handleRecipesSelected = (selectedRecipes: Recipe[]) => {
    setFormData({ ...formData, recipes: selectedRecipes });
    setIsRecipeSelectionOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Menu' : 'Create New Menu'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Menu Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              placeholder="e.g., Sunday Dinner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Meal Type</label>
            <select
              value={formData.mealType}
              onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {mealTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              required
              placeholder="Describe your menu..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Selected Recipes</label>
              <button
                type="button"
                onClick={() => setIsRecipeSelectionOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Select Recipes
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.recipes?.map((recipe) => (
                <div key={recipe.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{recipe.name}</h4>
                    <div className="text-sm text-gray-600">
                      <span>Prep: {recipe.prepTime}</span>
                      <span className="mx-2">•</span>
                      <span>Cook: {recipe.cookTime}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      recipes: formData.recipes?.filter(r => r.id !== recipe.id)
                    })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {(!formData.recipes || formData.recipes.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  No recipes selected. Click "Select Recipes" to add some.
                </div>
              )}
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
              disabled={!formData.recipes || formData.recipes.length === 0}
            >
              {isEdit ? 'Save Changes' : 'Create Menu'}
            </button>
          </div>
        </form>
      </div>

      {isRecipeSelectionOpen && (
        <RecipeSelectionModal
          onClose={() => setIsRecipeSelectionOpen(false)}
          onSave={handleRecipesSelected}
          initialSelectedRecipes={formData.recipes}
          availableRecipes={availableRecipes}
        />
      )}
    </div>
  );
}

function MenuDetailsModal({ menu, onClose, onEdit }: { menu: MenuItem; onClose: () => void; onEdit: () => void }) {
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleRecipe = (recipeId: string) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(recipeId)) {
      newExpanded.delete(recipeId); // Collapse the recipe
    } else {
      newExpanded.add(recipeId); // Expand the recipe
    }
    setExpandedRecipes(newExpanded); // Update the state
  };

  const handleRecipeClick = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation(); // Prevent event bubbling
    navigate('/recipes', { state: { selectedRecipeId: recipeId } });
  };

  const totalPrepTime = menu.recipes.reduce((total, recipe) => {
    const prepMinutes = parseInt(recipe.prepTime) || 0;
    return total + prepMinutes;
  }, 0);

  const totalCookTime = menu.recipes.reduce((total, recipe) => {
    const cookMinutes = parseInt(recipe.cookTime) || 0;
    return total + cookMinutes;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{menu.name}</h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:text-blue-800"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-gray-600">{menu.description}</p>
            <p className="text-sm text-gray-500 mt-2">Meal Type: {menu.mealType}</p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 border-t border-b py-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Total Prep: {totalPrepTime} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Total Cook: {totalCookTime} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Recipes: {menu.recipes.length}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Recipes</h3>
            {menu.recipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-start gap-4 p-4">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 
                        className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        onClick={(e) => handleRecipeClick(e, recipe.id)}
                      >
                        {recipe.name}
                      </h4>
                      <button
                        onClick={() => toggleRecipe(recipe.id)} // Toggle button
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {expandedRecipes.has(recipe.id) ? (
                          <ChevronUp className="w-5 h-5" /> // Expanded state
                        ) : (
                          <ChevronDown className="w-5 h-5" /> // Collapsed state
                        )}
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <span>Prep: {recipe.prepTime}</span>
                        <span>Cook: {recipe.cookTime}</span>
                        <span>Serves: {recipe.servings}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedRecipes.has(recipe.id) && ( // Expanded content
                  <div className="border-t px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Ingredients</h5>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {recipe.ingredients.map((ingredient, index) => (
                            <li key={index}>
                              {`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Instructions</h5>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                          {recipe.instructions.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Menu() {
  const location = useLocation();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('');

  useEffect(() => {
    if (location.state?.selectedRecipe) {
      setIsAddModalOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'menus'));
        const menuData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MenuItem));
        setMenus(menuData);
      } catch (error) {
        console.error('Error fetching menus:', error);
      }
    };

    const fetchRecipes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'menu'));
        const recipeData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Recipe));
        setRecipes(recipeData);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    fetchMenus();
    fetchRecipes();
  }, []);

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (menu: MenuItem) => {
    setSelectedMenu(menu);
    setIsEditModalOpen(true);
  };

  const handleView = (menu: MenuItem) => {
    setSelectedMenu(menu);
    setIsViewModalOpen(true);
  };

  const handleSaveNew = async (newMenu: Omit<MenuItem, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'menus'), newMenu);
      const savedMenu = { ...newMenu, id: docRef.id };
      setMenus([...menus, savedMenu]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding menu:', error);
    }
  };

  const handleSaveEdit = async (editedMenu: Omit<MenuItem, 'id'>) => {
    if (!selectedMenu) return;
    
    try {
      await updateDoc(doc(db, 'menus', selectedMenu.id), editedMenu);
      setMenus(menus.map(menu => 
        menu.id === selectedMenu.id ? { ...editedMenu, id: selectedMenu.id } : menu
      ));
      setIsEditModalOpen(false);
      setSelectedMenu(null);
    } catch (error) {
      console.error('Error updating menu:', error);
    }
  };

  const mealTypes = ['Breakfast', 'Lunch', 'Appetizers', 'Dinner', 'Desserts', 'Beverages'];

  const filteredMenus = menus.filter(menu => {
    const matchesSearch = 
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.recipes.some(recipe => 
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesMealType = !mealTypeFilter || menu.mealType === mealTypeFilter;
    
    return matchesSearch && matchesMealType;
  });

  const getMenuImages = (menu: MenuItem) => {
    const maxImages = 4;
    return menu.recipes.slice(0, maxImages).map(recipe => recipe.image);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menus</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Menu
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search menus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <select
          value={mealTypeFilter}
          onChange={(e) => setMealTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Meal Types</option>
          {mealTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleView(menu)}
          >
            <div className="relative h-48 grid grid-cols-2 grid-rows-2 gap-1 p-1">
              {getMenuImages(menu).map((image, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden"
                  style={{
                    gridColumn: index === 0 && menu.recipes.length === 1 ? 'span 2' : 'span 1',
                    gridRow: index === 0 && menu.recipes.length === 1 ? 'span 2' : 'span 1',
                  }}
                >
                  <img 
                    src={image}
                    alt={menu.recipes[index].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {menu.recipes.length > 4 && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  +{menu.recipes.length - 4} more
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">{menu.name}</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(menu);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-gray-600 mt-2">{menu.description}</p>
              <p className="text-sm text-gray-500 mt-2">Meal Type: {menu.mealType}</p>

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recipes:</h3>
                <div className="flex flex-wrap gap-2">
                  {menu.recipes.map((recipe) => (
                    <span
                      key={recipe.id}
                      className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                    >
                      {recipe.name}
                    </span>
                  ))}
                </div>
              </div>

              {menu.recipes.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Total: {menu.recipes.reduce((acc, recipe) => {
                        const prep = parseInt(recipe.prepTime) || 0;
                        const cook = parseInt(recipe.cookTime) || 0;
                        return acc + prep + cook;
                      }, 0)} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Serves: {menu.recipes[0]?.servings}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <MenuModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNew}
          availableRecipes={recipes}
        />
      )}

      {isEditModalOpen && selectedMenu && (
        <MenuModal
          initialData={selectedMenu}
          isEdit
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMenu(null);
          }}
          onSave={handleSaveEdit}
          availableRecipes={recipes}
        />
      )}

      {isViewModalOpen && selectedMenu && (
        <MenuDetailsModal
          menu={selectedMenu}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedMenu(null);
          }}
          onEdit={() => {
            setIsViewModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />
      )}
    </div>
  );
}