import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'digest' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', interactive = false, children, ...props }, ref) => {
    const finalVariant = interactive ? 'interactive' : variant;
    
    // 基础样式类
    const baseClasses = [
      'bg-gray-900',
      'border border-gray-800',
      'rounded-lg',
      'transition-all duration-300 ease-out',
      'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
    ];

    // 变体样式
    const variantClasses = {
      default: [
        'p-6',
        'shadow-lg',
        'hover:shadow-xl',
      ],
      digest: [
        'p-4',
        'border-l-4 border-l-blue-500',
        'shadow-md',
        'hover:shadow-lg',
        'my-2',
      ],
      elevated: [
        'p-6',
        'bg-gray-800',
        'border-gray-700',
        'shadow-xl',
        'hover:shadow-2xl',
      ],
      interactive: [
        'p-6',
        'shadow-lg',
        'hover:shadow-xl',
        'hover:bg-gray-800',
        'cursor-pointer',
        'select-none',
      ],
    };

    // 内边距样式
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    // 合并所有样式类
    const allClasses = [
      ...baseClasses,
      ...variantClasses[finalVariant],
      paddingClasses[padding],
      className,
    ].filter(Boolean).join(' ');

    return (
      <div
        className={allClasses}
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 pb-4 ${className}`}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Card Title component
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight text-gray-50 ${className}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// Card Description component
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-400 ${className}`}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content component
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`pt-0 ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

// Card Footer component
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center pt-4 ${className}`}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
