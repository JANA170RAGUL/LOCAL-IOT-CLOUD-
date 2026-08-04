import type { FC } from 'react';
import { TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search…',
}) => (
  <TextField
    label="Search"
    placeholder={placeholder}
    fullWidth
    size="small"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    slotProps={{
      input: {
        startAdornment: (
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
        ),
      },
    }}
  />
);
