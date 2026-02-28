"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeBlockWithCopyProps {
  code: string;
  language?: string;
  title?: string;
  maxHeight?: string;
  className?: string;
}

export function CodeBlockWithCopy({
  code,
  language = "bash",
  title,
  maxHeight,
  className,
}: CodeBlockWithCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("rounded-2xl border bg-zinc-950 dark:bg-zinc-900 overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
          <span className="text-xs font-medium text-zinc-400">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}
      <div className="relative">
        {!title && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute right-2 top-2 h-7 w-7 text-zinc-400 hover:text-zinc-200"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        )}
        <pre className="overflow-x-auto overflow-y-auto p-4" style={maxHeight ? { maxHeight } : undefined}>
          <code className="text-sm text-zinc-100 font-mono">{code}</code>
        </pre>
      </div>
    </div>
  );
}
