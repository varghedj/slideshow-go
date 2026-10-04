package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"mime"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// naturalLess compares two strings using natural human ordering (e.g., "jane (2)" < "jane (10)")
func naturalLess(s1, s2 string) bool {
	re := regexp.MustCompile(`(\d+|\D+)`)
	chunks1 := re.FindAllString(s1, -1)
	chunks2 := re.FindAllString(s2, -1)

	minLen := len(chunks1)
	if len(chunks2) < minLen {
		minLen = len(chunks2)
	}

	for i := 0; i < minLen; i++ {
		c1, c2 := chunks1[i], chunks2[i]

		n1, err1 := strconv.Atoi(c1)
		n2, err2 := strconv.Atoi(c2)

		if err1 == nil && err2 == nil {
			if n1 != n2 {
				return n1 < n2
			}
		} else {
			if strings.ToLower(c1) != strings.ToLower(c2) {
				return strings.ToLower(c1) < strings.ToLower(c2)
			}
		}
	}

	return len(chunks1) < len(chunks2)
}

// SelectDirectory recursively scans a selected folder and all subdirectories for images,
// returning them sorted in natural human numerical order.
func (a *App) SelectDirectory() ([]string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Folder with Images",
	})
	if err != nil || dir == "" {
		return nil, err
	}

	var imagePaths []string
	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
		".gif":  true,
		".bmp":  true,
	}

	err = filepath.WalkDir(dir, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return nil // Skip unreadable folders
		}
		if !d.IsDir() {
			ext := strings.ToLower(filepath.Ext(d.Name()))
			if validExts[ext] {
				imagePaths = append(imagePaths, path)
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Sort file paths using natural numerical order
	sort.Slice(imagePaths, func(i, j int) bool {
		return naturalLess(imagePaths[i], imagePaths[j])
	})

	return imagePaths, nil
}

// ReadImage encodes the image file into base64 to display cleanly in WebView2
func (a *App) ReadImage(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	ext := strings.ToLower(filepath.Ext(filePath))
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		switch ext {
		case ".png":
			mimeType = "image/png"
		case ".webp":
			mimeType = "image/webp"
		case ".gif":
			mimeType = "image/gif"
		case ".bmp":
			mimeType = "image/bmp"
		default:
			mimeType = "image/jpeg"
		}
	}

	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, encoded), nil
}

// ToggleFullscreen switches native window fullscreen mode
func (a *App) ToggleFullscreen() {
	if runtime.WindowIsFullscreen(a.ctx) {
		runtime.WindowUnfullscreen(a.ctx)
	} else {
		runtime.WindowFullscreen(a.ctx)
	}
}

// ExitFullscreen forces windowed mode
func (a *App) ExitFullscreen() {
	runtime.WindowUnfullscreen(a.ctx)
}
