import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

export const r2 = {
    upload: async (key, buffer, contentType) => {
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });
        return s3.send(command);
    },
    
    /**
     * Checks if a file exists in R2
     */
    exists: async (key) => {
        try {
            const command = new HeadObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            });
            await s3.send(command);
            return true;
        } catch (err) {
            return false;
        }
    }
};
