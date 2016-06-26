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
    this.cronOnStart = null;
    this.cronOnEnd = null;
    this.called = 0;

    var node = this;

    var starthour = Math.floor(node.starttime / 60);
    var startmin = node.starttime % 60;
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

    node.cronOnStart = new CronJob({
      cronTime: startmin + " " + starthour + " * * " + days,
      onTick: function() {
        node.pass = true;
        node.send([null, {
          topic: "start",
          payload: {
            starttime: starthour + ":" + startmin,
            endtime: endhour + ":" + endmin
          }
        }]);
        node.status({ fill: "green", shape: "dot", text: "on" });
      },
      start: true
    });

    node.cronOnEnd = new CronJob({
      cronTime: endmin + " " + endhour + " * * " + days,
      onTick: function() {
        node.pass = false;
        node.send([null, {
          topic: "end",
          payload: {
            called: node.called
          }
        }]);
        node.called = 0;
        node.status({ fill: "grey", shape: "dot", text: "off" });
      },
      start: true
    });

    node.on("input", function(msg) {
      if (node.pass) {
        node.called += 1;
        node.send([msg, null]);
      }
    });

    node.on("close", function() {
      node.cronOnStart.stop();
      delete node.cronOnStart;
      node.cronOnEnd.stop();
      delete node.cronOnEnd;
    });
  }

  RED.nodes.registerType("timefilter", TimefilterNode);
}
