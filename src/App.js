import Arena from './Components/Arena';
import myEpicGame from './utils/MyEpicGame.json';
import React, { useEffect, useState } from "react";
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import SelectCharacter from './Components/SelectCharacter';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import LoadingIndicator from './Components/LoadingIndicator';

// Constants
const TWITTER_HANDLE = 'georgesekkie';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
  const [currentAccount, setCurrentAccount] = useState(null);
  const [characterNFT, setCharacterNFT] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  const checkNetwork = async () => {
    try {
      if (window.ethereum.networkVersion !== '4') {
      alert("Rinkeby Test Network に接続してください!")
      } else {
      console.log("Rinkeby に接続されています.")
      }
    } catch(error) {
      console.log(error)
    }
  }
  
  // ユーザーがMetaMaskを持っているか確認します。
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log('Make sure you have MetaMask!');
        setIsLoading(false);
        return;
      } else {
        console.log('We have the ethereum object', ethereum);
        // accountsにWEBサイトを訪れたユーザーのウォレットアカウントを格納します。
        // （複数持っている場合も加味、よって account's' と変数を定義している）
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        // もしアカウントが一つでも存在したら、以下を実行。
        if (accounts.length !== 0) {
          // accountという変数にユーザーの1つ目（=Javascriptでいう0番目）のアドレスを格納
          const account = accounts[0];
          console.log('Found an authorized account:', account);
          // currentAccountにユーザーのアカウントアドレスを格納
          setCurrentAccount(account);
          
        } else {
          console.log('No authorized account found');
        }
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    // シナリオ1.
    // ユーザーがWEBアプリにログインしていない場合、WEBアプリ上に、"Connect Wallet to Get Started" ボタンを表示します。
    if (!currentAccount) {
      return (
        <div className="connect-wallet-container">
          <img
              src="https://i.imgur.com/yMocj5x.png"
              alt="Pickachu"
          />
          <button
            className="cta-button connect-wallet-button"
            onClick={connectWalletAction}
          >
            Connect Wallet to Get Started
          </button>
        </div>
      );
      // シナリオ2.
    // ユーザーはWEBアプリにログインしており、かつ NFT キャラクターを持っていない場合、WEBアプリ上に、を表示します。
    } else if (currentAccount && !characterNFT) {
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
    // シナリオ3.
    // WEBアプリにログインしており、かつ NFT キャラクターを持っている場合、
    // Area でボスと戦います。
    } else if (currentAccount && characterNFT) {
      return <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />;
    }
  };

  // connectWallet メソッドを実装します。
  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      // ユーザーがウォレットを持っているか確認します。
      checkIfWalletIsConnected();
      
      // ウォレットアドレスに対してアクセスをリクエストしています。
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      // ウォレットアドレスを currentAccount に紐付けます。
      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);

      // ユーザーが Rinkeby に接続されているか確認します。
      checkNetwork();
    } catch (error) {
      console.log(error);
    }
  };

  // ページがロードされたときに useEffect()内の関数が呼び出されます。
  useEffect(() => {
      setIsLoading(true);
      checkIfWalletIsConnected();
  }, []);
  
  useEffect(() => {
    // スマートコントラクトを呼び出す関数です。
    const fetchNFTMetadata = async () => {
      console.log('Checking for Character NFT on address:', currentAccount);
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
  
      const txn = await gameContract.checkIfUserHasNFT();
      if (txn.name) {
        console.log('User has character NFT');
        setCharacterNFT(transformCharacterData(txn));
      } else {
        console.log('No character NFT found');
      }
      // ユーザーが保持しているNFTの確認が完了したら、ロード状態を false に設定します。
	    setIsLoading(false);
    };
  
    // 接続されたウォレットがある場合のみ、下記を実行します。
    if (currentAccount) {
      console.log('CurrentAccount:', currentAccount);
      fetchNFTMetadata();
    }
  }, [currentAccount]);
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚡️ Blockchain Buttle Game ⚡️</p>
          <p className="sub-text">Let's do lots of Mints and defeat the bosses!🔥</p>
          {/* renderContent メソッドを呼び出します。*/}
          {renderContent()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
