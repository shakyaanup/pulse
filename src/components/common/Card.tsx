import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
}

const Card = ({ title, children }: CardProps) => {
  return (
    <div className="card">
      <h3 className="card__title">{title}</h3>
      <div className="card__body">{children}</div>
    </div>
  );
};

export default Card;
