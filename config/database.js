const mongoose = require('mongoose');
const mssql = require('mssql');
const EventEmitter = require('events');

class Database extends EventEmitter {
    constructor() {
        super();
        //this.connectMongoDB();
        this.connectMSSQL();
    }

    // MongoDB Connection
    async connectMongoDB() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ MongoDB Connected');
            this.emit('mongoConnected'); // Emit event when MongoDB is connected
        } catch (error) {
            console.error('❌ MongoDB Connection Error:', error);
            process.exit(1); // Exit the process if MongoDB connection fails
        }
    }

    // MS SQL Server Connection
    async connectMSSQL() {
        try {
            // Setup MSSQL connection configuration
            const sqlConfig = {
                user: process.env.MSSQL_USER,
                password: process.env.MSSQL_PASSWORD,
                server: process.env.MSSQL_SERVER,  // Could be an IP address or hostname
                database: process.env.MSSQL_DATABASE,
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                },
                options: {
                    encrypt: process.env.MSSQL_ENCRYPT === 'true' 
                    ? true 
                    : process.env.MSSQL_ENCRYPT === 'strict' 
                    ? 'strict' 
                    : false,
                
                    trustServerCertificate: false, // Change to true for self-signed certificates
                },
                requestTimeout: 120000 
            };

            // Connect to MSSQL
            await mssql.connect(sqlConfig);
            console.log('✅ MSSQL Connected');
            this.emit('mssqlConnected'); // Emit event when MSSQL is connected
        } catch (error) {
            console.error('❌ MSSQL Connection Error:', error);
            process.exit(1); // Exit the process if MSSQL connection fails
        }
    }
    async executeSQLQuery(query) {
        try {
            const result = await mssql.query(query);
            //console.log('SQL Query Result:', result);
            return result;  // Return the result of the query
        } catch (error) {
            console.error('❌ SQL Query Error:', error);
            throw error;  // Rethrow the error to be handled by the caller
        }
    }

}

module.exports = new Database();
