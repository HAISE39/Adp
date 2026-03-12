# Android Mod Menu for AIDE Pro

This is a source code for an injectable mod menu with memory scanning capabilities.

## Features
- **Floating UI**: Movable logo and menu window.
- **Memory Scanner**: Search and write memory in `java_heap` (Dalvik).
- **Supported Types**: DWORD, FLOAT, BYTE, WORD, DOUBLE, QWORD, XOR.
- **XOR Search**: Use `value:key` format in search box.
- **Lua Support**: Integration stub for LuaJ scripts.
- **Safety**: Signal handling for segfaults and memcpy for alignment.

## How to Build in AIDE Pro
1. Open the `ModMenuApp` folder in AIDE Pro.
2. Add `luaj-android-3.0.1.jar` to `app/libs/` if you want Lua support.
3. Build the project.

## How to Inject
1. Copy the generated `classes.dex` and `libmodmenu.so` to the target APK.
2. In the target APK's `MainActivity`, call:
   ```java
   com.mod.menu.Main.start(this);
   ```

## Requirements
- Overlay permission (requested automatically).
- Android 5.0+ (API 21+).
