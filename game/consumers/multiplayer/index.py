from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings #这里我们将房间容量信息存储在settings中所以需要引入settings
from django.core.cache import cache

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):  #当前端通过我们刚刚写的链接试图与我们建立连接时我们会执行这个函数
        self.room_name=None
        for i in range(1000):
            name="room_%d" % (i)
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:  #房间没有被创建或者房间人数不满的情况
                self.room_name=name
                break
        if not self.room_name:
            return
        await self.accept()  #建立连接

        if not cache.has_key(self.room_name):
            cache.set(self.room_name,[],3600) #一个小时有效期

        for player in cache.get(self.room_name):
            await self.send(text_data=json.dumps({ #向建立连接的web端发送房间内其他玩家信息
                'event':'create player',
                'uuid':player.get('uuid'),
                'username':player.get('username'),
                'photo':player.get('photo'),
            }))

        await self.channel_layer.group_add(self.room_name, self.channel_name)

    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self,data):
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
                'type':'group_create_player',
                'event':'create player',
                'uuid':data['uuid'],
                'username':data['username'],
                'photo':data['photo'],
            }
        )

    async def group_create_player(self,data):
        await self.send(text_data=json.dumps(data))


    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data['event']
        if event == "create player":
            await self.create_player(data)
