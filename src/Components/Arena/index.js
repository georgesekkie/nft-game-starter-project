import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';
import LoadingIndicator from '../../Components/LoadingIndicator';


// フロントエンドにNFTキャラクターを表示するため、characterNFTのメタデータを渡します。
const Arena = ({ characterNFT, setCharacterNFT }) => {
  // コントラクトのデータを保有する状態変数を初期化します。
  const [gameContract, setGameContract] = useState(null);
  
  // ボスのメタデータを保存する状態変数を初期化します。
  const [boss, setBoss] = useState(null);

  // 攻撃の状態を保存する変数を初期化します。
  const [attackState, setAttackState] = useState('');

  // 回復する状態を保存する変数を初期化します。
  const [restoreState, setRestoreState] = useState('');

  const [showToast, setShowToast] = useState(false);


  // ボスへ攻撃する関数を設定します。
  const runAttackAction = async () => {
    try {
    // コントラクトが呼び出されたことを確認します。
      if (gameContract) {
        // attackState の状態を attacking に設定します。
        setAttackState('attacking');
        console.log('Attacking boss...');

        // NFT キャラクターがボスを攻撃します。
        const attackTxn = await gameContract.attackBoss();

        // トランザクションがマイニングされるまで待ちます。
        await attackTxn.wait();
        console.log('attackTxn:', attackTxn);

        // attackState の状態を hit に設定します。
        setAttackState('hit');

        // 攻撃ダメージの表示をtrueに設定し（表示）、5秒後にfalseに設定する（非表示）
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
      setAttackState('');
    }
  };

  // プレイヤーを回復させる関数を設定
  const runKizugusuri = async () => {
    try {
    // コントラクトが呼び出されたことを確認します。
      if (gameContract) {
        setRestoreState('restoring');
        console.log('Using Kizugusuri...');

        const kizugusuriTxn = await gameContract.kizuGusuri();

        // トランザクションがマイニングされるまで待ちます。
        await kizugusuriTxn.wait();
        console.log('kizugusuriTxn:', kizugusuriTxn);
        setRestoreState('restored');
      }
    } catch (error) {
      console.error('Error using kizugusuri:', error);
    }
  };

  // ページがロードされると下記が実行されます。
  useEffect(() => {
    // コントラクトからボスのメタデータを取得し、bossを設定する非同期関数 fetchBoss を設定します。
    const fetchBoss = async () => {
      //ボスのメタデータをコントラクトをから呼び出します。
      const bossTxn = await gameContract.getBigBoss();
      console.log('Boss:', bossTxn);
      // ボスの状態を設定します。
      setBoss(transformCharacterData(bossTxn));
    };

    // AttackCompleteイベントを受信したときに起動するコールバックメソッドを追加します。
    const onAttackComplete = (newBossHp, newPlayerHp) => {
      // ボスの新しいHPを取得します。
      const bossHp = newBossHp.toNumber();
      // NFT キャラクターの新しいHPを取得します。
      const playerHp = newPlayerHp.toNumber();
      console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

      // NFT キャラクターとボスのHPを更新します。
      setBoss((prevState) => {
        return { ...prevState, hp: bossHp };
      });
      setCharacterNFT((prevState) => {
        return { ...prevState, hp: playerHp };
      });
    };
    // コントラクトが呼び出されていたら、下記を実行します。
    if (gameContract) {
      fetchBoss();
      // リスナーの設定：ボスが攻撃された通知を受け取ります。
      gameContract.on('AttackComplete', onAttackComplete);
    }

    // コンポーネントがマウントされたら、リスナーを停止する。
    return () => {
      if (gameContract) {
        gameContract.off('AttackComplete', onAttackComplete);
      }
    }
  }, [gameContract]);

  // ページがロードされると下記が実行されます。
  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
      setGameContract(gameContract);
    } else {
      console.log('Ethereum object not found');
    }
  }, []);
  return (
    <div className="arena-container">
      {/* 攻撃ダメージの通知を追加します */}
      {boss && characterNFT && (
        <div id="toast" className={showToast ? 'show' : ''}>
          <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
        </div>
      )}
      {/* ボスをレンダリングします */}
      {boss && (
        <div className="boss-container">
          <h2>Boss</h2>
          <div className={`boss-content  ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className="image-content">
              <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
              <div className="health-bar">
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* NFT キャラクター をレンダリングします*/}
      {characterNFT && (
        <div className="players-container">
          <div className="player-container">
            <h2>Your Monster</h2>
            <div className="player">
              <div className="image-content">
                <h2>{characterNFT.name}</h2>
                <img
                  src={characterNFT.imageURI}
                  alt={'Character ${characterNFT.name}'}
                />
                <div className="health-bar">
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className="stats">
                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
              </div>
            </div>
          </div>
          {/* <div className="active-players">
            <h2>Active Players</h2>
            <div className="players-list">{renderActivePlayersList()}</div>
          </div> */}
        </div>
      )}
      {boss && (
        <div className="boss-container">
          {attackState === 'attacking' && (
            <div className="loading-indicator">
              <LoadingIndicator />
              <p>Attacking ⚔️</p>
            </div>
          )}
          <div className="attack-container">
            <button className="cta-button" onClick={runAttackAction}>
              {`💥 Attack to ${boss.name}`}
            </button>
          </div>
          {restoreState === 'restoring' && (
            <div className="loading-indicator">
              <LoadingIndicator />
              <p>Recovering 💊</p>
            </div>
          )}
          <div className="kizugusuri-container">
            <button className="cta-button" onClick={runKizugusuri}>
              {`💊 Use Kizugusuri(+20)`}

            </button>
          </div>
          
        </div>
      )}
    </div>
  );
};
export default Arena;