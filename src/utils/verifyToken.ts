import { RsaSigningKey } from 'jwks-rsa';
import jwt, { GetPublicKeyOrSecret, JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response } from 'express';
import { DecodedToken } from '../types/types';

export const verifyToken = async (bearerToken: string) => {
    const client = jwksClient({
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    });

    const getJwksClientKey: GetPublicKeyOrSecret = (header, callback) => {
        client.getSigningKey(header.kid || '', (_, key) => {
            const signingKey = key.getPublicKey || (key as RsaSigningKey).rsaPublicKey;
            callback(null, signingKey());
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
            (err, decoded) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                resolve(decoded as DecodedToken);
            }
        );
    });
};

export const user_from_token = async (req: Request, res: Response): Promise<string | undefined> => {
    let token: string | undefined = req.cookies.token;
    if (!token) {
        const auth_header = req.headers.authorization || '';
        if (auth_header) {
            token = auth_header.split(' ')[1];
        }
        token = '';
    }
    try {
        const payload = (await verifyToken(token)) as DecodedToken;
        return payload.sub;
    } catch (err) {
        res.clearCookie('token');
    }
};
