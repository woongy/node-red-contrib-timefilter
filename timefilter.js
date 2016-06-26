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
    this.pass = false;
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
        node.pass = true;
        node.send([null, {
          topic: "start",
          payload: {
            starttime: node.starthour + ":" + leftPad(node.startmin, 2, 0),
            endtime: node.endhour + ":" + leftPad(node.endmin, 2, 0)
          }
        }]);
        node.status({ fill: "green", shape: "dot", text: "on" });
      },
      start: true
    });

    node.cronOnEnd = new CronJob({
      cronTime: node.endmin + " " + node.endhour + " * * " + days,
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

    node.status({ fill: "grey", shape: "dot", text: "off" });
  }

  RED.nodes.registerType("timefilter", TimefilterNode);
}
