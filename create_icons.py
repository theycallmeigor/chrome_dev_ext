#!/usr/bin/env python3
"""
Simple script to create placeholder icons for the Chrome extension.
Run this script to generate icon16.png, icon48.png, and icon128.png
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a purple background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)

    # Try to use a nice font, fallback to default
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size // 3)
    except:
        font = ImageFont.load_default()

    # Draw "CC" text in white
    text = "CC"

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    position = ((size - text_width) // 2, (size - text_height) // 2 - bbox[1])

    draw.text(position, text, fill='white', font=font)

    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    create_icon(16, 'icon16.png')
    create_icon(48, 'icon48.png')
    create_icon(128, 'icon128.png')

    print("\nIcons created successfully!")
    print("You can now load the extension in Chrome.")
