export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FoodAnalysis extends MacroNutrients {
  name: string;
  analysis: string; // Advice or comment
}

export interface FoodEntry extends FoodAnalysis {
  id: string;
  timestamp: number; // Unix timestamp
  imageUrl?: string;
}

export type ViewState = 'dashboard' | 'camera' | 'calendar' | 'details' | 'settings';

export interface DayStats {
  date: string; // ISO date string YYYY-MM-DD
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  entries: FoodEntry[];
}
