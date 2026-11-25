import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import api from '../services/api';
import contractInfoFallback from '../contracts/contractInfo.json';

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
  const [authToken, setAuthToken] = useState(localStorage.getItem('emr_token'));

  // Ref to track current account and prevent race conditions or stale closures
  const currentAccountRef = useRef(null);
  const isSwitchingRef = useRef(false);

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
   * Map role enum index from Solidity contract to string
   * Enum Role: 0: NONE, 1: PATIENT, 2: DOCTOR, 3: HOSPITAL, 4: ADMIN
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
        // contract may not be deployed yet or admin call failed
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

        // 1. Verify / bind signer specifically to cleanAddr
        const userSigner = await browserProvider.getSigner(cleanAddr);
        setSigner(userSigner);
        setAccount(cleanAddr);

        // 2. Re-create contract instance connected to this new signer
        const contractInstance = new ethers.Contract(
          contractInfoFallback.contractAddress,
          contractInfoFallback.abi,
          userSigner
        );
        setContract(contractInstance);

        // 3. Authoritative role check directly from smart contract
        const role = await getRoleFromContract(contractInstance, cleanAddr);
        setUserRole(role);

        // 4. Synchronize session with backend API for this specific wallet
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
          // Fallback user profile if backend is not responsive
          setUserProfile({
            walletAddress: cleanAddr,
            name: role === 'admin' ? 'System Administrator' : `User ${cleanAddr.slice(0, 6)}`,
            role,
            isVerifiedOnChain: role !== 'none',
          });
        }

        // 5. Route user to their corresponding dashboard if requested
        if (shouldRedirect) {
          const currentPath = window.location.pathname;
          let targetPath = '/connect';

          if (role === 'admin') targetPath = '/admin';
          else if (role === 'doctor') targetPath = '/doctor';
          else if (role === 'hospital') targetPath = '/hospital';
          else if (role === 'patient') targetPath = '/patient';
          else if (role === 'none') targetPath = '/register';

          // If currently on /connect or any dashboard path, navigate to targetPath
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

      // Verify chain
      const network = await browserProvider.getNetwork();
      const isCorrectChain = network.chainId === HARDHAT_CHAIN_ID_DEC || network.chainId === 1337n;
      setIsWrongNetwork(!isCorrectChain);

      // Request accounts through EIP-1193
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
   * Forces MetaMask to show the account picker so the user can select Account #0, #1, #2, #3
   */
  const switchAccount = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed.');
      return false;
    }

    try {
      setIsConnecting(true);

      // Request permission prompt to select/switch active account
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (permErr) {
        console.warn('wallet_requestPermissions dismissed or rejected:', permErr.message);
      }

      // Query the currently active account after switch
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
   * Refresh current user profile from backend
   */
  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('emr_token');
      if (!token) return;
      const { data } = await api.get('/auth/me');
      if (data && data.user) {
        // Only set profile if it matches currently selected account
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

        // Check if MetaMask already has authorized accounts
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0 && isMounted) {
          await resolveAccount(accounts[0], browserProvider, false);
        }
      } catch (err) {
        console.warn('Web3Context: Error initializing web3 on mount:', err.message);
      }
    };

    initOnLoad();

    // MetaMask Event Listeners
    if (window.ethereum) {
      // 1. Listen for Account Changes in MetaMask
      const handleAccountsChanged = async (accounts) => {
        console.log('Web3Context: accountsChanged event detected:', accounts);

        if (!accounts || accounts.length === 0) {
          // User locked MetaMask or disconnected all accounts
          logout();
          return;
        }

        const newAccount = accounts[0].toLowerCase();

        // If the account is indeed different
        if (newAccount !== currentAccountRef.current) {
          console.log(`Web3Context: Switching active wallet: ${currentAccountRef.current} -> ${newAccount}`);
          currentAccountRef.current = newAccount;

          // Clear previous user's credentials immediately
          localStorage.removeItem('emr_token');
          setAuthToken(null);
          setUserProfile(null);
          setUserRole(null);

          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(browserProvider);

          // Resolve new account and immediately redirect to its role dashboard
          await resolveAccount(newAccount, browserProvider, true);
        }
      };

      // 2. Listen for Chain Changes in MetaMask
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
        authToken,
        connectWallet,
        switchAccount,
        switchNetwork,
        logout,
        fetchMe,
        contractAddress: contractInfoFallback.contractAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
