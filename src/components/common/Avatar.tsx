import { useState } from 'react';
import clsx from 'clsx';
import { getInitials } from '../../utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Shows the photo when there is one, otherwise the person's initials.
// A broken image URL also falls back to initials.
const Avatar = ({ name, src, size = 'md' }: AvatarProps) => {
  // Remember *which* URL failed, so a new src gets a fresh attempt
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span className={clsx('avatar', `avatar--${size}`)} aria-hidden="true">
      {showImage ? (
        <img
          className="avatar__image"
          src={src}
          alt=""
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
};

export default Avatar;
