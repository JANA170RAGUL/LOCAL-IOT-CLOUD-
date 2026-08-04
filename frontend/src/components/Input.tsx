import React, { forwardRef } from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

export const Input = forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
  return (
    <TextField
      inputRef={ref}
      variant="outlined"
      fullWidth
      size="small"
      {...props}
    />
  );
});
Input.displayName = 'Input';
