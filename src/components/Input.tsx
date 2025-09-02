import * as React from 'react';

// 1) 移除原生 `size`，防止与 UI 尺寸同名冲突
type NativeInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

// 2) 定义 UI 尺寸，兼容历史 small/medium/large，减少改造面
export interface InputProps extends NativeInputProps {
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'error' | 'success';
  leftIcon?: React.ReactNode;
}

function normalizeSize(size?: InputProps['size']): 'sm' | 'md' | 'lg' {
  if (size === 'small') return 'sm';
  if (size === 'medium') return 'md';
  if (size === 'large') return 'lg';
  return (size as 'sm' | 'md' | 'lg') ?? 'md';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size, variant = 'default', leftIcon, className, ...rest },
  ref
) {
  const uiSize = normalizeSize(size);

  // 若你已有样式系统，将下述 className 替换为你的一致实现
  const sizeClass = uiSize === 'sm' ? 'text-sm' : uiSize === 'lg' ? 'text-lg' : 'text-base';
  const variantClass =
    variant === 'error' ? 'border-red-500' :
    variant === 'success' ? 'border-green-500' :
    'border-gray-300';

  return (
    <div className={`relative ${className ?? ''}`} data-size={uiSize} data-variant={variant}>
      {leftIcon ? <span className="absolute left-2 top-1/2 -translate-y-1/2">{leftIcon}</span> : null}
      <input
        ref={ref}
        className={`w-full border rounded px-3 py-2 ${sizeClass} ${variantClass} ${leftIcon ? 'pl-9' : ''}`}
        {...rest}
      />
    </div>
  );
});

export default Input;
