# build a chat application

- frontend - react - tailwind - js - shadcn components - lucid react icons - zustand for state
- backend - nodejs - expressjs - socketio
- message sent from frontend to node instance which then sends message to my backend php to store message/create channel/group etc...
- basically node instance sits in between my frontend react app and backend php server
- node instance deployed to a lamp stack server
- now the react app has to be mobile friendly and work like a chat app works in mobile with the option to select messages and back from back button and so on
- also i will be calling this react app in my flutter - android and ios app as web view
- so need to handle the file permission and other stuff

here is my list of my react packages
"@hookform/resolvers": "^3.10.0",
"@react-google-maps/api": "^2.20.5",
"@react-spring/web": "^9.7.5",
"@tanstack/react-query": "^5.64.2",
"axios": "^1.7.9",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"crypto-js": "^4.2.0",
"date-fns": "^4.1.0",
"embla-carousel-react": "^8.5.2",
"emoji-picker-react": "^4.12.0",
"firebase": "^11.5.0",
"framer-motion": "^12.6.3",
"i18next": "^24.2.1",
"i18next-browser-languagedetector": "^8.0.2",
"i18next-http-backend": "^3.0.2",
"input-otp": "^1.4.2",
"js-cookie": "^3.0.5",
"lucide-react": "^0.473.0",
"pdfjs-dist": "^4.8.69",
"react": "^18.3.1",
"react-beautiful-dnd": "^13.1.1",
"react-confetti": "^6.2.2",
"react-day-picker": "^9.5.1",
"react-dom": "^18.3.1",
"react-google-autocomplete": "^2.7.4",
"react-hook-form": "^7.54.2",
"react-hot-toast": "^2.5.1",
"react-i18next": "^15.4.0",
"react-intersection-observer": "^9.14.1",
"react-lazy-load-image-component": "^1.6.3",
"react-phone-number-input": "^3.4.10",
"react-router": "^7.1.3",
"react-webcam": "^7.2.0",
"socket.io-client": "^4.8.1",
"tailwind-merge": "^2.6.0",
"tailwindcss-animate": "^1.0.7",
"zod": "^3.24.1",
"zustand": "^5.0.3"

here is how i want it to work the react app already exists we need to create the chat interface and node app
from frontend or flutter app i will hit the /chat route with token as /chat/token
all the requests will be made with the token to node server and the php server
it will read the token and make the request to node instance and node instance will check with my php server for if token is valid if yes it will allow the chat route to load it willl hit /user endpoint to get data for token validation
then we will fetch the list of available chats at /user/channels
we will sort the list with recent chats at top and show in frontend also the message count and latest message you know the chat list card
also we will keep checking the channels list every minute

here is how the data will look
{
"success": true,
"message": "Channels Found Successfully!..",
"status_code": 200,
"data": [
{
"id": 25,
"name": "Sunita Test",
"description": null,
"is_group": 0,
"created_at": "2025-03-11 11:41:49",
"thumbnail_image_url": "..kintree-assets/images/default-avatars/female.png",
"unread_message_count": 0,
"latest_message": {
"id": 158,
"message": "regth",
"attachments": [],
"channel_id": 25,
"created_at": "2025-03-11 11:42:04",
"updated_at": "2025-03-11 11:42:04",
"message_sent_by_me": true,
"read_at": "2025-03-11 16:45:45",
"delivered_at": "2025-03-11 16:45:45",
"created_by": {
"id": 828,
"username": "chandrakant.dubey935",
"first_name": "Chandrakant",
"middle_name": "",
"last_name": "Dubey",
"gender": "m",
"profile_pic_url": "/images/preset-profiles/male-2.jpg",
"is_brand_page": false,
"relation": "Me"
}
},
"is_online": false,
"user_id": 831
},
{
"id": 27,
"name": "TestSonOneSonOne Dubey",
"description": null,
"is_group": 0,
"created_at": "2025-03-18 09:58:54",
"thumbnail_image_url": "/images/default-avatars/male.png",
"unread_message_count": 0,
"latest_message": {
"id": 167,
"message": "hello test message",
"attachments": [],
"channel_id": 27,
"created_at": "2025-03-18 09:59:01",
"updated_at": "2025-03-18 09:59:01",
"message_sent_by_me": true,
"read_at": "2025-03-18 09:59:06",
"delivered_at": "2025-03-18 09:59:06",
"created_by": {
"id": 828,
"username": "chandrakant.dubey935",
"first_name": "Chandrakant",
"middle_name": "",
"last_name": "Dubey",
"gender": "m",
"profile_pic_url": "/images/preset-profiles/male-2.jpg",
"is_brand_page": false,
"relation": "Me"
}
},
"is_online": false,
"user_id": 1049
}
]
}
if no channels we will show start chat button

now when user selects the channel/chat to interact we take the id and hit /user/channels/:channelId/messages
{
"success": true,
"message": "Messages Found Successfully!..",
"status_code": 200,
"data": {
"current_page": 1,
"last_page": 1,
"total_record": 1,
"filtered_record": 1,
"messages": [
{
"id": 158,
"message": "regth",
"attachments": [],
"channel_id": 25,
"created_at": "2025-03-11 11:42:04",
"updated_at": "2025-03-11 11:42:04",
"message_sent_by_me": true,
"read_at": "2025-03-11 16:45:45",
"delivered_at": "2025-03-11 16:45:45",
"created_by": {
"id": 828,
"username": "chandrakant.dubey935",
"first_name": "Chandrakant",
"middle_name": "",
"last_name": "Dubey",
"gender": "m",
"profile_pic_url": "..kintree-assets/images/preset-profiles/male-2.jpg",
"is_brand_page": false,
"relation": "Me"
}
}
]
}
}
there is pagination to allow the user to scroll up and automatically fetch next 20 messages when they reach the 20th message and so on
in the channel user can send/recive/delete/edit messages here are endpoints and payload to do so

- send(formdata) - /user/channels/:channelId/messages
  {
  message: "fghfgbhhb",
  attachment_id: 13
  }
  the images cannot be sent directly so we send id - i will handle the attachment and add id
- update(formdata) - user/channels/:channelId/messages/:messageId
  {
  message: "fghfgbhhb",
  \_method: PUT
  }
- get message by id - user/channels/:channelId/messages/:messageId
  {
  "success": true,
  "message": "Message Found Successfully!..",
  "status_code": 200,
  "data": {
  "id": 158,
  "message": "regth",
  "attachments": [],
  "channel_id": 25,
  "created_at": "2025-03-11 11:42:04",
  "updated_at": "2025-03-11 11:42:04",
  "message_sent_by_me": true,
  "read_at": "2025-03-11 16:45:45",
  "delivered_at": "2025-03-11 16:45:45",
  "created_by": {
  "id": 828,
  "username": "chandrakant.dubey935",
  "first_name": "Chandrakant",
  "middle_name": "",
  "last_name": "Dubey",
  "gender": "m",
  "profile_pic_url": "..kintree-assets/images/preset-profiles/male-2.jpg",
  "is_brand_page": false,
  "relation": "Me"
  }
  }
  }
- delete message by id - /user/channels/:channelId/messages/:messageId
- mark as read single message(put) - /user/channels/:channelId/messages/:messageId/mark-as-read
- mark single message delivered(put) - /user/channels/:channelId/messages/:messageId/mark-delivered-at

now about the channels

- get channel by id - /user/channels/:channelId
  {
  "success": true,
  "message": "Channel Found Successfully!..",
  "status_code": 200,
  "data": {
  "id": 25,
  "name": "Sunita Test",
  "description": null,
  "is_group": 0,
  "created_at": "2025-03-11 11:41:49",
  "thumbnail_image_url": "..kintree-assets/images/default-avatars/female.png",
  "unread_message_count": 0,
  "latest_message": {
  "id": 175,
  "message": "Hello",
  "attachments": [],
  "channel_id": 25,
  "created_at": "2025-04-10 10:57:26",
  "updated_at": "2025-04-10 10:57:26",
  "message_sent_by_me": true,
  "read_at": null,
  "delivered_at": null,
  "created_by": {
  "id": 828,
  "username": "chandrakant.dubey935",
  "first_name": "Chandrakant",
  "middle_name": "",
  "last_name": "Dubey",
  "gender": "m",
  "profile_pic_url": "..kintree-assets/images/preset-profiles/male-2.jpg",
  "is_brand_page": false,
  "relation": "Me"
  }
  },
  "is_online": false,
  "user_id": 831
  }
  }

- create channel(post)(formdata) - /user/channels
  {
  is_group: 0,
  name: "ffgf",
  description: "dfgbhnfgdsrgf",
  thumbnail_image: file,
  user_ids: [1]
  }
- delete channel - /user/channels/:channelId
- update channel(post)(formdata) - /user/channels/:channelId
  {
  is_group: 0,
  name: "ffgf",
  description: "dfgbhnfgdsrgf",
  thumbnail_image: file,
  \_method: PUT
  }

- marking all messages read(put) - /user/channels/:channelId/mark-as-read
- marking all messages delivered(put) - /user/channels/:channelId/mark-delivered-at
- clear chat(put) - /user/channels/:channelId/clear-chat
  {
  "message_ids" : []
  }
