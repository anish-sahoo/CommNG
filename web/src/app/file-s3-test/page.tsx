"use client";

import { useState, useRef } from "react";
import { useTRPCClient } from "../../lib/trpc";

/*
Probably quite trash react code but use this as an example of what to do (and what not to do) 
*/
export default function FileS3TestPage() {
  const trpc = useTRPCClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [uploadUrl, setUploadUrl] = useState<string>("");
  const [storedName, setStoredName] = useState<string>("");
  const [deleteStatus, setDeleteStatus] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  // 4. Fetch and display file from S3 via backend getFile
  async function handleDisplayFile() {
    if (!fileId) {
      addLog("No fileId to display.");
      return;
    }
    addLog("Fetching file info from backend...");
    try {
      // @ts-ignore
      const resp = await trpc.files.getFile.query({ fileId });
      if (resp && resp.data) {
        setFileUrl(resp.data);
        setFileType(resp.contentType || "");
        addLog("Fetched file URL: " + resp.data);
      } else {
        addLog("Failed to fetch file info: " + JSON.stringify(resp));
      }
    } catch (err) {
      addLog("Display error: " + (err as any).toString());
    }
  }
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to add log
  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev]);

  // 1. Login and store cookie
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    addLog("Logging in...");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + "/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        // Set cookie manually for fetch/trpc
        document.cookie = `better-auth.session=${data.token}; path=/`;
        addLog("Login successful. Token stored.");
      } else {
        addLog("Login failed: " + JSON.stringify(data));
      }
    } catch (err) {
      addLog("Login error: " + (err as any).toString());
    }
  }

  // 2. Upload file using new presigned S3 flow
  async function handleUpload() {
    if (!file) {
      addLog("No file selected.");
      return;
    }
    addLog("Requesting presigned upload...");
    try {
      // Call trpc mutation for createPresignedUpload (metadata only)
      const input = { fileName: file.name, contentType: file.type, fileSize: file.size };
      // @ts-ignore
      const resp = await trpc.files.createPresignedUpload.mutate(input);
      if (resp && resp.uploadUrl && resp.fileId) {
        setFileId(resp.fileId);
        setUploadUrl(resp.uploadUrl);
        // store storedName returned by backend so we can confirm later
        // @ts-ignore
        if (resp.storedName) setStoredName(resp.storedName);
        addLog("Got presigned URL. Uploading to S3...");
        // Upload to S3
        const uploadRes = await fetch(resp.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (uploadRes.ok) {
          addLog("File uploaded to S3 successfully. Confirming upload...");
          // Confirm upload via trpc (send file metadata so backend can persist)
          try {
            // @ts-ignore
            const confirmResp = await trpc.files.confirmUpload.mutate({
              fileId: resp.fileId,
              fileName: file.name,
              storedName: (resp as any).storedName || storedName,
              contentType: file.type,
            });
            if (confirmResp && confirmResp.ok) {
              addLog("Upload confirmed with backend.");
            } else {
              addLog("Upload confirmation failed: " + JSON.stringify(confirmResp));
            }
          } catch (err) {
            addLog("Upload confirmation error: " + (err as any).toString());
          }
        } else {
          addLog("S3 upload failed: " + uploadRes.statusText);
        }
      } else {
        addLog("Failed to get presigned URL: " + JSON.stringify(resp));
      }
    } catch (err) {
      addLog("Upload error: " + (err as any).toString());
    }
  }

  // 3. Delete file (assume a trpc method exists: files.deleteFile)
  async function handleDelete() {
    if (!fileId) {
      addLog("No fileId to delete.");
      return;
    }
    addLog("Deleting file via trpc...");
    try {
      // @ts-ignore
      const resp = await trpc.files.deleteFile.mutate({ fileId });
      setDeleteStatus("Deleted");
      addLog("File deleted: " + JSON.stringify(resp));
    } catch (err) {
      addLog("Delete error: " + (err as any).toString());
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">S3 File Upload Test</h1>
      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-2 border p-4 rounded">
        <div>
          <label>Email: </label>
          <input className="border px-2" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password: </label>
          <input className="border px-2" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="bg-blue-500 text-white px-4 py-1 rounded" type="submit">Login</button>
      </form>
      {/* File Upload */}
      <div className="space-y-2 border p-4 rounded">
        <div className="flex items-center gap-4">
          <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} />
          {file && (
            <span className="text-sm text-gray-700">Selected file: <span className="font-medium">{file.name}</span></span>
          )}
        </div>
        <button className="bg-green-600 text-white px-4 py-1 rounded mt-2" onClick={handleUpload} disabled={!file}>Upload</button>
      </div>
      {/* Delete Button */}
      <div className="space-y-2 border p-4 rounded">
        <button className="bg-red-600 text-white px-4 py-1 rounded" onClick={handleDelete} disabled={!fileId}>Delete File</button>
        {deleteStatus && <div className="text-sm text-gray-600">{deleteStatus}</div>}
      </div>
      {/* Display File Button and Preview */}
      <div className="space-y-2 border p-4 rounded">
        <button className="bg-indigo-600 text-white px-4 py-1 rounded" onClick={handleDisplayFile} disabled={!fileId}>Display File</button>
        {fileUrl && (
          <div className="mt-2">
            {fileType.startsWith("image/") ? (
              <img src={fileUrl} alt="Uploaded file" className="max-w-xs max-h-60 border" />
            ) : (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Download/View File</a>
            )}
          </div>
        )}
      </div>
      {/* Logs */}
      <div className="border p-4 rounded bg-gray-100">
        <h2 className="font-semibold mb-2">Logs</h2>
        <ul className="text-xs space-y-1 max-h-60 overflow-y-auto">
          {logs.map((log, i) => <li key={i}>{log}</li>)}
        </ul>
      </div>
    </div>
  );
}
