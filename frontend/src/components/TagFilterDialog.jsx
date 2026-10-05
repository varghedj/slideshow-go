import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Chip, Stack, Button } from '@mui/material';

export default function TagFilterDialog({
  isFilterDialogOpen,
  setIsFilterDialogOpen,
  allKnownTags,
  selectedFilterTags,
  handleToggleFilterTag,
  setSelectedFilterTags,
}) {
  return (
    <Dialog open={isFilterDialogOpen} onClose={() => setIsFilterDialogOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Filter Images by Tag</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Select tags to filter the current slideshow:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {Array.from(allKnownTags).map((tag) => {
              const isSelected = selectedFilterTags.includes(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  color={isSelected ? 'secondary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => handleToggleFilterTag(tag)}
                  clickable
                />
              );
            })}
          </Stack>
          {selectedFilterTags.length > 0 && (
            <Button variant="text" color="error" onClick={() => setSelectedFilterTags([])}>
              Clear Filters
            </Button>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
