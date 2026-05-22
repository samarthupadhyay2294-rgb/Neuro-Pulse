import { Link } from "react-router-dom";
import logoImg from "../assets/neuro-pulse-logo.png";

const sizes = {
  xs: "h-8 w-8",
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-20 w-20",
  "2xl": "h-24 w-24",
};

export default function Logo({
  size = "md",
  showText = false,
  className = "",
  linkTo = null,
}) {
  const img = (
    <img
      src={logoImg}
      alt="Neuro Pulse"
      className={`${sizes[size] || sizes.md} shrink-0 rounded-full object-cover shadow-glow`}
    />
  );

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {img}
      {showText && (
        <span className="text-lg font-bold tracking-tight text-primary">Neuro Pulse</span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
