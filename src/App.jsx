import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi/Greeter.json";

const contractAddress = "0x7A4C3e1Cc3b7F70E2f7BeF4bf343270c17643544";

function App() {
  const [text, setText] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check wallet connection and switch to Lisk Sepolia
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask not found. Please install MetaMask.");
        return;
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const liskSepoliaChainId = "0x106a"; // 4202 in hex

      if (network.chainId !== BigInt(4202)) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: liskSepoliaChainId }],
          });
        } catch (switchError) {
          // If chain is not added, add Lisk Sepolia
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: liskSepoliaChainId,
                  chainName: "Lisk Sepolia Testnet",
                  rpcUrls: ["https://rpc.sepolia-api.lisk.com"],
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia-blockscout.lisk.com"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      setIsConnected(true);
      await getMessage(); // Fetch initial message on connect
    } catch (err) {
      setError(err.message || "Failed to connect to wallet.");
    }
  };

  // Get the current message from the contract
  const getMessage = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask not found.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const message = await contract.getMessage();
      setCurrentMessage(message);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to fetch message from contract.");
    }
  };

  // Set a new message on the contract
  const handleSet = async () => {
    try {
      if (!text) {
        setError("Please enter a message before setting.");
        return;
      }

      setIsLoading(true);
      setError("");

      if (!window.ethereum) {
        setError("MetaMask not found.");
        setIsLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const tx = await contract.setMessage(text);
      await tx.wait();

      setText(""); // Clear input
      await getMessage(); // Refresh displayed message
    } catch (err) {
      setError(err.message || "Failed to set message.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch message on component mount
  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Greeter Smart Contract
        </h1>

        {/* Connection Status */}
        {!isConnected ? (
          <button
            onClick={connectWallet}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition mb-4"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-green-600 text-center mb-4">
            Connected to Lisk Sepolia
          </div>
        )}

        {/* Current Message */}
        <div className="mb-4">
          <label className="block text-gray-600 font-semibold mb-2">
            Current Message:
          </label>
          <div className="p-3 bg-gray-100 rounded-lg text-gray-800">
            {currentMessage || "No message set"}
          </div>
        </div>

        {/* Set Message Input */}
        <div className="mb-4">
          <label className="block text-gray-600 font-semibold mb-2">
            Set New Message:
          </label>
          <input
            type="text"
            placeholder="Enter new message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={!isConnected || isLoading}
          />
        </div>

        {/* Set Message Button */}
        <button
          onClick={handleSet}
          disabled={!isConnected || isLoading}
          className={`w-full py-2 rounded-lg text-white transition ${
            isConnected && !isLoading
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Processing..." : "Set Message"}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;