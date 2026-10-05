import React from 'react';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { muiTheme } from './theme';
import { useSlideshow } from './hooks/useSlideshow';
import SlideshowViewport from './components/SlideshowViewport';
import Toolbar from './components/Toolbar';
import PlaylistDrawer from './components/PlaylistDrawer';
import TagFilterDialog from './components/TagFilterDialog';
import TagManagerDialog from './components/TagManagerDialog';
import './App.css';

export default function App() {
  const s = useSlideshow();

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        onMouseMove={s.handleMouseMove}
        className={`app-container ${!s.shouldDisplayToolbar ? 'cursor-hidden' : ''}`}
      >
        {/* Main Viewport (Image or Unified Start Button) */}
        <SlideshowViewport
          loading={s.loading}
          filteredPaths={s.filteredPaths}
          rawPaths={s.rawPaths}
          currentSrc={s.currentSrc}
          currentFileName={s.currentFileName}
          transitionsEnabled={s.transitionsEnabled}
          imgKey={s.imgKey}
          handleLoadSingleFolder={s.handleLoadSingleFolder}
        />

        {/* Floating Control Toolbar */}
        <Toolbar
          playlistDirectories={s.playlistDirectories}
          handleAddDirectory={s.handleAddDirectory}
          handleLoadSingleFolder={s.handleLoadSingleFolder}
          setIsPlaylistOpen={s.setIsPlaylistOpen}
          selectedFilterTags={s.selectedFilterTags}
          setIsFilterDialogOpen={s.setIsFilterDialogOpen}
          isLikedState={s.isLikedState}
          handleToggleLike={s.handleToggleLike}
          filteredPaths={s.filteredPaths}
          tags={s.tags}
          handleToggleTagDialog={s.handleToggleTagDialog}
          isPinned={s.isPinned}
          setIsPinned={s.setIsPinned}
          handlePrev={s.handlePrev}
          handleNext={s.handleNext}
          isPlaying={s.isPlaying}
          setIsPlaying={s.setIsPlaying}
          isShuffle={s.isShuffle}
          handleToggleShuffle={s.handleToggleShuffle}
          transitionsEnabled={s.transitionsEnabled}
          setTransitionsEnabled={s.setTransitionsEnabled}
          intervalSec={s.intervalSec}
          setIntervalSec={s.setIntervalSec}
          handleDecreaseInterval={s.handleDecreaseInterval}
          handleIncreaseInterval={s.handleIncreaseInterval}
          isFullscreen={s.isFullscreen}
          handleToggleFullscreen={s.handleToggleFullscreen}
          currentFilePath={s.currentFilePath}
          currentFileName={s.currentFileName}
          copied={s.copied}
          handleCopyPath={s.handleCopyPath}
          shouldDisplayToolbar={s.shouldDisplayToolbar}
          handleToolbarMouseEnter={s.handleToolbarMouseEnter}
          handleToolbarMouseLeave={s.handleToolbarMouseLeave}
        />

        {/* Playlist Drawer Panel */}
        <PlaylistDrawer
          isPlaylistOpen={s.isPlaylistOpen}
          setIsPlaylistOpen={s.setIsPlaylistOpen}
          filteredPaths={s.filteredPaths}
          rawPaths={s.rawPaths}
          playlistDirectories={s.playlistDirectories}
          handleAddDirectory={s.handleAddDirectory}
          handleClearPlaylist={s.handleClearPlaylist}
          handleRemoveDirectory={s.handleRemoveDirectory}
        />

        {/* Tag Filter Dialog */}
        <TagFilterDialog
          isFilterDialogOpen={s.isFilterDialogOpen}
          setIsFilterDialogOpen={s.setIsFilterDialogOpen}
          allKnownTags={s.allKnownTags}
          selectedFilterTags={s.selectedFilterTags}
          handleToggleFilterTag={s.handleToggleFilterTag}
          setSelectedFilterTags={s.setSelectedFilterTags}
        />

        {/* Tag Management Dialog */}
        <TagManagerDialog
          isTagDialogOpen={s.isTagDialogOpen}
          setIsTagDialogOpen={s.setIsTagDialogOpen}
          tags={s.tags}
          availableSuggestedTags={s.availableSuggestedTags}
          tagInput={s.tagInput}
          setTagInput={s.setTagInput}
          handleAddTagByName={s.handleAddTagByName}
        />
      </Box>
    </ThemeProvider>
  );
}
