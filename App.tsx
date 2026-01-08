import React, { useState, useEffect, useRef } from 'react';
import { analyzeFoodImage } from './services/geminiService';
import { FoodEntry, ViewState, DayStats } from './types';
import MacroChart from './components/MacroChart';
import WeeklyChart from './components/WeeklyChart';
import { CameraIcon, HomeIcon, CalendarIcon, FlameIcon, ChevronLeftIcon, MoonIcon, SunIcon, GearIcon } from './components/Icon';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<FoodEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutrisnap_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save to local storage whenever entries change
  useEffect(() => {
    localStorage.setItem('nutrisnap_entries', JSON.stringify(entries));
  }, [entries]);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      setLoading(true);
      setView('camera'); // Switch to camera/analysis view

      try {
        const mimeType = file.type;
        const base64Data = base64String.split(',')[1];
        
        // Call service without passing API key explicitly
        const result = await analyzeFoodImage(base64Data, mimeType);
        
        const newEntry: FoodEntry = {
          ...result,
          id: Date.now().toString(),
          timestamp: Date.now(),
          imageUrl: base64String
        };
        
        setAnalyzedData(newEntry);
      } catch (error) {
        let message = "Erro ao analisar imagem.";
        if (error instanceof Error) {
            message = error.message;
        }
        alert(message);
        console.error(error);
        setView('dashboard');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmEntry = () => {
    if (analyzedData) {
      setEntries(prev => [analyzedData, ...prev]);
      setAnalyzedData(null);
      setPreviewImage(null);
      setView('dashboard');
    }
  };

  const cancelEntry = () => {
    setAnalyzedData(null);
    setPreviewImage(null);
    setView('dashboard');
  };

  // --- Aggregation Logic ---

  const getTodayStats = (): DayStats => {
    const today = new Date().toISOString().split('T')[0];
    return getStatsForDate(today);
  };

  const getStatsForDate = (dateStr: string): DayStats => {
    const dayEntries = entries.filter(e => {
      const eDate = new Date(e.timestamp).toISOString().split('T')[0];
      return eDate === dateStr;
    });

    return {
      date: dateStr,
      totalCalories: dayEntries.reduce((sum, e) => sum + e.calories, 0),
      totalProtein: dayEntries.reduce((sum, e) => sum + e.protein, 0),
      totalCarbs: dayEntries.reduce((sum, e) => sum + e.carbs, 0),
      totalFats: dayEntries.reduce((sum, e) => sum + e.fats, 0),
      entries: dayEntries
    };
  };

  const getWeeklyStats = () => {
    const stats = [];
    // Last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayStats = getStatsForDate(dateStr);
      
      stats.push({
        day: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        protein: dayStats.totalProtein,
        carbs: dayStats.totalCarbs,
        fats: dayStats.totalFats,
        totalCalories: dayStats.totalCalories
      });
    }
    return stats;
  };

  // --- Views ---

  const renderDashboard = () => {
    const stats = getTodayStats();
    const weeklyStats = getWeeklyStats();

    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Olá!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Pronto para comer saudável?</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('settings')}
              className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
              aria-label="Configurações"
            >
               <GearIcon className="w-5 h-5" />
            </button>
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 font-bold border border-transparent dark:border-green-800">
              NS
            </div>
          </div>
        </header>

        {/* Today's Summary Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-8 -mt-8 z-0 transition-colors"></div>
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Resumo de Hoje</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-4xl font-bold text-gray-900 dark:text-white transition-colors">{stats.totalCalories}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Kcal Consumidas</span>
              </div>
              <div className="w-24 h-24">
                <MacroChart protein={stats.totalProtein} carbs={stats.totalCarbs} fats={stats.totalFats} isDarkMode={darkMode} />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center transition-colors">
                <p className="text-xs text-blue-500 dark:text-blue-400 font-bold mb-1">Proteína</p>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{stats.totalProtein}g</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center transition-colors">
                <p className="text-xs text-green-500 dark:text-green-400 font-bold mb-1">Carbo</p>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">{stats.totalCarbs}g</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg text-center transition-colors">
                <p className="text-xs text-yellow-600 dark:text-yellow-500 font-bold mb-1">Gordura</p>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{stats.totalFats}g</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <WeeklyChart data={weeklyStats} isDarkMode={darkMode} />

        {/* Recent Entries */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors">Refeições Recentes</h3>
          {entries.length === 0 ? (
             <div className="text-center py-10 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 transition-colors">
               <p>Nenhuma refeição registrada ainda.</p>
               <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-green-600 dark:text-green-400 font-medium">Adicionar primeira refeição</button>
             </div>
          ) : (
            <div className="space-y-3">
              {entries.slice(0, 5).map(entry => (
                <div key={entry.id} className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-50 dark:border-gray-800 flex gap-3 items-center transition-colors">
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt={entry.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">{entry.name}</h4>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">{entry.calories} kcal</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {entry.analysis.substring(0, 40)}...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCameraAnalysis = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full pb-20 animate-pulse">
           <div className="w-64 h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-6 relative overflow-hidden transition-colors">
             {previewImage && <img src={previewImage} className="w-full h-full object-cover opacity-50" />}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
           </div>
           <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">Analisando...</h2>
           <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs transition-colors">Nossa IA está identificando os nutrientes da sua comida.</p>
        </div>
      );
    }

    if (!analyzedData) return null;

    return (
      <div className="pb-24 animate-fade-in">
        <div className="relative h-64 w-full -mx-4 -mt-4 mb-6">
           <img src={previewImage || ''} className="w-full h-full object-cover rounded-b-3xl shadow-md" />
           <button onClick={cancelEntry} className="absolute top-8 left-8 bg-white/80 dark:bg-gray-900/80 p-2 rounded-full backdrop-blur-sm text-gray-800 dark:text-white transition-colors">
             <ChevronLeftIcon className="w-6 h-6" />
           </button>
        </div>

        <div className="px-2">
          <div className="flex justify-between items-end mb-4">
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{analyzedData.name}</h1>
             <div className="flex items-center text-orange-500 font-bold text-xl">
               <FlameIcon className="w-6 h-6 mr-1" />
               {analyzedData.calories} kcal
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 transition-colors">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Macronutrientes</h3>
            <div className="grid grid-cols-3 gap-4">
               <div className="text-center">
                 <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analyzedData.protein}g</div>
                 <div className="text-xs text-gray-400 dark:text-gray-500">Proteína</div>
               </div>
               <div className="text-center border-l border-r border-gray-100 dark:border-gray-800">
                 <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analyzedData.carbs}g</div>
                 <div className="text-xs text-gray-400 dark:text-gray-500">Carbo</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{analyzedData.fats}g</div>
                 <div className="text-xs text-gray-400 dark:text-gray-500">Gordura</div>
               </div>
            </div>
            <div className="h-40 w-full mt-4">
                <MacroChart protein={analyzedData.protein} carbs={analyzedData.carbs} fats={analyzedData.fats} isDarkMode={darkMode} />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900/30 mb-8 transition-colors">
            <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-2 flex items-center">
              💡 Análise Nutricional
            </h3>
            <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
              {analyzedData.analysis}
            </p>
          </div>

          <button 
            onClick={confirmEntry}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all"
          >
            Salvar Refeição
          </button>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentMonthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      const dateStr = d.toISOString().split('T')[0];
      const stats = getStatsForDate(dateStr);
      return { date: dateStr, day: i + 1, stats };
    });

    return (
      <div className="pb-24 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 transition-colors">Histórico</h1>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 mb-6 transition-colors">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 capitalize">{currentMonthName}</h2>
          
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {['D','S','T','Q','Q','S','S'].map((d,i) => (
              <div key={i} className="text-gray-400 dark:text-gray-500 font-medium mb-2">{d}</div>
            ))}
            
            {days.map(d => {
              const hasData = d.stats.entries.length > 0;
              const isToday = d.date === new Date().toISOString().split('T')[0];
              const intensity = Math.min(d.stats.totalCalories / 2500, 1);
              
              return (
                <button 
                  key={d.date}
                  onClick={() => {
                    setSelectedDate(d.date);
                    setView('details');
                  }}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center relative transition-colors
                    ${isToday ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
                    ${hasData ? 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                  `}
                >
                  <span className={`text-xs ${hasData ? 'font-bold text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{d.day}</span>
                  {hasData && (
                    <div 
                      className="w-1.5 h-1.5 rounded-full mt-1 bg-green-500" 
                      style={{ opacity: 0.5 + (intensity * 0.5) }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (!selectedDate) return null;
    const stats = getStatsForDate(selectedDate);
    const dateDisplay = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
      <div className="pb-24 animate-fade-in">
        <div className="flex items-center mb-6">
          <button onClick={() => setView('calendar')} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white ml-2 capitalize transition-colors">{dateDisplay}</h1>
        </div>

        {stats.entries.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p>Nenhum registro neste dia.</p>
          </div>
        ) : (
          <>
             <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex justify-between items-center transition-colors">
                <div>
                   <p className="text-gray-500 dark:text-gray-400 text-sm">Total Ingerido</p>
                   <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">{stats.totalCalories} <span className="text-sm font-normal text-gray-400">kcal</span></p>
                </div>
                <div className="w-24 h-24">
                    <MacroChart protein={stats.totalProtein} carbs={stats.totalCarbs} fats={stats.totalFats} isDarkMode={darkMode} />
                </div>
             </div>

             <div className="space-y-4">
               <h3 className="font-semibold text-gray-700 dark:text-gray-200">Refeições</h3>
               {stats.entries.map(entry => (
                 <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-50 dark:border-gray-800 transition-colors">
                    <div className="flex">
                      {entry.imageUrl && <div className="w-24 h-auto bg-gray-100 dark:bg-gray-800"><img src={entry.imageUrl} className="w-full h-full object-cover" /></div>}
                      <div className="p-3 flex-1">
                         <div className="flex justify-between">
                           <h4 className="font-bold text-gray-800 dark:text-white">{entry.name}</h4>
                           <span className="text-xs font-bold text-green-600 dark:text-green-400">{entry.calories} kcal</span>
                         </div>
                         <div className="flex gap-2 text-xs text-gray-400 dark:text-gray-500 mt-1 mb-2">
                           <span>P: {entry.protein}g</span>
                           <span>C: {entry.carbs}g</span>
                           <span>G: {entry.fats}g</span>
                         </div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-2 rounded transition-colors">"{entry.analysis}"</p>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="pb-24 animate-fade-in">
        <div className="flex items-center mb-6">
          <button onClick={() => setView('dashboard')} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white ml-2 transition-colors">Configurações</h1>
        </div>

        {/* API Key Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4 border border-blue-100 dark:border-blue-900/30 transition-colors">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Configuração da API</h3>
            <p className="text-xs text-blue-700 dark:text-blue-400">
                A chave de API agora é gerenciada via variáveis de ambiente para maior segurança.
                <br/><br/>
                <strong>Local:</strong> Crie um arquivo <code>.env</code> com <code>API_KEY=sua_chave</code>.
                <br/>
                <strong>Vercel:</strong> Adicione <code>API_KEY</code> nas configurações do projeto (Environment Variables).
            </p>
        </div>

        {/* Theme Toggle */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-4 transition-colors">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-orange-100 text-orange-500'} transition-colors`}>
                  {darkMode ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
               </div>
               <div>
                  <h3 className="font-bold text-gray-800 dark:text-white transition-colors">Modo Escuro</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alternar tema do aplicativo</p>
               </div>
             </div>
             <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-green-600' : 'bg-gray-300'}`}
             >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`}></div>
             </button>
           </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>NutriSnap AI v1.1</p>
          <p>Seus dados são salvos apenas no navegador.</p>
        </div>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-950`}>
      <main className="flex-1 p-4 overflow-y-auto no-scrollbar">
        {view === 'dashboard' && renderDashboard()}
        {view === 'camera' && renderCameraAnalysis()}
        {view === 'calendar' && renderCalendar()}
        {view === 'details' && renderDetails()}
        {view === 'settings' && renderSettings()}
      </main>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
        capture="environment" 
      />

      {/* Navigation Bar */}
      {view !== 'camera' && view !== 'settings' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 pb-6 flex justify-around items-center z-50 transition-colors duration-300">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Início</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-600/30 dark:shadow-green-500/30 active:scale-95 transition-all -mt-8 border-4 border-gray-50 dark:border-gray-950"
          >
            <CameraIcon className="w-7 h-7" />
          </button>

          <button 
            onClick={() => setView('calendar')}
            className={`flex flex-col items-center gap-1 ${view === 'calendar' || view === 'details' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}`}
          >
            <CalendarIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Histórico</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;