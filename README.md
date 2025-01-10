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
送信するmarkdownは、  
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
をDISCORD_WEBHOOK_URL_SCに送信  


火曜日の14:00-15:00の場合
  
markdown内の変数を説明します。  
- `today`  
  今日の日付
- `pageName`  
  Notionページの`名前`プロパティ
- `pageLocation`  
  Notionページの`場所`プロパティ
- `contentBlocks`  
  `活動内容`というh1ブロックが1ブロック目にあるなら、次のh1ブロックまでのブロック  
  ないのであれば`null`です。
  対応しているのは以下のブロックです。  
  - paragraph
  - bulleted_list_item
    
  非対応のブロックはplain textのみ返します。

  # 使用方法
  APIキーなどはApps Scriptのスクリプト プロパティに記載してください。
  `PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");`であればプロパティに`NOTION_API_KEY`を入力、値に実際のAPIキーを入力してください。
