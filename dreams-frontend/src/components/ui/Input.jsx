import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "./label"

const Input = React.forwardRef(({ 
  className, 
  type, 
  label,
  floatingLabel = false,
  error,
  success,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  showPasswordToggle = false,
  maxLength,
  showCharCount = false,
  containerClassName,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [charCount, setCharCount] = React.useState(props.value?.length || props.defaultValue?.length || 0)
  const [isFocused, setIsFocused] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(props.value || props.defaultValue || "")
  const inputId = React.useId()
  const errorId = `${inputId}-error`
  const charCountId = `${inputId}-char-count`

  const inputType = type === 'password' && showPassword ? 'text' : type
  const hasError = !!error
  const hasSuccess = !!success && !hasError

  // Determine if label should be floating (focused or has value)
  const isFloating = floatingLabel && (isFocused || internalValue || props.value)

  // Sync internal value with controlled value
  React.useEffect(() => {
    if (props.value !== undefined) {
      setInternalValue(props.value)
    }
  }, [props.value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    if (showCharCount && maxLength) {
      setCharCount(newValue.length)
    }
    if (props.onChange) {
      props.onChange(e)
    }
  }

  const handleFocus = (e) => {
    setIsFocused(true)
    if (props.onFocus) {
      props.onFocus(e)
    }
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  const inputClasses = cn(
    "flex h-10 w-full rounded-md border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
    hasError && "border-destructive focus-visible:ring-destructive",
    hasSuccess && "border-success-500 focus-visible:ring-success-500",
    !hasError && !hasSuccess && "border-input focus-visible:ring-ring",
    floatingLabel && label && isFloating && "pt-5 pb-1",
    floatingLabel && label && !isFloating && "py-2",
    !floatingLabel && "py-2",
    LeftIcon ? (floatingLabel && label && isFloating ? "pl-10 pr-3" : "pl-10") : "px-3",
    (RightIcon || (type === 'password' && showPasswordToggle)) && "pr-10",
    className
  )

  const inputElement = (
    <div className="relative">
      {floatingLabel && label && (
        <Label
          htmlFor={inputId}
          className={cn(
            "absolute pointer-events-none transition-all duration-200 origin-left",
            isFloating
              ? "top-2 text-xs scale-75"
              : "top-1/2 -translate-y-1/2 text-sm",
            LeftIcon ? "left-10" : "left-3",
            hasError && "text-destructive",
            !hasError && isFloating && "text-foreground",
            !hasError && !isFloating && "text-muted-foreground"
          )}
        >
          {label}
        </Label>
      )}
      {LeftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
          <LeftIcon className="h-4 w-4" />
        </div>
      )}
      <input
        type={inputType}
        id={inputId}
        className={inputClasses}
        ref={ref}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : showCharCount ? charCountId : undefined}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        maxLength={maxLength}
        placeholder={floatingLabel && label ? undefined : props.placeholder}
        {...props}
      />
      {type === 'password' && showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
      {RightIcon && !(type === 'password' && showPasswordToggle) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <RightIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  )

  if (!label && !error && !success && !showCharCount) {
    return inputElement
  }

  return (
    <div className={cn("w-full space-y-2", containerClassName)}>
      {label && !floatingLabel && (
        <Label htmlFor={inputId} className={hasError ? "text-destructive" : ""}>
          {label}
        </Label>
      )}
      {inputElement}
      {showCharCount && maxLength && (
        <div id={charCountId} className="text-xs text-muted-foreground text-right">
          {charCount} / {maxLength}
        </div>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-sm text-success-600 dark:text-success-400">
          {success}
        </p>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
export default Input
