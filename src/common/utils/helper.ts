import { HttpStatus } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { RzpOptions } from '../enum';
import Razorpay from 'razorpay';

const secret = process.env.ENCRYPT_TOKEN;

export const successResponse = <T>(message: string) =>
  ({
    status_code: HttpStatus.OK,
    error: false,
    message,
  }) as const;

export const successResponseWithResult = <T>(message: string, result: T) =>
  ({
    status_code: HttpStatus.OK,
    error: false,
    message,
    result,
  }) as const;

export function encryptData(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, secret).toString();
}

export function decryptData(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secret);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export async function bcryptHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function bcryptCompare(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
export function getRzpClient(options: RzpOptions) {
  const rzpClient = new Razorpay({
    key_id: options.key_id,
    key_secret: options.key_secret,
  });

  return rzpClient;
}
