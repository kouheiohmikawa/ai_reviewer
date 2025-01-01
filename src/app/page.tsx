"use client";

import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { StreamLanguage } from '@codemirror/language';
import { clike } from '@codemirror/legacy-modes/mode/clike';
import { go } from '@codemirror/lang-go';
import axios from 'axios';
import Split from 'react-split';
import { marked } from 'marked';
import { ClipLoader } from 'react-spinners';

interface ContentPart {
  text: string;
}

interface Content {
  parts: ContentPart[];
}

interface Candidate {
  content: Content;
}

interface GeminiResponse {
  candidates: Candidate[];
}

type Language = 'javascript' | 'python' | 'java' | 'cpp' | 'csharp' | 'go';

const getLanguageExtension = (language: Language) => {
  switch (language) {
    case 'javascript':
      return [javascript({ jsx: true })];
    case 'python':
      return [python()];
    case 'java':
      return [java()];
    case 'cpp':
      return [cpp()];
    case 'csharp':
      return [StreamLanguage.define(clike())];
    case 'go':
      return [go()];
    default:
      return [javascript({ jsx: true })];
  }
};

function App() {
  const [code, setCode] = useState<string>('// ここにコードを入力');
  const [language, setLanguage] = useState<Language>('javascript');
  const [refactoredCode, setRefactoredCode] = useState<string>('');
  const [review, setReview] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as Language);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;

      if (!geminiApiKey) {
        throw new Error("API key is not defined");
      }

      const reviewPrompt = `あなたは経験豊富なシニアソフトウェアエンジニアです。以下の${language}で書かれたコードをレビューし、改善点を具体的に指摘してください。良い点にも言及し、初心者にもわかりやすいように説明してください。出力はマークダウン形式で記述してください。\n\nコード:\n\`\`\`${language}\n${code}\n\`\`\``;
      const reviewResponse = await axios.post<GeminiResponse>(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          contents: [
            {
              parts: [{ text: reviewPrompt }],
            },
          ],
        }
      );

      const refactorPrompt = `シニアエンジニアとして、以下の${language}で書かれたコードをリファクタリングしてください。\n\nコード:\n\`\`\`${language}\n${code}\n\`\`\``;
      const refactorResponse = await axios.post<GeminiResponse>(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          contents: [
            {
              parts: [{ text: refactorPrompt }],
            },
          ],
        }
      );

      setRefactoredCode(refactorResponse.data.candidates[0].content.parts[0].text);
      setReview(reviewResponse.data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('Error:', error);
      setRefactoredCode('エラーが発生しました');
      setReview('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const renderReview = () => {
    return { __html: marked(review) };
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AIリファクタリング & レビューツール</h1>

      <div className="mb-4">
        <label htmlFor="language-select" className="block mb-2">言語:</label>
        <select id="language-select" value={language} onChange={handleLanguageChange} className="border border-gray-400 p-2 rounded w-full">
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
        </select>
      </div>

      <CodeMirror
        value={code}
        height="200px"
        extensions={getLanguageExtension(language)}
        onChange={(value) => setCode(value)}
        className="mb-4"
      />
      <button 
        onClick={handleSubmit} 
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
      >
        {loading ? <ClipLoader size={15} color={"#fff"} /> : '実行'}
      </button>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
          <ClipLoader size={50} color={"#123abc"} loading={true} />
        </div>
      )}

      <Split className="flex flex-row mt-4" sizes={[50, 50]} minSize={100}>
        <div className="result-pane">
          <h2 className="text-lg font-bold mb-2">リファクタリング結果</h2>
          <CodeMirror
            value={refactoredCode}
            height="400px"
            readOnly={true}
            extensions={getLanguageExtension(language)}
          />
        </div>
        <div className="result-pane">
          <h2 className="text-lg font-bold mb-2">レビュー</h2>
          <div dangerouslySetInnerHTML={renderReview()} className="prose" />
        </div>
      </Split>
    </div>
  );
}

export default App;