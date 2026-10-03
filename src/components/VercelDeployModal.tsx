import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Send,
  Zap,
  Layers,
  Code2,
  FileCode,
  Download,
  Server,
  Cloud,
} from 'lucide-react';
import { copyToClipboard, triggerDownload } from '../utils/format';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  isDarkMode: boolean;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'render_guide' | 'vercel_guide' | 'curl' | 'python' | 'node' | 'live_test'>('render_guide');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live tester state
  const [testerTag, setTesterTag] = useState<string>('vercel_test');
  const [testerStatus, setTesterStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testerResponse, setTesterResponse] = useState<string>('');

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';

  const copyCode = async (key: string, code: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const curlRaw = `curl -X POST --data-binary @my_photo.jpg \\
  -H "Content-Type: image/jpeg" \\
  "${currentOrigin}/api/upload/raw?filename=my_photo.jpg&tag=automated"`;

  const curlBulk = `curl -X POST \\
  -F "images=@shot1.png" \\
  -F "images=@shot2.jpg" \\
  -F "tag=camera_dump" \\
  "${currentOrigin}/api/upload"`;

  const pythonCode = `import os
import requests

API_URL = "${currentOrigin}"

def upload_photo_lossless(file_path: str, tag: str = "python_script"):
    """Streams exact raw bytes without transcoding to ${currentOrigin}"""
    file_name = os.path.basename(file_path)
    endpoint = f"{API_URL}/api/upload/raw?filename={file_name}&tag={tag}"
    
    with open(file_path, "rb") as f:
        res = requests.post(endpoint, data=f, headers={"Content-Type": "image/jpeg"})
    
    if res.status_code == 201:
        data = res.json()
        print("Success! Direct image URL:", data["image"]["rawUrl"])
        return data["image"]
    else:
        print("Error:", res.text)
        return None

# Upload test:
# upload_photo_lossless("./render.jpg")`;

  const nodeCode = `import fs from 'fs';
import path from 'path';

const API_BASE = '${currentOrigin}';

async function uploadDirect(filePath, tag = 'automation_bot') {
  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);

  const res = await fetch(\`\${API_BASE}/api/upload/raw?filename=\${encodeURIComponent(fileName)}&tag=\${encodeURIComponent(tag)}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });

  const json = await res.json();
  console.log('Uploaded lossless image:', json.image?.rawUrl);
  return json;
}

// uploadDirect('./screenshot.png');`;

  const runLiveTest = async () => {
    setTesterStatus('testing');
    setTesterResponse('');

    try {
      // Generate a canvas image test
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(30, 30, 340, 240);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('VERCEL API TEST', 55, 140);
        ctx.font = '14px monospace';
        ctx.fillText(`Timestamp: ${Date.now()}`, 55, 175);
      }

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not create test image blob');

      const testFilename = `test_pixel_${Date.now()}.png`;
      const url = `/api/upload/raw?filename=${testFilename}&tag=${encodeURIComponent(testerTag || 'live_test')}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: blob,
      });

      const data = await res.json();
      setTesterStatus(res.ok ? 'success' : 'error');
      setTesterResponse(JSON.stringify(data, null, 2));

      if (res.ok) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setTesterStatus('error');
      setTesterResponse(err.message || 'Test failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-4xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#10121a] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white border border-zinc-700">
              {/* Vercel Icon */}
              <svg viewBox="0 0 76 65" className="w-5 h-5 fill-current">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>Vercel Deployment & Automation API</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Ready to Deploy
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pre-configured for Vercel Serverless Functions with zero extra setup.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Detected Base URL Banner */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between border-b text-xs font-mono ${
            isDarkMode
              ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
              : 'bg-blue-50/70 border-blue-100 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-sans font-medium text-zinc-300">Live Active API Domain:</span>
            <span className="text-amber-400 font-bold">{currentOrigin}</span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            (Updates automatically when hosted on Vercel)
          </span>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex items-center gap-2 px-6 pt-3 border-b overflow-x-auto ${
            isDarkMode ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <button
            onClick={() => setActiveTab('render_guide')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'render_guide'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Deploy to Render.com</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1 py-0.5 rounded">Free</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel_guide')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'vercel_guide'
                ? isDarkMode
                  ? 'border-amber-400 text-amber-400'
                  : 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {/* Vercel icon */}
            <svg viewBox="0 0 76 65" className="w-3 h-3 fill-current">
              <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
            </svg>
            <span>Deploy to Vercel</span>
          </button>

          <button
            onClick={() => setActiveTab('curl')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'curl'
                ? isDarkMode
                  ? 'border-amber-400 text-amber-400'
                  : 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>cURL (CLI)</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'python'
                ? isDarkMode
                  ? 'border-amber-400 text-amber-400'
                  : 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Script</span>
          </button>

          <button
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'node'
                ? isDarkMode
                  ? 'border-amber-400 text-amber-400'
                  : 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Node.js / JS</span>
          </button>

          <button
            onClick={() => setActiveTab('live_test')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === 'live_test'
                ? isDarkMode
                  ? 'border-amber-400 text-amber-400'
                  : 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Live Test API</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'render_guide' && (
            <div className="space-y-6">
              {/* Blueprint banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Pre-Configured for Render Web Service</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your project includes <code className="font-mono text-emerald-400">render.yaml</code> so Render configures the Node.js runtime, build script, and start command automatically.
                </p>
              </div>

              {/* 3-Step Guide */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Easy 3-Step Setup for Render.com
                </h4>

                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-xl border flex gap-4 ${
                      isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-semibold">Push Code to GitHub / GitLab</p>
                      <p className="text-xs text-zinc-400">
                        Initialize git and push this repo to your repository:
                      </p>
                      <pre className="p-2 rounded bg-black/80 text-[11px] font-mono text-emerald-400 border border-zinc-800 mt-1 overflow-x-auto">
                        git init && git add . && git commit -m &quot;Deploy Gallery&quot; && git push
                      </pre>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border flex gap-4 ${
                      isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-semibold">Open Render Dashboard & Click &quot;New Web Service&quot;</p>
                      <p className="text-xs text-zinc-400">
                        Visit{' '}
                        <a
                          href="https://dashboard.render.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 underline font-medium inline-flex items-center gap-1"
                        >
                          dashboard.render.com <ExternalLink className="w-3 h-3" />
                        </a>{' '}
                        and select your repository.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border flex gap-4 ${
                      isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-semibold">Set Commands & Click Deploy</p>
                      <div className="space-y-1.5 text-xs text-zinc-300 font-mono bg-black/50 p-2.5 rounded-lg border border-zinc-800 mt-1">
                        <div><span className="text-zinc-500">Runtime:</span> Node</div>
                        <div><span className="text-zinc-500">Build Command:</span> <span className="text-emerald-400">npm install && npm run build</span></div>
                        <div><span className="text-zinc-500">Start Command:</span> <span className="text-emerald-400">npm start</span></div>
                        <div><span className="text-zinc-500">Plan:</span> Free</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vercel_guide' && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-2xl border ${
                  isDarkMode
                    ? 'bg-zinc-900/60 border-zinc-800'
                    : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Pre-Configured for Vercel</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your project already includes <code className="font-mono text-amber-400">vercel.json</code> and the unified serverless router in <code className="font-mono text-amber-400">api/index.ts</code>. You don&apos;t need to write any configuration files manually.
                </p>
              </div>

              {/* Step by Step list */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Easy 3-Step Setup Guide
                </h4>

                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-xl border flex gap-4 ${
                      isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Push Code to GitHub or GitLab</p>
                      <p className="text-xs text-zinc-400">
                        Initialize git and push this repo to your GitHub account:
                      </p>
                      <pre className="p-2 rounded bg-black/80 text-[11px] font-mono text-emerald-400 border border-zinc-800 mt-1">
                        git init && git add . && git commit -m &quot;Initial commit&quot; && git push
                      </pre>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border flex gap-4 ${
                      isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Import into Vercel Dashboard</p>
                      <p className="text-xs text-zinc-400">
                        Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-amber-400 underline">vercel.com/new</a>, select your repository, and click <strong>Deploy</strong>.
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Vercel will automatically detect Vite and run <code className="font-mono">npm run build</code>.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border flex gap-4 ${
                      isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Live Site & API Routes Work Instantly</p>
                      <p className="text-xs text-zinc-400">
                        Once deployed, open your Vercel URL (e.g. <code className="font-mono text-amber-400">https://your-app.vercel.app</code>). The gallery UI and all <code className="font-mono text-amber-400">/api/upload</code> routes work right away!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoints Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Active Serverless Routes Available on Vercel
                </h4>
                <div className="border border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-zinc-900/80 text-zinc-400 text-[11px]">
                      <tr>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Endpoint</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      <tr>
                        <td className="p-2.5 text-emerald-400">POST</td>
                        <td className="p-2.5">/api/upload/raw</td>
                        <td className="p-2.5 font-sans text-zinc-400">Raw binary body upload (easiest for scripts)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-emerald-400">POST</td>
                        <td className="p-2.5">/api/upload</td>
                        <td className="p-2.5 font-sans text-zinc-400">Multipart bulk upload with images[]</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-blue-400">GET</td>
                        <td className="p-2.5">/api/images</td>
                        <td className="p-2.5 font-sans text-zinc-400">List all images JSON catalog</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-blue-400">GET</td>
                        <td className="p-2.5">/api/raw/:id</td>
                        <td className="p-2.5 font-sans text-zinc-400">Direct raw lossless image stream</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-blue-400">GET</td>
                        <td className="p-2.5">/api/images/export/zip</td>
                        <td className="p-2.5 font-sans text-zinc-400">Download ZIP bundle</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">1. Stream Raw Binary (No multipart needed)</span>
                  <button
                    onClick={() => copyCode('curl_raw', curlRaw)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
                  >
                    {copiedKey === 'curl_raw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'curl_raw' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-black/80 rounded-xl text-xs font-mono text-amber-300 border border-zinc-800 overflow-x-auto leading-relaxed">
                  {curlRaw}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">2. Bulk Multipart Upload</span>
                  <button
                    onClick={() => copyCode('curl_bulk', curlBulk)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
                  >
                    {copiedKey === 'curl_bulk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'curl_bulk' ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-black/80 rounded-xl text-xs font-mono text-amber-300 border border-zinc-800 overflow-x-auto leading-relaxed">
                  {curlBulk}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Python automated script with exact live URL:</span>
                <button
                  onClick={() => copyCode('python', pythonCode)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
                >
                  {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'python' ? 'Copied' : 'Copy Python'}</span>
                </button>
              </div>
              <pre className="p-4 bg-black/80 rounded-xl text-xs font-mono text-emerald-400 border border-zinc-800 overflow-x-auto leading-relaxed">
                {pythonCode}
              </pre>
            </div>
          )}

          {activeTab === 'node' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Node.js automated uploader:</span>
                <button
                  onClick={() => copyCode('node', nodeCode)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors"
                >
                  {copiedKey === 'node' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'node' ? 'Copied' : 'Copy Node'}</span>
                </button>
              </div>
              <pre className="p-4 bg-black/80 rounded-xl text-xs font-mono text-blue-300 border border-zinc-800 overflow-x-auto leading-relaxed">
                {nodeCode}
              </pre>
            </div>
          )}

          {activeTab === 'live_test' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <h4 className="text-xs font-bold text-white mb-1">Live Endpoint Verification</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Sends a real raw binary upload to <code className="text-amber-400 font-mono">POST /api/upload/raw</code> right now to verify that your backend API is responding with 201 Created and saving the lossless image.
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Upload Tag Label
                    </label>
                    <input
                      type="text"
                      value={testerTag}
                      onChange={(e) => setTesterTag(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="pt-5">
                    <button
                      onClick={runLiveTest}
                      disabled={testerStatus === 'testing'}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{testerStatus === 'testing' ? 'Testing API...' : 'Test Raw API Call'}</span>
                    </button>
                  </div>
                </div>

                {testerStatus === 'success' && (
                  <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>201 Created: API is fully functional! Photo is now visible in gallery.</span>
                  </div>
                )}

                {testerResponse && (
                  <div className="mt-3">
                    <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Server JSON Output:
                    </span>
                    <pre className="p-3 bg-black/80 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto border border-zinc-800 max-h-48">
                      {testerResponse}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-t ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <span className="text-xs text-zinc-500 font-mono">
            Vercel Ready · /api/index.ts
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
