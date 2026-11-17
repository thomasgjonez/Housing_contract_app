"use client";

import { useEffect, useState } from "react";

export function CopyLink({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(window.location.origin + path), [path]);
  return (
    <div className="mt-3 flex gap-2">
      <input readOnly value={url} className="input bg-white" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="btn-primary"
        onClick={() => {
          void navigator.clipboard?.writeText(url);
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
