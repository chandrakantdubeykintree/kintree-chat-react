export default function GlobalSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-xs z-50">
      <div className="relative">
        <img
          src="/kintreeLogo.svg"
          alt="Kintree"
          className="h-12 animate-fillBaloon"
        />
      </div>
    </div>
  );
}
