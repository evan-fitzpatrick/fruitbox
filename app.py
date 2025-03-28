from flask import Flask, render_template, jsonify, send_from_directory
import random
import os

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main game page"""
    return render_template('index.html')

@app.route('/generate-grid')
def generate_grid():
    """Generate a 16x10 grid with random numbers from 1-9"""
    grid = []
    for row in range(10):
        grid_row = []
        for col in range(16):
            grid_row.append(random.randint(1, 9))
        grid.append(grid_row)
    
    return jsonify({'grid': grid})

@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

if __name__ == '__main__':
    # Ensure the static/images directory exists
    os.makedirs('static/images', exist_ok=True)
    
    # Check if icon.png exists, if not create a placeholder
    icon_path = os.path.join('static', 'images', 'icon.png')
    if not os.path.exists(icon_path):
        print("Warning: icon.png not found in static/images. Please add an icon image.")
        print("Game will still run but icons will not display correctly.")
    
    app.run(debug=True)