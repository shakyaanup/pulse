// The animated Pulse mark: a heartbeat line drawn inside a rounded square.
// aria-hidden because the app name is always written next to it.
const Logo = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth="6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="20" y="20" width="160" height="160" rx="32" ry="32" />
    <path
      d="M40 100 L70 100 L85 75 L100 135 L120 65 L140 100 L160 100"
      strokeDasharray="300"
      strokeDashoffset="300"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="300"
        to="0"
        dur="3s"
        repeatCount="indefinite"
      />
    </path>
    <circle cx="160" cy="100" r="5">
      <animate
        attributeName="r"
        values="5;8;5"
        dur="1.2s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        values="1;0.6;1"
        dur="1.2s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

export default Logo;
