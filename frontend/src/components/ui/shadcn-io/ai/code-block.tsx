'use client';

import { Button } from '@repo/shadcn-ui/components/ui/button';
import { cn } from '@repo/shadcn-ui/lib/utils';
import { CheckIcon, CopyIcon } from 'lucide-react';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
// import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs/prism-light';
// import PrismLight from 'react-syntax-highlighter/dist/cjs/prism-light';


import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';


// // You would add more imports here for languages like 'css', 'json', etc.

// // 🛠️ 2. Register them with the highlighter component:
// SyntaxHighlighter.registerLanguage('tsx', tsx);
// SyntaxHighlighter.registerLanguage('bash', bash);
// SyntaxHighlighter.registerLanguage('javascript', javascript);

// 2. Import the actual registration function from the refractor core
// This requires 'refractor' to be installed (which it is, as a dependency)
// import {refractor} from 'refractor/core'; 
// const SyntaxHighlighter = PrismLight;
// 3. Import languages directly from refractor/lang
// This requires telling Vite where 'refractor/lang' lives via an alias.
// import tsx from 'refractor/lang/tsx';
// import bash from 'refractor/lang/bash';
// import javascript from 'refractor/lang/javascript';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light';


// 🛠️ 4. Register using the refractor core's function (refractor.register)
// refractor.register(tsx);
// refractor.register(bash);
// refractor.register(javascript);
SyntaxHighlighter.registerLanguage
// SyntaxHighlighter.registerLanguage(tsx);
// PrismLight.registerLanguage(bash);
// PrismLight.registerLanguage(javascript);

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-md border bg-background text-foreground',
        className
      )}
      {...props}
    >
      <div className="relative">
        <SyntaxHighlighter
          className="overflow-hidden dark:hidden"
          codeTagProps={{
            className: 'font-mono text-sm',
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
          }}
          language={language}
          lineNumberStyle={{
            color: 'hsl(var(--muted-foreground))',
            paddingRight: '1rem',
            minWidth: '2.5rem',
          }}
          showLineNumbers={showLineNumbers}
          style={oneLight}
        >
          {code}
        </SyntaxHighlighter>
        <SyntaxHighlighter
          className="hidden overflow-hidden dark:block"
          codeTagProps={{
            className: 'font-mono text-sm',
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
          }}
          language={language}
          lineNumberStyle={{
            color: 'hsl(var(--muted-foreground))',
            paddingRight: '1rem',
            minWidth: '2.5rem',
          }}
          showLineNumbers={showLineNumbers}
          style={oneDark}
        >
          {code}
        </SyntaxHighlighter>
        {children && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  </CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === 'undefined' || !navigator.clipboard.writeText) {
      onError?.(new Error('Clipboard API not available'));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn('shrink-0', className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
