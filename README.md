# Material Slideshow

A lightweight, modern desktop slideshow application built with **Wails**, **Go**, and **React** (Material Design 3 / MUI). Features full-screen idle auto-fading controls, customizable slide duration, dynamic shuffle playlists, and configurable transition effects.

---

## Key Features & Default Behaviors

* **Default Shuffle & Random Start:** Launching a directory picks a random starting image and automatically shuffles the playlist.
* **Auto-Hiding Toolbar:** In full-screen mode, moving the cursor or pressing any key reveals the floating control bar, which automatically fades out after 0.5 seconds of inactivity.
* **Recursive Image Loading:** Scans selected directories and all subfolders for supported formats (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`).
* **Fade Transitions:** Smooth fade-in transitions between slide updates (can be toggled on or off).
* **Filename & Path Access:** Displays the active image filename directly in the floating toolbar, with a single-click action to copy the full file path to your clipboard.

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
| **Copy File Path**     | —                        | Copy Button     | Copies the current image's full path to clipboard  |

---

## Branch Naming Convention

To maintain a clean and structured Git history, all branches should follow this standard naming structure:

<type>/<short-description>

---

## Formatting Rules
1. Category Prefixes: Use one of the standard prefixes below followed by a forward slash (/).

2. Kebab-case: Use lowercase letters separated by hyphens (e.g., feat/filename-display). Avoid spaces, underscores, or camelCase.

3. Concise Descriptions: Keep branch names brief and focused on the core change (2–4 words).

+-------------------+-------------------------------------------------------------------+------------------------------+
| Prefix            | Description / Purpose                                             | Example Branch Name          |
+-------------------+-------------------------------------------------------------------+------------------------------+
| feat/ or feature/ | New features or visual UI enhancements                            | feat/filename-display        |
| fix/ or bugfix/   | Bug fixes or correcting unexpected behavior                       | fix/fullscreen-controls-fade |
| refactor/         | Code restructuring or styling updates without behavior changes    | refactor/app-layout-css      |
| docs/             | Documentation updates (e.g., updating README or inline docs)      | docs/branch-naming-guide     |
| chore/            | Build configuration, dependency updates, or project setup tasks   | chore/wails-build-config     |
+-------------------+-------------------------------------------------------------------+------------------------------+