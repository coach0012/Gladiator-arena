import { ethers } from 'ethers';
import config from './config';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'wrong_network';

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private address: string | null = null;

  isInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  async connect(): Promise<{ address: string; chainId: number }> {
    if (!this.isInstalled()) {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum!);
      
      const accounts = await this.provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.signer = await this.provider.getSigner();
      this.address = accounts[0];

      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      // Check if on correct network
      if (chainId !== config.network.chainId && chainId !== config.testnet.chainId) {
        await this.switchToOGNetwork();
      }

      return { address: this.address, chainId };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  async switchToOGNetwork(useTestnet: boolean = false): Promise<void> {
    const networkConfig = useTestnet ? config.testnet : config.network;

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      const error = switchError as { code?: number };
      // Chain not added to wallet
      if (error.code === 4902) {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${networkConfig.chainId.toString(16)}`,
            chainName: networkConfig.chainName,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: [networkConfig.rpcUrl],
            blockExplorerUrls: [networkConfig.blockExplorer],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    return this.signer.signMessage(message);
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.address) {
      throw new Error('Wallet not connected');
    }

    const balance = await this.provider.getBalance(this.address);
    return ethers.formatEther(balance);
  }

  getAddress(): string | null {
    return this.address;
  }

  getChainId(): Promise<number> | null {
    if (!this.provider) return null;
    return this.provider.getNetwork().then(n => Number(n.chainId));
  }

  onAccountChanged(callback: (address: string | null) => void) {
    if (!window.ethereum) return;
    
    window.ethereum.on('accountsChanged', (accounts: unknown) => {
      const accountList = accounts as string[];
      this.address = accountList[0] || null;
      callback(this.address);
    });
  }

  onChainChanged(callback: (chainId: number) => void) {
    if (!window.ethereum) return;
    
    window.ethereum.on('chainChanged', (chainId: unknown) => {
      callback(parseInt(chainId as string, 16));
    });
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
  }
}

export const wallet = new WalletService();
export default wallet;
