#!/usr/bin/env python3
"""
Create simple solid color icons without requiring PIL
"""

import base64

# Minimal PNG files (solid purple squares) encoded in base64
# These are valid PNG files created with minimal headers

# 16x16 purple icon
icon16_base64 = """
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAOklEQVR4nGP4z8DwHwyZGCgETAyU
AqBB/xlQACMjI1U0/McqQA0XgA1gYqQQDI4BGBWAAYxDZwAAvQcE/9wgSdkAAAAASUVORK5CYII=
"""

# 48x48 purple icon
icon48_base64 = """
iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAQklEQVR4nO3QQREAAAjDMND/0rPD
OhhiCaVQaEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+MkGJcgAAfJKIUwAAAAASUVORK5C
YII=
"""

# 128x128 purple icon
icon128_base64 = """
iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAASUlEQVR4nO3QMREAAAAgEP8/2h4x
6IJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM4GJcgA
ASmRIbUAAAAASUVORK5CYII=
"""

# Better quality icons with actual purple color
icon16_b64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAI0lEQVR4nGNgYGD4z0ABYKKgbhgYNWDUgFEDRg0YNWBoDQAAJpQBAZ/ISlEAAAAASUVORK5CYII="

icon48_b64 = "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAI0lEQVR4nO3QMREAAAjDMND/0rPDYDuLSCGUQgEAAAAAwEsHJcgAAQtGfH0AAAAASUVORK5CYII="

icon128_b64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAI0lEQVR4nO3QMREAAAjDMND/0rPDYDuLSCGUQgEAAAAAwEsHJcgAAQtGfH0AAAAASUVORK5CYII="

def create_png(base64_data, filename):
    png_data = base64.b64decode(base64_data)
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_png(icon16_b64, 'icon16.png')
    create_png(icon48_b64, 'icon48.png')
    create_png(icon128_b64, 'icon128.png')

    print("\nSimple placeholder icons created!")
    print("Note: These are basic solid color icons.")
    print("For better icons, you can:")
    print("1. Design custom icons using an image editor")
    print("2. Replace icon16.png, icon48.png, and icon128.png")
