import React from "react"
import { Link } from "react-router-dom"

interface ButtonProps {
  // page that the button leads to
  link: string;
  // image used
  imgSrc?: string;
  // text, optional
  text?: string;
  // pixel size, optional
  size?: number;
  // class name, optional
  className?: string;
  // alternate icon used instead of image
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  link,
  imgSrc,
  text = 'Link Button',
  size = 12,
  className = '',
  icon,
}) => {
  return (
    <Link to={link} className={className} style={{ display: 'inline-block' }}>
      {icon ? (
        // Render the React icon component
        React.cloneElement(icon as React.ReactElement, { width: size, height: size })
      ) : imgSrc ? (
        // Fallback to imgSrc if no icon is passed
        <img src={imgSrc} alt={text} style={{ width: size, height: size }} />
      ) : null}
    </Link>
  );
};

export default Button;
