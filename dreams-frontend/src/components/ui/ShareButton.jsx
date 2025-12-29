import { useState } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Linkedin, Mail, Link2 } from 'lucide-react';
import { Button } from './Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { cn } from '@/lib/utils';
import { useToast } from '../../hooks/use-toast';

const ShareButton = ({
  url,
  title,
  description,
  className,
  variant = 'outline',
  size = 'icon',
  showSocialLinks = true,
  showCopyLink = true,
  customText,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const currentUrl = url || window.location.href;
  const shareTitle = title || document.title;
  const shareDescription = description || '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'The link has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again or copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: currentUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      color: 'text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`,
      color: 'text-info-400 hover:bg-info-50 dark:hover:bg-info-900/20',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      color: 'text-info-700 hover:bg-info-50 dark:hover:bg-info-900/20',
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareDescription + '\n\n' + currentUrl)}`,
      color: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
          {customText && <span>{customText}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Share2 className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Share
            </span>
          </div>

          {showCopyLink && (
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Copy link</span>
                </>
              )}
            </button>
          )}

          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <Share2 className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Share via...</span>
            </button>
          )}

          {showSocialLinks && (
            <>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  {shareLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                          link.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{link.name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {showCopyLink && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                <Link2 className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {currentUrl}
                </span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareButton;

