# Web Jitter RNG

**Web Jitter RNG** is a browser-based True Random Number Generator (TRNG) that harvests entropy from CPU execution time jitter. It provides a way to generate cryptographically strong random bytes purely in software by exploiting the inherent non-determinism of hardware and OS scheduling in a JavaScript environment.

**Web Jitter RNG** は、CPUの実行時間ジッター（ゆらぎ）からエントロピーを収集するブラウザベースの真性乱数生成器 (TRNG) です。JavaScript環境におけるハードウェアやOSスケジューリングの固有の非決定性を利用することで、ソフトウェアのみで暗号学的に強固な乱数を生成することを目指しています。

> [!WARNING]
> **This is a Proof of Concept (PoC). NOT a certified CSPRNG.**
> Do not use this for high-stakes cryptographic key generation or production security systems. For standard web cryptography, please use `window.crypto.getRandomValues()`.
>
> **これは概念実証 (PoC) であり、認証された CSPRNG ではありません。**
> 本番環境での重要な暗号鍵生成やセキュリティシステムには使用しないでください。標準的な用途には `window.crypto.getRandomValues()` を推奨します。

---

## 🌍 Language / 言語

- [English](#english)
- [日本語](#japanese)

---

<a name="english"></a>
## 🇬🇧 English

### Features
- **True Randomness Source**: Uses CPU jitter (micro-timing variations) as the source of entropy.
- **Hybrid Security**: Combines raw jitter entropy with SHA-256 hashing (Conditioning) to produce high-quality random output.
- **Non-Blocking**: Implements asynchronous chunking to collect samples without freezing the main thread/UI.
- **Configurable**: Adjustable CPU workload implementation and sampling parameters.

### 🛡️ Security & Usage Guidelines (Important)

- **Supplementary Use Only**: This library is designed to provide *additional* entropy on top of standard CSPRNGs. It should not be used as the sole source of randomness for sensitive cryptographic operations.
- **Timer Resolution Risks**: Browser `performance.now()` resolution is often reduced (coarsened) or jittered by the browser to prevent side-channel attacks. This implementation attempts to mitigate this with heavy CPU loops, but the entropy quality is highly dependent on the browser and OS environment.
- **Recommended Usage**: Always mix the output of this library with `window.crypto.getRandomValues()` (e.g., via XOR) to ensure defense-in-depth.

### Project Structure (Monorepo)
This project is a monorepo managed by NPM Workspaces.

- **`packages/web-jitter-rng`**: The core library.
- **`apps/demo`**: A visualization and testing application.

### Installation & Usage
(Assuming usage from `packages/web-jitter-rng`)

```typescript
import { getJitterRandom, collectJitterBytes } from 'web-jitter-rng';

// 1. Get conditioned random bytes (SHA-256 hashed)
// Recommended for most use cases needing high quality randomness.
const secureBytes = await getJitterRandom(32); 
console.log(secureBytes);

// 2. Get raw jitter bytes (Unconditioned)
// Useful for analyzing the raw entropy source.
const rawEntropy = await collectJitterBytes(32);
```

### Development

#### Prerequisites
- Node.js (v18+)
- NPM

#### Commands
Run these commands from the root directory:

- **Start Demo App**:
  ```bash
  npm run dev
  ```
  Runs the demo app at `http://localhost:5173`.

- **Run Tests**:
  ```bash
  npm run test
  ```
  Runs the Vitest suite for the library.

- **Run Quality Tests**:
  ```bash
  npm run quality-test
  ```
  Runs the rigorous statistical quality test using the [randomness](https://www.npmjs.com/package/randomness) package.
  > [!NOTE]
  > This generates >1,000,000 bits of entropy and runs NIST-based tests. It takes longer than unit tests.

- **Run Raw Mode Quality Tests (Unconditioned)**:
  ```bash
  npm run quality-test:raw
  # OR
  npm run quality-test -- --raw
  ```
  Runs the tests against the **raw jitter** source (without SHA-256 conditioning).
  > [!WARNING]
  > Failures in Monobit/Frequency tests are **expected** in this mode due to inherent bias in the raw source. This mode is for validating that entropy collection is working, not for cryptographic statistical pass.

---

<a name="japanese"></a>
## 🇯🇵 日本語

### 特徴
- **真性乱数ソース**: CPUジッター（微細なタイミングの変動）をエントロピー源として使用します。
- **ハイブリッドセキュリティ**: 生のジッターエントロピーをSHA-256ハッシュ関数で圧縮（コンディショニング）し、高品質な乱数を生成します。
- **ノンブロッキング**: メインスレッドやUIをフリーズさせないよう、非同期で分割してサンプリングを行います。
- **設定可能**: CPU負荷の強度やサンプリングパラメータを調整可能です。

### 🛡️ セキュリティと利用ガイドライン (重要)

- **補助的な利用を推奨**: 本ライブラリは、標準的な CSPRNG に対する「追加のエントロピー源」として提供されています。機密性の高い暗号操作において、単独の乱数源として使用することはお勧めしません。
- **タイマー分解能のリスク**: ブラウザの `performance.now()` は、サイドチャネル攻撃対策として分解能が低下（粗粒化）されたり、人工的なノイズが付与されたりする場合があります。本実装は CPU 高負荷ループによって緩和を試みていますが、エントロピーの質はブラウザや OS 環境に強く依存します。
- **推奨される使用法**: 防層防御の観点から、常に `window.crypto.getRandomValues()` の出力と（XORなどで）混合して使用することを強く推奨します。

### プロジェクト構成 (モノレポ)
このプロジェクトは NPM Workspaces を用いたモノレポ構成です。

- **`packages/web-jitter-rng`**: コアライブラリ本体。
- **`apps/demo`**: 動作確認と可視化のためのデモアプリケーション。

### インストールと使い方
(`packages/web-jitter-rng` を利用する場合)

```typescript
import { getJitterRandom, collectJitterBytes } from 'web-jitter-rng';

// 1. コンディショニング済み乱数の取得 (SHA-256ハッシュ化)
// 高品質な乱数が必要なほとんどのケースで推奨されます。
const secureBytes = await getJitterRandom(32); 
console.log(secureBytes);

// 2. 生のジッターバイトの取得 (非圧縮)
// 生のエントロピー源を解析したい場合に利用します。
const rawEntropy = await collectJitterBytes(32);
```

### 開発

#### 必要要件
- Node.js (v18以上)
- NPM

#### コマンド
ルートディレクトリで以下のコマンドを実行してください：

- **デモアプリの起動**:
  ```bash
  npm run dev
  ```
  `http://localhost:5173` でデモアプリが起動します。

- **テストの実行**:
  ```bash
  npm run test
  ```
  ライブラリの Vitest テストスイートを実行します。

- **品質テストの実行**:
  ```bash
  npm run quality-test
  ```
  [randomness](https://www.npmjs.com/package/randomness) パッケージを使用した、厳密な統計的品質テストを実行します。
  > [!NOTE]
  > 100万ビット以上のエントロピーを生成し、NISTベースの検定を行います。通常のユニットテストよりも時間がかかります。

- **品質テスト（生データモード）の実行**:
  ```bash
  npm run quality-test:raw
  # または
  npm run quality-test -- --raw
  ```
  SHA-256によるコンディショニングを行わない、**生のジッターソース**に対して検定を行います。
  > [!WARNING]
  > このモードでは、生のソースに含まれるバイアスにより、MonobitテストやFrequencyテストが**失敗することが期待されます**。これは暗号学的な合格を目指すものではなく、エントロピー収集が機能していることを確認するためのモードです。
