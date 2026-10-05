import React from 'react';
import {
  Box,
  Button,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  IconButton,
} from '@mui/material';
import { Queue, Delete } from '@mui/icons-material';

export default function PlaylistDrawer({
  isPlaylistOpen,
  setIsPlaylistOpen,
  filteredPaths,
  rawPaths,
  playlistDirectories,
  handleAddDirectory,
  handleClearPlaylist,
  handleRemoveDirectory,
}) {
  return (
    <Drawer anchor="right" open={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)}>
      <Box style={{ width: 320, padding: '16px' }}>
        <Typography variant="h6" gutterBottom>
          Playlist Manager
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Matching Images: {filteredPaths.length} / Total Loaded: {rawPaths.length}
        </Typography>

        <Box style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Queue />}
            onClick={handleAddDirectory}
            className="drawer-action-btn"
          >
            Add
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            startIcon={<Delete />}
            onClick={handleClearPlaylist}
            disabled={playlistDirectories.length === 0}
            className="drawer-action-btn"
          >
            Clear
          </Button>
        </Box>

        <Divider />

        <List>
          {playlistDirectories.map((item, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={item.dirPath.split(/[/\\]/).pop() || item.dirPath}
                secondary={`${item.images.length} images`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleRemoveDirectory(index)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
