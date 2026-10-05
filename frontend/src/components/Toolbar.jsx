import React from 'react';
import {
  Box,
  IconButton,
  Button,
  Slider,
  Typography,
  Paper,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Shuffle,
  FolderSpecial,
  Fullscreen,
  FullscreenExit,
  AutoAwesome,
  MotionPhotosOff,
  Add,
  Remove,
  ContentCopy,
  Check,
  Queue,
  PlaylistPlay,
  PushPin,
  PushPinOutlined,
  Favorite,
  FavoriteBorder,
  LocalOffer,
  FilterList,
} from '@mui/icons-material';

export default function Toolbar({
  playlistDirectories,
  handleAddDirectory,
  handleLoadSingleFolder,
  setIsPlaylistOpen,
  selectedFilterTags,
  setIsFilterDialogOpen,
  isLikedState,
  handleToggleLike,
  filteredPaths,
  tags,
  handleToggleTagDialog,
  isPinned,
  setIsPinned,
  handlePrev,
  handleNext,
  isPlaying,
  setIsPlaying,
  isShuffle,
  handleToggleShuffle,
  transitionsEnabled,
  setTransitionsEnabled,
  intervalSec,
  setIntervalSec,
  handleDecreaseInterval,
  handleIncreaseInterval,
  isFullscreen,
  handleToggleFullscreen,
  currentFilePath,
  currentFileName,
  copied,
  handleCopyPath,
  shouldDisplayToolbar,
  handleToolbarMouseEnter,
  handleToolbarMouseLeave,
}) {
  return (
    <Paper
      elevation={0}
      onMouseEnter={handleToolbarMouseEnter}
      onMouseLeave={handleToolbarMouseLeave}
      className={`floating-toolbar ${shouldDisplayToolbar ? 'visible' : 'hidden'}`}
    >
      {/* Open Library Button */}
      <Tooltip title="Open Image Library">
        <Button
          variant="contained"
          startIcon={<FolderSpecial />}
          onClick={handleLoadSingleFolder}
          className="folder-btn"
        >
          <span className="button-text-label">Open Library</span>
        </Button>
      </Tooltip>

      <Tooltip title="Add Folder to Playlist">
        <IconButton onClick={handleAddDirectory} className="icon-action-btn">
          <Queue />
        </IconButton>
      </Tooltip>

      <Tooltip title={`Playlist Manager (${playlistDirectories.length} Folders)`}>
        <IconButton
          onClick={() => setIsPlaylistOpen(true)}
          color={playlistDirectories.length > 0 ? 'primary' : 'default'}
          className="icon-action-btn"
        >
          <PlaylistPlay />
        </IconButton>
      </Tooltip>

      {/* Filter Dialog Button */}
      <Tooltip title="Filter Images by Tag">
        <IconButton
          onClick={() => setIsFilterDialogOpen(true)}
          color={selectedFilterTags.length > 0 ? 'secondary' : 'default'}
          className="icon-action-btn"
        >
          <Badge badgeContent={selectedFilterTags.length} color="secondary">
            <FilterList />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Like / Favorite Button */}
      <Tooltip title={isLikedState ? 'Unlike (Remove from Favorites)' : 'Like (Save to Favorites) (L)'}>
        <span>
          <IconButton
            onClick={handleToggleLike}
            disabled={!filteredPaths.length}
            color={isLikedState ? 'error' : 'default'}
            className="icon-action-btn"
          >
            {isLikedState ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </span>
      </Tooltip>

      {/* Tag Manager Button */}
      <Tooltip title="Manage Tags (G)">
        <span>
          <IconButton
            onClick={handleToggleTagDialog}
            disabled={!filteredPaths.length}
            color={tags.length > 0 ? 'primary' : 'default'}
            className="icon-action-btn"
          >
            <LocalOffer />
          </IconButton>
        </span>
      </Tooltip>

      {/* Pin Toolbar Toggle */}
      <Tooltip title={isPinned ? 'Unpin Toolbar (V)' : 'Pin Toolbar Always Visible (V)'}>
        <IconButton
          onClick={() => setIsPinned((prev) => !prev)}
          color={isPinned ? 'primary' : 'default'}
          className="icon-action-btn"
        >
          {isPinned ? <PushPin /> : <PushPinOutlined />}
        </IconButton>
      </Tooltip>
      {/* Navigation Controls */}
      <Box className="control-group">
        <Tooltip title="Previous Image (Left Arrow)">
          <span>
            <IconButton onClick={handlePrev} disabled={!filteredPaths.length} className="nav-btn">
              <SkipPrevious />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}>
          <span>
            <IconButton
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!filteredPaths.length}
              className="play-pause-btn"
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Next Image (Right Arrow)">
          <span>
            <IconButton onClick={handleNext} disabled={!filteredPaths.length} className="nav-btn">
              <SkipNext />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Shuffle Button */}
      <Tooltip title={isShuffle ? 'Shuffle Mode: ON (S)' : 'Sequential Mode (S)'}>
        <Button
          variant={isShuffle ? 'contained' : 'outlined'}
          color={isShuffle ? 'secondary' : 'inherit'}
          startIcon={<Shuffle />}
          onClick={handleToggleShuffle}
          disabled={!filteredPaths.length}
          className="pill-btn"
        >
          <span className="button-text-label">Shuffle {isShuffle ? 'ON' : 'OFF'}</span>
        </Button>
      </Tooltip>

      {/* Transition Toggle */}
      <Tooltip title={transitionsEnabled ? 'Disable Fade Transition (T)' : 'Enable Fade Transition (T)'}>
        <IconButton
          onClick={() => setTransitionsEnabled((prev) => !prev)}
          color={transitionsEnabled ? 'primary' : 'default'}
        >
          {transitionsEnabled ? <AutoAwesome /> : <MotionPhotosOff />}
        </IconButton>
      </Tooltip>

      {/* Interval Duration Controls */}
      <Box className="control-group">
        <Tooltip title="Decrease interval (- / Down Arrow)">
          <span>
            <IconButton
              size="small"
              onClick={handleDecreaseInterval}
              disabled={intervalSec <= 1}
              className="step-btn"
            >
              <Remove fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Typography variant="body2" className="interval-label">
          {intervalSec}s
        </Typography>

        <Tooltip title="Increase interval (+ / Up Arrow)">
          <span>
            <IconButton
              size="small"
              onClick={handleIncreaseInterval}
              disabled={intervalSec >= 60}
              className="step-btn"
            >
              <Add fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Slider
          value={intervalSec}
          min={1}
          max={30}
          onChange={(_, val) => setIntervalSec(val)}
          valueLabelDisplay="auto"
          className="duration-slider"
        />
      </Box>

      {/* Fullscreen Toggle */}
      <Tooltip title="Toggle Fullscreen (F / Esc)">
        <IconButton onClick={handleToggleFullscreen} className="icon-action-btn">
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      </Tooltip>

      {/* File Name & Path Info Pill */}
      {filteredPaths.length > 0 && (
        <Box className="filename-container">
          <Tooltip title={currentFilePath} arrow placement="top">
            <Typography variant="body2" noWrap className="filename-text">
              {currentFileName}
            </Typography>
          </Tooltip>

          <Tooltip title={copied ? 'Copied Path!' : 'Copy Full Path'} arrow placement="top">
            <IconButton
              size="small"
              onClick={handleCopyPath}
              color={copied ? 'success' : 'default'}
              className="icon-action-btn"
            >
              {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Paper>
  );
}
