import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";

const contractAddress = "0x7A4C3e1Cc3b7F70E2f7BeF4bf343270c17643544";

function App() {
 const [text, setText] = useState(""); // Input for new message
 const [currentMessage, setCurrentMessage] = useState(""); // Current message from contract
 const [error, setError] = useState(""); // Error messages
 const [isLoading, setIsLoading] = useState(false); // Loading state for transactions
 const [isConnected, setIsConnected] = useState(false); // Wallet connection status

 // Connect wallet and switch to Lisk Sepolia
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

 // Fetch current message from contract
 const getMessage = async () => {
 try {
 if (!window.ethereum) {
 setError("MetaMask not found.");
 return;
 }

 setIsLoading(true);
 setError("");

 const provider = new ethers.BrowserProvider(window.ethereum);
 const contract = new ethers.Contract(contractAddress, abi, provider);
 const message = await contract.getMessage();
 setCurrentMessage(message || "No message set");
 setError("");
 } catch (err) {
 setError(err.message || "Failed to fetch message from contract.");
 } finally {
 setIsLoading(false);
 }
 };

 // Set new message on contract
 const handleSet = async () => {
 try {
 if (!text) {
 setError("Please enter a message before setting.");
 return;
 }

 if (!window.ethereum) {
 setError("MetaMask not found.");
 return;
 }

 setIsLoading(true);
 setError("");

 await window.ethereum.request({ method: "eth_requestAccounts" }); // Prompt MetaMask
 const provider = new ethers.BrowserProvider(window.ethereum);
 const signer = await provider.getSigner();
 const contract = new ethers.Contract(contractAddress, abi, signer);

 const tx = await contract.setMessage(text);
 await tx.wait();

 setText(""); // Clear input
 await getMessage(); // Update state with new message
 } catch (err) {
 setError(err.message || "Failed to set message.");
 } finally {
 setIsLoading(false);
 }
 };

 // Initial wallet connection check
 useEffect(() => {
 if (window.ethereum) {
 connectWallet();
 }
 }, []);

 return (
 <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
 <h1 className="text-3xl font-bold text-center text-indigo-800 mb-6">
 Greeter DApp
 </h1>

 {/* Connection Status */}
 {!isConnected ? (
 <button
 onClick={connectWallet}
 className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition mb-6 font-semibold"
 >
 Connect MetaMask
 </button>
 ) : (
 <div className="text-green-600 text-center mb-6 font-medium">
 Connected to Lisk Sepolia
 </div>
 )}

 {/* Current Message */}
 <div className="mb-6">
 <label className="block text-gray-700 font-semibold mb-2">
 Current Message:
 </label>
 <div className="p-4 bg-gray-50 rounded-lg text-gray-800 border border-gray-200">
 {currentMessage || "No message set"}
 </div>
 </div>

 {/* Input Field */}
 <div className="mb-6">
 <label className="block text-gray-700 font-semibold mb-2">
 Set New Message:
 </label>
 <input
 type="text"
 placeholder="Enter your message"
 value={text}
 onChange={(e) => setText(e.target.value)}
 className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200"
 disabled={!isConnected || isLoading}
 />
 </div>

 {/* Action Buttons */}
 <div className="flex gap-4">
 <button
 onClick={handleSet}
 disabled={!isConnected || isLoading}
 className={`flex-1 py-3 rounded-lg text-white font-semibold transition ${
 isConnected && !isLoading
 ? "bg-indigo-600 hover:bg-indigo-700"
 : "bg-gray-400 cursor-not-allowed"
 }`}
 >
 {isLoading ? "Processing..." : "Set Message"}
 </button>
 <button
 onClick={getMessage}
 disabled={!isConnected || isLoading}
 className={`flex-1 py-3 rounded-lg text-white font-semibold transition ${
 isConnected && !isLoading
 ? "bg-teal-600 hover:bg-teal-700"
 : "bg-gray-400 cursor-not-allowed"
 }`}
 >
 Get Message
 </button>
 </div>

 {/* Error Message */}
 {error && (
 <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-200">
 {error}
 </div>
 )}
 </div>
 </div>
 );
}

export default App;