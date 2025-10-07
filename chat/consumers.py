import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Messages, User
from datetime import datetime

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs'].get('room_name', 'main_room')
        self.room_group_name = f'chat_{self.room_name}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_add('admin_chat_room', self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.channel_layer.group_discard('admin_chat_room', self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        sender_name = data.get('sender_name')
        sender_email = data.get('sender_email')
        sender_number = data.get('sender_number')
        receiver = data.get('receiver', 'admin')

        current_time = datetime.now().strftime("%H:%M:%S")

        event_data = {
            'type': 'chat_message',
            'message': message,
            'sender_name': sender_name,
            'sender_email': sender_email,
            'sender_number': sender_number,
            'receiver': receiver,
            'time': current_time,
        }

        await self.channel_layer.group_send(self.room_group_name, event_data)
        await self.channel_layer.group_send('admin_chat_room', event_data)
        
        await self.save_message(sender_name, message, receiver, sender_email, sender_number)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, sender_name, text, receiver, sender_email, sender_number):
        return Messages.objects.create(
            text=text,
            msg_sender=sender_name,
            msg_receiver=receiver,
            msg_sender_email=sender_email,
            msg_sender_number=sender_number
        )


class AdminChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'admin_chat_room'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        sender_name = data.get('sender_name', str(self.scope['user'].username))
        sender_email = getattr(self.scope['user'], 'email', 'admin@example.com')
        sender_number = getattr(self.scope['user'], 'phone', '0000')
        receiver = data.get('receiver')

        current_time = datetime.now().strftime("%H:%M:%S")

        event_data = {
            'type': 'chat_message',
            'message': message,
            'sender_name': sender_name,
            'sender_email': sender_email,
            'sender_number': sender_number,
            'receiver': receiver,
            'time': current_time,
        }

        await self.channel_layer.group_send(self.room_group_name, event_data)
        if receiver:
            user_group = f'chat_{receiver}'
            await self.channel_layer.group_send(user_group, event_data)
            
        await self.save_message(sender_name, message, receiver, sender_email, sender_number)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def save_message(self, sender_name, text, receiver, sender_email, sender_number):
        return Messages.objects.create(
            text=text,
            msg_sender=sender_name,
            msg_receiver=receiver,
            msg_sender_email=sender_email,
            msg_sender_number=sender_number
        )