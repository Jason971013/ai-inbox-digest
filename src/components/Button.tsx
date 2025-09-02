import React from 'react';

type NativeButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>;

export interface ButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // 基础样式类
    const baseClasses = [
      'inline-flex items-center justify-center gap-2',
      'font-medium text-sm',
      'rounded-md',
      'transition-all duration-300 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'min-h-[44px] min-w-[44px]', // Minimum touch target
    ];

    // 变体样式
    const variantClasses = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        'active:bg-blue-800',
        'shadow-sm',
      ],
      secondary: [
        'bg-transparent text-gray-400',
        'border border-gray-700',
        'hover:bg-gray-800 hover:text-gray-300',
        'active:bg-gray-900',
      ],
      ghost: [
        'bg-transparent text-gray-400',
        'hover:bg-gray-900 hover:text-gray-300',
        'active:bg-gray-800',
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700',
        'active:bg-red-800',
        'shadow-sm',
      ],
    };

    // 尺寸样式
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    };

    // 宽度样式
    const widthClasses = fullWidth ? 'w-full' : '';

    // 合并所有样式类
    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        className={allClasses}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
