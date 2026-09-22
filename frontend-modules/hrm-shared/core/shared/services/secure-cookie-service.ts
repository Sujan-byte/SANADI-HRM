import { Injectable } from '@angular/core';
import { set, get, del, clear, keys } from 'idb-keyval';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EncryptedStorageService {
  private keyPromise: Promise<CryptoKey>;
  // In-memory cache of values already resolved via getItem/setItem this session -
  // lets synchronous callers (e.g. dialog form-config builders, which run as plain
  // functions and are never awaited by their callers) read an already-known value
  // without needing to await the IndexedDB round trip themselves.
  private cache = new Map<string, any>();

  constructor() {
    const secret = environment.storageEncryptionKey;
    const keyData = new TextEncoder().encode(secret);

    if (keyData.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256-bit)');
    }

    this.keyPromise = crypto.subtle.importKey(
      'raw',
      keyData,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );

    // this.logAllItems();
  }

  private async encrypt(value: any): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    const key = await this.keyPromise;

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    });
  }

  private async decrypt(encryptedJson: string): Promise<any> {
    const { iv, data } = JSON.parse(encryptedJson);
    const key = await this.keyPromise;

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );

    // return JSON.parse(new TextDecoder().decode(decrypted));
    return JSON?.parse(new TextDecoder().decode(decrypted));
  }

  async setItem(key: string, value: any): Promise<void> {
    const encrypted = await this.encrypt(value);
    await set(key, encrypted);
    this.cache.set(key, value);
  }

  async getItem<T>(key: string): Promise<T | null> {
    const encrypted = await get<string>(key);
    if (!encrypted) {
      this.cache.set(key, null);
      return null;
    }
    // console.log(`${key}:`, encrypted);
    try {
      const value = await this.decrypt(encrypted);
      this.cache.set(key, value);
      return value;
    } catch (e) {
      console.error('Decryption failed:', e);
      await this.removeItem(key);
      return null;
    }
  }

  /**
   * Synchronous read of whatever getItem/setItem last resolved for this key in
   * this session - returns null if it hasn't been loaded yet (never awaited, or
   * this is the very first read). Only use where a stale/momentarily-null value
   * is acceptable, e.g. display-only fields in a synchronous form-config builder.
   */
  getItemSync<T>(key: string): T | null {
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  async removeItem(key: string): Promise<void> {
    await del(key);
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    await clear();
    this.cache.clear();
  }

  // async logAllItems(): Promise<void> {
  // const allKeys = await keys();
  // for (const key of allKeys) {
  //   const value = await this.getItem<any>(key as string);
  //   console.log(`${key}:`, value);
  // }
  // }
}
