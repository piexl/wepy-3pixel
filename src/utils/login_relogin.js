import wepy from 'wepy'

const interfaces = {
    async login() {
        wepy.setStorageSync('_isLogin', false)
        wepy.setStorageSync('_isWebSocketOpen', false)

        //获得登录数据
        let loginData = {}
        try {
            loginData = await wepy.login()
        } catch (e) {
            console.log('调用登录接口wepy.login出错')
            /*wepy.showModal({
             title: '提示',
             content: `没有登录哦...`,
             showCancel: false
             })*/
            //console.log(e.message)
            //console.log(e.stack)
        }

        //获得微信提供的用户信息
        let userinfoRaw = {}
        try {
            if (loginData.code) {
                userinfoRaw = await wepy.getUserInfo()
                userinfoRaw.code = loginData.code

                wepy.setStorageSync('_isLogin', true)

                await wepy.showToast({
                    title: '登录成功',
                    icon: 'success',
                    duration: 1000
                })
            } else {
                console.log('登录时获取用户code失败！')
            }
        } catch (e) {
            //二次重新登录(可设计一个登录按钮，以方便于用户随时进行二次重新登录)
            let status = await wepy.showModal({
                title: '提示',
                content: `您之前没有允许登录哦~\n\n现在重新登录吧...`,
                cancelText: '好的',
                cancelColor: '#3CC51F',
                confirmText: '不了',
                confirmColor: '#666666'
            })

            if (status.cancel) {  //假如允许重新登录
                let res = await wepy.openSetting()
                if (res && res.authSetting['scope.userInfo']) {
                    try {
                        userinfoRaw = await wepy.getUserInfo()
                        userinfoRaw.code = loginData.code

                        wepy.setStorageSync('_isLogin', true)

                        await wepy.showToast({
                            title: '重新登录成功',
                            icon: 'success',
                        })
                    } catch (e) {
                        console.log('再次getUserInfo失败！')
                        return
                    }
                } else {
                    await wepy.showToast({
                        title: '您刚才没有授权“用户信息”哦',
                        image: '/assets/images/hint-bulb.png',
                    })
                    return
                }
            } else {
                await wepy.showToast({
                    title: '没关系，您可随时重新登录哦',
                    image: '/assets/images/trust.png',
                })
                return
            }
        }

        //获取后台服务器提供的用户信息
        let userinfo = {}
        try {
            userinfo = await wepy.request({
                url: '',  //这里填写后台登录url
                method: 'POST',
                header: {
                    'x-wechat-code': userinfoRaw.code,
                    'x-wechat-encrypted': userinfoRaw.encryptedData,
                    'x-wechat-iv': userinfoRaw.iv
                },
                dataType: 'json',
                data: {}
            })
            //后台服务器传过来的JSON数据，小程序端有时收到的是字符串，并不是JSON对象，而且字符串
            //前面还多了几个零宽空白字符，因此先trim一下(这里用replace函数trim)
            if (typeof userinfo.data === 'string') {
                userinfo.data = JSON.parse(userinfo.data.replace(/(^\s+)|(\s+$)/g, ''))
            }
        } catch (e) {
            /*wepy.showModal({
             title: '提示',
             content: `请求获取服务端登录态失败，请关闭后重新再试。${e.message}`,
             showCancel: false
             })*/
            console.log('请求获取服务端登录态失败')
            console.log(e.message)
            console.log(e.stack)
        }

        try {
            await wepy.setStorage({
                key: '_session',
                data: userinfo.data.data.session
            })
        } catch (e) {
            /*wepy.showModal({
             title: '提示',
             content: `客户端存储会话信息失败，请关闭后重新再试。${e.message}`,
             showCancel: false
             })*/
            console.log('客户端存储会话信息失败')
            console.log(e.message)
            console.log(e.stack)
        }
    }
}

export default interfaces