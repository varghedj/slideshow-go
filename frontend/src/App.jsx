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
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Shuffle,
  FolderOpen,
  Fullscreen,
  FullscreenExit,
  AutoAwesome,
  MotionPhotosOff,
  Add,
  Remove,
  ContentCopy,
  Check,
} from '@mui/icons-material';

import { SelectDirectory, ReadImage, ToggleFullscreen, ExitFullscreen } from '../wailsjs/go/main/App';
import './App.css';

// Material Design 3 Dark Expressive Theme
const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a8c7fa' },
    secondary: { main: '#c4eca8' },
    background: { default: '#000000', paper: 'rgba(20, 21, 25, 0.16)' },
  },
  shape: { borderRadius: 28 },
});

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
  const [rawPaths, setRawPaths] = useState([]);
  const [isShuffle, setIsShuffle] = useState(true);
  const [playOrder, setPlayOrder] = useState([]);
  const [playIndex, setPlayIndex] = useState(0);

  const [currentSrc, setCurrentSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionsEnabled, setTransitionsEnabled] = useState(true);
  const [imgKey, setImgKey] = useState(0);

  // Copy path feedback state
  const [copied, setCopied] = useState(false);

  // Toolbar visibility & hover tracking
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const idleTimerRef = useRef(null);
  const isToolbarHoveredRef = useRef(false);

  // Keep ref in sync with state for timer callbacks
  useEffect(() => {
    isToolbarHoveredRef.current = isToolbarHovered;
  }, [isToolbarHovered]);

  // Ref tracking full-screen state
  const isFullscreenRef = useRef(false);
  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  // Derive current image details
  const currentOriginalIndex = playOrder.length > 0 ? playOrder[playIndex] : 0;
  const currentFilePath = rawPaths[currentOriginalIndex] || '';
  const currentFileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : '';

  // Handle window focus / blur
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

  // Global mouse movement handler: shows toolbar on movement, fades after 2s of idle
  const handleMouseMove = useCallback(() => {
    if (!isWindowFocused) return;

    setIsControlsVisible(true);

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // Only start idle timer if mouse is NOT directly hovering over the toolbar
    idleTimerRef.current = setTimeout(() => {
      if (!isToolbarHoveredRef.current) {
        setIsControlsVisible(false);
      }
    }, 2000);
  }, [isWindowFocused]);

  // Hover handlers for toolbar bounds
  const handleToolbarMouseEnter = () => {
    setIsToolbarHovered(true);
    setIsControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  const handleToolbarMouseLeave = () => {
    setIsToolbarHovered(false);
    // Restart idle countdown when leaving toolbar bounds
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 1500);
  };

  // Copy current filepath
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

  // Fetch image base64
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

  // Folder loader
  const handleLoadFolder = async () => {
    try {
      const paths = await SelectDirectory();
      if (paths && paths.length > 0) {
        setRawPaths(paths);
        setIsPlaying(true);

        const startIdx = Math.floor(Math.random() * paths.length);

        if (isShuffle) {
          setPlayOrder(createShuffleSequence(paths.length, startIdx));
          setPlayIndex(0);
        } else {
          setPlayOrder(Array.from({ length: paths.length }, (_, i) => i));
          setPlayIndex(startIdx);
        }
      }
    } catch (err) {
      console.error('Error opening folder:', err);
    }
  };

  // Shuffle toggle
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

  // Next image
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

  // Previous image
  const handlePrev = useCallback(() => {
    if (playOrder.length === 0) return;
    setPlayIndex((prev) => (prev - 1 + playOrder.length) % playOrder.length);
  }, [playOrder.length]);

  const handleToggleFullscreen = () => {
    ToggleFullscreen();
    setIsFullscreen((prev) => !prev);
  };

  // Duration adjusters
  const handleDecreaseInterval = useCallback(() => {
    setIntervalSec((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncreaseInterval = useCallback(() => {
    setIntervalSec((prev) => Math.min(60, prev + 1));
  }, []);

  // Interval timer
  useEffect(() => {
    let timer;
    if (isPlaying && rawPaths.length > 0) {
      timer = setInterval(handleNext, intervalSec * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, intervalSec, rawPaths.length, handleNext]);

  // Global Keyboard Shortcuts (Do NOT invoke handleMouseMove)
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
      if (e.key === 't' || e.key === 'T') {
        setTransitionsEnabled((prev) => !prev);
      }
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

  // Determine final visible state
  const shouldDisplayToolbar = isWindowFocused && (isControlsVisible || isToolbarHovered);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        onMouseMove={handleMouseMove}
        className={`app-container ${!shouldDisplayToolbar ? 'cursor-hidden' : ''}`}
      >
        {/* Main Viewport */}
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
            <Button
              variant="contained"
              startIcon={<FolderOpen />}
              onClick={handleLoadFolder}
              size="large"
              className="select-folder-btn"
            >
              Select Image Directory
            </Button>
          )}
        </Box>

        {/* Floating Toolbar */}
        <Paper
          elevation={0}
          onMouseEnter={handleToolbarMouseEnter}
          onMouseLeave={handleToolbarMouseLeave}
          className={`floating-toolbar ${shouldDisplayToolbar ? 'visible' : 'hidden'}`}
        >
          {/* Open Directory */}
          <Tooltip title="Open Directory">
            <Button
              variant="contained"
              startIcon={<FolderOpen />}
              onClick={handleLoadFolder}
              className="folder-btn"
            >
              Folder
            </Button>
          </Tooltip>

          {/* Playback Controls */}
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

          {/* Shuffle Mode Toggle Button */}
          <Tooltip title={isShuffle ? 'Shuffle Mode: ON (S)' : 'Sequential Mode (S)'}>
            <Button
              variant={isShuffle ? 'contained' : 'outlined'}
              color={isShuffle ? 'secondary' : 'inherit'}
              startIcon={<Shuffle />}
              onClick={handleToggleShuffle}
              disabled={!rawPaths.length}
              className="pill-btn"
            >
              Shuffle {isShuffle ? 'ON' : 'OFF'}
            </Button>
          </Tooltip>

          {/* Transition Effect Toggle Button */}
          <Tooltip title="Toggle Fade Transitions (T)">
            <Button
              variant={transitionsEnabled ? 'contained' : 'outlined'}
              color={transitionsEnabled ? 'primary' : 'inherit'}
              startIcon={transitionsEnabled ? <AutoAwesome /> : <MotionPhotosOff />}
              onClick={() => setTransitionsEnabled((prev) => !prev)}
              className="pill-btn"
            >
              Transitions {transitionsEnabled ? 'ON' : 'OFF'}
            </Button>
          </Tooltip>

          {/* Duration Controls */}
          <Box className="control-group">
            <Tooltip title="Decrease interval by 1s (- / Down Arrow)">
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

            <Tooltip title="Increase interval by 1s (+ / Up Arrow)">
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

          {/* Filename & Copy Filepath Action */}
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
      </Box>
    </ThemeProvider>
  );
}