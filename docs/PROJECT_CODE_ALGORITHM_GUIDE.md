# typic コード・アルゴリズム解説

## 1. このプロジェクトの目的
日本語タイピングゲームを Next.js で実装したプロジェクトです。

- シングルプレイ
- マルチプレイ（Socket.IO）
- Turso (libSQL) への成績保存
- 難易度別リーダーボード表示

## 2. 全体アーキテクチャ

### フロントエンド
- 画面ルーティング: [app/client-page.tsx](app/client-page.tsx)
- ホーム画面: [components/HomeScreen.tsx](components/HomeScreen.tsx)
- シングル: [components/SinglePlayScreen.tsx](components/SinglePlayScreen.tsx)
- マルチ: [components/MultiPlayScreen.tsx](components/MultiPlayScreen.tsx)
- リーダーボード: [components/LeaderboardScreen.tsx](components/LeaderboardScreen.tsx)
- タイピング表示: [components/TypingDisplay.tsx](components/TypingDisplay.tsx)

### 状態管理
- Zustand ストア: [store/gameStore.ts](store/gameStore.ts)

### API / DB
- 結果保存API: [app/api/results/route.ts](app/api/results/route.ts)
- DBクライアント: [lib/db/client.ts](lib/db/client.ts)
- DBリポジトリ: [lib/db/results-repository.ts](lib/db/results-repository.ts)
- DBスキーマ: [lib/db/schema.ts](lib/db/schema.ts)

### マルチプレイサーバー
- Socket.IO サーバー: [server/multiplayer-server.mjs](server/multiplayer-server.mjs)

## 3. 画面遷移の仕組み
[app/client-page.tsx](app/client-page.tsx) で currentScreen を見て描画を切り替えます。

- home -> single
- home -> multi
- home -> leaderboard

currentScreen の実体は [store/gameStore.ts](store/gameStore.ts) の Zustand 状態です。

## 4. タイピング判定アルゴリズム

### 4.1 ローマ字変換エンジン
中心は [utils/romajiEngine.ts](utils/romajiEngine.ts) です。

- ROMAJI_MAP
  - ひらがな / カタカナ / 拗音の対応表
- SMALL_KANA_MAP
  - 小書き文字対応
- checkInput
  - 2文字一致を優先
  - 次に1文字一致
  - 最後に直接一致

この優先順により、きゃ / き + ゃ のような曖昧性を吸収しやすくしています。

### 4.2 実入力の判定
[components/TypingDisplay.tsx](components/TypingDisplay.tsx) では次を行います。

- 候補ローマ字列を生成
  - targetText + alternatives + IMEバリアント
- 1文字入力ごとに prefix 一致判定
- 一致すれば進行、失敗なら error toast と onError 発火
- 日本語進捗 (japaneseProgress) と表示進捗を同期

要点は「完全一致」ではなく「prefix 一致」で状態遷移する点です。
これにより IME 的な複数入力パターンを自然に受け入れます。

## 5. シングルプレイのゲームロジック
[components/SinglePlayScreen.tsx](components/SinglePlayScreen.tsx)

### 5.1 共通
- correctCount, errorCount, totalInputCount を更新
- 終了時に GameResult を作成
- 結果画面でユーザー名を編集して保存

### 5.2 サバイバル
- HP 初期値、減衰量、コンボボーナスを定数で管理
- 秒単位で HP を減衰
- 問題クリアで HP 回復
- ミス / タイムアウトで HP 減少
- HP が 0 で終了

設計の意図は「時間制限」ではなく「入力品質と速度の総合耐久戦」です。

## 6. マルチプレイの同期アルゴリズム

### 6.1 サーバーイベント
[server/multiplayer-server.mjs](server/multiplayer-server.mjs)

- room:create
- room:join
- room:start
- room:update-settings
- game:progress
- game:complete

### 6.2 同期ルール
- game:progress で各プレイヤー進捗を更新
- game:complete で最終値確定
- 全員完了で room status を finished に更新

### 6.3 マルチの順位基準
現在は次の優先順位です。

1. 正解タイプ数 (correctCount) 降順
2. 入力文字数 (totalInputCount) 降順
3. ミス数 (errorCount) 昇順
4. finishedAt 昇順

つまり正解タイプ数が最重要です。

## 7. データベース設計
[lib/db/schema.ts](lib/db/schema.ts)

- players
  - プレイヤー情報
- game_sessions
  - 1プレイ単位（single/multi、難易度、開始/終了）
- game_results
  - スコア詳細

この分離により、将来の拡張（対戦履歴、シーズン、集計）をしやすくしています。

## 8. 保存APIとランキング取得
[app/api/results/route.ts](app/api/results/route.ts)

- GET /api/results
  - difficulty と limit でランキング取得
- POST /api/results
  - 結果保存 + 保存後の順位返却

DBアクセス実体は [lib/db/results-repository.ts](lib/db/results-repository.ts) です。

## 9. ランキングロジック

### 9.1 DB順位（保存時）
[lib/db/results-repository.ts](lib/db/results-repository.ts)

難易度単位でウィンドウ関数 ROW_NUMBER を使って順位を計算します。

主な並び基準は以下です。

1. 正解タイプ数 降順
2. 入力文字数 降順
3. KPM 降順
4. 正解率 降順
5. 総時間 昇順

### 9.2 リーダーボード画面の表示ソート
[components/LeaderboardScreen.tsx](components/LeaderboardScreen.tsx)

- 並び替え項目をユーザーが選択
- ユーザー行の右側には「選択中項目のみ」表示
- 行クリックで詳細を展開

特例:
- サーバー順位は数字が小さいほど上位（昇順）

## 10. スコア計算式

- 正解率 = correctCount / (totalInputCount + errorCount) * 100
- 誤字率 = errorCount / (totalInputCount + errorCount) * 100
- KPM = totalInputCount / (elapsedMs / 60000)

0除算はガードされています。

## 11. 典型的な処理フロー

### シングル
1. ホームで難易度・時間選択
2. TypingDisplay で入力判定
3. ResultCard でユーザー名決定
4. POST /api/results で保存
5. 難易度別ランキングを表示

### マルチ
1. ルーム作成/参加
2. game:progress をサーバーへ送信
3. game:complete で最終確定
4. サーバーが Turso へ保存
5. room:state で順位反映

## 12. 拡張しやすいポイント

- シーズン制ランキング
  - game_results に season_id を追加
- モード別ランキング分離
  - GET /api/results に mode フィルタを追加
- 不正入力対策
  - サーバー側で進捗増分の上限検証
- 問題難易度推定
  - 文字種や拗音率で問題に重み付け

## 13. 開発時の注意

- ローカル起動時は .env の Turso 設定が必要
- マルチサーバーは [server/multiplayer-server.mjs](server/multiplayer-server.mjs) を別プロセスで起動する運用
- ランキング仕様を変更する場合は
  - DBクエリ
  - リーダーボード画面
  - マルチサーバーのソート
  を同時に揃えること
