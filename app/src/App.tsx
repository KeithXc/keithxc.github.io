import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Menu, Github, FileText, FolderOpen, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';

interface FileInfo {
  name: string;
  path: string;
  type: string;
  children?: FileInfo[];
}

function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const owner = 'keitherhao';
  const repo = 'keitherhao.github.io';
  const branch = 'refs/heads/main';
  const basePath = 'md_root';
  const defaultFile = '_index.md';

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (!selectedFile && files.length > 0) {
      setSelectedFile(`${basePath}/${defaultFile}`);
    }
  }, [files]);

  useEffect(() => {
    if (selectedFile) {
      fetchMarkdown(selectedFile);
    }
  }, [selectedFile]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
      );
      const data = await response.json();

      const fileTree: FileInfo[] = [];
      const paths = new Map<string, FileInfo>();

      data.tree
        .filter((item: any) => item.path.startsWith(basePath) && item.path.endsWith('.md'))
        .forEach((item: any) => {
          const parts = item.path.split('/');
          let currentPath = '';

          parts.forEach((part: string, index: number) => {
            const fullPath = parts.slice(0, index + 1).join('/');

            if (!paths.has(fullPath)) {
              const newItem: FileInfo = {
                name: part,
                path: fullPath,
                type: index === parts.length - 1 ? 'file' : 'directory',
                children: index === parts.length - 1 ? undefined : []
              };

              paths.set(fullPath, newItem);

              if (index === 0) {
                if (currentPath === '') {
                  fileTree.push(newItem);
                }
              } else {
                const parentPath = parts.slice(0, index).join('/');
                const parent = paths.get(parentPath);
                if (parent && parent.children) {
                  parent.children.push(newItem);
                }
              }
            }
            currentPath = fullPath;
          });
        });

      setFiles(fileTree);
    } catch (err) {
      setError('Failed to fetch file list. Please check your repository settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkdown = async (filePath: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
      );
      let content = await response.text();

      // Transform image paths in the markdown content
      content = content.replace(
        /!\[([^\]]*)\]\((\.\/[^)]+)\)|<img[^>]*src=["'](\.\/[^"']+)["'][^>]*>/g,
        (match, alt, markdownPath, htmlPath) => {
          const path = markdownPath || htmlPath;
          const transformedPath = transformImageSrc(path);
          if (markdownPath) {
            return `![${alt}](${transformedPath})`;
          } else {
            return match.replace(path, transformedPath);
          }
        }
      );

      setMarkdown(content);
      setError(null);
    } catch (err) {
      setError('Failed to fetch markdown content.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const transformImageSrc = (src: string) => {
    if (!selectedFile) return src;

    // If it's already a full URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }

    // Remove './' prefix if present
    if (src.startsWith('./')) {
      src = src.substring(2);
    }

    // Get the current markdown file path without extension
    const currentFilePath = selectedFile.replace(/\.md$/, '');

    // Replace the assets folder path with the correct one
    const assetsPath = `${currentFilePath}.assets/`;
    console.log('assetsPath:', assetsPath);
    const imageName = src.split('/').pop();
    const newSrc = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${assetsPath}${imageName}`;
    console.log('newSrc:', newSrc);

    console.log('Run here');
    // content = content.replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*)>/g, (match, beforeSrc, src, afterSrc) => {
    //   // 构建新的URL
    // const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));
    // console.log('directoryPath:', directoryPath);
    // const newSrc = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${directoryPath}/${src.replace('./', '')}`;
    // console.log('newSrc:', newSrc); // 打印新路径
    //   return `<img src="${newSrc}">`;
    // });

    return newSrc;
  };

  const renderFileTree = (items: FileInfo[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
        {item.type === 'directory' ? (
          <>
            <button
              onClick={() => toggleFolder(item.path)}
              className="w-full text-left px-2 py-1.5 hover:bg-gray-800 rounded-lg flex items-center space-x-2"
            >
              {expandedFolders.has(item.path) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">{item.name}</span>
            </button>
            {expandedFolders.has(item.path) && item.children && (
              <div className="mt-1">
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => setSelectedFile(item.path)}
            className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center space-x-2 ${selectedFile === item.path
              ? 'bg-blue-900 text-blue-200'
              : 'text-gray-300 hover:bg-gray-800'
              }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm truncate">{item.name}</span>
          </button>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-300" />
            </button>
            <div className="flex items-center space-x-2">
              <Github className="w-6 h-6 text-gray-300" />
              <h1 className="text-xl font-semibold text-gray-100">
                Markdown Docs
              </h1>
            </div>
          </div>
          <a
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-gray-100"
          >
            {owner}/{repo}
          </a>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed lg:relative w-72 h-[calc(100vh-57px)] bg-gray-900 border-r border-gray-800 transition-transform duration-200 ease-in-out lg:translate-x-0 z-10 overflow-y-auto`}
        >
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Documentation
            </h2>
            <div className="space-y-1">
              {renderFileTree(files)}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <article className="prose prose-invert prose-blue max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ node, ...props }) => (
                    <img
                      {...props}
                      src={transformImageSrc(props.src || '')}
                      className="max-w-full h-auto"
                    />
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;