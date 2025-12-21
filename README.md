# Web Jitter RNG

**Web Jitter RNG** is a browser-based entropy source that harvests randomness from CPU execution time jitter. It provides a supplementary source of entropy that can be mixed with standard CSPRNGs for defense-in-depth, exploiting the inherent non-determinism of hardware and OS scheduling in a JavaScript environment.

**Web Jitter RNG** は、CPUの実行時間ジッター（ゆらぎ）からエントロピーを収集するブラウザベースのエントロピー源です。JavaScript環境におけるハードウェアやOSスケジューリングの固有の非決定性を利用し、標準的なCSPRNGと組み合わせることで多層防御を実現する補助的なエントロピー源を提供します。

> [!WARNING]
> **This project is a Proof of Concept (PoC). It is NOT a certified or standardized CSPRNG.**
>
> While this project includes statistical quality tests inspired by NIST recommendations,
> passing these tests does **not** imply compliance with NIST standards,
> nor does it guarantee cryptographic security.
>
> Do **NOT** use this library for high-stakes cryptographic purposes such as:
> - cryptographic key generation
> - session identifiers
> - password reset tokens
>
> For production web cryptography, always use `window.crypto.getRandomValues()`.

> [!WARNING]
> **本プロジェクトは概念実証（PoC）であり、認証・規格準拠された CSPRNG ではありません。**
>
> NIST に着想を得た統計的品質テストを実装・実行していますが、
> これらのテストを通過したからといって
> NIST 規格への準拠や暗号学的安全性が保証されるわけではありません。
>
> 以下のような用途には **絶対に使用しないでください**：
> - 暗号鍵生成
> - セッション ID
> - パスワードリセットトークン
>
> 本番用途では `window.crypto.getRandomValues()` を使用してください。

---

## 🌍 Language / 言語

- [English](#english)
- [日本語](#japanese)

---

<a name="english"></a>
## 🇬🇧 English

### Features
- **Jitter-Based Entropy**: Uses CPU jitter (micro-timing variations) as a supplementary source of entropy.
- **Hybrid Security**: Conditions jitter entropy with hashing + HMAC-based expansion to produce high-quality random output without exposing raw bytes.
- **Non-Blocking**: Implements asynchronous chunking to collect samples without freezing the main thread/UI.
- **Configurable**: Adjustable CPU workload implementation and sampling parameters.

### 🛡️ Security & Usage Guidelines (Important)

- **Supplementary Use Only**: This library is designed to provide *additional* entropy on top of standard CSPRNGs. It should not be used as the sole source of randomness for sensitive cryptographic operations.
- **Timer Resolution Risks**: Browser `performance.now()` resolution is often reduced (coarsened) or jittered by the browser to prevent side-channel attacks. This implementation attempts to mitigate this with heavy CPU loops, but the entropy quality is highly dependent on the browser and OS environment.
- **Recommended Usage**: Always mix the output of this library with `window.crypto.getRandomValues()` (e.g., via XOR) to ensure defense-in-depth.
- **Health Checks**: The collector runs lightweight health checks on the sampled jitter. Environments with coarse timers may fail these checks and will throw rather than silently returning biased output.

### ⏱️ Timing Modes

This library supports two timing measurement modes:

| Mode | Description | Recommended |
|------|-------------|-------------|
| `interpCount` | Counts iterations until timer tick changes. More robust in low-resolution environments. | ✅ **Default** |
| `duration` | Uses raw millisecond duration. Legacy mode for compatibility. | For comparison/debugging |

**Default: `interpCount`** - This mode is recommended for most environments as it provides better entropy quality in browsers with coarse timer resolution.

```typescript
// Use default interpCount mode (recommended)
const bytes = await getJitterRandom(32);

// Explicitly use duration mode (legacy)
const bytesLegacy = await getJitterRandom(32, { timingMode: 'duration' });
```

#### Timer Resolution (for interpCount mode)

The `timerResolution` option controls how samples are computed:

| Value | Description | Use Case |
|-------|-------------|----------|
| `'auto'` | Detect based on `performance.now()` precision | **Default** |
| `'high'` | Use fractional timing (sub-ms precision) | Node.js |
| `'low'` | Use block count only | Browsers |

```typescript
// Auto-detect (default, works in both environments)
const bytes = await getJitterRandom(32);

// Force low-resolution mode for browsers
const browserBytes = await getJitterRandom(32, { timerResolution: 'low' });
```

> [!WARNING]
> **interpCount mode considerations:**
> - May increase CPU load during sampling
> - Throws an error (does not freeze) if `interpMaxBlocks` is exceeded
> - May fail in throttled environments (background tabs, power saving mode)


### Project Structure (Monorepo)
This project is a monorepo managed by NPM Workspaces.

- **`packages/web-jitter-rng`**: The core library.
- **`apps/demo`**: A visualization and testing application.

### Installation & Usage
(Assuming usage from `packages/web-jitter-rng`)

```typescript
import { getJitterRandom, collectJitterBytes } from 'web-jitter-rng';

// 1. Get conditioned random bytes (HKDF/HMAC conditioned)
// Recommended for most use cases needing high quality randomness.
const secureBytes = await getJitterRandom(32);
console.log(secureBytes);

// 2. Collect conditioned entropy directly (alias for getJitterRandom)
// Raw jitter bytes are intentionally NOT exposed to avoid misuse.
const conditioned = await collectJitterBytes(32);
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
  Runs the Vitest suite for the library (Unit tests only).

#### Test Strategy

This project separates tests into two categories:

| Category | Description | Command |
|----------|-------------|---------|
| **Unit** | Deterministic tests only (validation, exceptions, pure functions). No dependency on `performance.now()` or actual jitter sampling. | `npm run test` |
| **Integration** | Tests that depend on real-time measurement or jitter collection. May be flaky depending on environment. | `npm run test:integration` |

> [!NOTE]
> `npm run test` runs only Unit tests. Integration tests are excluded from CI by default to ensure stability.

- **Run Quality Tests**:
  ```bash
  npm run quality-test
  ```
  Runs rigorous statistical quality tests based on NIST SP 800-22 recommendations.
  > [!NOTE]
  > This test generates over 1 million bits of output and applies
  > statistical randomness tests inspired by NIST SP 800-22
  > as a *sanity check* for detecting obvious bias or structural anomalies.
  >
  > These tests are intended for exploratory evaluation only and
  > are **not** sufficient to establish cryptographic security
  > or formal compliance with NIST standards.

- **Run Quality Tests (Without Health Check)**:
  ```bash
  npm run quality-test:no-health
  # OR
  npm run quality-test -- --no-health-check
  ```
  Runs quality tests with health checks disabled. Use this if health checks frequently fail on your system.
  > [!WARNING]
  > Health checks attempt to detect low-quality or unstable entropy sources.
  > Disabling them may allow statistically weak or environment-dependent output
  > to pass through without warning.

---

<a name="japanese"></a>
## 🇯🇵 日本語

### 特徴
- **ジッターベースエントロピー**: CPUジッター（微細なタイミングの変動）を補助的なエントロピー源として使用します。
- **ハイブリッドセキュリティ**: 生のジッターエントロピーをハッシュ + HMAC 拡張でコンディショニングし、高品質な乱数を生成します。生データは誤用防止のため公開しません。
- **ノンブロッキング**: メインスレッドやUIをフリーズさせないよう、非同期で分割してサンプリングを行います。
- **設定可能**: CPU負荷の強度やサンプリングパラメータを調整可能です。

### 🛡️ セキュリティと利用ガイドライン (重要)

- **補助的な利用を推奨**: 本ライブラリは、標準的な CSPRNG に対する「追加のエントロピー源」として提供されています。機密性の高い暗号操作において、単独の乱数源として使用することはお勧めしません。
- **タイマー分解能のリスク**: ブラウザの `performance.now()` は、サイドチャネル攻撃対策として分解能が低下（粗粒化）されたり、人工的なノイズが付与されたりする場合があります。本実装は CPU 高負荷ループによって緩和を試みていますが、エントロピーの質はブラウザや OS 環境に強く依存します。
- **推奨される使用法**: 防層防御の観点から、常に `window.crypto.getRandomValues()` の出力と（XORなどで）混合して使用することを強く推奨します。
- **ヘルスチェック**: サンプル系列に対して簡易なヘルスチェックを行います。タイマー分解能が粗い環境ではチェックに失敗し、バイアスのある出力を返す代わりに例外を投げます。

### ⏱️ タイミングモード

本ライブラリは2つのタイミング計測モードをサポートしています：

| モード | 説明 | 推奨 |
|------|-------------|-------------|
| `interpCount` | タイマー tick が変わるまでのイテレーション回数を計測。低分解能環境でも堅牢。 | ✅ **デフォルト** |
| `duration` | 生のミリ秒差分を使用。互換性維持のためのレガシーモード。 | 比較/デバッグ用 |

**デフォルト: `interpCount`** - タイマー分解能が粗いブラウザ環境でも良好なエントロピー品質を提供するため、このモードを推奨します。

```typescript
// デフォルトの interpCount モードを使用（推奨）
const bytes = await getJitterRandom(32);

// 明示的に duration モードを使用（レガシー）
const bytesLegacy = await getJitterRandom(32, { timingMode: 'duration' });
```

#### タイマー分解能（interpCount モード用）

`timerResolution` オプションでサンプル計算方法を制御できます：

| 値 | 説明 | 用途 |
|-------|-------------|----------|
| `'auto'` | `performance.now()` の精度に基づいて自動検出 | **デフォルト** |
| `'high'` | 小数部タイミングを使用（サブ ms 精度） | Node.js |
| `'low'` | ブロック数のみを使用 | ブラウザ |

```typescript
// 自動検出（デフォルト、両環境で動作）
const bytes = await getJitterRandom(32);

// ブラウザ向けに低分解能モードを強制
const browserBytes = await getJitterRandom(32, { timerResolution: 'low' });
```

> [!WARNING]
> **interpCount モードの注意点:**
> - サンプリング中に CPU 負荷が上がる可能性があります
> - `interpMaxBlocks` を超過した場合、フリーズではなくエラーを投げます
> - バックグラウンドタブや省電力モードでは失敗する可能性があります


### プロジェクト構成 (モノレポ)
このプロジェクトは NPM Workspaces を用いたモノレポ構成です。

- **`packages/web-jitter-rng`**: コアライブラリ本体。
- **`apps/demo`**: 動作確認と可視化のためのデモアプリケーション。

### インストールと使い方
(`packages/web-jitter-rng` を利用する場合)

```typescript
import { getJitterRandom, collectJitterBytes } from 'web-jitter-rng';

// 1. コンディショニング済み乱数の取得 (HKDF/HMAC)
// 高品質な乱数が必要なほとんどのケースで推奨されます。
const secureBytes = await getJitterRandom(32);
console.log(secureBytes);

// 2. コンディショニング済みエントロピーの直接取得（getJitterRandom と同等）
// 生のジッターバイトは誤用防止のため公開していません。
const conditioned = await collectJitterBytes(32);
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
  ライブラリの Vitest テストスイートを実行します（Unit テストのみ）。

#### テスト方針

本プロジェクトではテストを2種類に分類しています：

| 種別 | 説明 | コマンド |
|------|------|----------|
| **Unit** | 決定論的テストのみ（バリデーション、例外、純粋関数）。`performance.now()` や実際のジッター収集に依存しない。 | `npm run test` |
| **Integration** | 実時間測定やジッター収集に依存するテスト。環境によってはフレーク（不安定）になる可能性あり。 | `npm run test:integration` |

> [!NOTE]
> `npm run test` は Unit テストのみを実行します。Integration テストはテストの安定性確保のため、デフォルトでは CI から除外されています。

- **品質テストの実行**:
  ```bash
  npm run quality-test
  ```
  NIST SP 800-22 に基づいた厳密な統計的品質テストを実行します。
  > [!NOTE]
  > 本テストでは 100 万ビット以上の出力を生成し、
  > NIST SP 800-22 に着想を得た統計的ランダムネス検定を実行します。
  >
  > これは明白な偏りや構造的異常を検出するための
  > *品質確認（サニティチェック）* を目的としたものであり、
  > 暗号学的安全性や NIST 規格準拠を保証するものではありません。

- **品質テスト（ヘルスチェック無効）の実行**:
  ```bash
  npm run quality-test:no-health
  # または
  npm run quality-test -- --no-health-check
  ```
  ヘルスチェックを無効にして品質テストを実行します。ヘルスチェックが頻繁に失敗する環境で使用してください。
  > [!WARNING]
  > ヘルスチェックは、不安定または低品質なエントロピー源を検出するためのものです。
  > 無効化すると、環境依存で統計的に弱い出力が警告なしに通過する可能性があります。
