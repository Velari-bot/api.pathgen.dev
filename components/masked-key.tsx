"use client";

import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaskedKeyProps {
  apiKey: string;
  isNew?: boolean;
}

export function MaskedKey({ apiKey, isNew = false }: MaskedKeyProps) {
  const [show, setShow] = useState(isNew);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const masked = apiKey.replace(/^(.{5}).*(.{5})$/, "$1" + "•".repeat(24) + "$2");

  return (
    <div className="flex items-center gap-2 w-full glass p-2 rounded-xl group transition-all hover:border-primary/20">
      <code className="flex-1 font-mono text-xs px-2 truncate opacity-90 group-hover:opacity-100 transition-opacity">
        {show ? apiKey : masked}
      </code>
      <div className="flex items-center gap-1 shrink-0">
        {!isNew && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/5" 
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-white/5" 
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
}
