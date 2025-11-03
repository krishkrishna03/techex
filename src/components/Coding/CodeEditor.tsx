import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  language: string;
  initialCode?: string;
  onCodeChange: (code: string) => void;
  onRun?: (code: string, language: string) => void;
  readOnly?: boolean;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  initialCode = '',
  onCodeChange,
  onRun,
  readOnly = false,
  height = '500px'
}) => {
  const [code, setCode] = useState(initialCode);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    onCodeChange(newCode);
  };

  const handleReset = () => {
    setCode(getDefaultCode(language));
    onCodeChange(getDefaultCode(language));
  };

  const handleRun = () => {
    if (onRun) {
      onRun(code, language);
    }
  };

  const getDefaultCode = (lang: string): string => {
    const templates: Record<string, string> = {
      javascript: `function solution() {
  // Write your code here

}

// Test your solution
console.log(solution());`,
      python: `def solution():
    # Write your code here
    pass

# Test your solution
print(solution())`,
      java: `public class Solution {
    public static void main(String[] args) {
        // Write your code here

    }
}`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here

    return 0;
}`,
      c: `#include <stdio.h>

int main() {
    // Write your code here

    return 0;
}`,
      csharp: `using System;

class Solution {
    static void Main() {
        // Write your code here

    }
}`,
      go: `package main

import "fmt"

func main() {
    // Write your code here

}`,
      rust: `fn main() {
    // Write your code here

}`
    };
    return templates[lang] || '// Write your code here';
  };

  const getLanguageName = (lang: string): string => {
    const names: Record<string, string> = {
      javascript: 'JavaScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      csharp: 'C#',
      go: 'Go',
      rust: 'Rust'
    };
    return names[lang] || lang;
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{getLanguageName(language)}</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-1.5 hover:bg-gray-700 rounded"
                title="Reset Code"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {onRun && (
                <button
                  onClick={handleRun}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-gray-700 rounded"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r flex flex-col text-right pr-2 py-3 text-xs text-gray-500 font-mono select-none">
            {code.split('\n').map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>

          <textarea
            value={code}
            onChange={handleCodeChange}
            readOnly={readOnly}
            className="w-full pl-14 pr-4 py-3 font-mono text-sm leading-6 focus:outline-none resize-none"
            style={{
              height: isFullscreen ? 'calc(100vh - 100px)' : height,
              tabSize: 2
            }}
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newCode = code.substring(0, start) + '  ' + code.substring(end);
                setCode(newCode);
                onCodeChange(newCode);
                setTimeout(() => {
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                }, 0);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
