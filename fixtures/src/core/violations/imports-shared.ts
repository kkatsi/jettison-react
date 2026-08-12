// VIOLATION — core is the bottom layer; it may not import shared.
// Expected: boundaries/dependencies
import { Button } from '@shared/ui';

export const label = String(Button);
