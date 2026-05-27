import React, { useState, useRef } from 'react';
import axios from 'axios';
import ExpiryToast from './ExpiryToast';

function UploadPanel() {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'error'
  const [expiryTime, setExpiryTime] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const fileInputRef = useRef();

  // ── Helpers ─────────────────────────────────────────────

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleFileInput = (e) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type) => {
    if (!type) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📄';
  };

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleReset = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setExpiryTime(null);
    setShowToast(false);
    setRecipient('');
    setMessage('');
    setGeneratedCode('');
  };

  // ── Upload Handler ───────────────────────────────────────

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (!recipient.trim() || !isValidEmail(recipient)) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('email', recipient.trim());
    if (message.trim()) formData.append('message', message.trim());

    try {
      const response = await axios.post('https://fylfly-backend-2.onrender.com', formData);

      // Show toast first, then reset only the form fields
      setGeneratedCode(response.data.code);
      setExpiryTime(response.data.expiryTime);
      setShowToast(true);
      setSelectedFile(null);
      setUploadStatus(null);
      setRecipient('');
      setMessage('');

    } catch (err) {
      console.error('Upload failed:', err.response?.data || err.message);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="panel upload-panel">
      <div className="panel-header">
        <h2 className="panel-title">Send a File</h2>
        <p className="panel-subtitle">Upload a file and enter a valid email — get an access code.</p>
      </div>

      {/* ── Upload Form ── */}
      <>
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !selectedFile && fileInputRef.current.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden-input" onChange={handleFileInput} />
          {!selectedFile ? (
            <div className="drop-content">
              <div className="drop-icon">
                <img src={require('../upload-logo.png')} alt="Upload" className="upload-logo-img" />
              </div>
              <p className="drop-text">Drop your file here</p>
              <p className="drop-hint">or <span className="link-text">click to browse</span></p>
              <p className="drop-formats" style={{ color: "#fe3838ff" }}>Any format • Max 100 MB</p>
            </div>
          ) : (
            <div className="file-preview">
              <div className="file-preview-icon">{getFileIcon(selectedFile.type)}</div>
              <div className="file-preview-info">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-meta">{formatSize(selectedFile.size)} · {selectedFile.type || 'Unknown type'}</p>
              </div>
              <button className="remove-btn" onClick={(e) => { e.stopPropagation(); handleReset(); }}>✕</button>
            </div>
          )}
        </div>

        <div className="send-form">
          <div className="form-group">
            <label className="form-label">Email required<span style={{ color: '#e05c5c' }}>*</span></label>
            <input
              type="email"
              className="form-input"
              placeholder="abc@gmail.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message (optional)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Add a friendly note"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            className={`send-btn ${(!selectedFile || !recipient.trim()) ? 'disabled' : ''} ${uploadStatus === 'uploading' ? 'loading' : ''} ${uploadStatus === 'error' ? 'error' : ''}`}
            onClick={handleSend}
            disabled={!selectedFile || !recipient.trim() || uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' && <span className="btn-spinner" />}
            {uploadStatus === 'error' ? '❌ Upload Failed' : uploadStatus === 'uploading' ? 'Uploading...' : '⬆ Send File'}
          </button>
        </div>
      </>

      {/* ── Expiry Toast ── */}
      {showToast && expiryTime && (
        <ExpiryToast
          code={generatedCode}
          expiryTime={expiryTime}
          onDismiss={() => { setShowToast(false); }}
        />
      )}
    </div>
  );
}

export default UploadPanel;
