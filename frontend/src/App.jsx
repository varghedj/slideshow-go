import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Button,
  Slider,
  Typography,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';

// ============================================================================
// 1. ICON IMPORTS
// Add new Material icons here for additional toolbar or panel actions.
// ============================================================================
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Shuffle,
  FolderOpen,
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
  Delete,
  PlaylistPlay,
  PushPin,
  PushPinOutlined,
} from '@mui/icons-material';

// ============================================================================
// 2. WAILS BACKEND BINDINGS
// Backend Go function imports for file I/O and window controls.
// ============================================================================
import {
  SelectDirectory,
  AddDirectoryToPlaylist,
  ReadImage,
  ToggleFullscreen,
  ExitFullscreen,
} from '../wailsjs/go/main/App';
import './App.css';

// Material-UI Dark Theme Configuration
const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a8c7fa' },
    secondary: { main: '#c4eca8' },
    background: { default: '#000000', paper: 'rgba(20, 21, 25, 0.90)' },
  },
  shape: { borderRadius: 28 },
});

// Helper: Natural alphanumeric sort for file paths
const naturalSortPaths = (paths) => {
  return [...paths].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
};

// Helper: Fisher-Yates shuffle sequence generator
const createShuffleSequence = (length, pinOriginalIndex = -1) => {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  if (length > 0 && pinOriginalIndex >= 0) {
    const foundIdx = indices.indexOf(pinOriginalIndex);
    if (foundIdx !== -1) {
      indices.splice(foundIdx, 1);
      indices.unshift(pinOriginalIndex);
    }
  }
  return indices;
};

export default function App() {
  // ==========================================================================
  // 3. STATE DEFINITIONS
  // ==========================================================================
  const [playlistDirectories, setPlaylistDirectories] = useState([]);
  const [rawPaths, setRawPaths] = useState([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playOrder, setPlayOrder] = useState([]);
  const [playIndex, setPlayIndex] = useState(0);

  const [currentSrc, setCurrentSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionsEnabled, setTransitionsEnabled] = useState(true);
  const [imgKey, setImgKey] = useState(0);

  // Panel & UI Visibility Controls
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const idleTimerRef = useRef(null);
  const isToolbarHoveredRef = useRef(false);
  const isFullscreenRef = useRef(false);

  useEffect(() => {
    isToolbarHoveredRef.current = isToolbarHovered;
  }, [isToolbarHovered]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  // ==========================================================================
  // 4. PLAYLIST & DIRECTORY MANAGEMENT
  // ==========================================================================
  const rebuildCombinedPlaylist = useCallback((directories, shuffleMode) => {
    let combined = [];
    directories.forEach((dir) => {
      combined = combined.concat(dir.images);
    });

    const sortedCombined = naturalSortPaths(combined);
    setRawPaths(sortedCombined);

    if (sortedCombined.length > 0) {
      if (shuffleMode) {
        setPlayOrder(createShuffleSequence(sortedCombined.length, 0));
      } else {
        setPlayOrder(Array.from({ length: sortedCombined.length }, (_, i) => i));
      }
      setPlayIndex(0);
    } else {
      setPlayOrder([]);
      setPlayIndex(0);
      setCurrentSrc('');
    }
  }, []);

  const handleAddDirectory = async () => {
    try {
      const res = await AddDirectoryToPlaylist();
      if (res && res.images && res.images.length > 0) {
        const updated = [...playlistDirectories, res];
        setPlaylistDirectories(updated);
        rebuildCombinedPlaylist(updated, isShuffle);
      }
    } catch (err) {
      console.error('Error adding directory:', err);
    }
  };

  const handleRemoveDirectory = (indexToRemove) => {
    const updated = playlistDirectories.filter((_, idx) => idx !== indexToRemove);
    setPlaylistDirectories(updated);
    rebuildCombinedPlaylist(updated, isShuffle);
  };

  const handleClearPlaylist = () => {
    setPlaylistDirectories([]);
    setRawPaths([]);
    setPlayOrder([]);
    setPlayIndex(0);
    setCurrentSrc('');
  };

  const handleLoadSingleFolder = async () => {
    try {
      const paths = await SelectDirectory();
      if (paths && paths.length > 0) {
        const singleDirEntry = [{ dirPath: 'Selected Directory', images: paths }];
        setPlaylistDirectories(singleDirEntry);
        rebuildCombinedPlaylist(singleDirEntry, isShuffle);
      }
    } catch (err) {
      console.error('Error opening folder:', err);
    }
  };

  const currentOriginalIndex = playOrder.length > 0 ? playOrder[playIndex] : 0;
  const currentFilePath = rawPaths[currentOriginalIndex] || '';
  const currentFileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : '';

  // ==========================================================================
  // 5. UI VISIBILITY & CURSOR AUTO-HIDE LOGIC
  // ==========================================================================
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => {
      setIsWindowFocused(false);
      setIsToolbarHovered(false);
      setIsControlsVisible(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleMouseMove = useCallback(() => {
    if (!isWindowFocused) return;
    setIsControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      if (!isToolbarHoveredRef.current) {
        setIsControlsVisible(false);
      }
    }, 2000);
  }, [isWindowFocused]);

  const handleToolbarMouseEnter = () => {
    setIsToolbarHovered(true);
    setIsControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  const handleToolbarMouseLeave = () => {
    setIsToolbarHovered(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 1500);
  };

  const handleCopyPath = async () => {
    if (!currentFilePath) return;
    try {
      await navigator.clipboard.writeText(currentFilePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy file path:', err);
    }
  };

  // Image loading side effect
  useEffect(() => {
    if (!currentFilePath) return;

    let isMounted = true;
    setLoading(true);

    ReadImage(currentFilePath)
      .then((src) => {
        if (isMounted) {
          setCurrentSrc(src);
          setLoading(false);
          setImgKey((prev) => prev + 1);
        }
      })
      .catch((err) => {
        console.error('Failed to read image:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentFilePath]);

  // ==========================================================================
  // 6. PLAYBACK CONTROLS & KEYBOARD SHORTCUTS
  // ==========================================================================
  const handleToggleShuffle = useCallback(() => {
    if (rawPaths.length === 0) return;

    if (!isShuffle) {
      const newOrder = createShuffleSequence(rawPaths.length, currentOriginalIndex);
      setPlayOrder(newOrder);
      setPlayIndex(0);
      setIsShuffle(true);
    } else {
      const sequentialOrder = Array.from({ length: rawPaths.length }, (_, i) => i);
      setPlayOrder(sequentialOrder);
      setPlayIndex(currentOriginalIndex);
      setIsShuffle(false);
    }
  }, [isShuffle, rawPaths.length, currentOriginalIndex]);

  const handleNext = useCallback(() => {
    if (playOrder.length === 0) return;

    if (playIndex + 1 < playOrder.length) {
      setPlayIndex((prev) => prev + 1);
    } else {
      if (isShuffle) {
        const nextCycleOrder = createShuffleSequence(rawPaths.length);
        setPlayOrder(nextCycleOrder);
        setPlayIndex(0);
      } else {
        setPlayIndex(0);
      }
    }
  }, [playIndex, playOrder.length, isShuffle, rawPaths.length]);

  const handlePrev = useCallback(() => {
    if (playOrder.length === 0) return;
    setPlayIndex((prev) => (prev - 1 + playOrder.length) % playOrder.length);
  }, [playOrder.length]);

  const handleToggleFullscreen = () => {
    ToggleFullscreen();
    setIsFullscreen((prev) => !prev);
  };

  const handleDecreaseInterval = useCallback(() => {
    setIntervalSec((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncreaseInterval = useCallback(() => {
    setIntervalSec((prev) => Math.min(60, prev + 1));
  }, []);

  // Slideshow auto-advance timer
  useEffect(() => {
    let timer;
    if (isPlaying && rawPaths.length > 0) {
      timer = setInterval(handleNext, intervalSec * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, intervalSec, rawPaths.length, handleNext]);

  // Global keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') handleToggleFullscreen();
      if (e.key === 'Escape' && isFullscreenRef.current) {
        ExitFullscreen();
        setIsFullscreen(false);
      }
      if (e.key === 's' || e.key === 'S') handleToggleShuffle();
      if (e.key === 't' || e.key === 'T') setTransitionsEnabled((prev) => !prev);
      if (e.key === 'v' || e.key === 'V') setIsPinned((prev) => !prev);
      if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncreaseInterval();
      }
      if (e.key === '-' || e.key === '_' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecreaseInterval();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNext,
    handlePrev,
    handleToggleShuffle,
    handleIncreaseInterval,
    handleDecreaseInterval,
  ]);

  const shouldDisplayToolbar =
    isPinned || (isWindowFocused && (isControlsVisible || isToolbarHovered));

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        onMouseMove={handleMouseMove}
        className={`app-container ${!shouldDisplayToolbar ? 'cursor-hidden' : ''}`}
      >
        {/* ================================================================== */}
        {/* 7. MAIN VIEWPORT (IMAGE OR UNIFIED START BUTTON) */}
        {/* ================================================================== */}
        <Box className="main-viewport">
          {loading && <CircularProgress className="loading-spinner" />}

          {rawPaths.length > 0 ? (
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
                Start Slideshow
              </Button>
            </Box>
          )}
        </Box>

        {/* ================================================================== */}
        {/* 8. FLOATING CONTROL TOOLBAR */}
        {/* ================================================================== */}
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
                <IconButton onClick={handlePrev} disabled={!rawPaths.length} className="nav-btn">
                  <SkipPrevious />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}>
              <span>
                <IconButton
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={!rawPaths.length}
                  className="play-pause-btn"
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Next Image (Right Arrow)">
              <span>
                <IconButton onClick={handleNext} disabled={!rawPaths.length} className="nav-btn">
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
              disabled={!rawPaths.length}
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
          {rawPaths.length > 0 && (
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

        {/* ================================================================== */}
        {/* 9. PLAYLIST DRAWER PANEL */}
        {/* ================================================================== */}
        <Drawer anchor="right" open={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)}>
          <Box style={{ width: 320, padding: '16px' }}>
            <Typography variant="h6" gutterBottom>
              Playlist Manager
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Total Images Loaded: {rawPaths.length}
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
      </Box>
    </ThemeProvider>
  );
}