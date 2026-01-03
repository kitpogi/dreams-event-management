import { cn } from '@/lib/utils';

/**
 * PriceDisplay component for displaying prices with formatting
 * @param {Object} props
 * @param {number} props.amount - Price amount
 * @param {string} props.currency - Currency code (default: 'PHP')
 * @param {boolean} props.showCurrency - Show currency symbol
 * @param {boolean} props.showDecimals - Show decimal places
 * @param {number} props.size - Size variant: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} props.variant - Variant: 'default' | 'sale' | 'original' | 'discounted'
 * @param {number} props.originalPrice - Original price for discount display
 * @param {string} props.className - Additional CSS classes
 */
export const PriceDisplay = ({
  amount,
  currency = 'PHP',
  showCurrency = true,
  showDecimals = true,
  size = 'md',
  variant = 'default',
  originalPrice,
  className,
  ...props
}) => {
  const currencySymbols = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl font-bold',
  };

  const variantClasses = {
    default: 'text-foreground',
    sale: 'text-destructive font-semibold',
    original: 'text-muted-foreground line-through',
    discounted: 'text-success-600 dark:text-success-400 font-semibold',
  };

  const formatPrice = (price) => {
    if (showDecimals) {
      return price.toFixed(2);
    }
    return Math.round(price).toString();
  };

  const symbol = currencySymbols[currency] || currency;
  const formattedAmount = formatPrice(amount);
  const hasDiscount = originalPrice && originalPrice > amount;

  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <div className="flex items-baseline gap-2">
        {hasDiscount && variant === 'discounted' && (
          <span
            className={cn(
              sizeClasses[size],
              variantClasses.original
            )}
          >
            {showCurrency && symbol}
            {formatPrice(originalPrice)}
          </span>
        )}
        
        <span
          className={cn(
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          {showCurrency && symbol}
          {formattedAmount}
        </span>
      </div>
      
      {hasDiscount && (
        <span className="text-xs text-muted-foreground">
          Save {symbol}
          {formatPrice(originalPrice - amount)} (
          {Math.round(((originalPrice - amount) / originalPrice) * 100)}% off)
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;

