class MultiPlayerSocket{
    constructor(playground){
        this.playground=playground;
        this.ws=new WebSocket("wss://app2433.acapp.acwing.com.cn/wss/multiplayer/");
        //通过链接试图去建立连接
        this.start();
    }

    start(){
        this.receive();
    }

    receive(){
        let outer=this;
        //接收信息的函数
        this.ws.onmessage=function(e){
            let data=JSON.parse(e.data);
            let uuid=data.uuid;
            if(uuid === outer.uuid) return false;
            console.log("create player");
            let event=data.event;
            if(event==="create player"){
                outer.receive_create_player(uuid,data.username,data.photo);
            }
        };
    }

    send_create_player(username,photo){
        let outer=this;
        //发送信息的函数
        this.ws.send(JSON.stringify({
            'event':'create player',
            'uuid':outer.uuid,
            'username':username,
            'photo':photo,
        }));
    }

    receive_create_player(uuid,username,photo){
        let player=new Player(
            this.playground,
            // (this.playground.width * 0.5 + this.playground.rect.left) / this.playground.scale,
            (this.playground.width * 0.5) / this.playground.scale,
            (this.playground.height * 0.5) / this.playground.scale,
            // (this.playground.height * 0.5 + this.playground.rect.top) / this.playground.scale,
            (this.playground.height * 0.05) / this.playground.scale,
            this.playground.get_random_color(),
            (this.playground.height * 0.2) / this.playground.scale,
            "enemy",
            username,
            photo
        );
        // console.log(this.playground.rect.left);
        player.uuid=uuid;
        this.playground.players.push(player);
    }
}
