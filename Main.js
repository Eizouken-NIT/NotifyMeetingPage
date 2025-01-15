function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
}

function doPost(e) {
  main();
  return ContentService.createTextOutput("実行が完了しました。");
}

function main() {
  try {
    const NOTION_API_KEY = PropertiesService.getScriptProperties().getProperty("NOTION_API_KEY");
    const DATABASE_ID = PropertiesService.getScriptProperties().getProperty("DATABASE_ID");
    const DISCORD_SC_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty("DISCORD_SC_WEBHOOK_URL"); //SCHEDULE
    const DISCORD_NT_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty("DISCORD_NT_WEBHOOK_URL"); //NOTIFICATION

    const today = getNow().date;
    const time = getNow().time;
    const day = getNow().day;

    // 部集会の日の昼に呼ばれたなら
    if (time >= "1200" && time <= "1300" && day === "Tuesday"){
    
      // Notionデータベースを検索
      const notionData = fetchNotionDatabase(DATABASE_ID, NOTION_API_KEY, today);
      if (notionData.length > 0) {
        const page = notionData[0]; // 最初のページを取得
        const pageName = page.properties.名前.title[0]?.plain_text || '不明';
        const pageLocation = page.properties.場所.rich_text[0]?.plain_text || '不明';
        const pageId = page.id;

        // ページ内のブロック内容を取得
        const blocks = fetchPageBlocks(pageId, NOTION_API_KEY);
        const contentBlocks = extractContentBlocks(blocks);

        // Discordメッセージを作成
        const message = `@everyone
# 📅 今日 ${today}の予定
## 🔤 活動名
${pageName}
## 🚩 場所
${pageLocation}
## 📝 内容
${contentBlocks.join('\n')}
## 📌 詳細は[こちら](https://www.notion.so/${pageId.replace(/-/g, '')})
よろしくお願いします！`;

        sendDiscordMessage(DISCORD_SC_WEBHOOK_URL, message);
      } else {
        const message = `@everyone 火曜日だけど今日の予定がないよ！大丈夫？`;
        sendDiscordMessage(DISCORD_NT_WEBHOOK_URL, message);
      }
    }

    // 部集会直前のトリガー
    else if (time >= "1400" && time <= "1500" && day === "Tuesday") { 

      if (notionData.length > 0) {
        const page = notionData[0]; // 最初のページを取得
        const pageName = page.properties.名前.title[0]?.plain_text || '不明';
        // Discordメッセージを作成
        const message = `@everyone リマインドです！今日は${pageName}があります！
詳細は上のメッセージをご覧ください。`;
        sendDiscordMessage(DISCORD_SC_WEBHOOK_URL, message);
      } else {
        // 今日のページが存在しない場合
        const message = `@everyone 今日の予定はありません！`;
        sendDiscordMessage(DISCORD_SC_WEBHOOK_URL, message);
      }
    }

    //手動で呼び出された場合
    else { 

      // Notionデータベースを検索
      const notionData = fetchNotionDatabase(DATABASE_ID, NOTION_API_KEY, today);
      if (notionData.length > 0) {
        const page = notionData[0]; // 最初のページを取得
        const pageName = page.properties.名前.title[0]?.plain_text || '不明';
        const pageLocation = page.properties.場所.rich_text[0]?.plain_text || '不明';
        const pageId = page.id;

        // ページ内のブロック内容を取得
        const blocks = fetchPageBlocks(pageId, NOTION_API_KEY);
        const contentBlocks = extractContentBlocks(blocks);

        // Discordメッセージを作成
        const message = `@everyone
# 📅 今日 ${today}の予定
## 🔤 活動名
${pageName}
## 🚩 場所
${pageLocation}
## 📝 内容
${contentBlocks.join('\n')}
## 📌 詳細は[こちら](https://www.notion.so/${pageId.replace(/-/g, '')})
よろしくお願いします！`;
        sendDiscordMessage(DISCORD_SC_WEBHOOK_URL, message);
      } else {
      // 手動呼び出しなのに今日のページが存在しない場合
        const message = `@everyone 手動呼び出しだけど今日の予定がないよ！大丈夫？`;
        sendDiscordMessage(DISCORD_NT_WEBHOOK_URL, message);
      }
    }
  } catch (error) {
    Logger.log(`Error in main function: ${error.message}`);
    const message = `@everyone エラーが出たよ！: ${error.message}`;
    sendDiscordMessage(DISCORD_NT_WEBHOOK_URL, message);
  }
}
