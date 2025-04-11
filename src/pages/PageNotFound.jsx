import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  const handleGoBack = () => {
    window.history.pushState({}, "", "/foreroom");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
      {/* Stars background - move it behind with lower z-index */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle ${Math.random() * 2 + 1}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Content - bring it forward with higher z-index */}
      <div className="text-center relative z-10">
        <img
          src={"/kintreeLogo.svg"}
          alt="Kintree Logo"
          className="w-48 h-48 mb-8 mx-auto animate-bounce-slow"
        />
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-8">
          Oops! Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={handleGoBack}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
        >
          Go Back Home
        </Button>
      </div>
    </div>
  );
}
