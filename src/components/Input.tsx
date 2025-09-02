import React from 'react';

type NativeInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface InputProps extends NativeInputProps {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      leftIcon,
      rightIcon,
      error = false,
      success = false,
      disabled,
      ...props
    },
    ref
  ) => {
    // Determine variant based on props
    let finalVariant = variant;
    if (error) finalVariant = 'error';
    if (success) finalVariant = 'success';

    // 基础样式类
    const baseClasses = [
      'flex w-full',
      'rounded-md',
      'border',
      'bg-gray-900',
      'text-sm',
      'text-gray-50',
      'placeholder:text-gray-500',
      'transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'min-h-[44px]', // Minimum touch target
    ];

    // 变体样式
    const variantClasses = {
      default: [
        'border-gray-700',
        'hover:border-gray-600',
        'focus-visible:border-blue-500',
      ],
      error: [
        'border-red-500',
        'focus-visible:ring-red-500',
        'focus-visible:border-red-500',
      ],
      success: [
        'border-green-500',
        'focus-visible:ring-green-500',
        'focus-visible:border-green-500',
      ],
    };

    // 尺寸样式
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    // 合并所有样式类
    const allClasses = [
      ...baseClasses,
      ...variantClasses[finalVariant],
      sizeClasses[size],
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}
        <input
          className={allClasses}
          ref={ref}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          style={{
            paddingLeft: leftIcon ? '2.5rem' : undefined,
            paddingRight: rightIcon ? '2.5rem' : undefined,
          }}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Input Group component for combining inputs
const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex ${className}`}
    {...props}
  >
    {children}
  </div>
));
InputGroup.displayName = 'InputGroup';

// Input Addon component
const InputAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`
      flex items-center px-3 py-2
      text-sm text-gray-400
      bg-gray-800 border border-gray-700
      first:rounded-l-md last:rounded-r-md
      border-r-0 last:border-r
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
));
InputAddon.displayName = 'InputAddon';

// Input Error component
const InputError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', children, ...props }, ref) => (
  <p
    ref={ref}
    className={`mt-1 text-sm text-red-500 ${className}`}
    {...props}
  >
    {children}
  </p>
));
InputError.displayName = 'InputError';

// Input Help component
const InputHelp = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', children, ...props }, ref) => (
  <p
    ref={ref}
    className={`mt-1 text-sm text-gray-400 ${className}`}
    {...props}
  >
    {children}
  </p>
));
InputHelp.displayName = 'InputHelp';

export { Input, InputGroup, InputAddon, InputError, InputHelp };
