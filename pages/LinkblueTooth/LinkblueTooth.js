// pages/LinkblueTooth/LinkblueTooth.js
const util = require('../../utils/util.js')
Page({
  data: {
    hasDevices: false,
    linghtValue: 25,
    warmValue: 50,
    FirstNum: '68 02 01 01 02 ',
    FirstNumHEx: 110,//前面相加所得到的十进制6E
    sendHex: '',
    switchBoolean:false,//开关灯
    switchStatusBool:false,
    blueList:[],// 附近蓝牙列表
    deviceId: '',//连接蓝牙设备的id
    services: '',//UUId
    notifyId:'',//监听的ID
    writeId: '',//写入的ID
  },
  onLoad: function (options) {
    this.initBlue();//初始化蓝牙
    this.transformHex()//拿到初始的指令
  },
  // 计算出发送指令
  transformHex(){
    var that = this;
    var nowLightPercent = parseInt(this.data.linghtValue / 100 *255)
    var nowWarmPercent = parseInt(this.data.warmValue / 100 *255)
    // 前面的数值相加，转为二进制，并取最后的8位
    var binarySum = ((this.data.FirstNumHEx + nowLightPercent + nowWarmPercent).toString(2)).slice(-8)
    // 最后一位校验的值    二进制转换为十进制，再将其转换为十六进制
    var lastNum = parseInt(binarySum,2).toString(16)
    lastNum = lastNum.length < 2 ? ('0'+lastNum) : lastNum
    nowLightPercent = nowLightPercent.toString(16)
    nowWarmPercent = nowWarmPercent.toString(16)
    nowLightPercent = nowLightPercent.length < 2 ? ('0'+nowLightPercent) : nowLightPercent
    nowWarmPercent = nowWarmPercent.length < 2 ? ('0'+nowWarmPercent) : nowWarmPercent
    // 发送的指令
    var sendHex = this.data.FirstNum + nowLightPercent + ' ' + nowWarmPercent + ' ' + lastNum
    that.setData({
      sendHex
    })
    console.log(nowLightPercent, nowWarmPercent, '-------')
    console.log('取整后算出来的值', sendHex)
    if(!that.data.switchBoolean) return;//是否具备可开启灯的状态
    if (!that.data.deviceId || !that.data.switchStatusBool) {
      wx.showToast({
        title: '请先连接蓝牙设备',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    that.sendNotice(that.data.sendHex); //发送开灯的指令
  },
  // 亮度的滑动
  changeLightValueHandle : util.throttle(function (event) {
    var that = this;
    var nowLightValue = event.detail.value
    that.setData({
      linghtValue: nowLightValue
    })
    that.transformHex()//滑动后结算出要发送的指令
    // console.log(this.data.sendHex, '滑动计算出来的指令')
  }, 100),
  // 亮度滑动后抬起
  compleLightHadle(event){
    var that = this;
    var nowLightValue = event.detail.value
    console.log(nowLightValue,that.data.linghtValue)
    // 抬起得最后一步与开始的一步不相等
    if(nowLightValue != that.data.linghtValue){
      that.setData({
        linghtValue: nowLightValue
      })
      that.transformHex()//滑动后结算出要发送的指令
      // console.log(this.data.sendHex, '滑动计算出来的指令，抬起滑动')
    }
  },
  // 改变温度
  changeWarmValueHandle : util.throttle(function (event) {
    var that = this;
    var nowWarmtValue = event.detail.value
    that.setData({
      warmValue: nowWarmtValue
    })
    that.transformHex()//滑动后结算出要发送的指令
    console.log(this.data.sendHex, '滑动计算出来的指令')
  }),
  // 温度滑动后抬起
  compleWarmHadle(event){
    var that = this;
    var nowWarmtValue = event.detail.value
    console.log(nowWarmtValue,that.data.warmValue)
    // 抬起得最后一步与开始的一步不相等
    if(nowWarmtValue != that.data.warmValue){
      that.setData({
        warmValue: nowWarmtValue
      })
      that.transformHex()//滑动后结算出要发送的指令
    }
  },
  // 断开蓝牙连接
  breakBlue(){
    var that = this
    wx.closeBluetoothAdapter({
      success: function (res) {
        that.setData({
          deviceId: '',
          hasDevices: true,
          switchBoolean: false
        })
        wx.removeStorageSync('deviceId')
        wx.showToast({
          title: '蓝牙已断开',
          icon: 'none',
          duration: 1000
        })
        // wx.removeStorage({
        //   key: 'deviceId',
        //   success (res) {
        //     console.log(res)
        //     wx.showToast({
        //       title: '蓝牙已断开',
        //       icon: 'fails',
        //       duration: 1000
        //     })
        //   }
        // })
        wx.openBluetoothAdapter({//调用微信小程序api 打开蓝牙适配器接口
          success: function (res) {
            console.log('断开蓝牙后,进行蓝牙的初始化')
          },
          fail: function (res) {//如果手机上的蓝牙没有打开，可以提醒用户
            wx.showToast({
              title: '请开启蓝牙',
              icon: 'none',
              duration: 1000
            })
          }
        })
      }
    })
  },
  // 蓝牙的初始化
  initBlue(){
    var that = this;
    wx.openBluetoothAdapter({//调用微信小程序api 打开蓝牙适配器接口
      success: function (res) {
        // console.log(res)
        // wx.showToast({
        //   title: '初始化成功',
        //   icon: 'success',
        //   duration: 800
        // })
        // 拿到储存的设备信息，直接进行连接
        var deviceId = wx.getStorageSync('deviceId')
        if(deviceId){
          that.setData({
            deviceId
          })
          that.goConnect(deviceId)
        } else{
          that.findBlue();//搜索蓝牙的设备
        }
        // wx.getStorage({
        //   key: 'deviceId',
        //   success (res) {
        //     console.log('拿到存储设备的信息')
        //     console.log(res.data)
        //     if(res.data){
        //       that.setData({
        //         deviceId: res.data
        //       })
        //     }
        //   }
        // })
        // that.findBlue();//搜索蓝牙的设备
      },
      fail: function (res) {//如果手机上的蓝牙没有打开，可以提醒用户
        wx.showToast({
          title: '请开启蓝牙',
          icon: 'none',
          duration: 1000
        })
      }
    })
  },
  // 搜索蓝牙设备
  findBlue(){
    var that = this
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: false,
      interval: 0,
      success: function (res) {
        wx.showLoading({
          title: '正在搜索设备',
          mask:true

        })
        that.getBlue()//得到所有蓝牙设备的信息
      }
    })
  },
  // 得到所有蓝牙设备的信息
  getBlue(){
    var that = this
    wx.getBluetoothDevices({
      success: function(res) {
        wx.hideLoading();
        console.log(res.devices)
        var blueList = []
        var deviceId;//当前找到的设备对应的id
        function testFunc(item){return item.id == deviceId ;}
        for (var i = 0; i < res.devices.length; i++){
           if (res.devices[i].name != '未知设备'){
            //  进行数组相同的设备进行排除
            deviceId = res.devices[i].deviceId
            blueList.findIndex(testFunc) == -1 
            ? blueList.push(res.devices[i]) 
            : console.log('已存在该设备');
            that.setData({
              hasDevices: true,
              blueList
            })
            // that.connetBlue(res.devices[i].deviceId);//链接这个蓝牙设备
          }
        }
        console.log(that.data.blueList)
      },
      fail: function(){
        that.setData({
          hasDevices: false
        })
        wx.showToast({
          title: '搜索蓝牙设备失败或附件暂无开启的蓝牙设备',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  //点击连接蓝牙设备
  goConnect: function(event) { //根据设备id连接
    var deviceId;
    if(this.data.deviceId){
      deviceId = event
      console.log('存储中拿到的id')
    } else{
      deviceId = event.currentTarget.dataset.deviceid;
      console.log('点击连接的', deviceId)
    }
    wx.showLoading({
      title: '连接中...',
      mask:true
    })
    this.connetBlue(deviceId);//连接蓝牙的设备
  },
  // 连接蓝牙的设备
  connetBlue: function(deviceId) { //根据某一id连接设备，4.0
    var that = this;
    wx.createBLEConnection({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: deviceId, //设备id
      success: function(res) {
        console.log(res)
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })
        wx.stopBluetoothDevicesDiscovery({
          success: function(res) {
            console.log('连接蓝牙成功之后关闭蓝牙搜索');
          }
        })
        console.log('链接成功')
        // that.getTheBlueDisConnectWithAccident(); //连接成功后，开始监听异常
        that.setData({
          switchStatusBool: true,
          hasDevices: false,
          deviceId
        })
        that.getServiceId(); //获取这个蓝牙设备的服务uuid
        // 将已链接的设备存储起来
        wx.setStorageSync('deviceId', deviceId)
        // wx.setStorage({
        //   key:"deviceId",
        //   data:deviceId
        // })
      },
      fail: function(err) {
        console.log(err)
        wx.hideLoading();
        // 蓝牙已连接
        if(err.errCode == -1){
          wx.stopBluetoothDevicesDiscovery({
            success: function(res) {
              console.log('连接蓝牙成功之后关闭蓝牙搜索');
            }
          })
          that.setData({
            switchStatusBool: true,
            hasDevices: false,
            deviceId
          })
          that.getServiceId(); //获取这个蓝牙设备的服务uuid
        } else if(err.errCode == '10003' || err.errCode == '10006' || err.errCode == '10012'){
          that.setData({
            deviceId: ''
          })
          wx.removeStorageSync('deviceId')
          setTimeout(function(){
            wx.showToast({
              title: '连接失败，请重试',
              icon: 'none',
              duration: 1000
            })
          }, 100)
        } else if(err.errCode == '10001' || err.errCode == '10000'){
          wx.showToast({
            title: '请开启蓝牙',
            icon: 'none',
            duration: 1000
          })
        }
      },
      complete: function(event) {
        console.log("event",event)
        // wx.hideLoading();
      }
    })
  },
  // 获取这个蓝牙设备的服务uuid
  getServiceId(){
    var that = this
    wx.getBLEDeviceServices({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: that.data.deviceId,
      success: function (res) {
        console.log('连接成功后获取这个的UUID')
        console.log(res.services)
        var model = res.services[0]
        that.setData({
          services: model.uuid
        })
        that.getCharacteId()//获取特征值
      }
    })
  },
  // 获取特征值
  getCharacteId(){
    var that = this 
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接,设备的ID
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: that.data.services,
      success: function (res) {
        console.log(res)
        for (var i = 0; i < res.characteristics.length; i++) {//2个值
          var model = res.characteristics[i]
          if (model.properties.notify == true) {
            that.setData({
              notifyId: model.uuid//监听的值
            })
            // that.startNotice(model.uuid)//7.0
          }
          if (model.properties.write == true){
            that.setData({
              writeId: model.uuid//用来写入的值
            })
            // console.log(that.data.writeId)
            // that.sendOpen()//发送打开的指令
          }
        }
      }
    })
  },
  //发送开灯的指令
  openHandle() {
    this.setData({
      switchBoolean: true
    })
    this.transformHex()//拿到初始的指令
  },
  //发送关灯的指令
  shutHandle(){
    var that = this;
    that.setData({
      switchBoolean: false
    })
    if (!that.data.deviceId || !that.data.switchStatusBool) {
      wx.showToast({
        title: '请先连接蓝牙设备',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    that.sendNotice('68 02 01 01 02 00 00 6E'); //发送获取时间指令
  },
  // 亮度50%
  lightHandle(){
    var that = this;
    if (!that.data.deviceId) {
      wx.showToast({
        title: '请先连接蓝牙设备',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    console.log('50%亮度的灯')
    that.sendNotice('68 02 01 01 02 7F 00 ED'); //发送获取时间指令
  },
  // 温度50%
  warmHandle(){
    var that = this;
    if (!that.data.deviceId) {
      wx.showToast({
        title: '请先连接蓝牙设备',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    console.log('50%温度的灯')
    that.sendNotice('68 02 01 01 02 00 7F ED'); //发送获取时间指令
  },
  // 50%-50%
  middleHandle(){
    var that = this;
    if (!that.data.deviceId) {
      wx.showToast({
        title: '请先连接蓝牙设备',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    console.log('50%-灯')
    that.sendNotice('68 02 01 01 02 7F 7F 6C'); //发送获取时间指令
  },
  // data灯
  setDataHandle(){
    var that = this;
    if (!that.data.deviceId) {
      wx.showToast({
        title: '请先连接蓝牙设备',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    console.log('50%-灯')
    console.log(that.data.sendHex)
    that.sendNotice(that.data.sendHex); //发送获取时间指令
  },
  //给设备发送指令函数
  sendNotice: function(str) { 
    var that = this;
    // clearInterval(that.data.inter)
    // that.countdown()
    var buffer = that.stringToArrayBuffer(str);
    that.setData({
      showSleep: true
    });
    console.log(buffer)
    console.log("发送指令")
    console.log("str: " + str);
    // console.log(that.data.writeId)
    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: that.data.services,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: that.data.writeId, //第二步写入的特征值
      // 这里的value是ArrayBuffer类型
      value: buffer,
      success: function(res) {
        console.log(res)
        console.log("writeBLECharacteristicValue:写入成功");

      },
      fail: function(err) {
        console.log(err)
        console.log('写入失败');
        if(err.errCode == '10003' || err.errCode == '10006'){
          wx.showModal({
            title: '提示',
            content: '蓝牙已断开',
            success(res) {
              that.setData({
                switchStatusBool: false,
                hasDevices: true,
                switchBoolean:false
              })
            }
          })
        } else if(err.errCode == '10001' || err.errCode == '10000'){
          wx.showToast({
            title: '请开启蓝牙',
            icon: 'none',
            duration: 1000
          })
        }
        
      },
      complete: function() {
        console.log("写入结束complete。。。");
        // that.setData({
        //   showSleep: false
        // })
      }
    })
  },
  //  将字符串转换成ArrayBufer
  stringToArrayBuffer(hex) {
    hex = hex.replace(/\s+/g, '');
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function(h) {
      return parseInt(h, 16)
    }))
    return typedArray.buffer
  },
  onReady: function () {

  },
  onShow: function () {

  }
})