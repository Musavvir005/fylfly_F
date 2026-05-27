import React, { useState } from 'react';
import axios from 'axios';

function RetrievePanel() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null);
  const [foundFile, setFoundFile] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const getFileIcon = (name) => {
    if (!name) return '📄';
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return '🎬';
    if (['mp3', 'wav', 'aac'].includes(ext)) return '🎵';
    if (ext === 'pdf') return '📕';
    if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
    if (['doc', 'docx'].includes(ext)) return '📝';
    return '📄';
  };

  const handleRetrieve = async () => {
    if (!code.trim()) return;

    setStatus('loading');
    setFoundFile(null);

    try {
      const response = await axios.post('http://localhost:5000/api/retrieve', {
        code: code.trim()
      });

      setFoundFile(response.data);
      setStatus('found');

    } catch (err) {
      const httpStatus = err.response?.status;
      if (httpStatus === 404) setStatus('invalid');
      else if (httpStatus === 410) setStatus('expired');
      else setStatus('error');
    }
  };

  const getFileCategory = (name) => {
    if (!name) return 'other';
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'aac', 'ogg'].includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const handleView = () => {
    if (foundFile?.fileUrl) window.open(foundFile.fileUrl, '_blank');
  };

  const handleDownload = async () => {
    if (!foundFile?.fileUrl || downloading) return;

    try {
      setDownloading(true);

      // Step 1: Fetch the file from Cloudinary as raw binary
      const response = await fetch(foundFile.fileUrl);
      if (!response.ok) throw new Error('Fetch failed');

      // Step 2: Convert to a Blob (binary large object — the actual file data)
      const blob = await response.blob();

      // Step 3: Create a temporary local URL pointing to that blob
      const blobUrl = URL.createObjectURL(blob);

      // Step 4: Create a hidden <a> tag, set it to the local blob URL, and click it
      // Since it's a local URL (not external), the browser WILL download it
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = foundFile.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Step 5: Release the blob URL from memory
      URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. Try the View button instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="panel retrieve-panel">
      <div className="panel-header">
        <h2 className="panel-title">Retrieve a File</h2>
        <p className="panel-subtitle">Enter the access code.</p>
      </div>

      {/* ── Code Input ── */}
      <div className="code-search-box">
        <div className="code-input-wrapper">
          <span className="code-prefix">🔑<b><i>FYL - </i></b></span>
          <input
            className="code-input"
            type="text"
            placeholder="12S45W"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handleRetrieve()}
            maxLength={6}
          />
        </div>
        <button
          className={`search-btn ${status === 'loading' ? 'loading' : ''}`}
          onClick={handleRetrieve}
          disabled={status === 'loading' || code.trim().length < 6}
        >
          {status === 'loading' ? <span className="btn-spinner" /> : '⬇ Retrieve File'}
        </button>
      </div>
      <p>💡 Enter the 6-character alphanumeric code. Example:<strong>FYL-A2345F</strong></p>

      {/* ── Demo: supported file types (shown only before any search) ── */}
      <div className="demo-section">
        <p className="demo-label">📂 Supported File Types</p>

        <div className="file-types-box">
          <div className="file-type-row">
            <span className="ft-icon">🖼️</span>
            <span className="ft-name">Image</span>
            <span className="ft-sep">—</span>
            <span className="ft-formats">JPG, PNG, GIF, WebP, SVG</span>
          </div>

          <div className="file-type-row">
            <span className="ft-icon">🎬</span>
            <span className="ft-name">Video</span>
            <span className="ft-sep">—</span>
            <span className="ft-formats">MP4, MOV, AVI, MKV</span>
          </div>

          <div className="file-type-row">
            <span className="ft-icon">🎵</span>
            <span className="ft-name">Audio</span>
            <span className="ft-sep">—</span>
            <span className="ft-formats">MP3, WAV, AAC, OGG</span>
          </div>

          <div className="file-type-row">
            <span className="ft-icon">📕</span>
            <span className="ft-name">Document</span>
            <span className="ft-sep">—</span>
            <span className="ft-formats">PDF, DOC, DOCX</span>
          </div>
        </div>
      </div>
      {/* ── Invalid Code ── */}
      {status === 'invalid' && (
        <div className="result-card result-error">
          <div className="result-icon">❌</div>
          <div>
            <p className="result-title">Invalid Code</p>
            <p className="result-sub">No file found for this code. Check and try again.</p>
          </div>
        </div>
      )}

      {/* ── File Expired ── */}
      {status === 'expired' && (
        <div className="result-card result-error">
          <div className="result-icon">⌛</div>
          <div>
            <p className="result-title">File Expired</p>
            <p className="result-sub">This file is no longer available — it was deleted after 3 hours.</p>
          </div>
        </div>
      )}

      {/* ── Server Error ── */}
      {status === 'error' && (
        <div className="result-card result-error">
          <div className="result-icon">⚠️</div>
          <div>
            <p className="result-title">Something went wrong</p>
            <p className="result-sub">Please try again in a moment.</p>
          </div>
        </div>
      )}

      {/* ── File Found ── */}
      {status === 'found' && foundFile && (
        <div className="result-card result-success">
          <div className="file-icon-lg">{getFileIcon(foundFile.fileName)}</div>
          <div className="result-details">
            <p className="result-title">{foundFile.fileName}</p>
            {foundFile.expiryTime && (
              <p className="result-sub">
                ⏳ Available until <strong>{new Date(foundFile.expiryTime).toLocaleTimeString()}</strong>
              </p>
            )}
            <p className="result-sub" style={{ color: '#7ecb8f', marginTop: '4px' }}>
              ✅ You can use this code again within the 3-hour window
            </p>
          </div>
          <div className="result-actions">
            <button className="view-btn" onClick={handleView}>
              {getFileCategory(foundFile.fileName) === 'video' ? '▶ Watch Online' : '👁 View File'}
            </button>
            <button
              className={`download-btn ${downloading ? 'loading' : ''}`}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? <span className="btn-spinner" /> : '⬇ Download'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RetrievePanel;
