var vue = new Vue({
  el: "#page-box",
  data: {
    isDark: false,
    nobuyVip: false,
    isUseCoin: false,
    useCoinNum: 0,
    userHash: "",
    payWay: "appleStore",
    coinExchangeMoeyRate: 0.002,
    systemInfo: {
      platform: "iOS",
      isAwaitR: false,
    },
    userInfo: {
      vip: "0000000",
      isVip: false,
      vipClass: "",
      vipEndTime: "1900-01-01T:00:00:00",
      nickname: "软媒用户",
      rank: 0,
      medal: "",
      coin: 0,
    },
  },
  computed: {
    useCoinNumModel: {
      get: function () {
        var that = this;
        return that.useCoinNum;
      },
      set: function (value) {
        var that = this;
        if (that.maxCoinDeduction < value)
          this.useCoinNum = that.maxCoinDeduction;
        else if (value % (1 / that.coinExchangeMoeyRate) === 0)
          this.useCoinNum = value;
        else {
          this.useCoinNum = value - (value % (1 / that.coinExchangeMoeyRate));
        }
      },
    },
    //当前购买会员的苹果商品id
    nowBuyVipAppleStoreProductId: function () {
      var that = this;
      //当前只有黄金会员，增加多种会员时，可在这里判断url参数，切换产品
      return "com.ruanmei.ithome.vip.auto";
    },
    nowBuyVipName: function () {
      var that = this;
      //当前只有黄金会员，增加多种会员时，可在这里判断url参数，切换会员名称
      return "一年黄金会员";
    },
    //当前购买的vip价格
    nowBuyVipPrice: function () {
      var that = this;
      //当前只有黄金会员，增加多种会员时，可在这里判断url参数，切换会员类型、价格
      return 98;
    },
    //当前购买Vip Paytype
    nowBuyVipPayType: function () {
      var that = this;
      var payType = -1;
      switch (that.payWay) {
        case "aliPay":
          payType = 0;
          break;
        case "weChatPay":
          payType = 1;
          break;
        case "appleStore":
        case "allCoin":
          payType = 2;
          break;
        default:
          payType = -1;
          break;
      }
      return payType;
    },
    //最多使用金币数量
    maxCoinDeduction: function () {
      var that = this;
      if (that.nowBuyVipCoinPrice <= that.userInfo.coin) {
        return that.nowBuyVipCoinPrice;
      } else {
        return (
          that.userInfo.coin -
          (that.userInfo.coin % (1 / that.coinExchangeMoeyRate))
        );
      }
    },
    maxCoinDeductionMoney: function () {
      var that = this;
      return (
        Math.floor(
          parseFloat(that.maxCoinDeduction * that.coinExchangeMoeyRate) * 100
        ) / 100
      ).toFixed(2);
    },
    //当前全金币购买的vip使用金币数量
    nowBuyVipCoinPrice: function () {
      var that = this;
      return that.nowBuyVipPrice / that.coinExchangeMoeyRate;
    },
    //金币抵扣价格
    coinDeductionMoney: function () {
      var that = this;
      if (that.isUseCoin)
        return that.useCoinNumModel * that.coinExchangeMoeyRate;
      return 0;
    },
    //实际付款金额
    nowBuyVipPayMoney: function () {
      var that = this;
      return that.nowBuyVipPrice - that.coinDeductionMoney;
    },
  },
  filters: {
    moneyFormat: function (money) {
      return (Math.floor(parseFloat(money) * 100) / 100).toFixed(2);
    },
  },
  methods: {
    //金币说明
    coinExplain: function () {
      rm.showModal(
        {
          title: "金币使用说明",
          content: "1、500金币抵扣1元\n2、满500可用，只可使用500的整数倍\n",
          showCancel: false,
          confirmText: "知道了",
        },
        function (res) {}
      );
    },
    //选择支付方式
    choosePayWay: function (payWay) {
      var that = this;
      this.payWay = payWay;
      switch (payWay) {
        case "allCoin":
          that.isUseCoin = true;
          that.useCoinNumModel = that.nowBuyVipCoinPrice;
          break;
        default:
          that.isUseCoin = false;
          break;
      }
    },
    //金币抵扣选择
    coinDeductionDeal: function () {
      var that = this;
      that.isUseCoin = !that.isUseCoin;
      if (that.isUseCoin) that.useCoinNumModel = that.maxCoinDeduction;
      else that.useCoinNumModel = 0;
    },
    //支付
    payNow: function () {
      var that = this;
      if (that.nobuyVip) return false;
      that.nobuyVip = true;
      if (that.useCoinNumModel > that.userInfo.coin) {
        rm.toast({
          data: "很抱歉,金币不足。", //提示文字
          duration: 3700,
        });
      } else if (
        that.payWay === "allCoin" ||
        that.useCoinNumModel === that.nowBuyVipCoinPrice
      ) {
        //如果是全金币抵扣
        that.allCoinBuyVip();
      } else {
        //支付
        switch (that.payWay) {
          case "allCoin":
            that.allCoinBuyVip();
            break;
          case "appleStore":
            that.appleStoreBuyVip();
            break;
          case "aliPay":
            that.aliPayBuyVip();
            break;
          case "weChatPay":
            that.weChatPayBuyVip();
            break;
        }
      }
    },
    //下单
    placeOrder: function (thisCoins, thisOpenid, callBack) {
      var that = this;
      //string userHash, int client, string device, int paytype, string deviceId,string openid="",int coins=0)
      var thisClient = 0;
      switch (that.systemInfo.platform) {
        //case 1: tc = "wp"; break;
        case "iOS":
          thisClient = 3;
          break;
        //case 4: tc = "ipad"; break;
        //case 5: tc = "itouch"; break;
        //case 6: tc = "wap"; break;
        case "android":
          thisClient = 8;
          break;
        //case 7:
        //case 9:
        //case 10: tc = "windows8"; break;
        //case 11: tc = "win10"; break;
        //case 13: tc = "watch"; break;
        //case 14: tc = "imac"; break;
        //case 15: tc = "macbook"; break;
        //case 16: tc = "iphonex"; break;
        //case 17: tc = "xbox"; break;
        //case 18: tc = "androidCar"; break;
        //case 19: tc = "sf"; break;
        //case 12:
        //case 21: tc = "qiyu"; break;
        //case 25: tc = "androidTv"; break;
        //case 26: tc = "androidWatch"; break;
        //case 27: tc = "blackberry"; break;
        //case 28: tc = "hololens"; break;
        //case 29: tc = "weixin"; break;
        default:
          thisClient = 0;
          break;
      }
      rm.request(
        {
          url:
            AppApi.Vip.BuyVip +
            "?userHash=" +
            that.userHash +
            "&client=" +
            thisClient +
            "&device=" +
            that.systemInfo.model.replace(/ /g, "+") +
            "&paytype=" +
            that.nowBuyVipPayType +
            "&deviceId=" +
            rm.encryptSync({
              text: that.systemInfo.deviceId,
              key: "vip20317",
            }) +
            "&openid=" +
            thisOpenid +
            "&coins=" +
            thisCoins,
        },
        function (res) {
          callBack(res);
        }
      );
    },
    allCoinBuyVip: function () {
      var that = this;
      that.useCoinNumModel = that.nowBuyVipCoinPrice;
      rm.showModal(
        {
          title: "提示",
          content:
            "您将使用" +
            that.useCoinNumModel +
            "金币全额兑换" +
            that.nowBuyVipName +
            "(抵扣¥" +
            that.coinDeductionMoney +
            "元)是否立即支付？",
          cancelText: "取消", //默认"取消"
          showCancel: true, //是否显示取消按钮，默认显示
          confirmText: "确定兑换", //默认"确定"
        },
        function (showModalRes) {
          if (showModalRes.confirm) {
            that.placeOrder(that.useCoinNumModel, "", function (res) {
              if (res.statusCode === 200) {
                if (res.data.success) that.paySuccee();
                else that.payDefeated("下单失败");
              } else that.payDefeated("网络错误（" + res.statusCode + "）");
            });
          } else if (showModalRes.cancel) {
            //
          }
        }
      );
    },
    //appStore支付
    appleStoreBuyVip: function () {
      var that = this;
      //不使用金币
      rm.request(
        {
          method: "POST",
          url: AppApi.Vip.AppStorePayTradeno,
          data: {
            UserHash: that.userHash,
            Device: that.systemInfo.model.replace(/ /g, "+"),
            DeviceID: rm.encryptSync({
              text: that.systemInfo.deviceId,
              key: "vip20317",
            }),
          },
        },
        function (res) {
          if (res.statusCode === 200) {
            if (res.data.success) {
              that.appStorePay(res.data.content, function (appStorePayRes) {
                if (appStorePayRes.success)
                  that.appStoreBuyVipCallback(appStorePayRes.parameters);
                else {
                  that.payDefeated(appStorePayRes.message);
                }
              });
            } else {
              that.payDefeated(res.message);
            }
          } else that.payDefeated("网络错误（" + res.statusCode + "）");
        }
      );
    },
    //appStore支付拉起
    appStorePay: function (orderId) {
      var that = this;
      rm.showLoading({ title: "请耐心等候..." });
      rm.requestPayment(
        {
          channel: "appleiap",
          params: {
            productId: that.nowBuyVipAppleStoreProductId, //Apple商品ID
            orderId: orderId, //商户平台订单ID
          },
        },
        function (payRes) {
          rm.hideLoading();
          if (payRes.success) {
            that.paySuccee();
          } else {
            that.payDefeated(payRes.message);
          }
          // 支付结果包含信息约定：
          // {
          //     merchantOrderId: "8782993739438",//商户平台订单ID
          //     productId: "com.ruanmei.ithome.vip.autorenew",//Apple商品ID
          //     credential: xxx,//Apple支付凭证
          //     transactionId: xxx,//Apple交易ID
          //     transactionInfo: {}//Apple返回交易信息，保持原有结构，尽量保证数据完整
          // }
        }
      );
    },
    //appStore支付结果处理
    appStoreBuyVipCallback: function (appStorePayRes) {
      var that = this;
      //不使用金币
      rm.request(
        {
          method: "POST",
          url: AppApi.Vip.AppStorePayVerifyReceipt,
          data: {
            userHash: that.userHash,
            trandeNO: appStorePayRes.merchantOrderId,
            transactionid: appStorePayRes.transactionId,
            receipt: appStorePayRes.credential,
            productId: appStorePayRes.productId,
            isSandbox: appStorePayRes.transactionInfo.environment,
          },
        },
        function (res) {
          if (res.statusCode === 200) {
            if (res.data.success) {
              that.appStoreCallback(
                appStorePayRes.merchantOrderId,
                appStorePayRes.transactionId,
                function (appStoreCallbackRes) {
                  if (appStoreCallbackRes.success)
                    that.paySuccee(appStoreCallbackRes.message);
                  else that.payDefeated(appStoreCallbackRes.message);
                }
              );
            } else {
              that.payDefeated("AppStore内购验证失败");
            }
          } else that.payDefeated("网络错误（" + res.statusCode + "）");
        }
      );
    },
    appStoreCallback: function (orderId, transactionId, callBack) {
      var that = this;
      rm.requestPayment(
        {
          channel: "appleiap",
          params: {
            productId: that.nowBuyVipAppleStoreProductId, //Apple商品ID
            transactionId: transactionId, //Apple 订单交易ID
            orderId: orderId, //商户平台订单ID
            process: "callback",
          },
        },
        function (payRes) {
          //{
          //   success: true,
          //   message: "Apple服务器故障，请稍后再试"
          //}
          console.log("回调结果", payRes);
          callBack(payRes);
        }
      );
    },
    aliPayBuyVip: function () {
      var that = this;
      that.placeOrder(that.useCoinNumModel, "", function (res) {
        if (res.statusCode === 200) {
          if (res.data.success) {
            rm.requestPayment(
              {
                channel: "alipay",
                params: res.data.content.sign,
              },
              function (payRes) {
                if (payRes.resultStatus === "9000") {
                  that.paySuccee();
                } else {
                  that.payDefeated("支付失败");
                }
              }
            );
          } else that.payDefeated("下单失败");
        } else that.payDefeated("网络错误（" + res.statusCode + "）");
      });
    },
    weChatPayBuyVip: function () {
      var that = this;
      that.placeOrder(that.useCoinNumModel, "", function (res) {
        if (res.statusCode === 200 && res.data.success) {
          if (res.statusCode === 200) {
            if (res.data.success) {
              var payParamOrignal = JSON.parse(res.data.content.sign);
              var payParam = {
                partnerId: payParamOrignal.partnerid,
                prepayId: payParamOrignal.prepayid,
                packageValue: payParamOrignal.package,
                nonceStr: payParamOrignal.noncestr,
                timeStamp: payParamOrignal.timestamp,
                sign: payParamOrignal.sign,
              };
              rm.requestPayment(
                {
                  channel: "weixin",
                  params: payParam,
                },
                function (payRes) {
                  if (payRes.errCode === 0) {
                    that.paySuccee();
                  } else {
                    that.payDefeated(payRes.errStr);
                  }
                }
              );
            } else that.payDefeated("下单失败");
          } else that.payDefeated("网络错误（" + res.statusCode + "）");
        }
      });
    },
    paySuccee: function (msg) {
      var that = this;
      if (msg === undefined || msg === "" || msg === null) {
        msg = "购买成功,前往会员中心查看。";
      }
      rm.getUserInfo(
        {
          refresh: true, //未登录时还是直接返回，无需执行网络请求
        },
        function (res) {
          if (res.success) {
            that.userInfo = res.userInfo;
            //vip类型判断
            var huangjin = 1;
            if (((that.userInfo.vip >> (huangjin - 1)) & 1) === 1) {
              that.userInfo.isVip = true;
              that.userInfo.VipClass = "黄金会员";
            }
          }
        }
      );
      rm.showModal(
        {
          title: "提示",
          content: msg,
          showCancel: false,
          cancelText: "不用了",
          confirmText: "确定",
        },
        function (res) {
          if (res.confirm) {
            rm.closeWindow();
          } else {
            rm.navigateTo({
              url: "ithome://index",
            });
          }
        }
      );
      that.nobuyVip = false;
    },
    payDefeated: function (msg) {
      var that = this;
      if (msg === undefined || msg === "" || msg === null) {
        msg = "购买失败";
      }
      rm.toast({
        data: msg, //提示文字
        duration: 7800,
      });
      that.nobuyVip = false;
    },
  },
  created: function () {
    var that = this;
    //加载数据
    rm.ready(function () {
      rm.setTextSelectEnable(true);
      rm.hideMenus(["navigation", "openBrowser", "refresh", "share"]);
      //夜间模式监听
      rm.onAppThemeChanged(function (status) {
        that.isDark = status.isDark;
        if (that.isDark) document.documentElement.className = "night";
        else document.documentElement.className = "";
      });
      //系统信息
      rm.getSystemInfo(function (res) {
        if (res.success) {
          that.systemInfo = res.systemInfo;
          if (that.systemInfo.platform === "iOS") {
            that.choosePayWay("appleStore");
          } else {
            that.choosePayWay("aliPay");
          }
        }
      });
      //用户信息
      rm.login(function (loginRes) {
        if (loginRes.success) {
          //获取userhash
          rm.getUserHash(function (res) {
            if (res.success) {
              that.userHash = res.userHash;
            }
          });
          rm.getUserInfo(function (res) {
            if (res.success) {
              that.userInfo = res.userInfo;
              //vip类型判断
              var huangjin = 0;
              if (((that.userInfo.vip >> (huangjin - 1)) & 1) === 1) {
                that.userInfo.isVip = true;
                that.userInfo.VipClass = "黄金会员";
              }
            }
          });
        }
      });
    });
  },
});
