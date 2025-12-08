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

---

<a name="japanese"></a>
## 🇯🇵 日本語

### 特徴
- **真性乱数ソース**: CPUジッター（微細なタイミングの変動）をエントロピー源として使用します。
- **ハイブリッドセキュリティ**: 生のジッターエントロピーをSHA-256ハッシュ関数で圧縮（コンディショニング）し、高品質な乱数を生成します。
- **ノンブロッキング**: メインスレッドやUIをフリーズさせないよう、非同期で分割してサンプリングを行います。
- **設定可能**: CPU負荷の強度やサンプリングパラメータを調整可能です。

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
