import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Chip,
  Stack,
  TextField,
  Button,
  Divider,
} from '@mui/material';

export default function TagManagerDialog({
  isTagDialogOpen,
  setIsTagDialogOpen,
  tags,
  availableSuggestedTags,
  tagInput,
  setTagInput,
  handleAddTagByName,
}) {
  return (
    <Dialog open={isTagDialogOpen} onClose={() => setIsTagDialogOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Image Tags</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Active Image Tags */}
          <Typography variant="caption" color="textSecondary">
            Assigned Tags
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {tags.map((tag) => (
              <Chip key={tag} label={tag} color="primary" variant="filled" />
            ))}
          </Stack>

          {/* Clickable Existing / Suggested Tags */}
          {availableSuggestedTags.length > 0 && (
            <>
              <Divider />
              <Typography variant="caption" color="textSecondary">
                Click an existing tag to add:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {availableSuggestedTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={`+ ${tag}`}
                    variant="outlined"
                    onClick={() => handleAddTagByName(tag)}
                    clickable
                  />
                ))}
              </Stack>
            </>
          )}

          <Divider />

          {/* Manual Input Field */}
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="New Tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTagByName()}
              fullWidth
            />
            <Button variant="contained" onClick={() => handleAddTagByName()}>
              Add
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
