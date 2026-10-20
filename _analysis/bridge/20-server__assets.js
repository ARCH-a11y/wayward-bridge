// src/server/assets.js
var require_assets = __commonJS({
  "src/server/assets.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var zlib = require("zlib");
    var gen = null;
    try {
      gen = require_assets_generated();
    } catch (_) {
      gen = null;
    }
    function devRead(rel) {
      return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
    }
    var crypto = require("crypto");
    var BOOTSTRAP = gen ? "(" + gen.BOOTSTRAP.toString() + ")();" : devRead("ui/bootstrap.js");
    var MENU_JS = gen ? "(" + gen.MENU.toString() + ")();" : devRead("ui/menu.js");
    var MENU_HASH = crypto.createHash("sha1").update(MENU_JS).digest("hex").slice(0, 10);
    var VERSION = gen ? gen.VERSION : "dev";
    var tagText = null;
    function tags() {
      if (tagText == null) tagText = gen ? zlib.gunzipSync(Buffer.from(gen.TAGS_GZ_B64, "base64")).toString("utf8") : devRead("data/danbooru-tags.txt");
      return tagText;
    }
    var aliasText = null;
    function aliases() {
      if (aliasText == null) aliasText = gen ? zlib.gunzipSync(Buffer.from(gen.ALIASES_GZ_B64, "base64")).toString("utf8") : devRead("data/danbooru-aliases.txt");
      return aliasText;
    }
    module2.exports = { BOOTSTRAP, MENU_JS, MENU_HASH, VERSION, tags, aliases };
  }
});

