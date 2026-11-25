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
   * SAFE TRANSACTION EXECUTOR:
   * - Prevents duplicate concurrent transaction calls (mutex lock).
   * - Checks network and contract existence.
   * - Intercepts MetaMask Nonce too high / Nonce mismatch errors and surfaces solution.
   * - Intercepts "Record does not exist" and user rejection.
   */
  const executeTx = async (txFn, progressCallback) => {
    if (isTxLockedRef.current) {
      const lockError = new Error('Another transaction is currently in progress. Please wait for it to complete.');
      lockError.userFriendly = true;
      throw lockError;
    }

    if (!contract || !signer || !account) {
      throw new Error('Wallet or smart contract not initialized. Please connect your MetaMask wallet.');
    }

    if (isWrongNetwork) {
      await switchNetwork();
    }

    try {
      isTxLockedRef.current = true;
      setIsTxPending(true);
      setTxProgress({ status: 'waiting', message: 'Prompting MetaMask for signature...' });
      if (progressCallback) progressCallback('Waiting for MetaMask signature...');

      const txResult = await txFn(contract, signer, provider);

      if (txResult && typeof txResult.wait === 'function') {
        setTxProgress({ status: 'confirming', message: 'Transaction submitted. Waiting for block confirmation...' });
        if (progressCallback) progressCallback('Waiting for block confirmation on Hardhat node...');

        const receipt = await txResult.wait();
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
        err.code === -32603 && fullErrStr.includes('nonce')
      ) {
        const errorDetail = err.data?.message || err.message || 'Nonce too high. Expected nonce to be 1 but got 3.';
        setNonceModalState({ isOpen: true, details: errorDetail });
        const friendlyNonceErr = new Error(
          'MetaMask Nonce Desynchronized: Local blockchain restarted. Please open MetaMask -> Settings -> Advanced -> click "Clear activity tab data" (Reset account).'
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
  };

  /**
   * Helper: Ensure a medical record exists on the smart contract before granting/revoking access.
   * If it doesn't exist on-chain yet, anchors it automatically using contract.addRecord!
   */
  const ensureRecordAnchored = async (recordId, fallbackFileHash, fallbackCategory) => {
    if (!contract || !recordId) return false;
    try {
      const rec = await contract.getRecord(recordId);
      if (rec && rec.exists) {
        return true;
      }

      console.log(`[Web3Context] Auto-anchoring record ${recordId} to blockchain...`);
      const hash = fallbackFileHash || ethers.keccak256(ethers.toUtf8Bytes(recordId));
      const cat = fallbackCategory || 'General Record';
      const tx = await contract.addRecord(recordId, hash, cat);
      await tx.wait();
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
