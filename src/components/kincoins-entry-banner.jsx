export default function KincoinsEntryBanner() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-40 relative animate-fadeOut">
        <img
          src="/kincoinsImg/kintree_coin.svg"
          className="w-full h-auto animate-pulse-once drop-shadow-2xl"
          alt="Kintree Coin"
        />
      </div>
    </div>
  );
}
