# rishu-extension

rishu-extensionは、金沢大学の学内システムの使い勝手を向上させるためのブラウザ拡張機能です。

## 機能概要

- LMSの講義一覧のUIを改善
- 履修時間割表からGoogleカレンダーに講義を追加
- **NEW**: LMSのレポート課題をGoogleタスクに自動追加

## セットアップ

1. レポジトリをクローン：`git clone https://github.com/ToYama170402/rishu-extension.git`
2. 依存関係のインストール：`pnpm install`
3. 開発用サーバーの起動：`pnpm dev`

開発用ビルドが`build/chrome-mv3-dev`等に出力されます。Chromeの拡張機能管理画面から「パッケージ化されていない拡張機能を読み込む」で該当ディレクトリを選択してください。

## 本番ビルド

```bash
pnpm build
```

`build/`ディレクトリに本番用バンドルが生成されます。

## デプロイ・ストアへの公開

`.github/workflows/submit.yml`を実行します。

## 参考リンク

- [Plasmo公式ドキュメント](https://docs.plasmo.com/)

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
