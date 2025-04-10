require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
//const mongoSanitize = require('express-mongo-sanitize');
//const xss = require('xss-clean');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const morgan = require('morgan');
const path = require('path');

// Import Database Connection
const Database = require('./config/database');

class Server {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 5000;

        this.middlewares();
        this.routes();
    }

    middlewares() {
        
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Use cookie-parser middleware
        this.app.use(cookieParser());
        this.app.use(cors({
            origin: [process.env.CORS_ORIGIN],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            credentials: true,
        }));
        
        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        imgSrc: [
                            "'self'",
                            "data:",
                            "blob:",
                        ],                        
                        scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                        fontSrc: ["'self'", "https://fonts.gstatic.com"],
                        connectSrc: [
                            "'self'",
                            process.env.CLIENT_URL,
                        ],
                    },
                },
            })
        );
        
        this.app.use(hpp());
        //this.app.use(mongoSanitize());
        //this.app.use(xss());
        this.app.use(compression())
        this.app.use(morgan("combined"));

        this.app.set('trust proxy', 1);
        this.app.use(rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 1000,
            message: 'Too many requests, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        }));
        //this.app.set('dist', path.join(__dirname, 'dist'));
        this.app.use(express.static(path.join(__dirname, 'dist')));


    }

    routes() {
        this.app.use('/api/v1.0/', require('./routes/rtmRoute'));
        const indexPath = path.resolve(__dirname, 'dist', 'index.html');
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
        
    }

    start() {
       // Database.on('connected', () => {
            this.server.listen(this.port, async () => {
                console.log(`🚀 Secure server running on port ${this.port}`);
            });
       // });
    }
}

// Start the server
const serverInstance = new Server();
serverInstance.start();

module.exports = serverInstance; 