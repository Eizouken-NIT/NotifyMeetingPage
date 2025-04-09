# NotifyMeetingPage
Notify Notion page contents with webhook.

# 概要
## 構成
特定のNotionデータベースに、日付プロパティが今日のページがあったら、webhookを使用して任意のアプリケーションにページ内容を記したmarkdownでリクエストを送信します。

## 用途
私たちの部活動では毎週の部集会の告知の通知に使用しています。

# 使用環境
- Google Apps Script
- Notion API 2022-06-28
- Discord webhook

# 仕組み
## 送信するmarkdown

- 火曜日の12:00-13:00（部活動が毎週火曜日なので）orそれ以外で日付プロパティが今日のページがある場合

```markdown:message.md
@everyone
# 📅 今日 ${today}の予定
## 🔤 活動名
${pageName}
## 🚩 場所
${pageLocation}
## 📝 内容
${contentBlocks.join('\n')}
## 📌 詳細は[こちら](https://www.notion.so/${pageId.replace(/-/g, '')})
よろしくお願いします！
```  
をDISCORD_SC_WEBHOOK_URLに送信  

- 火曜日の12:00-13:00でページがない場合
```markdown:message.md
@everyone 火曜日だけど今日の予定がないよ！大丈夫？
```
をDISCORD_NT_WEBHOOK_URLに送信  
  
- 火曜日の14:00-15:00でページがある場合
```markdown:message.md
@everyone 
リマインドです！今日は${pageName}があります！
詳細は上のメッセージをご覧ください。
```
をDISCORD_SC_WEBHOOK_URLに送信  

- 火曜日の14:00-15:00でページがない場合
```markdown:message.md
@everyone 今日の予定はありません！
```
をDISCORD_SC_WEBHOOK_URLに送信  
  
- 手動呼び出しなのに今日のページが存在しない場合
```markdown:message.md
@everyone 手動呼び出しだけど今日の予定がないよ！大丈夫？
```
をDISCORD_NT_WEBHOOK_URLに送信

  
## markdown内の変数の説明

- `today`  
今日の日付  
  
- `pageName`  
Notionページの名前プロパティ  
  
- `pageLocation`  
Notionページの場所プロパティ  
  
- `contentBlocks`  
活動内容というh1ブロックが1ブロック目にあるなら、次のh1ブロックまでのブロック  
  ないのであればnullです。
  対応しているのは以下のブロックです。  
  - `paragraph`
  - `bulleted_list_item`  

  非対応のブロックはplain textのみ返します。  
  
# 使用方法
APIキーなどはApps Scriptのスクリプト プロパティに記載してください。
PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");であればプロパティにNOTION_API_KEYを入力、値に実際のAPIキーを入力してください。

# features
- [x] 毎週の部集会の通知
- [x] 毎週の部集会の予定なし通知 
- [ ] それ以外のイレギュラーイベントの通知（開始時刻n分前通知->定期的なAPIコールでの監視が必要）
- [ ] 任意のタイミングでの通知
- [ ] Webコンソールでの設定（毎週通知の一時停止など）の実装

