import React from 'react';
import {
  ShoppingBag,
  Home,
  Zap,
  Droplets,
  Wifi,
  Package,
  HeartPulse,
  GraduationCap,
  Bus,
  Fuel,
  Utensils,
  Plane,
  Film,
  ShieldCheck,
  Receipt,
  Tag,
} from 'lucide-react';
import { ExpenseCategory } from '../types';

interface Props {
  category: ExpenseCategory;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<Props> = ({ category, className = 'w-4 h-4', size = 18 }) => {
  switch (category) {
    case 'Groceries':
      return <ShoppingBag size={size} className={className} />;
    case 'Rent':
      return <Home size={size} className={className} />;
    case 'Electricity':
      return <Zap size={size} className={className} />;
    case 'Water':
      return <Droplets size={size} className={className} />;
    case 'Internet & Mobile':
      return <Wifi size={size} className={className} />;
    case 'Household Supplies':
      return <Package size={size} className={className} />;
    case 'Medical':
      return <HeartPulse size={size} className={className} />;
    case 'Education':
      return <GraduationCap size={size} className={className} />;
    case 'Transport':
      return <Bus size={size} className={className} />;
    case 'Fuel':
      return <Fuel size={size} className={className} />;
    case 'Shopping':
      return <ShoppingBag size={size} className={className} />;
    case 'Dining':
      return <Utensils size={size} className={className} />;
    case 'Travel':
      return <Plane size={size} className={className} />;
    case 'Entertainment':
      return <Film size={size} className={className} />;
    case 'Insurance':
      return <ShieldCheck size={size} className={className} />;
    case 'Other':
    default:
      return <Receipt size={size} className={className} />;
  }
};

export const getCategoryColor = (category: ExpenseCategory): { bg: string; text: string } => {
  switch (category) {
    case 'Groceries':
      return { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700' };
    case 'Rent':
      return { bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700' };
    case 'Electricity':
      return { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700' };
    case 'Water':
      return { bg: 'bg-cyan-50 text-cyan-700', text: 'text-cyan-700' };
    case 'Internet & Mobile':
      return { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700' };
    case 'Medical':
      return { bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700' };
    case 'Education':
      return { bg: 'bg-purple-50 text-purple-700', text: 'text-purple-700' };
    case 'Dining':
      return { bg: 'bg-orange-50 text-orange-700', text: 'text-orange-700' };
    case 'Transport':
    case 'Fuel':
      return { bg: 'bg-teal-50 text-teal-700', text: 'text-teal-700' };
    default:
      return { bg: 'bg-slate-100 text-slate-700', text: 'text-slate-700' };
  }
};
