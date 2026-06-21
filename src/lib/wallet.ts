import { ethers } from 'ethers';
import config from './config';

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

// EIP-6963: Multi Injected Provider Discovery.
// Lets multiple installed wallet extensions (MetaMask, OKX, Backpack, etc.)
// each announce themselves, so we can show the user a real picker instead
// of blindly using whichever extension happened to claim window.ethereum.
export interface WalletProviderInfo {
  uuid: string;
  name: string;
  icon: string; // data URI
  rdns: string; // reverse-DNS id, e.g. "io.metamask"
}

interface EIP6963ProviderDetail {
  info: WalletProviderInfo;
  provider: EIP1193Provider;
}

interface EIP6963AnnounceEvent extends Event {
  detail: EIP6963ProviderDetail;
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'wrong_network';

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private address: string | null = null;
  private rawProvider: EIP1193Provider | null = null;

  private discovered = new Map<string, EIP6963ProviderDetail>();
  private discoveryStarted = false;

  startDiscovery(onUpdate?: (wallets: WalletProviderInfo[]) => void) {
    if (this.discoveryStarted || typeof window === 'undefined') return;
    this.discoveryStarted = true;

    window.addEventListener('eip6963:announceProvider', (event: Event) => {
      const detail = (event as EIP6963AnnounceEvent).detail;
      if (!detail?.info?.uuid) return;
      this.discovered.set(detail.info.uuid, detail);
      onUpdate?.(this.getDiscoveredWallets());
    });

    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }

  getDiscoveredWallets(): WalletProviderInfo[] {
    return Array.from(this.discovered.values()).map(d => d.info);
  }

  isInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  hasAnyWallet(): boolean {
    return this.discovered.size > 0 || this.isInstalled();
  }

  async connect(uuid?: string): Promise<{ address: string; chainId: number }> {
    console.log('[wallet] connect() called with uuid:', uuid);
    let rawProvider: EIP1193Provider | undefined;

    if (uuid) {
      rawProvider = this.discovered.get(uuid)?.provider;
      console.log('[wallet] found provider for uuid?', !!rawProvider, 'discovered size:', this.discovered.size);
      if (!rawProvider) {
        throw new Error('Selected wallet is no longer available — please try again');
      }
    } else if (this.discovered.size === 1) {
      rawProvider = Array.from(this.discovered.values())[0].provider;
    } else if (this.isInstalled()) {
      rawProvider = window.ethereum;
    }

    if (!rawProvider) {
      throw new Error('No wallet found — please install MetaMask, OKX Wallet, Backpack, or another Web3 wallet');
    }

    try {
      this.rawProvider = rawProvider;
      this.provider = new ethers.BrowserProvider(rawProvider as ethers.Eip1193Provider);
      console.log('[wallet] calling eth_requestAccounts...');

      const accounts = await this.provider.send('eth_requestAccounts', []);
      console.log('[wallet] got accounts:', accounts);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.signer = await this.provider.getSigner();
      this.address = accounts[0];

      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      console.log('[wallet] chainId:', chainId);

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
    const rawProvider = this.rawProvider || window.ethereum;
    if (!rawProvider) throw new Error('Wallet not connected');

    try {
      await rawProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      const error = switchError as { code?: number };
      if (error.code === 4902) {
        await rawProvider.request({
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
    const rawProvider = this.rawProvider || window.ethereum;
    if (!rawProvider) return;

    rawProvider.on('accountsChanged', (accounts: unknown) => {
      const accountList = accounts as string[];
      this.address = accountList[0] || null;
      callback(this.address);
    });
  }

  onChainChanged(callback: (chainId: number) => void) {
    const rawProvider = this.rawProvider || window.ethereum;
    if (!rawProvider) return;

    rawProvider.on('chainChanged', (chainId: unknown) => {
      callback(parseInt(chainId as string, 16));
    });
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.rawProvider = null;
  }
}

export const wallet = new WalletService();
export default wallet;
