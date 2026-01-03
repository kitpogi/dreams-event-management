import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { cn } from '@/lib/utils';

/**
 * AvatarGroup component for displaying multiple avatars
 * @param {Object} props
 * @param {Array} props.avatars - Array of avatar objects: [{ src, alt, name, ...props }]
 * @param {number} props.max - Maximum number of avatars to show (default: 3)
 * @param {number} props.size - Size of avatars in rem units (default: 2.5, which is 40px)
 * @param {string} props.className - Additional CSS classes
 */
export const AvatarGroup = ({
  avatars = [],
  max = 3,
  size = 2.5,
  className,
  ...props
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);

  if (avatars.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('flex -space-x-2', className)}
      {...props}
    >
      {visibleAvatars.map((avatar, index) => {
        const initials = avatar.name
          ? avatar.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : '?';

        return (
          <Avatar
            key={index}
            style={{ width: `${size}rem`, height: `${size}rem` }}
            className={cn('border-2 border-background')}
            title={avatar.name || avatar.alt}
          >
            {avatar.src && (
              <AvatarImage src={avatar.src} alt={avatar.alt || avatar.name} />
            )}
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        );
      })}
      
      {remainingCount > 0 && (
        <Avatar
          style={{ width: `${size}rem`, height: `${size}rem` }}
          className={cn('border-2 border-background bg-muted text-muted-foreground')}
          title={`${remainingCount} more`}
        >
          <AvatarFallback className="text-xs font-semibold">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default AvatarGroup;

