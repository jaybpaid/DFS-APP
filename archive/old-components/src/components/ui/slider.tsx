import * as React from 'react';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const Slider = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    type='range'
    ref={ref}
    className={cn(
      'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
      className
    )}
    {...props}
  />
));
Slider.displayName = 'Slider';
