import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import MathText from './MathText';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Home, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface PresentationViewProps {
  questions: Question[];
  onBack: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({ questions, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, boolean>>({});

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (optId: string) => {
    if (answeredMap[currentQ.id]) return; // Prevent re-answering
    setSelectedOptionId(optId);
  };

  const submitAnswer = () => {
    if (answeredMap[currentQ.id] || !selectedOptionId) return;

    const isCorrect = selectedOptionId === currentQ.correctOptionId;
    if (isCorrect) setScore(s => s + 1);
    
    setAnsweredMap(prev => ({ ...prev, [currentQ.id]: true }));
    setShowExplanation(true);
  };

  const nextSlide = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOptionId(null);
      setShowExplanation(false);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      // Restore state if viewed back
      const prevQ = questions[currentIndex - 1];
      setSelectedOptionId(null); // Simple reset, or could track history
      setShowExplanation(!!answeredMap[prevQ.id]);
    }
  };

  const handleRetry = () => {
    // Removed window.confirm to avoid blocking issues or bad UX if popup is ignored
    // Simply reset the state immediately
    setCurrentIndex(0);
    setScore(0);
    setAnsweredMap({});
    setSelectedOptionId(null);
    setShowExplanation(false);
  };

  // Calculate Progress
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-20 relative">
        <div className="flex space-x-6">
          <button onClick={onBack} className="flex items-center text-slate-600 hover:text-indigo-600 transition group">
            <Home className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-lg">Thoát</span>
          </button>
          
          <button 
            onClick={handleRetry} 
            className="flex items-center text-slate-600 hover:text-indigo-600 transition group"
            title="Làm lại từ đầu"
          >
            <RotateCcw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-medium text-lg">Làm lại</span>
          </button>
        </div>

        <div className="text-2xl font-bold text-slate-800 hidden md:block">
          Câu {currentIndex + 1} / {questions.length}
        </div>
        <div className="flex items-center space-x-2 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100">
          <span className="text-lg text-indigo-800 font-bold">Điểm số: {score}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 z-10">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Slide Content - Maximized Area */}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-2 md:p-4 z-0">
        <div className="min-h-full flex flex-col justify-center items-center py-4">
            <div className="w-full max-w-[95vw] xl:max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-12 flex flex-col">
            
            {/* Question Content */}
            <div className="mb-8 md:mb-12">
                <span className="inline-block px-4 py-1.5 bg-slate-100 text-slate-600 text-sm md:text-base font-bold rounded-lg mb-6 uppercase tracking-wider">
                {currentQ.type === QuestionType.MCQ ? 'Trắc nghiệm' : 
                currentQ.type === QuestionType.TRUE_FALSE ? 'Đúng / Sai' : 'Tự luận / Trả lời ngắn'}
                </span>
                <div className="text-3xl md:text-5xl font-semibold text-slate-900 leading-normal break-words">
                  <MathText content={currentQ.content} block />
                </div>
            </div>

            {/* Options / Interaction Area */}
            <div className="flex-1 w-full">
                {currentQ.type === QuestionType.MCQ || currentQ.type === QuestionType.TRUE_FALSE ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {currentQ.options?.map((opt, idx) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isCorrect = opt.id === currentQ.correctOptionId;
                    const isAnswered = !!answeredMap[currentQ.id];
                    
                    let borderClass = 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50';
                    let icon = <div className="w-14 h-14 rounded-full border-2 border-slate-300 text-slate-400 flex items-center justify-center font-bold text-2xl">{String.fromCharCode(65+idx)}</div>;

                    if (isAnswered) {
                        if (isCorrect) {
                        borderClass = 'border-green-500 bg-green-50 ring-2 ring-green-500';
                        icon = <CheckCircle className="w-14 h-14 text-green-600" />;
                        } else if (isSelected && !isCorrect) {
                        borderClass = 'border-red-500 bg-red-50';
                        icon = <XCircle className="w-14 h-14 text-red-600" />;
                        } else {
                        borderClass = 'opacity-50 border-slate-200';
                        }
                    } else if (isSelected) {
                        borderClass = 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600';
                        icon = <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl">{String.fromCharCode(65+idx)}</div>;
                    }

                    return (
                        <button
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt.id)}
                        disabled={isAnswered}
                        className={`flex items-center p-6 border-2 rounded-2xl transition-all text-left group w-full ${borderClass}`}
                        >
                        <div className="mr-6 flex-shrink-0">{icon}</div>
                        <div className="text-3xl md:text-4xl text-slate-700 font-medium break-words w-full leading-relaxed">
                            <MathText content={opt.content} />
                        </div>
                        </button>
                    );
                    })}
                </div>
                ) : (
                <div className="p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center text-slate-500 text-2xl w-full">
                    Câu hỏi này yêu cầu học sinh làm bài ra giấy. Nhấn "Hiện đáp án" để xem lời giải.
                </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between w-full">
                <div className="flex space-x-4">
                {(currentQ.type === QuestionType.MCQ || currentQ.type === QuestionType.TRUE_FALSE) && !answeredMap[currentQ.id] && (
                    <button
                    onClick={submitAnswer}
                    disabled={!selectedOptionId}
                    className={`px-8 py-3 rounded-xl font-bold text-xl text-white transition shadow-lg ${
                        selectedOptionId 
                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                    >
                    Kiểm tra
                    </button>
                )}
                
                <button 
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="flex items-center px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-lg"
                >
                    {showExplanation ? <EyeOff className="w-6 h-6 mr-2"/> : <Eye className="w-6 h-6 mr-2"/>}
                    {showExplanation ? 'Ẩn lời giải' : 'Hiện lời giải'}
                </button>
                </div>

                <div className="flex space-x-3">
                <button 
                    onClick={prevSlide}
                    disabled={currentIndex === 0}
                    className="p-4 rounded-full hover:bg-slate-100 disabled:opacity-30 transition"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                    onClick={nextSlide}
                    disabled={currentIndex === questions.length - 1}
                    className="p-4 rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-md"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
                </div>
            </div>
            </div>

            {/* Explanation Card */}
            {showExplanation && (
            <div className="w-full max-w-[95vw] xl:max-w-[90vw] mt-8 bg-green-50 border border-green-200 p-8 rounded-2xl animate-fade-in-up shadow-sm">
                <h3 className="text-green-800 font-bold text-2xl mb-4 flex items-center">
                <CheckCircle className="w-8 h-8 mr-3" />
                Hướng dẫn giải chi tiết
                </h3>
                <div className="text-slate-800 text-2xl md:text-3xl leading-relaxed break-words">
                <MathText content={currentQ.explanation} />
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PresentationView;