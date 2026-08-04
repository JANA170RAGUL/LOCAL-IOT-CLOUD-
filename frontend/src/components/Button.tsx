import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends MuiButtonProps {
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ isLoading, children, ...props }) => {
  return (
    <MuiButton
      variant={props.variant || "contained"}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <CircularProgress size={20} color="inherit" style={{ marginRight: 8 }} /> : null}
      {children}
    </MuiButton>
  );
};
