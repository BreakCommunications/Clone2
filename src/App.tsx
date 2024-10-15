import React, { useState, useEffect } from 'react';
import { FileIcon, FolderIcon, Terminal, Code, Play, Link, Wand2, Settings } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import OpenAI from 'openai';

SyntaxHighlighter.registerLanguage('javascript', js);

interface File {
  name: string;
  type: 'file' | 'folder';
  content: string;
}

const initialFiles: File[] = [
  { name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>AI Generated App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>' },
  { name: 'src', type: 'folder', content: '' },
  { name: 'src/main.tsx', type: 'file', content: "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)" },
  { name: 'src/App.tsx', type: 'file', content: "import React from 'react'\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello, AI-generated App!</h1>\n    </div>\n  )\n}\n\nexport default App" },
];

interface PromptUIProps {
  onSubmit: (prompt: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  model: string;
  setModel: (model: string) => void;
}

const PromptUI: React.FC<PromptUIProps> = ({ onSubmit, apiKey, setApiKey, model, setModel }) => {
  const [prompt, setPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prompt);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold mb-4">What do you want to build?</h1>
      <p className="text-xl mb-8">Prompt, run, edit, and deploy full-stack web apps.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-lg mb-8">
        <div className="bg-gray-800 rounded-lg p-2 flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="i need you to make a"
            className="flex-grow bg-transparent outline-none text-lg"
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg">
            <Play className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="ml-2 bg-gray-700 text-white p-2 rounded-lg"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
        {showSettings && (
          <div className="mt-4 bg-gray-800 rounded-lg p-4">
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2"
                placeholder="Enter your OpenAI API key"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">
                OpenAI Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

interface CodeEditorUIProps {
  files: File[];
  updateFile: (name: string, content: string) => void;
  aiResponse: string;
  onDeploy: () => void;
}

const CodeEditorUI: React.FC<CodeEditorUIProps> = ({ files, updateFile, aiResponse, onDeploy }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ AI Response:',
    aiResponse,
  ]);

  const handleFileChange = (content: string) => {
    if (selectedFile) {
      updateFile(selectedFile, content);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-300">
      <header className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Code className="w-6 h-6" />
          <h1 className="text-xl font-bold">AI-Generated App</h1>
        </div>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          onClick={onDeploy}
        >
          <Play className="w-4 h-4" />
          <span>Deploy Locally</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-gray-800 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Files</h2>
          <ul>
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-700 px-2 rounded"
                onClick={() => setSelectedFile(file.name)}
              >
                {file.type === 'folder' ? (
                  <FolderIcon className="w-4 h-4 text-yellow-500" />
                ) : (
                  <FileIcon className="w-4 h-4 text-blue-500" />
                )}
                <span>{file.name}</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {selectedFile || 'Select a file to view its content'}
            </h2>
            {selectedFile && (
              <SyntaxHighlighter 
                language="javascript" 
                style={atomOneDark}
                customStyle={{
                  backgroundColor: 'rgb(31, 41, 55)',
                  padding: '1rem',
                  borderRadius: '0.25rem',
                }}
                contentEditable={true}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const target = e.target as HTMLElement;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    target.value = target.value.substring(0, start) + "  " + target.value.substring(end);
                    target.selectionStart = target.selectionEnd = start + 2;
                  }
                }}
                onChange={(e) => handleFileChange(e.target.value)}
              >
                {files.find(f => f.name === selectedFile)?.content || ''}
              </SyntaxHighlighter>
            )}
          </div>

          <div className="h-48 bg-black p-4 font-mono text-sm overflow-y-auto flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <Terminal className="w-4 h-4" />
              <span>Terminal</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {terminalOutput.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [aiResponse, setAiResponse] = useState('');
  const [files, setFiles] = useState<File[]>(initialFiles);

  const updateFile = (name: string, content: string) => {
    setFiles(prevFiles => prevFiles.map(file => 
      file.name === name ? { ...file, content } : file
    ));
  };

  const parseAIResponse = (response: string) => {
    const fileRegex = /```(\w+)\s*\n([\s\S]*?)```/g;
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      const [, fileName, fileContent] = match;
      updateFile(fileName, fileContent.trim());
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key in the settings.');
      return;
    }

    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an AI assistant that generates code for web applications. Provide code snippets for each file, wrapped in triple backticks with the filename as the language specifier.' },
          { role: 'user', content: prompt }
        ],
        model: model,
      });

      const response = completion.choices[0].message.content;
      setAiResponse(response || 'No response from AI.');
      parseAIResponse(response || '');
      setShowCodeEditor(true);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      alert('Error calling OpenAI API. Please check your API key and try again.');
    }
  };

  const handleDeploy = () => {
    // This is a simplified local deployment simulation
    setAiResponse(prev => prev + '\n\nDeploying locally...\nApplication is now running on http://localhost:3000');
  };

  return (
    <div className="h-screen">
      {showCodeEditor ? (
        <CodeEditorUI 
          files={files}
          updateFile={updateFile}
          aiResponse={aiResponse}
          onDeploy={handleDeploy}
        />
      ) : (
        <PromptUI
          onSubmit={handlePromptSubmit}
          apiKey={apiKey}
          setApiKey={setApiKey}
          model={model}
          setModel={setModel}
        />
      )}
    </div>
  );
};

export default App;