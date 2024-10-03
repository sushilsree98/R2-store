const s3Client = require('@aws-sdk/client-s3').S3Client;
const PutObjectCommand = require('@aws-sdk/client-s3').PutObjectCommand
const {v4 : uuidv4} = require('uuid');
const { Upload } = require('@aws-sdk/lib-storage');

const clients = new Map();

// SSE endpoint to connect clients
const uploadEventStream = async (req, res) => {
    const { uploadId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Store the response associated with the upload ID
    clients.set(uploadId, res);

    // Remove the client when the connection is closed
    req.on('close', () => {
        clients.delete(uploadId);
    });
};

const s3 = new s3Client({
    region: 'apac',
    endpoint: `https://${process.env.CLOUDFLARE_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_ID
    }
});

const upload = async (req, res, next) => {
    try{
        const file = req.file
        console.log(file)
        if (!file) {
            return res.status(400).send('No file uploaded.');
        }
        const uploadId = req.params.uploadId || req.query.uploadId || req.body.uploadId
        const mime = await import('mime');
        const contentType = mime.default.getType(file.originalname) || 'application/octet-stream';

        const upload = new Upload({
            client: s3,
            params: {
                Bucket: 'master',
                Key: `sample_a/${uuidv4()}_${file.originalname}`,
                Body: file.buffer,
                ContentType: contentType,
            },
            leavePartsOnError: false, 
        });

        upload.on('httpUploadProgress', (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            const client = clients.get(uploadId);
            if(client){
                client.write(`data: ${JSON.stringify({ progress: percent })}\n\n`)
            }
        })

        const s3response = await upload.done();
        res.send({ data: s3response });

    }catch(err){
        console.log(err);
        const client = clients.get(uploadId);
        if (client) {
            client.end(); // Close the client connection
            clients.delete(uploadId); // Remove the client
        }
        res.send('error')
    }

}

module.exports = {
    upload,
    uploadEventStream
}