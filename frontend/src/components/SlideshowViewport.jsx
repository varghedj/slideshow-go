import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

export default function SlideshowViewport({
  loading,
  filteredPaths,
  rawPaths,
  currentSrc,
  currentFileName,
  transitionsEnabled,
  imgKey,
  handleLoadSingleFolder,
}) {
  return (
    <Box className="main-viewport">
      {loading && <CircularProgress className="loading-spinner" />}

      {filteredPaths.length > 0 ? (
        <img
          key={transitionsEnabled ? `slide-${imgKey}` : 'static-slide'}
          src={currentSrc}
          alt={currentFileName || 'Slide'}
          className={`slideshow-image ${transitionsEnabled ? 'fade-active' : ''}`}
        />
      ) : (
        <Box className="empty-state-container">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PlayArrow fontSize="large" />}
            onClick={handleLoadSingleFolder}
            className="start-slideshow-btn"
          >
            {rawPaths.length > 0 ? 'No Matching Filter Images' : 'Start Slideshow'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
