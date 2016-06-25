module.exports = function(RED) {
  "use strict";
  var CronJob = require("cron").CronJob;

  function TimefilterNode(config) {
    RED.nodes.createNode(this, config);
    this.starttime = Number(config.starttime);
    this.endtime = Number(config.endtime);
    this.sun = config.sun;
    this.mon = config.mon;
    this.tue = config.tue;
    this.wed = config.wed;
    this.thu = config.thu;
    this.fri = config.fri;
    this.sat = config.sat;
    this.cronjob = null;
    this.called = 0;

    var node = this;

    var endhour = Math.floor(node.endtime / 60);
    var endmin = node.endtime % 60;
    var days = [];
    if (node.sun) { days.push(0); }
    if (node.mon) { days.push(1); }
    if (node.tue) { days.push(2); }
    if (node.wed) { days.push(3); }
    if (node.thu) { days.push(4); }
    if (node.fri) { days.push(5); }
    if (node.sat) { days.push(6); }
    days = days.join();

    node.cronjob = new CronJob({
      cronTime: endmin + " " + endhour + " * * " + days,
      onTick: function() {
        if (node.called == 0) {
          node.send([null, {}]);
        }
        node.called = 0;
      },
      start: true
    });

    node.on("input", function(msg) {
      var now = new Date();

      var nowoff = -now.getTimezoneOffset() * 60000;
      var nowMillis = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), 0);
      nowMillis += nowoff;
      var midnightMillis = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0);
      var today = Math.round((nowMillis - midnightMillis) / 60000) % 1440;

      if ((node.starttime <= today) && (today <= node.endtime)) {
        switch (now.getDay()) {
          case 0:
            if (node.sun) { onCall(msg); } break;
          case 1:
            if (node.mon) { onCall(msg); } break;
          case 2:
            if (node.tue) { onCall(msg); } break;
          case 3:
            if (node.wed) { onCall(msg); } break;
          case 4:
            if (node.thu) { onCall(msg); } break;
          case 5:
            if (node.fri) { onCall(msg); } break;
          case 6:
            if (node.sat) { onCall(msg); } break;
        }
      }

      function onCall(msg) {
        node.called += 1;
        node.send([msg, null]);
      }
    });

    node.on("close", function() {
      node.cronjob.stop();
      delete node.cronjob;
    });
  }

  RED.nodes.registerType("timefilter", TimefilterNode);
}
