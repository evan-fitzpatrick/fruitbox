from flask import Flask, render_template, jsonify, send_from_directory, request
import random
import os
import csv
from io import StringIO

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main game page"""
    return render_template('index.html')

@app.route('/generate-grid')
def generate_grid():
    """Generate a 10x17 grid with random numbers from 1-9"""
    grid = []
    for row in range(10):
        grid_row = []
        for col in range(17):
            grid_row.append(random.randint(1, 9))
        grid.append(grid_row)
    
    return jsonify({'grid': grid})

@app.route('/load-grid', methods=['POST'])
def load_grid():
    """Load a grid from a CSV file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.csv'):
        try:
            # Read the CSV content
            content = file.read().decode('utf-8')
            csv_reader = csv.reader(StringIO(content))
            
            # Convert to grid format
            grid = []
            for row in csv_reader:
                if row:  # Skip empty rows
                    grid.append([int(cell) for cell in row if cell.strip()])
            
            # Validate grid dimensions
            if len(grid) == 10 and all(len(row) == 17 for row in grid):
                return jsonify({'grid': grid})
            else:
                return jsonify({'error': 'Invalid grid dimensions. Expected 10x17.'}), 400
                
        except Exception as e:
            return jsonify({'error': f'Error parsing CSV: {str(e)}'}), 400
    
    return jsonify({'error': 'Invalid file format. Only CSV files are accepted.'}), 400

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
