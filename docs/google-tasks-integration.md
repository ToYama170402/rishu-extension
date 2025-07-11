# Google Tasks Integration Feature

## 概要
金沢大学のLMSのレポート課題をワンクリックでGoogleタスクに追加できる機能です。

## ⚠️ 重要：セットアップ要件

この機能を使用するには、Google Cloud Console でGoogle Tasks API を有効にする必要があります。

### Google Cloud Console でのAPI有効化手順

1. **Google Cloud Console にアクセス**
   - [Google Cloud Console](https://console.cloud.google.com/)にログイン
   - OAuth設定で使用しているプロジェクトを選択

2. **Google Tasks API を有効化**
   - 左側のメニューから「APIとサービス」→「ライブラリ」を選択
   - 検索バーで「Google Tasks API」を検索
   - 「Google Tasks API」をクリック
   - 「有効にする」ボタンをクリック

3. **確認**
   - 「APIとサービス」→「有効なAPI」で「Google Tasks API」が一覧に表示されることを確認

### よくあるエラーとその対処法

**エラー例:**
```
Error: タスクの追加中にエラーが発生しました。Status: 403, Error: {"error":{"code":403,"message":"Google Tasks API has not been used in project [PROJECT_ID] before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=[PROJECT_ID] then retry..."}}
```

**対処法:**
上記の手順でGoogle Tasks APIを有効化してください。API有効化後、数分待ってから再度お試しください。

## 機能詳細

### 対象ページ
- `https://lms-wc.el.kanazawa-u.ac.jp/webclass/course.php/*`

### 機能
1. **自動課題検出**: ページ読み込み時に自動でレポート・課題を検出
2. **個別追加**: 各課題に「📋 タスクに追加」ボタンを配置
3. **一括追加**: 未提出課題をまとめて追加する機能
4. **フィルタリング**: 提出済み課題や期限切れ課題を除外

### 検出対象
- 課題種別が「レポート」「課題」「Report」「Assignment」のもの
- 未提出の課題のみが一括追加の対象

### Google Tasks連携
- 課題タイトルがタスク名に設定される
- 提出期限がタスクの期限に自動設定
- コース名、課題種別、期限情報がタスクメモに記録される

### 使用方法
1. LMSの講義ページを開く
2. 拡張機能が自動で課題を検出し、上部に操作パネルを表示
3. 個別追加: 各課題の「📋 タスクに追加」ボタンをクリック
4. 一括追加: 「📋 未提出課題を一括追加」ボタンをクリック

### UI状態
- 追加済み課題: ボタンが「✓ 追加済み」に変化し、成功メッセージを表示
- 提出済み課題: ボタンは表示されない
- エラー時: エラーメッセージを表示

## 技術仕様

### 課題抽出ロジック
```javascript
Array.from(document.querySelectorAll(".col-xs-12 .list-group-item"))
  .map((e) => {
    const titleElement = e.querySelector(".cm-contentsList_contentName *:last-child")
    const typeElement = e.querySelector(".cl-contentsList_categoryLabel")
    const expireElement = e.querySelector(".cm-contentsList_contentDetailListItemData")
    // ... 期限解析とフィルタリング
  })
```

### 期限解析
- 形式: `YYYY/MM/DD HH:MM - YYYY/MM/DD HH:MM`
- 開始時刻と終了時刻を分離して解析
- 無効な日付は null として処理

### 提出状況判定
- `.label-success`、`.badge-success` クラスの存在
- テキスト内の「提出済み」「完了」「submitted」を検出

## OAuth権限
- `https://www.googleapis.com/auth/tasks` - Google Tasks APIへのアクセス
- `https://www.googleapis.com/auth/calendar` - 既存のカレンダー機能（維持）

## API呼び出し
- `GET_TASKS_LIST`: タスクリスト一覧取得
- `CREATE_TASK`: タスク作成

## エラーハンドリング
- 認証エラー: OAuth再認証を促す
- API エラー: 詳細なエラーメッセージを表示
- 部分的失敗: 成功した件数と失敗した件数を報告