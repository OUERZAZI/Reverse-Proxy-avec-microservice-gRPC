const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql');

// Paramètres de connexion à la base de données MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbuser',
    password: 'dbpass',
    database: 'db'
});

// Connexion à la base de données MySQL
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// Charge le service gRPC et le fichier.proto
const PROTO_PATH = __dirname + '/my-service.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const serviceProto = grpc.loadPackageDefinition(packageDefinition).myservice;

// Définit la fonction getRecord pour accéder à la base de données
function getRecord(call, callback) {
    const id = call.request.id;
    // Requète à la base de données pour obtenir l'enregistrement avec l'ID spécifié
    connection.query('SELECT * FROM records WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.error(error);
            callback(error);
            return;
        }
        // Renvoie les données au client
        const record = results[0];
        callback(null, { record: record.id });
    });
}

// Démarre le serveur gRPC
const server = new grpc.Server();
server.addService(serviceProto.MyService.service, { getRecord });
server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), () => {
    console.log('Listening on port 50051');
    server.start();
});
