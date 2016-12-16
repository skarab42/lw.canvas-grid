import canvasFilters from 'lw.canvas-filters'

// CanvasGrid class
class CanvasGrid {
    // Class constructor...
    constructor(settings) {
        // Init properties
        this.cellSize   = 1024
        this.scaleRatio = 1
        this.filters    = {}

        Object.assign(this, settings || {})

        this.size   = { width: 0, height: 0, cols: 0, rows: 0 }
        this.file   = null
        this.image  = null
        this.url    = null
        this.src    = null
        this.canvas = []
        this.pixels = []
    }

    // <input> can be Image, File URL object or URL string (http://* or data:image/*)
    load(input) {
        // Load File object
        if (input instanceof File) {
            return this.loadFromFile(input)
        }

        // Load Image object
        if (input instanceof Image) {
            return this.loadFromImage(input)
        }

        // Load URL object
        if (typeof input === 'string' || input instanceof URL) {
            return this.loadFromURL(input.trim())
        }

        // Return rejected promise with an Error object
        return Promise.reject(new Error('Unsupported input format.'))
    }

    // Load image
    _loadImage(src, reject, resolve) {
        // Create Image object
        let image = new Image()

        // Register for load and error events
        image.onload = event => {
            this.loadFromImage(image).then(result => {
                this._processImage()
                this.src = src
                resolve(result)
            }).catch(reject)
        }

        image.onerror = event => {
            reject(new Error('Error reading file : ' + src))
        }

        // Load the image from File url
        image.src = src
    }

    // Load from File object
    loadFromFile(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof File)) {
                reject(new Error('Input param must be a File object.'))
            }

            // Set input file
            this.file = input

            // Load image
            this._loadImage(URL.createObjectURL(input), reject, resolve)
        })
    }

    // Load from URL object or string
    loadFromURL(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof URL) && typeof input !== 'string') {
                reject(new Error('Input param must be a URL string or object.'))
            }

            // Create url object
            let url = input instanceof URL ? input : new URL(input)

            // Set url
            this.url = url

            // Load image
            this._loadImage(url, reject, resolve)
        })
    }

    // Load from Image object
    loadFromImage(input) {
        return new Promise((resolve, reject) => {
            // Bad input type
            if (! (input instanceof Image)) {
                reject(new Error('Input param must be a Image object.'))
            }

            // Set input image
            this.image = input

            resolve(this)
        })
    }

    _processImage() {
        // Reset canvas grid
        this.canvas = []
        this.pixels = []

        // Calculate grid size
        let width  = this.image.width * this.scaleRatio
        let height = this.image.height * this.scaleRatio
        let cols   = Math.ceil(width / this.cellSize)
        let rows   = Math.ceil(height / this.cellSize)

        this.size = { width, height, cols, rows }

        // Create canvas grid
        let line    = null
        let canvas  = null
        let context = null

        let x  = null
        let y  = null
        let sw = null
        let sh = null
        let sx = null
        let sy = null

        // For each line
        for (y = 0; y < this.size.rows; y++) {
            // Reset current line
            line = []

            // For each column
            for (x = 0; x < this.size.cols; x++) {
                // Create canvas element
                canvas = document.createElement('canvas')

                // Set canvas size
                if (x === 0 || x < (this.size.cols - 1)) {
                    canvas.width = this.size.width < this.cellSize
                                 ? this.size.width : this.cellSize
                }
                else {
                    // Get the rest for the last item (except the first one)
                    canvas.width = this.size.width % this.cellSize
                }

                if (y === 0 || y < (this.size.rows - 1)) {
                    canvas.height = this.size.height < this.cellSize
                                  ? this.size.height : this.cellSize
                }
                else {
                    // Get the rest for the last item (except the first one)
                    canvas.height = this.size.height % this.cellSize
                }

                // Get canvas 2d context
                context = canvas.getContext('2d')

                // Fill withe background (avoid alpha chanel calculation)
                context.fillStyle = 'white'
                context.fillRect(0, 0, canvas.width, canvas.height)

                // Draw the part of image in the canvas (scale)
                sw = canvas.width / this.scaleRatio
                sh = canvas.height / this.scaleRatio
                sx = x * this.cellSize / this.scaleRatio
                sy = y * this.cellSize / this.scaleRatio

                context.drawImage(
                    this.image, sx, sy, sw, sh,
                    0, 0, canvas.width, canvas.height
                )

                // Apply image filters
                canvasFilters(canvas, this.filters)

                // Add the canvas to current line
                line.push(canvas)
            }

            // Add the line to canvas grid
            this.canvas.push(line)
        }
    }

    // Apply filters
    applyFilters(filters) {
        Object.assign(this.filters, filters || {})
        this.canvas.forEach(canvas => canvasFilters(canvas, this.filters))
    }
}

// Exports
export { CanvasGrid }
export default CanvasGrid