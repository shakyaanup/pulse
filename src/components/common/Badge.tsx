import clsx from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
}

const Badge = ({ label, variant = 'neutral' }: BadgeProps) => {
  return (
    <div
      className={clsx(
        'badge',
        variant === 'success' && 'badge--success',
        variant === 'warning' && 'badge--warning',
        variant === 'danger' && 'badge--danger',
        variant === 'neutral' && 'badge--neutral'
      )}
    >
      {label}
    </div>
  );
};

export default Badge;
