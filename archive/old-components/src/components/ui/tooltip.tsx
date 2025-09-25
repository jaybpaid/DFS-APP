import * as React from 'react';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <div className='relative inline-block'>{children}</div>
);

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('cursor-pointer', className)} {...props} />
));
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute z-50 overflow-hidden rounded-md border bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';
