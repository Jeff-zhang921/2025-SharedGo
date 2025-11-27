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
}

const Button: React.FC<ButtonProps> = ({
  // initialised, and defaults set for text & size
  link,
  imgSrc,
  text = 'Link Button',
  size = 12,
}) => {
  return (
    <Link to={link} style={{ display: 'inline-block' }}>
      <img
        src={imgSrc}
        alt={text}
        style={{
          width: size,
          height: size
        }}
      />
    </Link>
  );
};

export default Button;
