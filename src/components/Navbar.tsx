import React, { useState } from 'react';
import { Button } from './Button';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'elevated' | 'transparent';
  size?: 'sm' | 'md' | 'lg';
  brand?: React.ReactNode;
  leftItems?: React.ReactNode;
  rightItems?: React.ReactNode;
  mobileMenu?: React.ReactNode;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      brand,
      leftItems,
      rightItems,
      mobileMenu,
      isMobileMenuOpen = false,
      onMobileMenuToggle,
      children,
      ...props
    },
    ref
  ) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isControlled = onMobileMenuToggle !== undefined;
    const menuOpen = isControlled ? isMobileMenuOpen : isMenuOpen;
    const toggleMenu = isControlled ? onMobileMenuToggle : () => setIsMenuOpen(!isMenuOpen);

    // 基础样式类
    const baseClasses = [
      'flex items-center justify-between',
      'w-full',
      'bg-gray-900',
      'border-b border-gray-800',
      'px-4 py-3',
      'transition-all duration-300 ease-out',
    ];

    // 变体样式
    const variantClasses = {
      default: 'shadow-lg',
      elevated: 'shadow-xl',
      transparent: 'bg-transparent border-transparent',
    };

    // 尺寸样式
    const sizeClasses = {
      sm: 'h-12',
      md: 'h-16',
      lg: 'h-20',
    };

    // 合并所有样式类
    const allClasses = [
      ...baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].filter(Boolean).join(' ');

    return (
      <nav
        ref={ref}
        className={allClasses}
        role="navigation"
        aria-label="Main navigation"
        {...props}
      >
        {/* Brand */}
        <div className="flex items-center">
          {brand && (
            <div className="flex-shrink-0">
              {brand}
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {leftItems && (
            <div className="flex items-center space-x-6">
              {leftItems}
            </div>
          )}
        </div>

        {/* Right side items */}
        <div className="flex items-center space-x-4">
          {rightItems && (
            <div className="hidden md:flex md:items-center md:space-x-4">
              {rightItems}
            </div>
          )}

          {/* Mobile menu button */}
          {mobileMenu && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenu && menuOpen && (
          <div
            id="mobile-menu"
            className="absolute top-full left-0 right-0 z-50 md:hidden"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="mobile-menu-button"
          >
            <div className="bg-gray-900 border-b border-gray-800 shadow-xl">
              <div className="px-4 py-2 space-y-1">
                {mobileMenu}
              </div>
            </div>
          </div>
        )}

        {children}
      </nav>
    );
  }
);

Navbar.displayName = 'Navbar';

// Navbar Brand component
const NavbarBrand = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center space-x-2 ${className}`}
    {...props}
  >
    {children}
  </div>
));
NavbarBrand.displayName = 'NavbarBrand';

// Navbar Item component
const NavbarItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center ${className}`}
    {...props}
  >
    {children}
  </div>
));
NavbarItem.displayName = 'NavbarItem';

// Navbar Link component
const NavbarLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    active?: boolean;
  }
>(({ className = '', active = false, children, ...props }, ref) => (
  <a
    ref={ref}
    className={`
      px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300
      text-gray-300 hover:text-gray-50 hover:bg-gray-800
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      ${active ? 'text-gray-50 bg-gray-800' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </a>
));
NavbarLink.displayName = 'NavbarLink';

// Navbar Divider component
const NavbarDivider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`h-6 w-px bg-gray-700 ${className}`}
    role="separator"
    aria-orientation="vertical"
    {...props}
  />
));
NavbarDivider.displayName = 'NavbarDivider';

export { Navbar, NavbarBrand, NavbarItem, NavbarLink, NavbarDivider };
