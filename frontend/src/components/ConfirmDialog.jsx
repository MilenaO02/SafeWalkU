import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  busy = false,
  confirmDisabled = false,
  danger = false,
  error = '',
  onConfirm,
  onClose
}) {
  return (
    <Dialog
      open={Boolean(open)}
      onClose={busy ? undefined : onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      slotProps={{
        paper: {
          className: 'dark:bg-[#2B2B2F] dark:text-slate-100',
          sx: { borderRadius: 3, width: 'min(92vw, 440px)' }
        }
      }}
    >
      <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description" className="dark:text-slate-300">
          {message}
        </DialogContentText>
        {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      </DialogContent>
      <DialogActions sx={{ padding: '12px 24px 20px', gap: 1 }}>
        <Button onClick={onClose} disabled={busy} color="inherit" sx={{ minHeight: 44, fontWeight: 700 }}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy || confirmDisabled}
          variant="contained"
          color={danger ? 'error' : 'secondary'}
          sx={{ minHeight: 44, fontWeight: 800 }}
        >
          {busy ? 'Procesando…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
