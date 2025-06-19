import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
  headerAction?: ReactNode;
}

export function Card({
  children,
  className = '',
  title,
  description,
  footer,
  headerAction,
}: CardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {(title || description || headerAction) && (
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-medium">{title}</h3>}
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
    </div>
  );
}

// Card subcomponents for more complex layouts
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`border-b border-gray-200 px-6 py-4 ${className}`}>{children}</div>;
}

export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`border-t border-gray-200 px-6 py-4 ${className}`}>{children}</div>;
}