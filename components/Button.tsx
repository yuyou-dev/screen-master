import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isActive?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isActive = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-cine-border hover:bg-zinc-700 text-white border border-zinc-700",
    secondary: "bg-transparent text-zinc-400 hover:text-white border border-dashed border-zinc-700 hover:border-zinc-500",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
    accent: "bg-cine-accent text-black font-bold hover:bg-opacity-90 shadow-lg shadow-cine-accent/20",
    icon: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
  };

  const activeStyles = isActive ? "bg-zinc-700 text-white border-zinc-500 shadow-inner" : "";
  
  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-sm",
    md: "text-sm px-4 py-2 rounded-sm",
    lg: "text-base px-6 py-3 rounded-md",
    icon: "p-2 rounded-md"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${activeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};