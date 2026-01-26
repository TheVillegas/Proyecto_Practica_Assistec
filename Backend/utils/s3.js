require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

/**
 * Sube un archivo a S3
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} fileName - Nombre original
 * @param {string} mimeType - Tipo MIME
 * @returns {Promise<string>} La Key del objeto en S3
 */
async function uploadFile(fileBuffer, fileName, mimeType) {
    const uploadParams = {
        Bucket: bucketName,
        Key: `uploads/${Date.now()}_${fileName}`, // Nombre único
        Body: fileBuffer,
        ContentType: mimeType
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    return uploadParams.Key;
}

/**
 * Genera una URL firmada (temporal) para ver un objeto privado
 * @param {string} key - La Key del objeto en S3
 * @returns {Promise<string>} URL firmada válida por 1 hora
 */
async function getObjectSignedUrl(key) {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
    });

    // URL válida por 3600 segundos (1 hora)
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Descarga un objeto de S3 y lo devuelve como Buffer (Útil para Excel)
 * @param {string} key 
 * @returns {Promise<Buffer>}
 */
async function getObjectBuffer(key) {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
    });

    const response = await s3Client.send(command);
    // Convertir stream a buffer
    return new Promise((resolve, reject) => {
        const chunks = [];
        response.Body.on('data', (chunk) => chunks.push(chunk));
        response.Body.on('error', reject);
        response.Body.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

module.exports = {
    uploadFile,
    getObjectSignedUrl,
    getObjectBuffer
};
