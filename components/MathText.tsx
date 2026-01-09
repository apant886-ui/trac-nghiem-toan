import React from 'react';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
  block?: boolean;
}

const MathText: React.FC<MathTextProps> = ({ content, className = '', block = false }) => {
  if (!content) return null;

  // Function to repair common JSON escaping issues in LaTeX strings
  const repairLatex = (str: string): string => {
    // 1. Recover \frac where \f became Form Feed (\u000c)
    // 2. Recover \tan, \tau, \theta, \times where \t became Tab (\u0009)
    // 3. Recover \beta, \bar where \b became Backspace (\u0008)
    // 4. Recover \rho, \right where \r became Carriage Return (\u000d)
    
    return str
      .replace(/\u000c/g, '\\f') // \f char -> \f string
      .replace(/\u0009/g, '\\t') // \t char -> \t string
      .replace(/\u0008/g, '\\b') // \b char -> \b string
      .replace(/\u000d/g, '\\r') // \r char -> \r string
      .replace(/\u000a/g, '\\n'); // \n char -> \n string (rare but possible)
  };

  const renderContent = () => {
    // Regex to split content by <math>...content...</math>
    const parts = content.split(/(<math>.*?<\/math>)/g);
    
    return parts.map((part, index) => {
      // Check if this part is a math block
      if (part.startsWith('<math>') && part.endsWith('</math>')) {
        // Extract and REPAIR LaTeX content
        let latex = part.replace(/^<math>|<\/math>$/g, '');
        latex = repairLatex(latex);
        
        try {
          // Render LaTeX to HTML string
          const html = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false,
            output: 'html',
          });
          
          return (
            <span 
              key={index} 
              dangerouslySetInnerHTML={{ __html: html }} 
              className="px-0.5 text-indigo-900"
            />
          );
        } catch (error) {
          console.error("KaTeX error:", error);
          // Show raw latex in red if it still fails
          return <span key={index} className="text-red-500 font-mono text-sm bg-red-50 p-1 rounded">{latex}</span>;
        }
      }
      
      // Render regular text
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  return (
    <div className={`${block ? 'block' : 'inline'} ${className} leading-relaxed`}>
      {renderContent()}
    </div>
  );
};

export default MathText;