import AsyncComponent from "./async-component";
import { Dialog, DialogContent } from "./ui/dialog";

export default function KintreeTermsDialog({ isOpen, onClose, type, url }) {
  return (
    <AsyncComponent>
      <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
        <DialogContent className="max-w-[1250px] h-[90vh] bg-background dark:bg-foreground kinterms-dialog">
          <iframe
            src={url}
            style={{ width: "100%", height: "100%" }}
            title={type}
          ></iframe>
        </DialogContent>
      </Dialog>
    </AsyncComponent>
  );
}
