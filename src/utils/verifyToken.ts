import { Headers } from 'jwks-rsa';

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

export const verifyToken = async (bearerToken: string) => {
    const client = jwksClient({
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    });

    const getJwksClientKey = (header: Headers, callback: (_: null, key: string) => void) => {
        client.getSigningKey(header.kid, (error: Error, key: { publicKey: string; rsaPublicKey: string }) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    };

    return new Promise((resolve, reject) => {
        jwt.verify(
            bearerToken,
            getJwksClientKey,
            {
                audience: process.env.AUDIENCE,
                algorithms: ['RS256'],
            },
            (err: Error, decoded: string) => {
                if (err) reject(err);
                resolve(decoded as unknown);
            }
        );
    });
};
