import React from 'react';
interface LogoProps {
  variant?: 'full' | 'wordmark' | 'monogram' | 'lockup-h';
  theme?: 'dark' | 'light' | 'bronze';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subTitle?: string;
}
/** The supplied artwork is preserved, including the original ribbon and serif shapes. */
export const VasselLogo: React.FC<LogoProps> = ({ variant = 'full', theme = 'dark', className = '', size = 'md' }) => {
  const width = { sm: 118, md: 155, lg: 210, xl: 290 }[size];
  const mono = variant === 'monogram';
  const wordmark = variant === 'wordmark';
  const viewBox = mono ? '445 346 357 309' : wordmark ? '235 697 790 143' : '235 346 790 565';
  return <svg role="img" aria-label="Vassel Fashion Brand" viewBox={viewBox}
    width={mono ? width * .4 : width}
    className={`brand-artwork brand-artwork--${theme} ${className}`}>
    <image href="/brand/vassel-original.webp" width="1254" height="1254" />
  </svg>;
};
