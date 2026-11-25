import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import api from '../services/api';
import contractInfoFallback from '../contracts/contractInfo.json';
import NonceAlertModal from '../components/NonceAlertModal';

const Web3Context = createContext();

const HARDHAT_CHAIN_ID_HEX = '0x7a69'; // 31337 in hex
const HARDHAT_CHAIN_ID_DEC = 31337n;
const HARDHAT_RPC = 'http://127.0.0.1:8545';

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'patient' | 'doctor' | 'hospital' | 'admin' | 'none'
  const [userProfile, setUserProfile] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [contractNotDeployed, setContractNotDeployed] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('emr_token'));

  // Transaction execution state & locks
  const [isTxPending, setIsTxPending] = useState(false);
  const [txProgress, setTxProgress] = useState({ status: 'idle', message: '' });
  const [nonceModalState, setNonceModalState] = useState({ isOpen: false, details: '' });

  // Refs to track current account and prevent race conditions or duplicate submissions
  const currentAccountRef = useRef(null);
  const isTxLockedRef = useRef(false);
  // Per-wallet queue to serialize transactions strictly one-by-one
  const walletQueuesRef = useRef(new Map());
  const lastKnownGenesisRef = useRef(null);
  const lastKnownNoncesRef = useRef(new Map());

  /**
   * Helper to update URL location without hard page reload
   */
  const navigateTo = useCallback((targetPath) => {
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  /**
   * Verify contract bytecode exists on local chain
   */
  const verifyContractDeployment = async (browserProvider, contractAddress) => {
    try {
      const code = await browserProvider.getCode(contractAddress);
      const isDeployed = code && code !== '0x' && code !== '0x0';
      setContractNotDeployed(!isDeployed);
      return isDeployed;
    } catch (e) {
      console.warn('Could not verify contract deployment code:', e.message);
      return false;
    }
  };

  /**
   * Map role enum index from Solidity contract to string
   */
  const getRoleFromContract = async (contractInstance, walletAddr) => {
    if (!contractInstance || !walletAddr) return 'none';
    const cleanAddr = walletAddr.toLowerCase();

    try {
      // 1. Check if deployer / admin
      try {
        const adminAddr = await contractInstance.admin();
        if (adminAddr && adminAddr.toLowerCase() === cleanAddr) {
          return 'admin';
        }
      } catch (adminErr) {
        // contract call failed or contract not deployed
      }

      // 2. Query getUser(walletAddr)
      const user = await contractInstance.getUser(cleanAddr);
      const roleIndex = Number(user[0]);
      const roles = ['none', 'patient', 'doctor', 'hospital', 'admin'];
      return roles[roleIndex] || 'none';
    } catch (err) {
      console.warn('Web3Context: Could not read role from contract for', cleanAddr, err.message);
      return 'none';
    }
  };

  /**
   * Complete resolution pipeline for a newly selected wallet address
   */
  const resolveAccount = useCallback(
    async (rawAddress, browserProvider, shouldRedirect = false) => {
      if (!rawAddress) return null;
      const cleanAddr = rawAddress.toLowerCase();
      currentAccountRef.current = cleanAddr;

      try {
        setIsConnecting(true);

        // 1. Verify contract bytecode exists on chain
        await verifyContractDeployment(browserProvider, contractInfoFallback.contractAddress);

        // 2. Verify / bind signer specifically to cleanAddr
        const userSigner = await browserProvider.getSigner(cleanAddr);
        setSigner(userSigner);
        setAccount(cleanAddr);

        // 3. Re-create contract instance connected to this new signer
        const contractInstance = new ethers.Contract(
          contractInfoFallback.contractAddress,
          contractInfoFallback.abi,
          userSigner
        );
        setContract(contractInstance);

        // 4. Authoritative role check directly from smart contract
        const role = await getRoleFromContract(contractInstance, cleanAddr);
        setUserRole(role);

        // 5. Synchronize session with backend API for this specific wallet
        try {
          const { data: sessionData } = await api.post('/auth/session', {
            walletAddress: cleanAddr,
          });

          if (sessionData && sessionData.token) {
            localStorage.setItem('emr_token', sessionData.token);
            setAuthToken(sessionData.token);
            setUserProfile(sessionData.user);
            if (sessionData.user.role && role === 'none') {
              setUserRole(sessionData.user.role);
            }
          }
        } catch (apiErr) {
          console.warn('Web3Context: Backend session sync warning:', apiErr.message);
          setUserProfile({
            walletAddress: cleanAddr,
            name: role === 'admin' ? 'System Administrator' : `User ${cleanAddr.slice(0, 6)}`,
            role,
            isVerifiedOnChain: role !== 'none',
          });
        }

        // 6. Route user to their corresponding dashboard if requested
        if (shouldRedirect) {
          const currentPath = window.location.pathname;
          let targetPath = '/connect';

          if (role === 'admin') targetPath = '/admin';
          else if (role === 'doctor') targetPath = '/doctor';
          else if (role === 'hospital') targetPath = '/hospital';
          else if (role === 'patient') targetPath = '/patient';
          else if (role === 'none') targetPath = '/register';

          if (
            currentPath === '/connect' ||
            currentPath === '/' ||
            currentPath.startsWith('/admin') ||
            currentPath.startsWith('/doctor') ||
            currentPath.startsWith('/hospital') ||
            currentPath.startsWith('/patient') ||
            currentPath === '/register'
          ) {
            navigateTo(targetPath);
          }
        }

        return cleanAddr;
      } catch (err) {
        console.error('Web3Context: Failed to resolve account:', err);
        return null;
      } finally {
        setIsConnecting(false);
      }
    },
    [navigateTo]
  );

  /**
   * Clear previous wallet session completely
   */
  const logout = useCallback(() => {
    currentAccountRef.current = null;
    localStorage.removeItem('emr_token');
    setAuthToken(null);
    setAccount(null);
    setUserRole(null);
    setUserProfile(null);
    setSigner(null);
    setContract(null);
    navigateTo('/connect');
  }, [navigateTo]);

  /**
   * Switch Network to Hardhat Localhost
   */
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
      setIsWrongNetwork(false);
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: HARDHAT_CHAIN_ID_HEX,
                chainName: 'Hardhat Localhost',
                rpcUrls: [HARDHAT_RPC],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
          setIsWrongNetwork(false);
        } catch (addError) {
          console.error('Failed to add Hardhat network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  /**
   * Connect wallet using eth_requestAccounts
   */
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to use this application.');
      return false;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const network = await browserProvider.getNetwork();
      const isCorrectChain = network.chainId === HARDHAT_CHAIN_ID_DEC || network.chainId === 1337n;
      setIsWrongNetwork(!isCorrectChain);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        setIsConnecting(false);
        return false;
      }

      await resolveAccount(accounts[0], browserProvider, true);
      return true;
    } catch (err) {
      console.error('Web3Context: Failed to connect wallet:', err);
      setIsConnecting(false);
      return false;
    }
  };

  /**
   * Explicit Switch Account modal through wallet_requestPermissions
   */
  const switchAccount = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed.');
      return false;
    }

    try {
      setIsConnecting(true);
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permErr) {
        console.warn('wallet_requestPermissions dismissed or rejected:', permErr.message);
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      if (!accounts || accounts.length === 0) {
        logout();
        return false;
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      await resolveAccount(accounts[0], browserProvider, true);
      return true;
    } catch (err) {
      console.error('Web3Context: Error during switchAccount:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Helper: Wrap contract in a Proxy that dynamically injects the exact on-chain nonce
   * for all state-mutating transactions, ensuring MetaMask cannot submit with a stale cached nonce.
   */
  const wrapContractWithDynamicNonce = (baseContract, nonce, walletAddr) => {
    return new Proxy(baseContract, {
      get(target, prop, receiver) {
        const orig = target[prop];
        if (typeof orig === 'function') {
          const fragment = target.interface?.getFunction(prop);
          // Only mutate state transactions (not view, not pure, not constant)
          if (
            fragment &&
            !fragment.constant &&
            fragment.stateMutability !== 'view' &&
            fragment.stateMutability !== 'pure'
          ) {
            return async function (...args) {
              const lastArg = args[args.length - 1];
              const isOverride =
                lastArg &&
                typeof lastArg === 'object' &&
                !Array.isArray(lastArg) &&
                (
                  'nonce' in lastArg ||
                  'gasLimit' in lastArg ||
                  'value' in lastArg ||
                  'gasPrice' in lastArg ||
                  'maxFeePerGas' in lastArg
                );

              let finalArgs;
              if (isOverride) {
                finalArgs = [...args.slice(0, -1), { nonce, ...lastArg }];
              } else {
                finalArgs = [...args, { nonce }];
              }

              console.log(
                `[Blockchain Tx] Wallet: ${walletAddr} | Contract: ${target.target} | Method: ${prop}() | Assigned Nonce: ${nonce} | Chain ID: 31337`
              );
              return orig.apply(target, finalArgs);
            };
          }
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  };

  /**
   * SAFE TRANSACTION EXECUTOR:
   * - Serializes transactions per wallet via a strict FIFO queue.
   * - Queries live on-chain nonce from Hardhat node (pending block tag).
   * - Injects exact on-chain nonce into the transaction to prevent MetaMask stale cache mismatch.
   * - Awaits block confirmation before clearing the queue.
   * - Intercepts Hardhat restart & nonce desynchronization with actionable modal.
   * - Produces comprehensive non-sensitive audit logs.
   */
  const executeTx = async (txFn, progressCallback) => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed.');
    }

    const activeAccounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!activeAccounts || activeAccounts.length === 0) {
      throw new Error('MetaMask is locked or no account is connected.');
    }

    const currentAddr = activeAccounts[0].toLowerCase();
    const walletKey = currentAddr;

    // Check if network is correct
    if (isWrongNetwork) {
      await switchNetwork();
    }

    // Per-wallet FIFO queue chaining: subsequent transactions wait for prior ones to confirm!
    const previousQueue = walletQueuesRef.current.get(walletKey) || Promise.resolve();

    const currentOperation = (async () => {
      // Wait for any prior transaction from this wallet to complete
      await previousQueue.catch((prevErr) => {
        console.warn(`[TxQueue] Previous transaction for ${walletKey} finished with error:`, prevErr.message);
      });

      // Obtain a fresh browser provider and signer directly bound to current wallet
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const activeSigner = await browserProvider.getSigner(currentAddr);
      setSigner(activeSigner);
      setProvider(browserProvider);

      // Verify contract bytecode is intact
      const isDeployed = await verifyContractDeployment(browserProvider, contractInfoFallback.contractAddress);
      if (!isDeployed) {
        throw new Error(
          `Hardhat restarted: Smart contract not deployed at ${contractInfoFallback.contractAddress}. Please run deployment script.`
        );
      }

      // Check for Hardhat node restart via genesis block hash
      try {
        const genesis = await browserProvider.getBlock(0);
        if (genesis && genesis.hash) {
          if (lastKnownGenesisRef.current && lastKnownGenesisRef.current !== genesis.hash) {
            console.warn('[Web3Context] Hardhat restart detected: Genesis hash changed. Resetting transaction cache.');
            lastKnownNoncesRef.current.clear();
          }
          lastKnownGenesisRef.current = genesis.hash;
        }
      } catch (genErr) {
        // block 0 query warning
      }

      // Query live on-chain nonce for this account
      const onChainNonce = await browserProvider.getTransactionCount(currentAddr, 'pending');
      lastKnownNoncesRef.current.set(walletKey, onChainNonce);

      console.log(`[TxQueue] Preparing tx for ${currentAddr} | Live on-chain nonce: ${onChainNonce}`);

      // Create fresh contract instance bound to fresh signer
      const activeContract = new ethers.Contract(
        contractInfoFallback.contractAddress,
        contractInfoFallback.abi,
        activeSigner
      );

      // Wrap with nonce-injecting proxy
      const safeContract = wrapContractWithDynamicNonce(activeContract, onChainNonce, currentAddr);

      try {
        isTxLockedRef.current = true;
        setIsTxPending(true);
        setTxProgress({ status: 'waiting', message: `Prompting MetaMask for signature (Nonce: ${onChainNonce})...` });
        if (progressCallback) progressCallback(`Waiting for MetaMask signature (Nonce: ${onChainNonce})...`);

        // Execute caller transaction using safe proxy
        const txResult = await txFn(safeContract, activeSigner, browserProvider, { nonce: onChainNonce });

        if (txResult && typeof txResult.wait === 'function') {
          console.log(
            `[TxSubmitted] Wallet: ${currentAddr} | TxHash: ${txResult.hash} | Nonce: ${txResult.nonce ?? onChainNonce} | Waiting for block confirmation...`
          );
          setTxProgress({
            status: 'confirming',
            message: `Tx ${txResult.hash.slice(0, 10)}... submitted. Waiting for confirmation...`,
          });
          if (progressCallback) progressCallback('Waiting for block confirmation on Hardhat node...');

          const receipt = await txResult.wait();
          console.log(
            `[TxConfirmed] Wallet: ${currentAddr} | TxHash: ${receipt.hash} | Block: ${receipt.blockNumber} | Status: SUCCESS`
          );
          setTxProgress({ status: 'success', message: 'Transaction confirmed successfully on blockchain!' });
          if (progressCallback) progressCallback('Transaction confirmed!');
          return receipt;
        }

        setTxProgress({ status: 'success', message: 'Action completed successfully!' });
        return txResult;
      } catch (err) {
        console.error('[Web3Context] executeTx error:', err);
        const errMsg = (err.message || '').toLowerCase();
        const errReason = (err.reason || '').toLowerCase();
        const errDataMsg = (err.data?.message || '').toLowerCase();
        const fullErrStr = `${errMsg} ${errReason} ${errDataMsg}`;

        // 1. Detect Nonce desynchronization error
        if (
          fullErrStr.includes('nonce too high') ||
          fullErrStr.includes('expected nonce') ||
          fullErrStr.includes('nonce') && fullErrStr.includes('automining') ||
          (err.code === -32603 && fullErrStr.includes('nonce'))
        ) {
          const detailMatch = err.data?.message || err.message || '';
          setNonceModalState({
            isOpen: true,
            details: detailMatch || `Nonce too high: Hardhat expected nonce ${onChainNonce}`,
          });

          const friendlyNonceErr = new Error(
            `MetaMask Nonce Desynchronized: Hardhat expected nonce ${onChainNonce}. Please open MetaMask -> Settings -> Advanced -> click "Clear activity tab data" (Reset account).`
          );
          friendlyNonceErr.userFriendly = true;
          setTxProgress({ status: 'error', message: friendlyNonceErr.message });
          throw friendlyNonceErr;
        }

        // 2. Detect Record does not exist
        if (fullErrStr.includes('record does not exist')) {
          const friendlyRecordErr = new Error(
            'Record does not exist on blockchain: This record reference has not been anchored to the smart contract yet.'
          );
          friendlyRecordErr.userFriendly = true;
          setTxProgress({ status: 'error', message: friendlyRecordErr.message });
          throw friendlyRecordErr;
        }

        // 3. Detect User rejection
        if (err.code === 4001 || fullErrStr.includes('user rejected') || fullErrStr.includes('action_rejected')) {
          const cancelErr = new Error('Transaction was cancelled in MetaMask.');
          cancelErr.userFriendly = true;
          setTxProgress({ status: 'error', message: cancelErr.message });
          throw cancelErr;
        }

        setTxProgress({ status: 'error', message: err.reason || err.message || 'Transaction failed.' });
        throw err;
      } finally {
        isTxLockedRef.current = false;
        setIsTxPending(false);
      }
    })();

    walletQueuesRef.current.set(walletKey, currentOperation);
    return await currentOperation;
  };

  /**
   * Helper: Ensure a medical record exists on the smart contract before granting/revoking access.
   * If it doesn't exist on-chain yet, anchors it automatically through executeTx!
   */
  const ensureRecordAnchored = async (recordId, fallbackFileHash, fallbackCategory) => {
    if (!recordId) return false;
    try {
      if (contract) {
        try {
          const rec = await contract.getRecord(recordId);
          if (rec && rec.exists) {
            return true;
          }
        } catch (readErr) {
          console.warn(`[Web3Context] getRecord check for ${recordId}:`, readErr.message);
        }
      }

      console.log(`[Web3Context] Record ${recordId} not found on-chain. Anchoring via TxQueue...`);
      const hash = fallbackFileHash || ethers.keccak256(ethers.toUtf8Bytes(recordId));
      const cat = fallbackCategory || 'General Record';

      // Anchor through executeTx so it joins the queue and gets live on-chain nonce!
      await executeTx(async (safeContract) => {
        return await safeContract.addRecord(recordId, hash, cat);
      });
      console.log(`[Web3Context] Record ${recordId} anchored successfully on-chain!`);
      return true;
    } catch (e) {
      console.warn(`[Web3Context] Auto-anchor check error for ${recordId}:`, e.message);
      return false;
    }
  };

  /**
   * Refresh current user profile from backend
   */
  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('emr_token');
      if (!token) return;
      const { data } = await api.get('/auth/me');
      if (data && data.user) {
        if (
          !currentAccountRef.current ||
          data.user.walletAddress.toLowerCase() === currentAccountRef.current.toLowerCase()
        ) {
          setUserProfile(data.user);
          if (data.user.role) {
            setUserRole(data.user.role);
          }
        }
      }
    } catch (err) {
      console.warn('Web3Context: Could not fetch /auth/me:', err.message);
    }
  };

  /**
   * Initialize provider on startup and wire up MetaMask EIP-1193 event listeners
   */
  useEffect(() => {
    let isMounted = true;

    const initOnLoad = async () => {
      if (!window.ethereum) return;

      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        if (!isMounted) return;
        setProvider(browserProvider);

        const network = await browserProvider.getNetwork();
        if (!isMounted) return;
        setIsWrongNetwork(network.chainId !== HARDHAT_CHAIN_ID_DEC && network.chainId !== 1337n);

        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0 && isMounted) {
          await resolveAccount(accounts[0], browserProvider, false);
        }
      } catch (err) {
        console.warn('Web3Context: Error initializing web3 on mount:', err.message);
      }
    };

    initOnLoad();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        console.log('Web3Context: accountsChanged event detected:', accounts);

        if (!accounts || accounts.length === 0) {
          logout();
          return;
        }

        const newAccount = accounts[0].toLowerCase();

        if (newAccount !== currentAccountRef.current) {
          console.log(`Web3Context: Switching active wallet: ${currentAccountRef.current} -> ${newAccount}`);
          currentAccountRef.current = newAccount;

          localStorage.removeItem('emr_token');
          setAuthToken(null);
          setUserProfile(null);
          setUserRole(null);

          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(browserProvider);

          await resolveAccount(newAccount, browserProvider, true);
        }
      };

      const handleChainChanged = (chainId) => {
        console.log('Web3Context: chainChanged event detected:', chainId);
        const isLocal = chainId === HARDHAT_CHAIN_ID_HEX || Number(chainId) === 31337 || Number(chainId) === 1337;
        setIsWrongNetwork(!isLocal);
        initOnLoad();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        isMounted = false;
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [resolveAccount, logout]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        contract,
        userRole,
        setUserRole,
        userProfile,
        setUserProfile,
        isConnecting,
        isWrongNetwork,
        contractNotDeployed,
        authToken,
        isTxPending,
        txProgress,
        connectWallet,
        switchAccount,
        switchNetwork,
        executeTx,
        ensureRecordAnchored,
        logout,
        fetchMe,
        contractAddress: contractInfoFallback.contractAddress,
        openNonceModal: (details) => setNonceModalState({ isOpen: true, details }),
        closeNonceModal: () => setNonceModalState({ isOpen: false, details: '' }),
      }}
    >
      {children}
      <NonceAlertModal
        isOpen={nonceModalState.isOpen}
        details={nonceModalState.details}
        onClose={() => setNonceModalState({ isOpen: false, details: '' })}
      />
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
