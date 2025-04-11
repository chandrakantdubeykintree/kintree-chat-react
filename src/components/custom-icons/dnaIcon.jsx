export default function DnaIcon({
  className,
  strokeColor = "#54D052",
  strokeLinecap = "round",
  strokeLinejoin = "round",
}) {
  return (
    <svg
      width="22"
      height="24"
      viewBox="0 0 22 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M21.0799 21.2396C21.1069 21.4801 21.0826 21.7235 21.0087 21.9541C20.9348 22.1845 20.8131 22.3967 20.6513 22.5767C20.4891 22.7564 20.2906 22.8999 20.0691 22.9972C19.8475 23.0948 19.6076 23.1443 19.3656 23.1424H2.63417C2.39206 23.1443 2.15231 23.0948 1.93071 22.9972C1.7091 22.8999 1.51066 22.7564 1.34845 22.5767C1.18667 22.3967 1.06486 22.1845 0.990988 21.9541C0.91712 21.7235 0.89288 21.4801 0.91988 21.2396L2.42845 7.71387H19.5713L21.0799 21.2396Z"
        stroke={strokeColor}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
      <path
        d="M6.71387 7.71408V5.14265C6.71387 4.00601 7.16539 2.91591 7.96912 2.11218C8.77284 1.30846 9.86294 0.856934 10.9996 0.856934C12.1362 0.856934 13.2263 1.30846 14.03 2.11218C14.8338 2.91591 15.2853 4.00601 15.2853 5.14265V7.71408"
        stroke={strokeColor}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
    </svg>
  );
}
