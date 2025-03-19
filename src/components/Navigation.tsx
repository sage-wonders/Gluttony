import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Menu as MenuIcon, Book, Package, ShoppingCart, BookOpen } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/menu" className="flex flex-col items-center gap-1">
            <MenuIcon className="w-6 h-6 text-gray-700" />
            <span className="text-xs">Menu</span>
          </Link>
          <Link to="/calendar" className="flex flex-col items-center gap-1">
            <Calendar className="w-6 h-6 text-gray-700" />
            <span className="text-xs">Calendar</span>
          </Link>
          <Link to="/recipes" className="flex flex-col items-center gap-1">
            <Book className="w-6 h-6 text-gray-700" />
            <span className="text-xs">Recipes</span>
          </Link>
          <Link to="/inventory" className="flex flex-col items-center gap-1">
            <Package className="w-6 h-6 text-gray-700" />
            <span className="text-xs">Stock</span>
          </Link>
          <Link to="/shopping" className="flex flex-col items-center gap-1">
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            <span className="text-xs">Shopping</span>
          </Link>
          <Link to="/diary" className="flex flex-col items-center gap-1">
            <BookOpen className="w-6 h-6 text-gray-700" />
            <span className="text-xs">Diary</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
