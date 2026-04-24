import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  /** MDI path string from @mdi/js */
  path: string;
  /** Size in rem (default: 1 = 24px). Pass "auto" to inherit via CSS. */
  size?: number | string;
  /** Accessible title */
  title?: string;
}

/**
 * Lightweight MDI icon wrapper that renders inline SVGs.
 * Supports className for Tailwind sizing (size-4, size-5, etc.).
 * When className includes a size class, set size="auto" to let CSS control dimensions.
 */
const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ path, size, title, className, ...props }, ref) => {
    // If className has a size/width/height class, default to CSS sizing
    const hasClassSize = className && /\b(size-|w-|h-|text-)/.test(className);
    const effectiveSize = size ?? (hasClassSize ? undefined : 1);

    const sizeValue =
      effectiveSize === undefined || effectiveSize === 'auto'
        ? undefined
        : `${Number(effectiveSize) * 1.5}rem`;

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        role={title ? 'img' : 'presentation'}
        aria-hidden={!title}
        className={cn('inline-block shrink-0 fill-current', className)}
        width={sizeValue}
        height={sizeValue}
        {...props}
      >
        {title && <title>{title}</title>}
        <path d={path} />
      </svg>
    );
  }
);
Icon.displayName = 'Icon';

export { Icon, type IconProps };
