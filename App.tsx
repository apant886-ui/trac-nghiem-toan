import React, { useState, useEffect } from 'react';
import { generateQuestions, getLessonTopics } from './services/geminiService';
import { Question, AppConfig, Difficulty, QuestionType, Curriculum } from './types';
import PresentationView from './components/PresentationView';
import ExportView from './components/ExportView';
import { BookOpen, Presentation, FileText, Loader2, Sparkles, Check, School, BookMarked, RefreshCw, Cpu, Zap } from 'lucide-react';

enum AppMode {
  HOME = 'HOME',
  PRESENTATION = 'PRESENTATION',
  EXPORT = 'EXPORT'
}

// Data mẫu cho bộ sách "Kết nối tri thức"
const KNTT_CURRICULUM: Curriculum = {
  "10": [
    "Bài 1. Mệnh đề",
    "Bài 2. Tập hợp",
    "Bài 3. Bất phương trình bậc nhất hai ẩn",
    "Bài 4. Hệ bất phương trình bậc nhất hai ẩn",
    "Bài 5. Giá trị lượng giác của một góc từ 0 đến 180 độ",
    "Bài 6. Hệ thức lượng trong tam giác"
  ],
  "11": [
    "Bài 1. Giá trị lượng giác của góc lượng giác",
    "Bài 2. Công thức lượng giác",
    "Bài 3. Hàm số lượng giác",
    "Bài 4. Phương trình lượng giác cơ bản",
    "Bài 18. Lũy thừa với số mũ thực",
    "Bài 19. Logarit",
    "Bài 20. Hàm số mũ và hàm số logarit",
    "Bài 21. Phương trình, bất phương trình mũ và logarit"
  ],
  "12": [
    "Bài 1. Tính đơn điệu và cực trị của hàm số",
    "Bài 2. Giá trị lớn nhất và giá trị nhỏ nhất của hàm số",
    "Bài 3. Đường tiệm cận của đồ thị hàm số",
    "Bài 4. Khảo sát sự biến thiên và vẽ đồ thị hàm số",
    "Bài 5. Ứng dụng đạo hàm để giải quyết một số vấn đề thực tiễn",
    "Bài 6. Vectơ trong không gian",
    "Bài 7. Hệ trục tọa độ trong không gian",
    "Bài 8. Biểu thức tọa độ của các phép toán vectơ",
    "Bài 9. Khoảng biến thiên và khoảng tứ phân vị của mẫu số liệu ghép nhóm",
    "Bài 10. Phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm",
    "Bài 11. Nguyên hàm",
    "Bài 12. Tích phân",
    "Bài 13. Ứng dụng hình học của tích phân",
    "Bài 14. Phương trình mặt phẳng",
    "Bài 15. Phương trình đường thẳng trong không gian",
    "Bài 16. Công thức tính góc trong không gian",
    "Bài 17. Phương trình mặt cầu",
    "Bài 18. Xác suất có điều kiện",
    "Bài 19. Công thức xác suất toàn phần và công thức Bayes"
  ]
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false); // For analyzing topics
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Topics from AI
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const [config, setConfig] = useState<AppConfig>({
    grade: "11",
    lesson: "Bài 18. Lũy thừa với số mũ thực",
    topics: [],
    difficulty: Difficulty.UNDERSTANDING,
    questionTypes: [QuestionType.MCQ],
    quantity: 10,
    model: 'gemini-3-flash-preview' // Default model
  });

  // Fetch topics whenever Grade or Lesson changes manually, or on init
  const analyzeLesson = async (currentGrade: string, currentLesson: string) => {
    setIsAnalysing(true);
    setAvailableTopics([]);
    setConfig(prev => ({...prev, topics: []})); // Reset selected topics
    try {
      const topics = await getLessonTopics(currentGrade, currentLesson);
      setAvailableTopics(topics);
      // Auto-select all by default
      setConfig(prev => ({...prev, topics: topics}));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalysing(false);
    }
  };

  // Initial load
  useEffect(() => {
    analyzeLesson(config.grade, config.lesson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleGradeChange = (newGrade: string) => {
    const defaultLesson = KNTT_CURRICULUM[newGrade][0];
    setConfig(prev => ({ ...prev, grade: newGrade, lesson: defaultLesson }));
    analyzeLesson(newGrade, defaultLesson);
  };

  const handleLessonChange = (newLesson: string) => {
    setConfig(prev => ({ ...prev, lesson: newLesson }));
    analyzeLesson(config.grade, newLesson);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generated = await generateQuestions(config);
      setQuestions(generated);
      setMode(AppMode.PRESENTATION);
    } catch (err: unknown) {
      if(err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi không xác định");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopic = (t: string) => {
    setConfig(prev => {
      const exists = prev.topics.includes(t);
      return {
        ...prev,
        topics: exists ? prev.topics.filter(item => item !== t) : [...prev.topics, t]
      };
    });
  };

  if (mode === AppMode.PRESENTATION) {
    return <PresentationView questions={questions} onBack={() => setMode(AppMode.HOME)} />;
  }

  if (mode === AppMode.EXPORT) {
    return <ExportView questions={questions} onBack={() => setMode(AppMode.HOME)} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-6xl">
        <header className="flex flex-col md:flex-row items-center justify-between mb-10 pb-6 border-b border-slate-700">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-4 shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">AI Math Master Pro</h1>
              <p className="text-slate-400 text-sm">Kết Nối Tri Thức Với Cuộc Sống</p>
            </div>
          </div>
          <div className="flex space-x-3">
             <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-xs font-mono text-slate-300">
               v2.1 Pro
             </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Configuration Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-3xl p-6 shadow-xl">
               <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                  <School className="w-5 h-5 mr-2 text-indigo-400" />
                  Chọn Nội Dung Bài Học
               </h2>

               {/* Step 1: Grade Selection */}
               <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Khối Lớp</label>
                  <div className="flex space-x-2">
                    {["10", "11", "12"].map(g => (
                      <button
                        key={g}
                        onClick={() => handleGradeChange(g)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                          config.grade === g 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Step 2: Lesson Selection */}
               <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Bài Học (Kết nối tri thức)</label>
                  <div className="relative">
                    <BookMarked className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <select 
                      value={config.lesson}
                      onChange={(e) => handleLessonChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      {KNTT_CURRICULUM[config.grade].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
               </div>

               {/* Step 3: AI Analysis (Dynamic Topics) */}
               <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-slate-400">Chủ đề Kiến thức (AI Phân tích)</label>
                    <button 
                      onClick={() => analyzeLesson(config.grade, config.lesson)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center"
                      title="Phân tích lại"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isAnalysing ? 'animate-spin' : ''}`} /> Làm mới
                    </button>
                  </div>
                  
                  {isAnalysing ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-10 bg-slate-700/50 rounded-lg w-full"></div>
                      <div className="h-10 bg-slate-700/50 rounded-lg w-3/4"></div>
                      <div className="h-10 bg-slate-700/50 rounded-lg w-5/6"></div>
                    </div>
                  ) : availableTopics.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {availableTopics.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => toggleTopic(t)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm text-left transition-all ${
                            config.topics.includes(t)
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <span>{t}</span>
                          {config.topics.includes(t) && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm text-center">
                      Không tải được chủ đề. Vui lòng thử lại.
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* RIGHT: Advanced Settings & Actions */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
               <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                  Cấu Hình Chi Tiết Đề Thi
               </h2>

               {/* AI Model Selection */}
               <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Mô hình AI (Model)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setConfig({ ...config, model: 'gemini-3-flash-preview' })}
                      className={`flex flex-row items-center justify-between p-3 rounded-xl border transition-all group ${
                        config.model === 'gemini-3-flash-preview'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner'
                          : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <Zap className={`w-5 h-5 mr-3 ${config.model === 'gemini-3-flash-preview' ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`} />
                        <div className="text-left">
                           <span className="block font-bold text-sm">Gemini 3 Flash</span>
                           <span className="block text-xs opacity-70">Tốc độ cao</span>
                        </div>
                      </div>
                      {config.model === 'gemini-3-flash-preview' && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>

                    <button
                      onClick={() => setConfig({ ...config, model: 'gemini-3-pro-preview' })}
                      className={`flex flex-row items-center justify-between p-3 rounded-xl border transition-all group ${
                        config.model === 'gemini-3-pro-preview'
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-inner'
                          : 'bg-slate-900 border-slate-600 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center">
                        <Cpu className={`w-5 h-5 mr-3 ${config.model === 'gemini-3-pro-preview' ? 'text-purple-400' : 'text-slate-500'}`} />
                        <div className="text-left">
                           <span className="block font-bold text-sm">Gemini 3 Pro</span>
                           <span className="block text-xs opacity-70">Thông minh vượt trội</span>
                        </div>
                      </div>
                      {config.model === 'gemini-3-pro-preview' && <Check className="w-4 h-4 text-purple-400" />}
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Độ khó</label>
                    <select
                      value={config.difficulty}
                      onChange={(e) => setConfig({...config, difficulty: e.target.value as Difficulty})}
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value={Difficulty.RECOGNITION}>Nhận biết (Dễ)</option>
                      <option value={Difficulty.UNDERSTANDING}>Thông hiểu (Trung bình)</option>
                      <option value={Difficulty.APPLICATION}>Vận dụng (Khá)</option>
                      <option value={Difficulty.MIXED}>Hỗn hợp</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Số lượng câu</label>
                    <div className="flex items-center space-x-3 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3">
                       <input
                        type="range"
                        min="5" max="50" step="5"
                        value={config.quantity}
                        onChange={(e) => setConfig({...config, quantity: Number(e.target.value)})}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <span className="font-mono text-indigo-400 font-bold w-6 text-right">{config.quantity}</span>
                    </div>
                 </div>
               </div>

               <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Dạng câu hỏi</label>
                  <div className="flex flex-wrap gap-2">
                   {[QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.SHORT_ANSWER, QuestionType.ESSAY].map(type => (
                     <button
                        key={type}
                        onClick={() => {
                            if (config.questionTypes.includes(type) && config.questionTypes.length > 1) {
                                setConfig({...config, questionTypes: config.questionTypes.filter(t => t !== type)});
                            } else if (!config.questionTypes.includes(type)) {
                                setConfig({...config, questionTypes: [...config.questionTypes, type]});
                            }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            config.questionTypes.includes(type)
                            ? 'bg-white text-slate-900 shadow-md'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                     >
                       {type === QuestionType.MCQ ? 'Trắc nghiệm' : 
                        type === QuestionType.TRUE_FALSE ? 'Đúng/Sai' :
                        type === QuestionType.SHORT_ANSWER ? 'Trả lời ngắn' : 'Tự luận'}
                     </button>
                   ))}
                  </div>
               </div>

               {/* Action Buttons */}
               <div className="mt-auto space-y-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || config.topics.length === 0}
                    className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Đang biên soạn đề với {config.model === 'gemini-3-pro-preview' ? 'Gemini 3 Pro' : 'Gemini 3 Flash'}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                        Tạo Bộ Câu Hỏi Ngay
                      </>
                    )}
                  </button>
                  
                  {questions.length > 0 && !isLoading && (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                      <button
                        onClick={() => setMode(AppMode.PRESENTATION)}
                        className="flex items-center justify-center py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
                      >
                        <Presentation className="w-5 h-5 mr-2" /> Trình Chiếu
                      </button>
                      <button
                        onClick={() => setMode(AppMode.EXPORT)}
                        className="flex items-center justify-center py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition"
                      >
                        <FileText className="w-5 h-5 mr-2" /> Xuất Word
                      </button>
                    </div>
                  )}
               </div>

               {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;