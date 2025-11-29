import React from "react"
import { Link } from "react-router-dom"

interface ButtonProps {
  // page that the button leads to
  link: string;
  // image used
  imgSrc: string;
  // text, optional
  text?: string;
  // pixel size, optional
  size?: number;
  // class name, optional
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  link,
  imgSrc,
  text = 'Link Button',
  size = 12,
  className = '',
}) => {
  return (
    <Link to={link} className={className} style={{ display: 'inline-block' }}>
      <img src={imgSrc} alt={text} style={{width: size,height: size}}/>
    </Link>
  );
};

export default Button;
