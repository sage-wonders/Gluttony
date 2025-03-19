import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  recipes: Recipe[];
}

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
  ingredients: { name: string; quantity: number; unit: string }[]; // Updated to match the actual structure
  instructions: string[]; // Updated to match the actual structure
}

export function MenuDetails() {
  const { id } = useParams<{ id: string }>(); // Get the menu ID from the URL
  const [menu, setMenu] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuDocRef = doc(db, 'menus', id); // Fetch the menu from Firestore
        const menuSnapshot = await getDoc(menuDocRef);
        if (menuSnapshot.exists()) {
          setMenu({ id: menuSnapshot.id, ...menuSnapshot.data() } as MenuItem);
        } else {
          console.error('Menu not found');
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    };

    fetchMenu();
  }, [id]);

  if (!menu) {
    return <div>Loading...</div>; // Show a loading state while fetching the menu
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{menu.name}</h1>
      <p className="text-gray-600 mb-6">{menu.description}</p>

      <div className="space-y-6">
        {menu.recipes.map((recipe) => (
          <div key={recipe.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">{recipe.name}</h2>
            <p className="text-gray-600 mb-4">{recipe.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Ingredients</h3>
                <ul className="list-disc list-inside">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Instructions</h3>
                <ol className="list-decimal list-inside">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}