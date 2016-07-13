module.exports = function(RED) {
  "use strict";
  var CronJob = require("cron").CronJob;
  var leftPad = require("left-pad");

  function TimefilterNode(config) {
    RED.nodes.createNode(this, config);
    this.starthour = Number(config.starthour);
    this.startmin = Number(config.startmin);
    this.endhour = Number(config.endhour);
    this.endmin = Number(config.endmin);
    this.sun = config.sun;
    this.mon = config.mon;
    this.tue = config.tue;
    this.wed = config.wed;
    this.thu = config.thu;
    this.fri = config.fri;
    this.sat = config.sat;
    this.once = config.once;
    this.cronOnStart = null;
    this.cronOnEnd = null;
    this.called = 0;

    var node = this;

    var days = [];
    if (node.sun) { days.push(0); }
    if (node.mon) { days.push(1); }
    if (node.tue) { days.push(2); }
    if (node.wed) { days.push(3); }
    if (node.thu) { days.push(4); }
    if (node.fri) { days.push(5); }
    if (node.sat) { days.push(6); }
    days = days.join();

    node.cronOnStart = new CronJob({
      cronTime: node.startmin + " " + node.starthour + " * * " + days,
      onTick: function() {
        node.send([
          null,
          {
            topic: "start",
            payload: {
              starttime: node.starthour + ":" + leftPad(node.startmin, 2, 0),
              endtime: node.endhour + ":" + leftPad(node.endmin, 2, 0)
            }
          },
          null
        ]);
        node.status({ fill: "green", shape: "dot", text: "on" });
      },
      start: true
    });

    node.cronOnEnd = new CronJob({
      cronTime: node.endmin + " " + node.endhour + " * * " + days,
      onTick: function() {
        if (node.called == 0) {
          node.send([
            null,
            null,
            { topic: "end" }
          ]);
        }
        node.called = 0;
        node.status({ fill: "grey", shape: "dot", text: "off" });
      },
      start: true
    });

    node.on("input", function(msg) {
      if (shouldCall()) { onCall(msg); }
    });

    function shouldCall() {
      if (node.once && node.called > 0) { return false; }

      var now = new Date();

      var nowoff = -now.getTimezoneOffset() * 60000;
      var nowMillis = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), 0);
      nowMillis += nowoff;
      var midnightMillis = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0);
      var nowtime = Math.round((nowMillis - midnightMillis) / 60000) % 1440;

      var starttime = node.starthour * 60 + node.startmin
      var endtime = node.endhour * 60 + node.endmin

      if ((starttime <= nowtime) && (nowtime <= endtime)) {
        switch (now.getDay()) {
          case 0:
            return node.sun;
          case 1:
            return node.mon;
          case 2:
            return node.tue;
          case 3:
            return node.wed;
          case 4:
            return node.thu;
          case 5:
            return node.fri;
          case 6:
            return node.sat;
        }
      }
    }

    function onCall(msg) {
      node.called += 1;
      if (node.once && node.called == 1) {
        node.status({ fill: "grey", shape: "dot", text: "off" });
      }
      node.send([msg, null, null]);
    }

    node.on("close", function() {
      node.cronOnStart.stop();
      delete node.cronOnStart;
      node.cronOnEnd.stop();
      delete node.cronOnEnd;
    });

    if (shouldCall()) {
      node.status({ fill: "green", shape: "dot", text: "on" });
    } else {
      node.status({ fill: "grey", shape: "dot", text: "off" });
    }
  }

  RED.nodes.registerType("timefilter", TimefilterNode);
}
