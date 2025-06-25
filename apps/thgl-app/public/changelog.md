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
