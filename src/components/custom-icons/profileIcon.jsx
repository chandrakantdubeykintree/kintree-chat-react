export default function ProfileIcon({
  className,
  strokeColor = "#54D052",
  strokeLinecap = "round",
  strokeLinejoin = "round",
}) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12.0006 13.714C14.3675 13.714 16.2863 11.7952 16.2863 9.42829C16.2863 7.06136 14.3675 5.14258 12.0006 5.14258C9.63363 5.14258 7.71484 7.06136 7.71484 9.42829C7.71484 11.7952 9.63363 13.714 12.0006 13.714Z"
        stroke={strokeColor}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
      <path
        d="M4.68066 20.3996C5.44565 19.1439 6.5208 18.106 7.80274 17.386C9.08468 16.6658 10.5303 16.2876 12.0007 16.2876C13.471 16.2876 14.9166 16.6658 16.1986 17.386C17.4806 18.106 18.5556 19.1439 19.3207 20.3996"
        stroke={strokeColor}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
      <path
        d="M12.0003 23.1426C18.1544 23.1426 23.1431 18.1539 23.1431 11.9998C23.1431 5.84576 18.1544 0.856934 12.0003 0.856934C5.84625 0.856934 0.857422 5.84576 0.857422 11.9998C0.857422 18.1539 5.84625 23.1426 12.0003 23.1426Z"
        stroke={strokeColor}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
    </svg>
  );
}
