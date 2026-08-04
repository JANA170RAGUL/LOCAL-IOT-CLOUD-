import React, { forwardRef } from 'react';
import { TextField, MenuItem } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

type SelectOption = { value: string | number; label: string };

type SelectProps = Omit<TextFieldProps, 'variant'> & {
  options: SelectOption[];
  variant?: 'standard' | 'outlined' | 'filled';
};

export const Select = forwardRef<HTMLInputElement, SelectProps>(({ options, ...props }, ref) => {
  return (
    <TextField
      inputRef={ref}
      select
      variant={props.variant || "outlined"}
      fullWidth
      size="small"
      {...props}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
});
Select.displayName = 'Select';
