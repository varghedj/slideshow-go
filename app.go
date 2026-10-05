package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const UntaggedTag = "untagged"

// DirectoryImages represents a directory and its scanned image paths.
type DirectoryImages struct {
	DirPath string   `json:"dirPath"`
	Images  []string `json:"images"`
}

// App struct
type App struct {
	ctx          context.Context
	mu           sync.RWMutex
	likedImages  map[string]bool     // filePath -> bool
	imageTags    map[string][]string // filePath -> []tags
	allKnownTags map[string]bool     // global set of all tags created
}

// NewApp creates a new App application struct
func NewApp() *App {
	app := &App{
		likedImages:  make(map[string]bool),
		imageTags:    make(map[string][]string),
		allKnownTags: make(map[string]bool),
	}
	app.allKnownTags[UntaggedTag] = true
	return app
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SelectDirectory opens a directory dialog and returns all supported image files recursively.
func (a *App) SelectDirectory() ([]string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Image Directory",
	})
	if err != nil || dir == "" {
		return nil, err
	}

	return scanImages(dir)
}

// AddDirectoryToPlaylist opens a directory dialog and returns the directory path and its images.
func (a *App) AddDirectoryToPlaylist() (*DirectoryImages, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Add Directory to Playlist",
	})
	if err != nil || dir == "" {
		return nil, err
	}

	images, err := scanImages(dir)
	if err != nil {
		return nil, err
	}

	return &DirectoryImages{
		DirPath: dir,
		Images:  images,
	}, nil
}

// ReadImage reads a file from disk and returns it as a Base64 data URL.
func (a *App) ReadImage(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	ext := strings.ToLower(filepath.Ext(filePath))
	mimeType := "image/jpeg"
	switch ext {
	case ".png":
		mimeType = "image/png"
	case ".gif":
		mimeType = "image/gif"
	case ".webp":
		mimeType = "image/webp"
	case ".bmp":
		mimeType = "image/bmp"
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
}

// ToggleFullscreen toggles window fullscreen state.
func (a *App) ToggleFullscreen() {
	if runtime.WindowIsFullscreen(a.ctx) {
		runtime.WindowUnfullscreen(a.ctx)
	} else {
		runtime.WindowFullscreen(a.ctx)
	}
}

// ExitFullscreen exits fullscreen mode.
func (a *App) ExitFullscreen() {
	runtime.WindowUnfullscreen(a.ctx)
}

// ============================================================================
// FAVORITES & TAGGING BACKEND BINDINGS
// ============================================================================

// ToggleLikeImage toggles the favorite state of a given image file.
func (a *App) ToggleLikeImage(filePath string) (bool, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	current := a.likedImages[filePath]
	a.likedImages[filePath] = !current
	return !current, nil
}

// IsLiked returns whether an image is marked as a favorite.
func (a *App) IsLiked(filePath string) (bool, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	return a.likedImages[filePath], nil
}

// GetTags returns the tags assigned to a specific image file. Returns ["untagged"] if none exist.
func (a *App) GetTags(filePath string) ([]string, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	tags := a.imageTags[filePath]
	if len(tags) == 0 {
		return []string{UntaggedTag}, nil
	}
	return tags, nil
}

// AddTag assigns a new tag to a specific image file.
// If a custom tag is added, the default "untagged" tag is automatically removed.
func (a *App) AddTag(filePath string, tag string) ([]string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	tag = strings.TrimSpace(tag)
	if tag == "" {
		return a.getTagsLocked(filePath), nil
	}

	// Add tag to global tag store
	a.allKnownTags[strings.ToLower(tag)] = true

	existing := a.imageTags[filePath]
	var cleaned []string

	if strings.EqualFold(tag, UntaggedTag) {
		// Adding "untagged" resets custom tags
		a.imageTags[filePath] = []string{UntaggedTag}
		return a.imageTags[filePath], nil
	}

	// Remove "untagged" tag if it exists when adding a real tag
	for _, t := range existing {
		if !strings.EqualFold(t, UntaggedTag) {
			cleaned = append(cleaned, t)
		}
	}

	// Check for duplicates
	for _, t := range cleaned {
		if strings.EqualFold(t, tag) {
			a.imageTags[filePath] = cleaned
			return cleaned, nil
		}
	}

	updated := append(cleaned, tag)
	a.imageTags[filePath] = updated
	return updated, nil
}

// GetAllTags returns a list of all unique tags ever created in the application.
func (a *App) GetAllTags() ([]string, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	tags := make([]string, 0, len(a.allKnownTags))
	for tag := range a.allKnownTags {
		tags = append(tags, tag)
	}
	sort.Strings(tags)
	return tags, nil
}

func (a *App) getTagsLocked(filePath string) []string {
	tags := a.imageTags[filePath]
	if len(tags) == 0 {
		return []string{UntaggedTag}
	}
	return tags
}

// Helper: Recursive scanning for image formats
func scanImages(dir string) ([]string, error) {
	var images []string
	supportedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
		".gif":  true,
		".bmp":  true,
	}

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			ext := strings.ToLower(filepath.Ext(path))
			if supportedExts[ext] {
				images = append(images, path)
			}
		}
		return nil
	})

	return images, err
}
