# Material Slideshow

A lightweight, modern desktop slideshow application built with **Wails**, **Go**, and **React** (Material Design 3 / MUI). Features full-screen idle auto-fading controls, customizable slide duration, dynamic shuffle playlists, and configurable transition effects.

---

## Key Features & Default Behaviors

* **Default Shuffle & Random Start:** Launching a directory picks a random starting image and automatically shuffles the playlist.
* **Auto-Hiding Toolbar:** In full-screen mode, moving the cursor or pressing any key reveals the floating control bar, which automatically fades out after 0.5 seconds of inactivity.
* **Recursive Image Loading:** Scans selected directories and all subfolders for supported formats (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`).
* **Fade Transitions:** Smooth fade-in transitions between slide updates (can be toggled on or off).

---

## Key Controls & Shortcuts

| Action                 | Keyboard Shortcut        | UI Control      | Description                                        |
| :--------------------- | :----------------------- | :-------------- | :------------------------------------------------- |
| **Next Image**         | `Right Arrow`            | Next Button     | Advances to the next image in the playlist         |
| **Previous Image**     | `Left Arrow`             | Prev Button     | Returns to the previous image                      |
| **Play / Pause**       | `Spacebar`               | Play/Pause      | Toggles automatic slideshow timer                  |
| **Shuffle Mode**       | `S`                      | Shuffle Button  | Toggles between Shuffle mode and Sequential order  |
| **Toggle Transitions** | `T`                      | Transitions     | Turns smooth image fade transitions ON or OFF      |
| **Increase Interval**  | `Up Arrow` / `+` / `=`   | + Button        | Increases display duration by 1s (max 60s)         |
| **Decrease Interval**  | `Down Arrow` / `-` / `_` | - Button        | Decreases display duration by 1s (min 1s)          |
| **Adjust Timer**       | —                        | Duration Slider | Smoothly adjusts display duration (1–30s)          |
| **Toggle Fullscreen**  | `F`                      | Fullscreen      | Switches between windowed and fullscreen mode      |
| **Exit Fullscreen**    | `Escape`                 | Fullscreen Exit | Exits fullscreen mode and restores window controls |
| **Open Folder**        | —                        | Folder Button   | Opens native dialog to select an image directory   |

---

## Live Development

To run in live development mode with Vite hot-reloading:

```bash
wails dev

## Live Development
wails build -o <name>.exe