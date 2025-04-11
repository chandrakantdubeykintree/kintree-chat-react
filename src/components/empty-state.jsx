import { Card } from "./ui/card";

export default function EmptyState({ title, message, message2, imgSrc }) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 py-10 text-center gap-8 border-none shadow-none">
      {imgSrc && (
        <div className="">
          <img src={imgSrc} />
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm">{message}</p>
        <p className="text-sm">{message2}</p>
      </div>
    </Card>
  );
}
