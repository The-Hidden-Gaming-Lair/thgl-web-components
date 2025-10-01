# 2.9.0

- Feat: **Dune Awakening** Add Overmap/Overworld support (blank placeholder for now, working on it. But the app automatically switches to the overworld map when you are in it)
- Feat: **Dune Awakening** Add live mode for Spice Fields and Small Shipwrecks (Live mode has limited view range, but shows locations in real-time. Very useful if the map locations are not fully updated after weekly resets)

# 2.8.0

- Feat: **Once Human** Add Deviation Secure scenario support
- Fix: **Once Human** Broken scenario detection after game update

# 2.7.0

- Feat: **Dune: Awakening** Add Live Mode support for most resources. See the filter tooltip if Live Mode is supported for the selected resource.
- Feat: Decide if a desktop icon should be created during installation.
- Feat: Add support for F13-F24 keys as hotkeys.

# 2.6.2

- Fix: **Dune: Awakening** Buried Treasure tracking

# 2.6.1

- Fix: **Once Human** Player position detection

# 2.6.0

- Feat: **Dune: Awakening** Add Live Mode support for Primrose Field (This will fill up the map with missing gatherables)
- Feat: **Dune: Awakening** Add Live Mode support for Buried Treasures (This is experimental and it will show all treasures, even if not active. It's possible, that it's not showing all treasures yet, working on it)
- Fix: **Dune: Awakening** Deep Desert Grid and Resource Heatmaps are not shown when the app window is locked.
- Fix: **Palia** Reset mouse position to the center of the screen when pressing "R" in-game.

# 2.5.3

- Feat: Track buried treasures in Dune Awakening (preview access for Elite Supporter only -> need testing before public release)
- Fix: Player position detection in Once Human

# 2.4.1

- Fix: Dune Awakening position detection in vehicles

# 2.4.0

- Feat: Silent updater for upcoming versions
- Fix: Sometimes, the overlay was not interactable
- Fix: Hotkey support for F1, F3, F5, F6, F7, F11, F12
- Fix: Hotkeys not working if 2nd screen window is focused
- Fix: Hotkeys are not updated after changing them in 2nd screen settings

# 2.3.7

- Fix: Sometimes, the overlay was not interactable (it still happens for very few users)

# 2.3.6

- Fix: Move input handling in a separate thread to fix overlay interaction issues

# 2.3.5

- Perf: Improved CPU usage and reduced installer size

# 2.3.2

- Fix: Another attempt to fix overlay interaction issues
- Fix: Missing live mode in rare cases

# 2.3.0

- Feat: Automatcally send crash reports (anonymized) to improve stability
- Fix: App crashes related to running games detectection

# 2.2.0

- Feat: remember multi-monitor window positions
- Feat: add colorblind mode
- Fix: stabilize startup and UI responsiveness

# 2.1.3

- Fix: App crashes (mostly 0x50 access violation)
- Fix: Improve mouse mode detection
- Fix: CPU and memory usage optimizations

# 2.1.2

- Fix: Prevent game crashes by improving exception handling
- Fix: Remove "other player" marker behind your character in Palia
- Fix: Invalid position detection because of outdated caches
- Fix: Exit app/game worker threads on game exit

# 2.1.1

- Feat: Add Dune Awakening position detection for all users! Preview access for live mode of team players and gatherables will start soon.
- Fix: Black background of the overlay on game window resize
- Fix: Map dragging on ALT-hold in Wuthering Waves
- Fix: Reset cache of actors on map change. This should solve some invalid actor positions.

# 2.1.0

- Feat: The app checks for a new version every 30 minutes and installs it, if no game is running.
- Fix: F6 key (or hit the X button) is correctly toggling the overlay.
- Fix: A crash in Palia during the loading screen is fixed.

# 2.0.2

This release is a rewrite of most of the existing features. The main reason is to add support for games like Dune Awakening, which have a different architecture and require a more flexible approach. The app is not injecting into the game process anymore, which improves compatibility and stability.
Most of the app crashes should be resolved with this update. In addition, it's easier for me to support future game updates, which would break the position tracking before.

Because of this major change, there could be some new issues introduced. If you encounter any problems, please report them so I can address them quickly.
Overall, I'm very happy with this update and the app feels more stable and the performance is improved.

Other changes include:

- Feat: Add position detection support for Dune Awakening (currently in preview access for Elite Supporter only)
- Feat: Improve crash logging
- Remove: Drop support for Infinity Nikki. This game is more difficult to update and the numbers are very low compared to other games. Sadly, it's not worth the effort.
- Remove: Support for exclusive full-screen mode. Please play the games in borderless or windowed mode.
- Fix: Close all app windows on game exit
- Fix: All game crashes

# 1.20.4

- Fix: Palia position detection after game update

# 1.20.2

- Fix: Infinity Nikki map detection after game update

# 1.20.1

- Fix: Wuthering Waves map detection after game update

# 1.20.0

- Feat: Sign the app with a new certificate to prevent Windows SmartScreen from blocking the app
- Fix: Remember custom hotkeys in the app settings

# 1.19.2

- Fix: Once Human position detection

# 1.19.0

- Fix: Close all windows on app exit and remember the positions

# 1.18.0

- Feat: Update Palworld support to the latest game version
- Fix: Item search respects all locations

# 1.17.4

- Fix: Another attempt to fix position detection

# 1.17.3

- Fix: Better position detection recovery

# 1.17.2

- Fix: Palia map detection issues

# 1.17.1

- Fix: Wuthering Waves position detection issues

# 1.17.0

- Feat: Customize hotkeys in the app settings
- Feat: Prepare support for Dune Awakening. This game won't have player position detection or overlay support, but you can use it as replacement for the website.
- Fix: CPU load when changing server in Once Human
- Fix: Improve detectection of zombie processes

# 1.16.0

- Feat: Ignore crashed or Zombie processes
- Fix: Tree variants detection in Palia

# 1.15.2

- Fix: Fish detection in Palia

# 1.15.1

- Fix: Game crash (sorry for this, it was a stupid mistake on my side)

# 1.15.0

- Feat: Add new Endless Dream and RaidZone scenarios for Once Human
- Fix: Nodes have invalid names in Palia

# 1.14.0

- Fix: Nodes have invalid names in Palia (need more testing)
- Fix: Houses and dungeons detection in Infinity Nikki

# 1.13.2

- Fix: Map detection in Infinity Nikki

# 1.13.1

- Feat: Add logging for Infinity Nikki to be able to detect map detection issues
- Fix: Invalid detection for locations in Palia

# 1.13.0

- Fix: The game was sometimes now interactable after hiding the app controls
- Fix: Detection issues in Palia

# 1.12.1

- Fix: Rummage Piles are not visible in Palia
- Fix: Fishes are not visible in Palia

# 1.12.0

- Feat: Bring 2nd screen map window to the front on opening
- Feat: Add Elderwood Pile to Palia
- Fix: After hitting F9, the game is not interactable anymore
- Fix: Show Flow Trees in Palia

# 1.11.1

- Fix: Housing Plot position detection in Palia
- Fix: Invalid "Other player" detected behind your character in Palia

## 1.11.0

- Feat: Add beta support for "Palia" (a few features are not working yet)
- Feat: Show player coordinates in Once Human map

## 1.10.1

- Fix: Filter out cosmetic crates in Once Human

## 1.10.0

- Feat: Add option to control autostart on Windows startup
- Feat: Add Peer Link support, allowing you to use your phone or any other device as a second screen
- Fix: Unselect autostart option in the installer didn't remove existing autostart entry
- Fix: Icons in custom markers
- Fix: Search input in overlay mode
- Fix: Drawings are partially saved

## 1.9.3

- Fix: Memory leak when changing the icon size and map zoom level
- Fix: Prevent map interaction if no cursor is visible in-game
- Fix: Improve map rendering performance

## 1.9.2

- Feat: Disable video ads for better user experience and performance (ads are still shown in the app for free users)
- Feat: Change default hotkeys for Infinity Nikki (some are combined with CTRL now)
- Fix: Mute app
- Fix: Missing map marker in the app
- Fix: Map detection in Infinity Nikki (need more testing)
- Fix: Improve app performance

## 1.9.0

- Fix: Hotkeys not working sometimes
- Fix: Detection of Chinese Wuthering Waves client
- Fix: Infinity Nikki game injection issues

## 1.8.0

- Feat: Add support for the new game "Infinity Nikki" (experimental)

## 1.7.0

- Feat: Rotate log files to prevent them from growing too large (Check `C:\Users\<USER>\AppData\Local\The Hidden Gaming Lair`)
- Fix: Overlay zooms on CTRL+Mouse Wheel. This is disabled if you are interacting with the game. It's still possible to zoom the app when it is focused.

## 1.6.2

- Feat: Improve rendering performance
- Feat: More detailed logging
- Fix: Wuthering Waves crash
- Fix: Sometimes the map was moving out of bounds

## 1.5.1

- Feat: Allow snapping dashboard and 2nd screen windows to the screen edges
- Feat: Extend logging to include more information about app crashes
- Fix: Crash on Wuthering Waves start (need more testing)

## 1.4.2

- Feat: Add Wuthering Waves support
- Fix: Filter out false positive deviations (e.g. in backpack)

## 1.3.0

- Feat: Add option to run the app on Windows startup in the installation process
- Fix: Make sure that the app is always running in privileged mode

## 1.2.0

- Feat: Remove context menu from the app
- Fix: False positive virus detection

## 1.1.1

- Fix: Prevent app from running multiple times
- Fix: Once Human detection for Chinese client

## 1.1.0

- Feat: Display hotkeys in the map settings (will be configurable soon)
- Fix: Reduce number of false positives virus detections (Windows Defender, etc.)
- Fix: Trying to fix black app window (needs more testing)

## 1.0.1

- Feat: Public release of the app with ads for free users
- Feat: Change layout of the dashboard window
- Feat: Sign code with a certificate to prevent Windows SmartScreen from blocking the app
- Feat: Add monsters detection in RuneScape: Dragonwilds

## 0.7.2

- Fix: Once Human detection not working correctly (95% fixed)

## 0.7.1

- Feat: Add support for the new game "RuneScape: Dragonwilds" (experimental)

## 0.6.0

- Feat: Add warning if app is not running in privileged mode

## 0.5.5

- Feat: Add Once Human support (experimental)
- Fix: Crash on Palworld server join
- Fix: App not launched after update

## 0.4.2

- Feat: Add settings, account, info and discord buttons to the app header
- Feat: Add version number to analytics
- Fix: List style for cascaded lists
- Fix: Resize the app when the game is resized (Exclusive fullscreen mode is not supported yet)
- Fix: Detect not-movable actors in the game (e.g. Palworld, etc.)

## 0.3.1

- Feat: Add hotkey support for the app. You can now use the following hotkeys (customizable will be added in the future):
  - `F5` Toggle Live Mode
  - `F6` Show/Hide App
  - `F7` Zoom In
  - `F8` Zoom Out
  - `F9` Lock/Unlock App
  - `F10` Discover Node
- Feat: Add option to hide the dashboard on start
- Fix: Auto update not working correctly. Please install the latest version manually
- Fix: Palworld is not interactable when using the app in "hide controls" mode
- Fix: Minimizing the app in overlay mode

## 0.2.0

- Feat: The app can automatically update itself from now on. Please update to the latest version to get this feature.
- Fix: Palworld crash on startup (should not happend on new game versions anymore)
