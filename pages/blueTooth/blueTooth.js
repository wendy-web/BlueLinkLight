// pages/blueTooth/blueTooth.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    devices: [], //可用设备列表
    devicesTime: '', //设备上的时间
    serviceId: [], //设备serviceId
    timer: '', //定时器
    time: '00:01',
    alarmtime: '00:01',
    switch1Checked: true,
    showAlarm: false, //显示闹钟部分
    showSleep: false, //
    volume: 0, //音量
    inter: '', //定时器
    array: ['主人', '亲爱的', '哥哥', '姐姐'],
    appellation: "", //称谓
  },
  // bindViewTap: function () {
  //   wx.navigateTo({
  //     url: '../control/control'
  //   })
  // },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {


    try {
      // 同步接口立即返回值
      // 获取当前称谓
      var value1 = wx.getStorageSync('appellation') || 0
      this.setData({
        index: value1,
      })
      console.log(value1)
      // 获取当前音量
      var value2 = wx.getStorageSync('volume') || 0

      this.setData({
        volume: value2
      })
      console.log(value2)
    } catch (e) {
      console.log(e)
      console.log('读取发生错误')
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },


  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  // 倒计时5分钟 5分钟内无指令断开
  // countdown: function () {
  //   var that = this;
  //   var time = 60;
  //   that.data.inter = setInterval(function () {
  //     if (time <= 0) {
  //       clearInterval(that.data.inter)
  //       that.closeConnect()
  //     }
  //     else{
  //       time--;
  //       console.log(time)
  //     }
  //   }.bind(this), 1000);

  // },
  // 初始化蓝牙
  initBlue: function() { //1.0
    var that = this;
    wx.openBluetoothAdapter({ //初始化蓝牙模块
      success(res) {
        wx.showToast({
          title: '初始化成功',
          icon: 'success',
          duration: 800
        })
        that.findBlue(); //2.0
      },
      fail(err) {
        wx.showToast({
          title: '请检查是否已开启蓝牙',
          icon: 'none',
          duration: 1500
        })
      }
    })
  },
  // 搜索蓝牙
  findBlue: function() { //手机蓝牙初始化成功之后，就会去搜索周边的蓝牙设备
    var that = this;
    wx.startBluetoothDevicesDiscovery({
      success(res) {
        // console.log(res,'2.0')
        wx.showLoading({
          title: '正在搜索设备',
        })
        that.getBlue() //3.0
      }
    })
  },
  // 设备信息
  getBlue: function() { //获取搜索到的设备信息,3.0
    var that = this;
    wx.getBluetoothDevices({
      success: function(res) {
        console.log(res.devices)
        that.setData({
          devices: res.devices,
          hasDevices: true
        })
      },
      fail: function() {
        console.log("搜索蓝牙设备失败");
        that.setData({
          hasDevices: false
        })
        wx.showToast({
          title: '搜索蓝牙设备失败或附件暂无开启的蓝牙设备',
          icon: 'none',
          duration: 2000
        })
      },
      complete: function() {
        wx.hideLoading();
      }
    })
  },
  goConnect: function(event) { //根据设备id连接
    var deviceId = event.currentTarget.dataset.deviceid;
    this.setData({
      deviceId
    })
    wx.showLoading({
      title: '连接中...',
    })
    this.connetBlue(deviceId);
  },
  // 蓝牙连接
  connetBlue: function(deviceId) { //根据某一id连接设备，4.0
    var that = this;
    wx.createBLEConnection({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: deviceId, //设备id
      success: function(res) {
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 800
        })
        wx.stopBluetoothDevicesDiscovery({
          success: function(res) {
            console.log('连接蓝牙成功之后关闭蓝牙搜索');
          }
        })
        console.log('链接成功')
        that.getTheBlueDisConnectWithAccident(); //连接成功后，开始监听异常
        that.getServiceId(deviceId); //5.0
        that.setData({
          hasDevices: false
        })
      },
      fail: function(err) {
        wx.showToast({
          title: '连接失败，请重试',
          icon: 'none'
        })
      },
      complete: function() {
        wx.hideLoading();
      }
    })
  },

  // 这边的这个设备的第一个serviceid的特征值支持写入 第二个serviceid的特征值支持监听 所以写死了写入取第一个，监听取第二个，这样一开始展示界面会比较快，如果其他设备是不是同样的第一个serviceid的特征值支持写入 第二个serviceid的特征值支持监听，还是说不确定的，这样就需要遍历  一开始耗费时间会比较长


  // 先监听后写入
  // 获取蓝牙服务id
  getServiceId: function(deviceId) { //连接上需要的蓝牙设备之后，获取这个蓝牙设备的服务uuid,5.0
    var that = this
    wx.getBLEDeviceServices({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: deviceId,
      success: function(res) {
        // console.log("获取特征值")
        console.log(res.services)
        that.setData({
          serviceId: res.services
        })
        // console.log("222222222",that.data.serviceId)
        // for(var i=0;i<res.services.length;i++){
        //   var model = res.services[i]
        // that.setData({
        //   services: model.uuid
        // })
        // console.log(deviceId)
        //notify取第二个serviceid特征值的第一个
        // that.getCharacteId("0000FFE0-0000-1000-8000-00805F9B34FB", deviceId) //6.0
        that.getCharacteIdNotify(that.data.serviceId[1].uuid, deviceId) //6.0
        // that.getCharacteIdWrite("0000FFE5-0000-1000-8000-00805F9B34FB", "5B9BF465-7CDB-0664-E309-D3467CCA9C79") //6.0
        // }

      }
    })
  },
  // 获取蓝牙特征值(写入)
  getCharacteIdWrite: function(services, deviceId) { //6.0必须具有某些特征值，所以通过上面步骤获取的id可以查看当前蓝牙设备的特征值
    var that = this
    var writeServices = services
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: deviceId,
      // 这里的 serviceId 需要 getBLEDeviceServices 接口中获取
      serviceId: services,
      success: function(res) {
        console.log("getBLEDeviceCharacteristics", res.characteristics[0].uuid)
        that.setData({
          writeId: res.characteristics[0].uuid, //用来写入的值
          wirteService: services
        })
        // setTimeout(() => {
        that.getTime(); //获取设备时间
        // }, 1000)
      }
    })
  },
  //获取蓝牙特征值(监听)
  getCharacteIdNotify: function(services, deviceId) { //6.0必须具有某些特征值，所以通过上面步骤获取的id可以查看当前蓝牙设备的特征值
    var that = this
    var notifyServices = services
    // var writeServices = "0000FFE5-0000-1000-8000-00805F9B34FB"
    wx.getBLEDeviceCharacteristics({
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: deviceId,
      // 这里的 serviceId 需要 getBLEDeviceServices 接口中获取
      serviceId: services,
      success: function(res) {
        console.log("getBLEDeviceCharacteristics", res)
        // for (let model of res.characteristics) {//2个值
        // if (model.properties.notify == true) {
        that.setData({
          notifyId: res.characteristics[0].uuid, //监听的值
          notifyServices
        })
        console.log(that.data.notifyId)
        that.startNotice(that.data.notifyId) //7.0,开始侦听数据
        // }
        // if (model.properties.write == true) {
        // that.setData({
        //   writeId: "0000FFE9-0000-1000-8000-00805F9B34FB", //用来写入的值
        //   wirteService: "0000FFE5-0000-1000-8000-00805F9B34FB"
        // })
        // }
        // if (model.properties.read == true){
        // that.setData({
        //   readId: "00002A19-0000-1000-8000-00805F9B34FB", //用来读的值
        //   readService: "0000180F-0000-1000-8000-00805F9B34FB"
        // })
        // }
        // if (model.properties.indicate == true) {
        //   that.setData({
        //     indicateId: model.uuid,//用来备用
        //   })
        // }
      }
      // }
    })
  },
  //获取设备时间
  getTime() {
    var that = this;
    if (!that.data.deviceId) {
      wx.showToast({
        title: '请先连接蓝牙设备',
      });
      return;
    }
    that.sendNotice('A5 FA 03 00 00 00 A2 FB'); //发送获取时间指令
  },
  //取消闹钟
  cacelAlarmClock() {
    var that = this;
    that.sendNotice('A5 FA 05 00 00 00 A4 FB');
  },
  // 指令测试
  // sendstr(){
  //   var that = this; 
  //   that.sendNotice('A5 FA 00 03 06 00 A8 FB');
  // },
  // 停止闹钟
  stopAlarmClock() {
    var that = this;
    console.log("停止闹钟")
    // that.closeConnect()
    that.sendNotice('A5 FA 00 03 10 00 B2 FB');
  },
  // 设置设备时间
  setTime(hour, minutes) {
    let checksum = 165 + 250 + 1 + parseInt(hour) + parseInt(minutes);
    hour = this.deal16string(hour);
    minutes = this.deal16string(minutes);
    checksum = checksum.toString(16);
    checksum = checksum.substr(checksum.length - 2, 2)
    this.sendNotice('A5FA01' + hour + minutes + '00' + checksum + 'FB');
  },
  //获取闹钟
  getAlarmClock() {
    this.sendNotice('A5 FA 04 00 00 00 A3 FB'); //发送获取闹钟指令
  },
  //设置闹钟
  setAlarmClock(hour, minutes) {
    let checksum = 165 + 250 + 2 + parseInt(hour) + parseInt(minutes);
    hour = this.deal16string(hour);
    minutes = this.deal16string(minutes);
    checksum = checksum.toString(16);
    checksum = checksum.substr(checksum.length - 2, 2);
    this.sendNotice('A5FA02' + hour + minutes + '00' + checksum + 'FB');
    // this.sendNotice('A5 FA 02 00 02 00 A3 FB')
  },

  setNickname() {
    this.sendNotice('A5 FA 00 02 02 00 A3 FB');
  },
  // 设置时间出发的picker
  bindTimeChange: function(e) {
    var valueTime = (e.detail.value).split(':');
    this.setData({
      time: e.detail.value
    })
    this.setTime(valueTime[0], valueTime[1]);
  },
  //设置闹钟
  bindAlarmChange: function(e) {
    var valueTime = (e.detail.value).split(':');
    this.setData({
      alarmtime: e.detail.value
    })
    this.setAlarmClock(valueTime[0], valueTime[1]);
  },
  // 打开关闭闹钟
  switch1Change: function(e) { 
    this.setData({
      switch1Checked: e.detail.value
    });
    if (e.detail.value) {
      this.setAlarmClock(this.data.alarmHour, this.data.alarmMinute);
    } else {
      this.cacelAlarmClock();
    }
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
    console.log(that.data.writeId)
    wx.writeBLECharacteristicValue({
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: that.data.serviceId[0].uuid,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: that.data.writeId, //第二步写入的特征值

      // 这里的value是ArrayBuffer类型
      value: buffer,
      success: function(res) {
        // console.log(that.data.wirteService)
        // console.log(that.data.writeId)
        // console.log(res)
        // console.log(str.substr(4, 2));
        // console.log(str.substr(6, 2));
        // console.log('writeBLECharacteristicValue success', res.errMsg)
        // console.log(str.substr(12, 2));
        if (str.substr(4, 2) == '01') { //设置时间
          that.getTime();
          wx.showToast({
            title: '设置成功!',
            icon: 'success',
            duration: 2000
          })
        } else if (str.substr(6, 2) == '05') { //取消闹钟
          // console.log("取消闹钟")
          // that.cacelAlarmClock()
          that.setData({
            switch1Checked: false
          })
          wx.showToast({
            title: '已取消闹钟!',
            icon: 'success',
            duration: 2000
          })
        } else if (str.substr(4, 2) == '02') { //闹钟
          // console.log("设置成功闹钟")
          wx.showToast({
            title: '设置成功!',
            icon: 'success',
            duration: 2000
          })
          that.getAlarmClock();
        } else if (str.substr(12, 2) == '11' || str.substr(12, 2) == '12' || str.substr(12, 2) == '13' || str.substr(12, 2) == '14' || str.substr(12, 2) == '15' || str.substr(12, 2) == '16' || str.substr(12, 2) == '17') { //设置音量
          // console.log("设置成功音量")
          that.sendNotice("A5 FA 00 03 03 00 A5 FB") 
        }
        // 为了兼容问题，写入后，重新读取一遍
        // wx.readBLECharacteristicValue({
        //   deviceId: "5B9BF465-7CDB-0664-E309-D3467CCA9C79",
        //   // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
        //   serviceId: "0000180F-0000-1000-8000-00805F9B34FB",
        //   // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
        //   characteristicId: "00002A19-0000-1000-8000-00805F9B34FB",
        //   success: function (res) {
        //     console.log('readBLECharacteristicValue')
        //   }
        // })
        console.log("writeBLECharacteristicValue:写入成功");

      },
      fail: function(err) {
        console.log(err)
        console.log('写入失败');
        wx.showModal({
          title: '提示',
          content: err.errMsg,
          success(res) {}
        })
      },
      complete: function() {
        // console.log("写入结束complete。。。");
        that.setData({
          showSleep: false
        })
      }
    })
  },
  // 开始监听
  startNotice(uuid) {
    var that = this;
    console.log("deviceId", that.data.deviceId)
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
      deviceId: that.data.deviceId,
      // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
      serviceId: that.data.serviceId[1].uuid,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: uuid, //第一步 开启监听 notityid  第二步发送指令 write
      success: function(res) {
        console.log(res)
        //测试1
        console.log("deviceId", that.data.deviceId)
        that.oncharChange();
      },
      fail: function(err) {
        console.log(err)
      }
    })
  },
  oncharChange() { //监听回调
    var that = this;
    // 设备返回的方法
    console.log("监听设备返回信息的方法");
    wx.onBLECharacteristicValueChange(function(res) {
      console.log("开始监听");
      // 此时可以拿到蓝牙设备返回来的数据是一个ArrayBuffer类型数据，所以需要通过一个方法转换成字符串
      console.log("res-onBLECharacteristicValueChange", res)
      console.log("监听设备返回信息");
      console.log(res.value);
      console.log(that.ab2hex(res.value))
      var nonceId = that.ab2hex(res.value);
      console.log("nonceId", nonceId);
      console.log(nonceId.substr(4, 2));
      if (nonceId.substr(4, 2) == '03') { //获取到的时间
        let hours = that.hex2int(nonceId.substr(6, 2));
        let minutes = that.hex2int(nonceId.substr(8, 2));
        let seconds = that.hex2int(nonceId.substr(10, 2));
        that.setData({
          hours: that.fixInt(hours),
          minutes: that.fixInt(minutes),
          seconds: that.fixInt(seconds)
        })
        clearInterval(that.data.timer)
        that.data.timer = setInterval(that.dealTime, 1000);
      } else if (nonceId.substr(4, 2) == '04') { //获取到闹钟
        console.log(nonceId)
        var alarmHour = that.fixInt(that.hex2int(nonceId.substr(6, 2)));
        var alarmMinute = that.fixInt(that.hex2int(nonceId.substr(8, 2)));
        var status = that.hex2int(nonceId.substr(10, 2));
        console.log(status)
        that.setData({
          alarmHour,
          alarmMinute,
          showAlarm: true,
          switch1Checked: status == 1 ? true : false
        })
      } else if (nonceId.substr(4, 2) == '64') {
        console.log("646464");
        let hours = that.hex2int(nonceId.substr(6, 2));
        let minutes = that.hex2int(nonceId.substr(8, 2));
        let seconds = that.hex2int(nonceId.substr(10, 2));
        console.log("hours: " + hours);
        console.log("minutes: " + minutes);
        console.log("seconds: " + seconds);
        that.setData({
          hours: that.fixInt(hours),
          minutes: that.fixInt(minutes),
          seconds: that.fixInt(seconds)
        })
        clearInterval(that.data.timer)
        that.data.timer = setInterval(that.dealTime, 1000);
      }
    })
    console.log(that.data.serviceId)
    // 写入取第一个serviceId的特征值 
    that.getCharacteIdWrite(that.data.serviceId[0].uuid, that.data.deviceId) //6.0
  },

  dealTime() {
    if (this.data.seconds < 59) this.setData({
      seconds: this.fixInt(parseInt(this.data.seconds) + 1)
    })
    else {
      if (this.data.minutes < 59) this.setData({
        minutes: this.fixInt(parseInt(this.data.minutes) + 1),
        seconds: '00'
      })
      else {
        if (this.data.hours < 24) this.setData({
          hours: this.fixInt(parseInt(this.data.hours) + 1),
          minutes: '00'
        })
        else {
          this.setData({
            hours: '00',
            minutes: '00',
            seconds: '00'
          })
        }
      }
    }
  },
  /**
   * 将字符串转换成ArrayBufer
   */
  stringToArrayBuffer(hex) {
    hex = hex.replace(/\s+/g, '');
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function(h) {
      return parseInt(h, 16)
    }))
    return typedArray.buffer
  },
  /**
   * 将ArrayBuffer转换成字符串
   */
  ab2hex(buffer) {
    console.log("buffer", buffer)
    let hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function(bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    console.log("hexArr", hexArr)
    return hexArr.join('');
  },
  hex2int(hex) {
    var len = hex.length,
      a = new Array(len),
      code;
    for (var i = 0; i < len; i++) {
      code = hex.charCodeAt(i);
      if (48 <= code && code < 58) {
        code -= 48;
      } else {
        code = (code & 0xdf) - 65 + 10;
      }
      a[i] = code;
    }

    return a.reduce(function(acc, c) {
      acc = 16 * acc + c;
      return acc;
    }, 0);
  },
  fixInt(count) {
    return count < 10 ? '0' + count : count
  },
  deal16string(str) {
    var hour = Number(str).toString(16);
    if (hour.length < 2) hour = `0${hour}`;
    return hour
  },
  getTheBlueDisConnectWithAccident: function(e) { //// 该方法回调中可以用于处理连接意外断开等异常情况
    var that = this;
    wx.onBLEConnectionStateChange(function(res) {
      // console.log(res)
      if (!res.connected) {
        console.log('连接已断开');
        wx.showModal({
          title: '提示',
          content: '蓝牙已断开，请重新搜索重连！',
          success(res) {}
        })
        clearInterval(that.data.timer)
      }
    })
  },
  btn_minus(e) { //音量减
    var that = this;
    if (that.data.volume >= 1) {
      that.setData({
        volume: that.data.volume - 1
      })
    }
    console.log(that.data.volume)
    if (that.data.volume == 1) {
      that.sendNotice("A5 FA 00 03 11 00 A6 FB")
    }
    if (that.data.volume == 2) {
      that.sendNotice("A5 FA 00 03 12 00 A7 FB")
    }
    if (that.data.volume == 3) {
      that.sendNotice("A5 FA 00 03 13 00 A8 FB")
    }
    if (that.data.volume == 4) {
      that.sendNotice("A5 FA 00 03 14 00 A9 FB")
    }
    if (that.data.volume == 5) {
      that.sendNotice("A5 FA 00 03 15 00 BA FB")
    }
    if (that.data.volume == 6) {
      that.sendNotice("A5 FA 00 03 16 00 BB FB")
    }
    if (that.data.volume == 7) {
      that.sendNotice("A5 FA 00 03 17 00 BC FB")
    }

    try {
      // 同步接口立即写入.本地存储
      wx.setStorageSync('volume', that.data.volume)
      console.log('写入volume成功')
    } catch (e) {
      console.log('写入volume发生错误')

    }
  },
  btn_add(e) { //音量加
    var that = this;
    if (that.data.volume < 7) {
      that.setData({
        volume: that.data.volume + 1
      })
    }
    try {
      // 同步接口立即写入
      wx.setStorageSync('volume', that.data.volume)
      console.log('写入volume成功')
    } catch (e) {
      console.log('写入volume发生错误')
    }

    console.log(that.data.volume)
    if (that.data.volume == 1) {
      that.sendNotice("A5 FA 00 03 11 00 A6 FB")
    }
    if (that.data.volume == 2) {
      that.sendNotice("A5 FA 00 03 12 00 A7 FB")
    }
    if (that.data.volume == 3) {
      that.sendNotice("A5 FA 00 03 13 00 A8 FB")
    }
    if (that.data.volume == 4) {
      that.sendNotice("A5 FA 00 03 14 00 A9 FB")
    }
    if (that.data.volume == 5) {
      that.sendNotice("A5 FA 00 03 15 00 BA FB")
    }
    if (that.data.volume == 6) {
      that.sendNotice("A5 FA 00 03 16 00 BB FB")
    }
    if (that.data.volume == 7) {
      that.sendNotice("A5 FA 00 03 17 00 BC FB")
    }
  },
  // // 选择昵称
  bindPickerChange: function(e) {
    console.log(e.detail.value)
    var that = this
    console.log('picker发送选择改变，携带值为', e.detail.value)
    that.setData({
      index: e.detail.value,
    })
    var buffer = 'A5 FA 00 02 01 00 A2 FB'
    if (e.detail.value == 0) {
      buffer = 'A5 FA 00 02 01 00 A2 FB'
    } else if (e.detail.value == 1) {
      buffer = 'A5 FA 00 02 02 00 A3 FB'
    } else if (e.detail.value == 2) {
      buffer = 'A5 FA 00 02 03 00 A4 FB'
    } else if (e.detail.value == 3) {
      buffer = 'A5 FA 00 02 04 00 A5 FB'
    }
    try {
      // 同步接口立即写入
      wx.setStorageSync('appellation', e.detail.value)
      console.log('写入appellation成功')
    } catch (e) {
      console.log('写入appellation发生错误')
    }
    // 发送指令
    that.sendNotice(buffer)
    // setTimeout(() => {
    //   var buffers = that.stringToArrayBuffer(buffer);
    //   wx.writeBLECharacteristicValue({
    //     // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    //     deviceId: "5B9BF465-7CDB-0664-E309-D3467CCA9C79",
    //     // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
    //     serviceId: "0000FFE5-0000-1000-8000-00805F9B34FB",
    //     // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
    //     characteristicId: "0000FFE9-0000-1000-8000-00805F9B34FB", //第二步写入的特征值
    //     // 这里的value是ArrayBuffer类型
    //     value: buffers,
    //     success: function(res) {
    //       // wx.showModal({
    //       //   title: '提示',
    //       //   content: '更改成功',
    //       //   success(res) { }
    //       // })
    //       console.log(res)
    //       console.log(buffer)
    //       console.log("writeBLECharacteristicValue:写入成功")
    //     },
    //     fail: function(err) {
    //       console.log(err)
    //       console.log('写入失败');
    //       wx.showModal({
    //         title: '提示',
    //         content: err.errMsg,
    //         success(res) {}
    //       })

    //     },
    //   })
    //   // 为了兼容问题，写入后，重新读取一遍


    // }, 500);

  },
  // 断开设备连接
  closeConnect() {
    var that = this
    if ("5B9BF465-7CDB-0664-E309-D3467CCA9C79") {
      wx.closeBLEConnection({
        deviceId: that.data.deviceId,
        success: function(res) {
          that.closeBluetoothAdapter()
        },
        fail(res) {}
      })
    } else {
      that.closeBluetoothAdapter()
    }
  },
  // 关闭蓝牙模块
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter({
      success: function(res) {
        console.log("断开蓝牙")
      },
      fail: function(err) {}
    })
  },
})