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
  Chip,
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
} from '@mui/icons-material';

import { SelectDirectory, ReadImage, ToggleFullscreen, ExitFullscreen } from '../wailsjs/go/main/App';
import './App.css';

// Material Design 3 Dark Expressive Theme
const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a8c7fa' },
    secondary: { main: '#c4eca8' },
    background: { default: '#000000', paper: 'rgba(20, 21, 25, 0.35)' },
  },
  shape: { borderRadius: 28 },
});

/**
 * Generates a randomized permutation of array indices [0 ... length-1].
 * Optionally places `pinOriginalIndex` at index 0 so the initial image doesn't jump immediately.
 */
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
  const [isShuffle, setIsShuffle] = useState(true); // Enabled by default
  const [playOrder, setPlayOrder] = useState([]);
  const [playIndex, setPlayIndex] = useState(0);

  const [currentSrc, setCurrentSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSec, setIntervalSec] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionsEnabled, setTransitionsEnabled] = useState(true);
  const [imgKey, setImgKey] = useState(0);

  // Full-screen controls auto-fade state & timer ref
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const idleTimerRef = useRef(null);

  // Derive current original image index and filepath
  const currentOriginalIndex = playOrder.length > 0 ? playOrder[playIndex] : 0;
  const currentFilePath = rawPaths[currentOriginalIndex] || '';

  // Mouse activity detector: resets 500ms timer in full-screen mode
  const handleMouseMove = useCallback(() => {
    setIsControlsVisible(true);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (isFullscreen) {
      idleTimerRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 500); // 0.5 seconds idle timeout
    }
  }, [isFullscreen]);

  // Clean up timer when exiting full-screen mode
  useEffect(() => {
    if (!isFullscreen) {
      setIsControlsVisible(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      handleMouseMove();
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isFullscreen, handleMouseMove]);

  // Fetch Base64 data whenever current file path updates
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

  // Open directory, pick a random starting image, and start playback
  const handleLoadFolder = async () => {
    try {
      const paths = await SelectDirectory();
      if (paths && paths.length > 0) {
        setRawPaths(paths);
        setIsPlaying(true);

        // Pick a random starting image index
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

  // Toggle between Shuffle mode and Sequential mode
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

  // Next Image navigation
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

  // Previous Image navigation
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

  // Slideshow interval timer
  useEffect(() => {
    let timer;
    if (isPlaying && rawPaths.length > 0) {
      timer = setInterval(handleNext, intervalSec * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, intervalSec, rawPaths.length, handleNext]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      handleMouseMove(); // Reveal controls on keystroke

      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') handleToggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) {
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
    handleMouseMove,
    isFullscreen,
    handleIncreaseInterval,
    handleDecreaseInterval,
  ]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        onMouseMove={handleMouseMove}
        sx={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          cursor: isFullscreen && !isControlsVisible ? 'none' : 'default',
        }}
      >
        {/* Main Viewport */}
        <Box
          sx={{
            flex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {loading && (
            <CircularProgress
              sx={{ position: 'absolute', zIndex: 2, color: 'primary.main' }}
            />
          )}

          {rawPaths.length > 0 ? (
            <img
              key={transitionsEnabled ? `slide-${imgKey}` : 'static-slide'}
              src={currentSrc}
              alt={`Slide ${currentOriginalIndex + 1}`}
              className={`slideshow-image ${transitionsEnabled ? 'fade-active' : ''}`}
            />
          ) : (
            <Button
              variant="contained"
              startIcon={<FolderOpen />}
              onClick={handleLoadFolder}
              size="large"
              sx={{ borderRadius: 8, px: 4, py: 1.8, fontSize: '1.1rem' }}
            >
              Select Image Directory
            </Button>
          )}
        </Box>

        {/* More Transparent Frosted Glass Floating Toolbar */}
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            p: 1.5,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 10,
            backgroundColor: 'rgba(20, 21, 25, 0.35)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            zIndex: 10,
            transition: 'opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease',
            opacity: isFullscreen && !isControlsVisible ? 0 : 1,
            pointerEvents: isFullscreen && !isControlsVisible ? 'none' : 'auto',
            visibility: isFullscreen && !isControlsVisible ? 'hidden' : 'visible',
          }}
        >
          {/* Open Directory */}
          <Tooltip title="Open Directory">
            <Button
              variant="outlined"
              startIcon={<FolderOpen />}
              onClick={handleLoadFolder}
              sx={{ borderRadius: 6, borderColor: 'rgba(255, 255, 255, 0.25)' }}
            >
              Folder
            </Button>
          </Tooltip>

          {/* Playback Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Previous Image (Left Arrow)">
              <span>
                <IconButton onClick={handlePrev} disabled={!rawPaths.length}>
                  <SkipPrevious />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}>
              <span>
                <IconButton
                  onClick={() => setIsPlaying(!isPlaying)}
                  color="primary"
                  disabled={!rawPaths.length}
                  sx={{ backgroundColor: 'rgba(168, 199, 250, 0.25)', mx: 0.5 }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Next Image (Right Arrow)">
              <span>
                <IconButton onClick={handleNext} disabled={!rawPaths.length}>
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
              sx={{
                borderRadius: 6,
                textTransform: 'none',
                px: 2,
                borderColor: 'rgba(255, 255, 255, 0.25)',
              }}
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
              sx={{
                borderRadius: 6,
                textTransform: 'none',
                px: 2,
                borderColor: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              Transitions {transitionsEnabled ? 'ON' : 'OFF'}
            </Button>
          </Tooltip>

          {/* Duration Controls (+ / - & Slider) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Decrease interval by 1s (- / Down Arrow)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDecreaseInterval}
                  disabled={intervalSec <= 1}
                >
                  <Remove fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 28, textAlign: 'center' }}>
              {intervalSec}s
            </Typography>

            <Tooltip title="Increase interval by 1s (+ / Up Arrow)">
              <span>
                <IconButton
                  size="small"
                  onClick={handleIncreaseInterval}
                  disabled={intervalSec >= 60}
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
              sx={{ width: 60, ml: 1 }}
            />
          </Box>

          {/* Fullscreen Toggle */}
          <Tooltip title="Toggle Fullscreen (F / Esc)">
            <IconButton onClick={handleToggleFullscreen}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>

          {/* Slide Index Counter */}
          {rawPaths.length > 0 && (
            <Chip
              label={`${currentOriginalIndex + 1} / ${rawPaths.length}`}
              variant="outlined"
              size="small"
              color={isShuffle ? 'secondary' : 'default'}
              sx={{
                fontWeight: 600,
                ml: 0.5,
                borderColor: 'rgba(255, 255, 255, 0.25)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
          )}
        </Paper>
      </Box>
    </ThemeProvider>
  );
}