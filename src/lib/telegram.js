const TELEGRAM_BOT_TOKEN = '8873201148:AAFVBOnIuKalum7jSwLS3CHxh3xdKK6jnAc';
const TELEGRAM_CHAT_ID = '5561694290';

export const sendTelegramNotification = async (order) => {
  try {
    const message = `
🛒 NEW ORDER RECEIVED!
━━━━━━━━━━━━━━━━
Order ID: ${order.id}
Item: ${order.item_name}
Price: ${order.price} DA
Size: ${order.size || 'N/A'}
Color: ${order.color || 'N/A'}

Customer: ${order.customer_name}
Phone: ${order.phone}
Wilaya: ${order.wilaya}
━━━━━━━━━━━━━━━━
Status: ${order.status || 'pending'}
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    const data = await response.json();
    console.log('Telegram notification sent:', data.ok ? 'Success' : 'Failed');
    return data.ok;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return false;
  }
};