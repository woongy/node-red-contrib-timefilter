module.exports = function(RED) {
  "use strict";

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

    var node = this;

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
            if (node.sun) { node.send(msg); } break;
          case 1:
            if (node.mon) { node.send(msg); } break;
          case 2:
            if (node.tue) { node.send(msg); } break;
          case 3:
            if (node.wed) { node.send(msg); } break;
          case 4:
            if (node.thu) { node.send(msg); } break;
          case 5:
            if (node.fri) { node.send(msg); } break;
          case 6:
            if (node.sat) { node.send(msg); } break;
        }
      }
    });
  }

  RED.nodes.registerType("timefilter", TimefilterNode);
}
