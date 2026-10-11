# whiteboard

## Overview
複数のブラウザでキャンパスを共有可能<br />
片側の描画をリアルタイムで反映可能なホワイトボード

## Structure
```
whiteboard/
|-- client/    # Vite + React + TypeScript. Canvas描画とWebSocketクライアント
|-- server/    # Node.js + ws + TypeScript. ブロードキャストと履歴保持
```

## Getting Started
`client`と`server`は独立したnpmプロジェクト
```sh
# Server（ws://localhost:8080）
cd server
npm install
npm run dev

# Client（http://localhost:5173）
cd client
npm install
npm run dev
```
`http://localhost:5173`を2つのタブで開き、片側の描画が反映されることを確認する

## Message Format
全てのJSONで`type`フィールドで種別を判別<br />
型は`client/src/messages.ts`と`server/src/messages.ts`に別々定義

| 型 | 方向 | 内容 |
|-----|-----|-----|
| `stroke` | client → server → 他のクライアント | 線分の配列、送信元には返さない |
| `clear` | client → server → 全クライアント | 全消去、送信元にも返す |
| `history` | server → 接続直後のクライアント | それまでの`stroke`をまとめて送信 |

```ts
type Point = { x: number; y: number };

type StrokeMessage = { type: "stroke"; points: Point[]; color: string; width: number };
type ClearMessage = { type: "clear" };
type HistoryMessage = { type: "history"; strokes: StrokeMessage[] };
```
不正なJSONや未知の`type`や項目が異なるメッセージは受信側で警告を表示し捨てる

## How It Works

- **送信の間引き**: `mousemove`の度に送らず`requestAnimationFrame`ごとに1つの`stroke`をまとめて送信
- **履歴**: サーバが`stroke`を配列に保持、新しい接続を直後に`history`として送信。`clear`で履歴を空にし、上限（5000件）を超えたら古いものから削除
- **再接続**: `onclose`を検知したら 1s → 2s → 4s ... と感覚を倍にして最大10sまで再接続を試す。画面には接続状態（接続中・接続済み・再接続中）を表示
- **消しゴム**: 白色（`#ffffff`）でペンの5倍の太さの`stroke`として描画

