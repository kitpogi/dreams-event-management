import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

/**
 * RichTextEditor - A simple rich text editor component
 * 
 * @param {Object} props
 * @param {String} props.value - HTML content value
 * @param {Function} props.onChange - Callback when content changes
 * @param {String} props.placeholder - Placeholder text
 * @param {String} props.className - Additional CSS classes
 * @param {Boolean} props.disabled - Disable editor
 */
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  disabled = false,
  minHeight = '200px',
  maxHeight,
}) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', label: 'Bold' },
    { icon: Italic, command: 'italic', label: 'Italic' },
    { icon: Underline, command: 'underline', label: 'Underline' },
    { separator: true },
    { icon: List, command: 'insertUnorderedList', label: 'Bullet List' },
    { icon: ListOrdered, command: 'insertOrderedList', label: 'Numbered List' },
    { separator: true },
    { icon: AlignLeft, command: 'justifyLeft', label: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', label: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', label: 'Align Right' },
    { separator: true },
    { icon: Link, command: 'link', label: 'Insert Link', action: insertLink },
    { icon: ImageIcon, command: 'image', label: 'Insert Image', action: insertImage },
  ];

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden',
        isFocused && 'ring-2 ring-primary ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Toolbar */}
      <div className="border-b bg-gray-50 dark:bg-gray-800 p-2 flex items-center gap-1 flex-wrap">
        {toolbarButtons.map((button, index) => {
          if (button.separator) {
            return (
              <div
                key={`separator-${index}`}
                className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"
              />
            );
          }

          const Icon = button.icon;
          const handleClick = () => {
            if (button.action) {
              button.action();
            } else {
              execCommand(button.command);
            }
          };

          return (
            <Button
              key={button.command}
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClick}
              disabled={disabled}
              className="h-8 w-8"
              title={button.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'p-4 outline-none',
          'prose prose-sm max-w-none',
          'dark:prose-invert',
          '[&_ul]:list-disc [&_ul]:ml-6',
          '[&_ol]:list-decimal [&_ol]:ml-6',
          '[&_p]:my-2',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4',
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3',
          '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2',
          '[&_a]:text-primary [&_a]:underline',
          '[&_img]:max-w-full [&_img]:rounded',
        )}
        style={{
          minHeight,
          maxHeight,
          overflowY: maxHeight ? 'auto' : 'visible',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

