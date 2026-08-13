import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui';

import type { WithdrawModel } from '../hooks/useWithdrawRelease';

// Props in, JSX out. Every screen that can take a release back renders this one,
// so the confirmation reads the same wherever it is triggered.
export function WithdrawDialog({ dialog }: { dialog: WithdrawModel['dialog'] }) {
  return (
    <Dialog open={dialog.isOpen} onOpenChange={(open) => (open ? undefined : dialog.onCancel())}>
      <DialogContent className="sm:max-w-105">
        <DialogHeader>
          <DialogTitle>{dialog.title}</DialogTitle>
          <DialogDescription>{dialog.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={dialog.onCancel}>
            Keep it as it is
          </Button>
          <Button onClick={dialog.onConfirm} className="bg-danger text-canvas hover:bg-danger/85">
            {dialog.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
