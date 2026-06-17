import { ethers } from 'ethers';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import logger from '../lib/logger';
import config from '../config';

interface StorageUploadResult {
  hash: string;
  size: number;
  timestamp: number;
}

interface StorageDownloadResult {
  data: unknown;
  hash: string;
}

export class StorageService {
  private indexer: Indexer;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null;

  constructor() {
    this.indexer = new Indexer(config.og.indexerUrl);
    this.provider = new ethers.JsonRpcProvider(config.og.rpcUrl);

    // Without a funded private key, uploads cannot be signed and submitted on-chain.
    this.signer = config.og.storagePrivateKey
      ? new ethers.Wallet(config.og.storagePrivateKey, this.provider)
      : null;

    if (!this.signer) {
      logger.warn(
        'OG_STORAGE_PRIVATE_KEY is not set — 0G Storage uploads will be skipped until configured.'
      );
    }
  }

  async uploadAgent(agentData: unknown): Promise<StorageUploadResult> {
    return this.uploadJson({
      type: 'agent',
      version: '1.0',
      timestamp: Date.now(),
      data: agentData,
    });
  }

  async uploadBattle(battleData: unknown): Promise<StorageUploadResult> {
    return this.uploadJson({
      type: 'battle',
      version: '1.0',
      timestamp: Date.now(),
      data: battleData,
    });
  }

  async uploadTournament(tournamentData: unknown): Promise<StorageUploadResult> {
    return this.uploadJson({
      type: 'tournament',
      version: '1.0',
      timestamp: Date.now(),
      data: tournamentData,
    });
  }

  async download(hash: string): Promise<StorageDownloadResult> {
    try {
      const outputPath = `/tmp/0g-download-${hash}.json`;
      const err = await this.indexer.download(hash, outputPath, true);

      if (err !== null) {
        throw new Error(`0G download error: ${err}`);
      }

      const fs = await import('fs/promises');
      const raw = await fs.readFile(outputPath, 'utf-8');
      await fs.unlink(outputPath).catch(() => undefined);

      return { data: JSON.parse(raw), hash };
    } catch (error) {
      logger.error('0G Storage download error:', error);
      return { data: null, hash };
    }
  }

  /**
   * Uploads a JSON-serializable payload to 0G Storage and returns the
   * resulting root hash. Throws if no signer is configured — callers
   * should catch this and decide how to degrade (e.g. skip persistence,
   * but never fabricate a fake hash).
   */
  private async uploadJson(payload: unknown): Promise<StorageUploadResult> {
    if (!this.signer) {
      throw new Error(
        '0G Storage is not configured — set OG_STORAGE_PRIVATE_KEY to enable uploads'
      );
    }

    const json = JSON.stringify(payload);
    const buffer = Buffer.from(json, 'utf-8');

    const tmpPath = `/tmp/0g-upload-${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
    const fs = await import('fs/promises');
    await fs.writeFile(tmpPath, buffer);

    try {
      const file = await ZgFile.fromFilePath(tmpPath);
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr !== null || !tree) {
        throw new Error(`Failed to build merkle tree: ${treeErr}`);
      }

      const [, uploadErr] = await this.indexer.upload(file, config.og.rpcUrl, this.signer);
      await file.close();

      if (uploadErr !== null) {
        throw new Error(`0G upload error: ${uploadErr}`);
      }

      const rootHash = tree.rootHash() ?? '';

      return {
        hash: rootHash,
        size: buffer.length,
        timestamp: Date.now(),
      };
    } finally {
      await fs.unlink(tmpPath).catch(() => undefined);
    }
  }
}

export const storageService = new StorageService();
