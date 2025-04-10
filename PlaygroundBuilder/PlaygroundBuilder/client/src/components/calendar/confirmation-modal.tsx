import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isPending 
}: DeleteConfirmationProps) {
  const { t } = useTranslation();

  // Funktion, die beim Klicken auf den Bestätigungsbutton aufgerufen wird
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>{t('confirm.deleteTitle')}</DialogTitle>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('confirm.deleteMessage')}
          </p>
        </DialogHeader>
        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            {t('confirm.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? t('confirm.deleting') : t('confirm.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
