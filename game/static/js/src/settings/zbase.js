class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.AcWingOS) this.platform = "ACAPP";
        this.username = "";
        this.photo = "";

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login"> <!--登录界面-->
        <div class="ac-game-settings-title"> <!--标题-->
            登录
        </div>
        <div class="ac-game-settings-username"> <!--用户名输入框-->
            <div class="ac-game-settings-item">
                <input type="text" placeholder="Username"> <!--输入处-->
            </div>
        </div>
        <div class="ac-game-settings-password"> <!--密码输入框-->
            <div class="ac-game-settings-item">
                <input type="password" placeholder="Password"> <!--密码输入处-->
            </div>
        </div>
        <div class="ac-game-settings-submit"> <!--按钮-->
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message"> <!--错误信息-->
            用户名或密码错误！
        </div>
        <div class="ac-game-settings-option"> <!--注册选项-->
            注册
        </div>
        <br> <!--这里一定要加上，不然一键登录图标不会居中，前面两行是inline的样式，可能会有bug-->
        <div class="ac-game-settings-acwing">
            <img src="AcWing图标的url" width="30"> <!--一键登录图标-->
            <div> <!--图标下提示信息-->
                AcWingOS一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register"> <!--这是注册界面-->
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username"> <!--用户名输入框-->
            <div class="ac-game-settings-item">
                <input type="text" placeholder="Username"> <!--输入处-->
            </div>
        </div>
        <div class="ac-game-settings-password-first"> <!--密码输入框-->
            <div class="ac-game-settings-item">
                <input type="password" placeholder="Password"> <!--密码输入处-->
            </div>
        </div>
        <div class="ac-game-settings-password-second"> <!--确认密码输入框-->
            <div class="ac-game-settings-item">
                <input type="password" placeholder="Password Confirm"> <!--确认密码密码输入处-->
            </div>
        </div>
        <div class="ac-game-settings-submit"> <!--按钮-->
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message"> <!--错误信息-->
            用户名或密码不可用！
        </div>
        <div class="ac-game-settings-option"> <!--注册选项-->
            登录
        </div>
        <br> <!--这里一定要加上，不然一键登录图标不会居中，前面两行是inline的样式，可能会有bug-->
        <div class="ac-game-settings-acwing">
            <img src="" width="30"> <!--一键登录图标-->
            <div> <!--图标下提示信息-->
                AcWingOS 一键登录
            </div>
        </div>
    </div>
</div>
`);
        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register.hide();

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    start() {
        this.getinfo();
    }

    register() {
        this.$login.hide();
        this.$register.show();
    }

    login() {
        this.$register.hide();
        this.$login.show();
    }

    getinfo() {
        let outer = this;

        $.ajax({
            url: "https://app2433.acapp.acwing.com.cn/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function(resp) {
                console.log(resp);
                if (resp.result === "success") {
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                } else {
                    outer.login();
                }
            }
        });
    }

    hide() {
        this.$settings.hide();
    }

    show() {
        this.$settings.show();
    }



}
