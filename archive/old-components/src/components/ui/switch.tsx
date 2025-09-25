import * as React from 'react';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const Switch = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    type='checkbox'
    ref={ref}
    className={cn(
      'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
      className
    )}
    {...props}
  />
));
Switch.displayName = 'Switch';
