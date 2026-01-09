import React, { useState } from 'react';
import { Question, ExamExportConfig } from '../types';
import { downloadWordFiles } from '../services/exportService';
import MathText from './MathText';
import { FileDown, ArrowLeft, Layers, Type } from 'lucide-react';

interface ExportViewProps {
  questions: Question[];
  onBack: () => void;
}

const ExportView: React.FC<ExportViewProps> = ({ questions, onBack }) => {
  const [config, setConfig] = useState<ExamExportConfig>({
    numberOfVariants: 4,
    examTitle: 'KIỂM TRA 15 PHÚT - BÀI 18: LŨY THỪA VỚI SỐ MŨ THỰC',
    schoolName: 'TRƯỜNG THPT NGUYỄN DU',
  });

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      downloadWordFiles(questions, config);
      setIsExporting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-slate-100 transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Xuất đề thi ra Microsoft Word</h1>
      </header>

      <main className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-indigo-600" />
              Cấu hình đề thi
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên trường</label>
                <input 
                  type="text" 
                  value={config.schoolName}
                  onChange={e => setConfig({...config, schoolName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề bài kiểm tra</label>
                <input 
                  type="text" 
                  value={config.examTitle}
                  onChange={e => setConfig({...config, examTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng mã đề (1-10)</label>
                <div className="flex items-center space-x-4">
                   <input 
                    type="range" 
                    min="1" max="10" 
                    value={config.numberOfVariants}
                    onChange={e => setConfig({...config, numberOfVariants: Number(e.target.value)})}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-bold text-indigo-700 w-8 text-center">{config.numberOfVariants}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Hệ thống sẽ trộn câu hỏi và đảo đáp án để tạo ra {config.numberOfVariants} mã đề khác nhau.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition"
                >
                  <FileDown className="w-5 h-5 mr-2" />
                  {isExporting ? 'Đang tạo file...' : 'Tải xuống File Word'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100">
            <strong>Lưu ý:</strong> File .doc xuất ra sử dụng định dạng toán học LaTeX ($...$) tương thích với các add-in hỗ trợ soạn thảo Toán phổ biến.
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
             <h3 className="font-bold text-slate-700 flex items-center">
                <Type className="w-4 h-4 mr-2" /> Xem trước nội dung (Ngân hàng {questions.length} câu)
             </h3>
          </div>
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
             {questions.map((q, idx) => (
               <div key={q.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-start">
                    <span className="font-bold text-indigo-600 mr-2 flex-shrink-0">Câu {idx + 1}:</span>
                    <div className="text-slate-800">
                       <MathText content={q.content} />
                    </div>
                  </div>
                  {q.options && (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 ml-8">
                       {q.options.map((opt, i) => (
                         <div key={opt.id} className={`text-sm ${opt.id === q.correctOptionId ? 'text-green-600 font-semibold' : 'text-slate-600'}`}>
                           {String.fromCharCode(65 + i)}. <MathText content={opt.content} />
                         </div>
                       ))}
                    </div>
                  )}
                  <div className="mt-2 ml-8 text-sm text-slate-400 italic">
                     Lời giải: <MathText content={q.explanation} className="text-slate-500" />
                  </div>
               </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExportView;