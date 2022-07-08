from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings #这里我们将房间容量信息存储在settings中所以需要引入settings
from django.core.cache import cache

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):  #当前端通过我们刚刚写的链接试图与我们建立连接时我们会执行这个函数
        await self.accept()


    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self,data):
        self.room_name = None

        for i in range(1000):
            name="room-%d" % (i)
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:  #房间没有被创建或者房间人数不满的情况
                self.room_name=name
                break
        if not self.room_name:
            return

        if not cache.has_key(self.room_name):
            cache.set(self.room_name,[],3600) #一个小时有效期

        for player in cache.get(self.room_name):
            await self.send(text_data=json.dumps({ #向建立连接的web端发送房间内其他玩家信息
                'event':'create_player',
                'uuid':player.get('uuid'),
                'username':player.get('username'),
                'photo':player.get('photo'),
            }))

        await self.channel_layer.group_add(self.room_name, self.channel_name)

        players=cache.get(self.room_name)
        players.append({
            'uuid':data['uuid'],
            'username':data['username'],
            'photo':data['photo'],
        })
        cache.set(self.room_name,players,3600)
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type':'group_send_event',
                'event':'create_player',
                'uuid':data['uuid'],
                'username':data['username'],
                'photo':data['photo'],
            }
        )

    async def group_send_event(self,data):
        await self.send(text_data=json.dumps(data))

    async def move_to(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'move_to',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )

    async def shoot_fireball(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'shoot_fireball',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
                'ball_uuid': data['ball_uuid'],
            }
        )

    async def attack(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'attack',
                'uuid': data['uuid'],
                'attackee_uuid': data['attackee_uuid'],
                'x': data['x'],
                'y': data['y'],
                'angle': data['angle'],
                'damage': data['damage'],
                'ball_uuid': data['ball_uuid'],
            }
        )

    async def blink(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'blink',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data['event']
        if event == "create_player":
            await self.create_player(data)
        elif event == "move_to":
            await self.move_to(data)
        elif event == "shoot_fireball":
            await self.shoot_fireball(data)
        elif event == "attack":
            await self.attack(data)
        elif event == "blink":
            await self.blink(data)
