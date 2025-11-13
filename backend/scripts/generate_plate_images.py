"""
Script to generate license plate images for vehicles
"""
from PIL import Image, ImageDraw, ImageFont
import os

# License plates from seed data
plates = [
    "30A-123.45",
    "30A-678.90", 
    "29X-999.88",
    "51F-456.78",
    "30A-111.22",
    "59A-789.01",
    "30F-333.44",
    "30A-555.66",
    "30E-888.99",
    "29B-222.33"
]

def create_license_plate(plate_number: str, output_path: str):
    """Create a Vietnamese license plate image"""
    # Plate dimensions (Vietnamese license plate standard)
    width, height = 400, 120
    
    # Create white background
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw blue border
    border_width = 8
    draw.rectangle(
        [(0, 0), (width-1, height-1)],
        outline='#0066CC',
        width=border_width
    )
    
    # Draw Vietnam flag area (left side)
    flag_width = 80
    draw.rectangle(
        [(border_width, border_width), (flag_width, height-border_width)],
        fill='#DA251D'
    )
    
    # Draw yellow star (simplified)
    star_center_x = flag_width // 2
    star_center_y = height // 2
    star_size = 20
    points = []
    for i in range(5):
        angle = i * 144 - 90  # 144 degrees between points
        import math
        x = star_center_x + star_size * math.cos(math.radians(angle))
        y = star_center_y + star_size * math.sin(math.radians(angle))
        points.append((x, y))
    draw.polygon(points, fill='#FFFF00')
    
    # Try to use a bold font, fallback to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 50)
    except:
        font = ImageFont.load_default()
    
    # Draw license plate number
    text = plate_number
    
    # Calculate text position (centered in the right area)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = flag_width + (width - flag_width - text_width) // 2
    text_y = (height - text_height) // 2 - 5
    
    # Draw text with black color
    draw.text((text_x, text_y), text, fill='black', font=font)
    
    # Save image
    img.save(output_path)
    print(f"✅ Created: {output_path}")

def main():
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'Images', 'vehicles')
    os.makedirs(output_dir, exist_ok=True)
    
    print("🎨 Generating license plate images...")
    
    for plate in plates:
        # Convert plate format for filename: 30A-123.45 -> 30A-12345.jpg
        filename = plate.replace('-', '').replace('.', '') + '.jpg'
        output_path = os.path.join(output_dir, filename)
        create_license_plate(plate, output_path)
    
    print(f"\n✅ Generated {len(plates)} license plate images in {output_dir}")

if __name__ == "__main__":
    main()
