import { useState } from 'react'
import { ethers } from 'ethers'
import { erc20Abi } from './abi/erc20Abi'

// 这里换成你部署后的 ERC20 合约地址
const CONTRACT_ADDRESS = '0x67d1e772936F199D1776AFfC8C17cF6596EE076a'

export default function ERC20Page() {
  const [account, setAccount] = useState('')
  const [symbol, setSymbol] = useState('')
  const [balance, setBalance] = useState('')
  const [mintAmount, setMintAmount] = useState('100')
  const [status, setStatus] = useState('')

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus('没有检测到 MetaMask')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const userAddress = accounts[0]

      setAccount(userAddress)
      setStatus('钱包连接成功')

      await loadTokenData(userAddress, provider)
    } catch (error) {
      console.error(error)
      setStatus('连接钱包失败')
    }
  }

  async function loadTokenData(userAddress, providerParam) {
    try {
      const provider = providerParam || new ethers.BrowserProvider(window.ethereum)

      const contract = new ethers.Contract(CONTRACT_ADDRESS, erc20Abi, provider)

      const [tokenSymbol, tokenDecimals, rawBalance] = await Promise.all([
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(userAddress),
      ])

      const formattedBalance = ethers.formatUnits(rawBalance, tokenDecimals)

      setSymbol(tokenSymbol)
      setBalance(formattedBalance)
    } catch (error) {
      console.error(error)
      setStatus('读取代币信息失败')
    }
  }

  async function handleMint() {
    try {
      if (!window.ethereum) {
        setStatus('没有检测到 MetaMask')
        return
      }

      if (!account) {
        setStatus('请先连接钱包')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const contract = new ethers.Contract(CONTRACT_ADDRESS, erc20Abi, signer)

      const decimals = await contract.decimals()
      const amount = ethers.parseUnits(mintAmount, decimals)

      const tx = await contract.mint(amount)
      setStatus('交易已发送，等待链上确认...')
      await tx.wait()

      setStatus('Mint 成功')
      await loadTokenData(account, provider)
    } catch (error) {
      console.error(error)
      setStatus('Mint 失败，检查网络、地址或合约权限')
    }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', fontFamily: 'Arial' }}>
      <h1>ERC20 React DApp</h1>

      <button onClick={connectWallet}>连接 MetaMask</button>

      <div style={{ marginTop: '20px', lineHeight: '1.8' }}>
        <div>
          <strong>当前账户：</strong>
          {account || '未连接'}
        </div>
        <div>
          <strong>代币符号：</strong>
          {symbol || '-'}
        </div>
        <div>
          <strong>余额：</strong>
          {balance ? `${balance} ${symbol}` : '-'}
        </div>
      </div>

      <hr style={{ margin: '24px 0' }} />

      <h2>Mint Token</h2>
      <input
        value={mintAmount}
        onChange={(e) => setMintAmount(e.target.value)}
        placeholder="输入 mint 数量"
      />
      <button onClick={handleMint} style={{ marginLeft: '10px' }}>
        Mint
      </button>

      <div style={{ marginTop: '24px', color: 'blue' }}>
        <strong>状态：</strong>
        {status}
      </div>
    </div>
  )
}
