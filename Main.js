function doGet() {
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
    Logger.log(today);
    const time = getNow().time;
    Logger.log(time);
    const day = getNow().day;
    Logger.log(day);

    const notionData = fetchNotionDatabase(DATABASE_ID, NOTION_API_KEY, today); //今日のページを取得
    
    // 部集会の日の昼に呼ばれたなら
    if (time >= "1200" && time <= "1300" && day === "Tuesday"){
      Logger.log('部集会の日の昼だね');
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
    Logger.log(`main catch ${error.message}`);
    const DISCORD_NT_WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty("DISCORD_NT_WEBHOOK_URL"); //NOTIFICATION
    const message = `@everyone エラーが出たよ！: ${error.message}`;
    sendDiscordMessage(DISCORD_NT_WEBHOOK_URL, message);
  }
}

function getNow() {
  // 現在の日時を取得
  const now = new Date();
  
  // 時間を24時間形式で取得（例: 1230は12:30）
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const time = hours + minutes;  // 例: "1230"
  const date = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"形式の今日の日付を取得
  // 曜日を取得
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[now.getDay()];  // 例: "Tuesday"
  return { date, time, day };
}
// Notion APIでデータベースを検索
function fetchNotionDatabase(databaseId, apiKey, date) {
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28' // バージョンを指定
    },
    payload: JSON.stringify({
      filter: {
        property: '日付', // データベースのプロパティ名に一致させる
        date: {
          equals: date // 今日の日付
        }
      }
    })
  };
  try {
    // APIリクエストを送信
    const response = UrlFetchApp.fetch(url, options);
    // ステータスコードをログに出力
    Logger.log('Response Code: ' + response.getResponseCode());
    const data = JSON.parse(response.getContentText()); // レスポンスをパース
    return data.results || []; // 結果を返す
  } catch (error) {
    Logger.log(`Error fetching database: ${error.message}`);
    return []; // エラー時は空配列を返す
  }
}
function fetchPageBlocks(pageId, apiKey) {
  const url = `https://api.notion.com/v1/blocks/${pageId}/children`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28'
    }
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('Response Code: ' + response.getResponseCode());
    const data = JSON.parse(response.getContentText());
    return data.results || [];
  } catch (error) {
    Logger.log(`Error fetching page blocks: ${error.message}`);
    return [];
  }
}
// ブロック内容を収集
function extractContentBlocks(blocks) {
  let contentBlocks = [];
  let capture = false;
  for (const block of blocks) {
    // ブロックの種類が heading_1 の場合
    Logger.log(block.type)
    text = '';
    if (block.type === 'heading_1') {
      text = block.heading_1.rich_text?.map(rt => rt.plain_text).join('') || '';
      if (text === '活動内容') {
        capture = true; // "活動内容" ブロックが見つかったらキャプチャ開始
        continue; //'活動内容'ブロックは含まない
      } else if (capture) {
        break; // 次にheading_1 に到達したら終了（heading_1は含まない）
      }
    }
    // テキストを収集
    if (capture) {
      
      if (block.type === 'bulleted_list_item'){ // 箇条書きだったら
        const bulletedText = block[block.type]?.rich_text?.map(rt => rt.plain_text).join('') || '';
        text = '- ' + bulletedText;
      } else {
        text = block[block.type]?.rich_text?.map(rt => rt.plain_text).join('') || ''; // それ以外(paragraphも含む)なら文字だけ
      }
      if (text) {
        contentBlocks.push(text);
      } else contentBlocks.push('') // 改行を検出したら改行
    }
  }
  Logger.log (contentBlocks)
  return contentBlocks;
}
// Discordにメッセージを送信
function sendDiscordMessage(url, content) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ content })
  };
  const response = UrlFetchApp.fetch(url, options);
  Logger.log('Discord Response Code: ' + response.getResponseCode());
  const responseText = response.getContentText();
  Logger.log('Discord Response Text: ' + responseText);

  if (response.getResponseCode() === 204) {
    Logger.log('Discordにメッセージを送信しました。');
  } else {
    // throw exception(...) を throw new Error(...) に修正
    throw new Error(`Discordのメッセージ送信に失敗しました: ${response.getResponseCode()}`);
  }
}
