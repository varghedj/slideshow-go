import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SelectDirectory,
  AddDirectoryToPlaylist,
  ReadImage,
  ToggleFullscreen,
  ExitFullscreen,
  ToggleLikeImage,
  IsLiked,
  GetTags,
  AddTag,
  GetAllTags,
} from '../../wailsjs/go/main/App';
import { naturalSortPaths, createShuffleSequence } from '../utils/sort';

export function useSlideshow() {
  // Playlist & Playback State
  const [playlistDirectories, setPlaylistDirectories] = useState([]);
  const [rawPaths, setRawPaths] = useState([]);
  const [filteredPaths, setFilteredPaths] = useState([]);
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

  // Favorites & Tagging State
  const [isLikedState, setIsLikedState] = useState(false);
  const [tags, setTags] = useState([]);
  const [allKnownTags, setAllKnownTags] = useState(new Set(['untagged']));
  const [tagInput, setTagInput] = useState('');
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  // Filter State
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

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

  // FIX 1: Safely load persistent tag index from backend on startup
  useEffect(() => {
    if (typeof GetAllTags === 'function') {
      GetAllTags()
        .then((fetchedTags) => {
          if (fetchedTags && fetchedTags.length > 0) {
            setAllKnownTags(new Set([...fetchedTags, 'untagged']));
          }
        })
        .catch((err) => console.error('Failed to load global tag index:', err));
    }
  }, []);

  // Filter paths when rawPaths or selectedFilterTags change
  useEffect(() => {
    let isMounted = true;

    const applyFilters = async () => {
      if (rawPaths.length === 0) {
        if (isMounted) setFilteredPaths([]);
        return;
      }

      if (selectedFilterTags.length === 0) {
        if (isMounted) setFilteredPaths(rawPaths);
        return;
      }

      const matching = [];
      for (const filePath of rawPaths) {
        try {
          const imgTags = (await GetTags(filePath)) || ['untagged'];
          const hasMatch = selectedFilterTags.some((filterTag) =>
            imgTags.some((t) => t.toLowerCase() === filterTag.toLowerCase())
          );
          if (hasMatch) {
            matching.push(filePath);
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (isMounted) {
        setFilteredPaths(matching);
      }
    };

    applyFilters();

    return () => {
      isMounted = false;
    };
  }, [rawPaths, selectedFilterTags]);

  // Re-index play order when filteredPaths change
  useEffect(() => {
    if (filteredPaths.length > 0) {
      if (isShuffle) {
        setPlayOrder(createShuffleSequence(filteredPaths.length, 0));
      } else {
        setPlayOrder(Array.from({ length: filteredPaths.length }, (_, i) => i));
      }
      setPlayIndex(0);
    } else {
      setPlayOrder([]);
      setPlayIndex(0);
      setCurrentSrc('');
    }
  }, [filteredPaths, isShuffle]);

  // ==========================================================================
  // PLAYLIST & DIRECTORY MANAGEMENT
  // ==========================================================================
  const rebuildCombinedPlaylist = useCallback((directories) => {
    let combined = [];
    directories.forEach((dir) => {
      combined = combined.concat(dir.images);
    });

    const sortedCombined = naturalSortPaths(combined);
    setRawPaths(sortedCombined);
  }, []);

  const handleAddDirectory = async () => {
    try {
      const res = await AddDirectoryToPlaylist();
      if (res && res.images && res.images.length > 0) {
        const updated = [...playlistDirectories, res];
        setPlaylistDirectories(updated);
        rebuildCombinedPlaylist(updated);
      }
    } catch (err) {
      console.error('Error adding directory:', err);
    }
  };

  const handleRemoveDirectory = (indexToRemove) => {
    const updated = playlistDirectories.filter((_, idx) => idx !== indexToRemove);
    setPlaylistDirectories(updated);
    rebuildCombinedPlaylist(updated);
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
        rebuildCombinedPlaylist(singleDirEntry);
      }
    } catch (err) {
      console.error('Error opening folder:', err);
    }
  };

  const currentOriginalIndex = playOrder.length > 0 ? playOrder[playIndex] : 0;
  const currentFilePath = filteredPaths[currentOriginalIndex] || '';
  const currentFileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : '';

  // Sync Favorites and Tags for active file
  useEffect(() => {
    if (!currentFilePath) {
      setIsLikedState(false);
      setTags([]);
      return;
    }

    if (typeof IsLiked === 'function') {
      IsLiked(currentFilePath)
        .then(setIsLikedState)
        .catch(console.error);
    }

    if (typeof GetTags === 'function') {
      GetTags(currentFilePath)
        .then((fetchedTags) => {
          const safeTags = fetchedTags || ['untagged'];
          setTags(safeTags);
          setAllKnownTags((prev) => {
            const updated = new Set(prev);
            safeTags.forEach((t) => updated.add(t));
            return updated;
          });
        })
        .catch(console.error);
    }
  }, [currentFilePath]);

  const handleToggleLike = useCallback(async () => {
    if (!currentFilePath) return;
    try {
      const likedStatus = await ToggleLikeImage(currentFilePath);
      setIsLikedState(likedStatus);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  }, [currentFilePath]);

  const handleAddTagByName = async (tagName) => {
    const tagToUse = (tagName || tagInput).trim();
    if (!tagToUse || !currentFilePath) return;

    try {
      const updatedTags = await AddTag(currentFilePath, tagToUse);
      const safeTags = updatedTags || ['untagged'];
      setTags(safeTags);
      setTagInput('');
      setAllKnownTags((prev) => new Set(prev).add(tagToUse));
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleToggleFilterTag = (tag) => {
    setSelectedFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // FIX 2: Removed dependency on currentFilePath so shortcut handlers remain stable
  const handleToggleTagDialog = useCallback(() => {
    setIsTagDialogOpen((prev) => !prev);
  }, []);

  // ==========================================================================
  // UI VISIBILITY & CURSOR AUTO-HIDE LOGIC
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

    if (typeof ReadImage === 'function') {
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
    }

    return () => {
      isMounted = false;
    };
    return () => {
      isMounted = false;
    };
  }, [currentFilePath]);

  // ==========================================================================
  // PLAYBACK CONTROLS & KEYBOARD SHORTCUTS
  // ==========================================================================
  // FIX 3: Calculate currentOrigIdx dynamically inside handleToggleShuffle
  const handleToggleShuffle = useCallback(() => {
    if (filteredPaths.length === 0) return;

    const currentOrigIdx = playOrder.length > 0 ? playOrder[playIndex] : 0;

    if (!isShuffle) {
      const newOrder = createShuffleSequence(filteredPaths.length, currentOrigIdx);
      setPlayOrder(newOrder);
      setPlayIndex(0);
      setIsShuffle(true);
    } else {
      const sequentialOrder = Array.from({ length: filteredPaths.length }, (_, i) => i);
      setPlayOrder(sequentialOrder);
      setPlayIndex(currentOrigIdx);
      setIsShuffle(false);
    }
  }, [isShuffle, filteredPaths.length, playOrder, playIndex]);

  const handleNext = useCallback(() => {
    if (playOrder.length === 0) return;

    if (playIndex + 1 < playOrder.length) {
      setPlayIndex((prev) => prev + 1);
    } else {
      if (isShuffle) {
        const nextCycleOrder = createShuffleSequence(filteredPaths.length);
        setPlayOrder(nextCycleOrder);
        setPlayIndex(0);
      } else {
        setPlayIndex(0);
      }
    }
  }, [playIndex, playOrder.length, isShuffle, filteredPaths.length]);

  const handlePrev = useCallback(() => {
    if (playOrder.length === 0) return;
    setPlayIndex((prev) => (prev - 1 + playOrder.length) % playOrder.length);
  }, [playOrder.length]);

  const handleToggleFullscreen = () => {
    if (typeof ToggleFullscreen === 'function') {
      ToggleFullscreen();
    }
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
    if (isPlaying && filteredPaths.length > 0) {
      timer = setInterval(handleNext, intervalSec * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, intervalSec, filteredPaths.length, handleNext]);

  // Global keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') handleToggleFullscreen();
      if (e.key === 'Escape' && isFullscreenRef.current) {
        if (typeof ExitFullscreen === 'function') {
          ExitFullscreen();
        }
        setIsFullscreen(false);
      }
      if (e.key === 's' || e.key === 'S') handleToggleShuffle();
      if (e.key === 't' || e.key === 'T') setTransitionsEnabled((prev) => !prev);
      if (e.key === 'v' || e.key === 'V') setIsPinned((prev) => !prev);
      if (e.key === 'l' || e.key === 'L') handleToggleLike();
      if (e.key === 'g' || e.key === 'G') handleToggleTagDialog();
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
    handleToggleLike,
    handleToggleTagDialog,
  ]);

  const shouldDisplayToolbar =
    isPinned || (isWindowFocused && (isControlsVisible || isToolbarHovered));

  const availableSuggestedTags = Array.from(allKnownTags).filter(
    (tag) => !tags.includes(tag)
  );

  return {
    // Playlist state & handlers
    playlistDirectories,
    rawPaths,
    filteredPaths,
    handleAddDirectory,
    handleRemoveDirectory,
    handleClearPlaylist,
    handleLoadSingleFolder,

    // Playback state & handlers
    isPlaying,
    setIsPlaying,
    intervalSec,
    setIntervalSec,
    isShuffle,
    handleToggleShuffle,
    handleNext,
    handlePrev,
    isFullscreen,
    handleToggleFullscreen,
    transitionsEnabled,
    setTransitionsEnabled,
    imgKey,
    currentSrc,
    currentFileName,
    currentFilePath,
    loading,

    // Favorites & tags
    isLikedState,
    handleToggleLike,
    tags,
    tagInput,
    setTagInput,
    allKnownTags,
    availableSuggestedTags,
    handleAddTagByName,
    isTagDialogOpen,
    setIsTagDialogOpen,
    handleToggleTagDialog,

    // Filter state
    selectedFilterTags,
    setSelectedFilterTags,
    isFilterDialogOpen,
    setIsFilterDialogOpen,
    handleToggleFilterTag,

    // UI visibility
    isPinned,
    setIsPinned,
    copied,
    isPlaylistOpen,
    setIsPlaylistOpen,
    shouldDisplayToolbar,
    handleMouseMove,
    handleToolbarMouseEnter,
    handleToolbarMouseLeave,
    handleCopyPath,
  };
}
