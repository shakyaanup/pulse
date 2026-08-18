import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        'btn',
        variant === 'primary' && 'btn--primary',
        variant === 'secondary' && 'btn--secondary',
        variant === 'danger' && 'btn--danger',
        size === 'sm' && 'btn--sm',
        size === 'md' && 'btn--md',
        size === 'lg' && 'btn--lg',
        isLoading && 'btn--loading'
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <span className="btn__spinner" /> : children}
    </button>
  );
};

export default Button;
