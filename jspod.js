// Generated by CoffeeScript 1.3.3
(function() {
  var Podcast, activePanel, adjustSizes, createPlayer, getAttr, getText, navigateTo, options, panels, podcast, render, renderInside, templates, title2Id, updatePlayer;

  getText = function(element) {
    if (element.length === 0) {
      return null;
    } else {
      return element.text();
    }
  };

  getAttr = function(element, attr) {
    var result;
    if (element.length === 0) {
      return null;
    } else {
      result = element.attr(attr);
      if (result === void 0 || result === "") {
        return null;
      } else {
        return result;
      }
    }
  };

  title2Id = function(title) {
    var newStr, oldStr, result, _i, _len, _ref, _ref1;
    if (!(title != null)) {
      throw "JSPod.title2Id() is called with null";
    }
    if (typeof title !== "string") {
      throw "JSPod.title2Id() is called with an non-string argument";
    }
    result = title.toLowerCase();
    _ref = [[/\ /g, '_'], [/ä/g, 'ae'], [/ö/g, 'oe'], [/ü/g, 'ue'], [/ß/g, 'sz']];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i], oldStr = _ref1[0], newStr = _ref1[1];
      result = result.replace(oldStr, newStr);
    }
    result = result.replace(/([a-z])[_]+([0-9]+)/, "$1$2");
    return result;
  };

  /*
  The Podcast class gives an abstraction layer to an RSS feed.
  
  TODO:
  	* support for ATOM feeds
  	* take <itunes:summary> if defined (before <description>)
  	* What, if there are many channels or the RSS is broken?!
  	* Item with no title, ....
  	
  	Episode:
  	
  	* <itunes:summary> vor <description> 
  	* more than one title- or other tags
  */


  Podcast = (function() {

    function Podcast(xml) {
      var episode, item, _i, _len, _ref;
      xml = $(xml);
      this.title = getText(xml.find("channel > title"));
      this.description = getText(xml.find("channel > description"));
      this.image = getAttr(xml.find("channel > itunes\\:image"), 'href');
      if (this.image === null) {
        this.image = getAttr(xml.find("channel > image"), 'href');
      }
      this.episodes = [];
      _ref = xml.find("channel > item");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        item = $(item);
        episode = {};
        episode.title = getText(item.find("title"));
        episode.id = getText(item.find("jspod\\:id"));
        if (episode.id === null) {
          episode.id = getText(item.find("id"));
        }
        if (episode.id === null && (episode.title != null)) {
          episode.id = title2Id(episode.title);
        }
        if (episode.id != null) {
          episode.id = "#!/" + episode.id + "/";
        }
        episode.subtitle = getText(item.find("itunes\\:subtitle"));
        if (episode.subtitle === null) {
          episode.subtitle = getText(item.find("subtitle"));
        }
        episode.description = getText(item.find("description"));
        episode.short_description = getText($($(episode.description), "p").first());
        episode.source = getAttr(item.find("enclosure"), "url");
        episode.source_type = getAttr(item.find("enclosure"), "type");
        episode.sources = [];
        episode.sources[0] = {
          source: episode.source,
          source_type: episode.source_type
        };
        episode.image = this.image;
        if (episode.source_type != null) {
          episode.media_type = (function() {
            switch (episode.source_type.substring(0, 6)) {
              case "audio/":
                return "audio";
              case "video/":
                return "video";
              default:
                return null;
            }
          })();
        } else {
          episode.media_type = null;
        }
        this.episodes.push(episode);
      }
    }

    return Podcast;

  })();

  podcast = null;

  render = function(template, data) {
    if (data == null) {
      data = {};
    }
    return new EJS({
      text: templates[template]
    }).render(data);
  };

  renderInside = function(template, target, data) {
    if (data == null) {
      data = {};
    }
    return $(target).html(render(template, data));
  };

  navigateTo = function(target) {
    return window.location.hash = target;
  };

  panels = [
    {
      id: "podcast",
      handleRequest: function(hash) {
        if (hash === "") {
          return {
            data: {
              podcast: podcast
            },
            title: podcast.title
          };
        } else {
          return null;
        }
      },
      hash: null,
      title: null
    }, {
      id: "episode",
      handleRequest: function(hash) {
        var episode, flashsrc, height, mediaelementsrc, source, testElement, width, _i, _j, _len, _len1, _ref, _ref1;
        _ref = podcast.episodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          episode = _ref[_i];
          if (episode.id === encodeURI(hash)) {
            width = 640;
            if (episode.media_type === "audio") {
              height = 24;
            } else {
              height = 480;
            }
            flashsrc = render("flash_media", {
              width: width,
              height: height,
              flashurl: options.flash,
              source: episode.source
            });
            testElement = document.createElement(episode.media_type);
            if (testElement.canPlayType) {
              mediaelementsrc = flashsrc;
              _ref1 = episode.sources;
              for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                source = _ref1[_j];
                if (testElement.canPlayType(source.source_type)) {
                  mediaelementsrc = render("native_media", {
                    width: width,
                    height: height,
                    flash: flashsrc,
                    episode: episode
                  });
                  break;
                }
              }
            } else {
              mediaelementsrc = flashsrc;
            }
            return {
              data: {
                episode: episode,
                mediaelementsrc: mediaelementsrc
              },
              title: episode.title,
              prev: ["", "Podcast: " + podcast.title]
            };
          }
        }
        return null;
      },
      hash: null,
      title: null
    }
  ];

  activePanel = panels[0];

  adjustSizes = function() {
    $("#jspod_" + activePanel.id + "_panel").height($("#jspod").innerHeight() - $("#jspod_header").outerHeight());
    return $("#jspod_panels").css("padding-top", "" + ($("#jspod_header").outerHeight()) + "px");
  };

  options = null;

  updatePlayer = function() {
    var hash, index, navButton, navTargetHash, navTargetPanel, navTargetTitle, nextPanel, panel, prevPanel, result, type, _i, _j, _len, _len1, _ref, _ref1, _results;
    hash = window.location.hash;
    if (activePanel.hash !== hash) {
      index = 0;
      prevPanel = null;
      _results = [];
      for (_i = 0, _len = panels.length; _i < _len; _i++) {
        panel = panels[_i];
        nextPanel = (index + 1 < panels.length ? panels[index + 1] : null);
        result = panel.handleRequest(hash);
        if (result !== null) {
          panel.title = result.title;
          $("head title").text(result.title);
          if (panel.hash !== hash) {
            panel.hash = hash;
            renderInside(panel.id, "#jspod_" + panel.id + "_panel_content", result.data);
          }
          if (activePanel.hash != null) {
            $("#jspod_panels").animate({
              left: "-" + (index * 100) + "%"
            });
          } else {
            $("#jspod_panels").css({
              'left': "-" + (index * 100) + "%"
            });
          }
          _ref = ["prev", "next"];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            type = _ref[_j];
            navTargetPanel = type === "prev" ? prevPanel : nextPanel;
            navButton = $("#jspod_header a.ui-navbutton-" + type);
            if ((result[type] != null) || ((navTargetPanel != null) && (navTargetPanel.hash != null))) {
              navButton.show();
              if (result[type]) {
                _ref1 = result[type], navTargetHash = _ref1[0], navTargetTitle = _ref1[1];
              } else {
                navTargetHash = navTargetPanel.hash;
                navTargetTitle = navTargetPanel.title;
              }
              navButton.attr("title", navTargetTitle);
              if (navTargetTitle.length > 30) {
                navTargetTitle = "" + (navTargetTitle.substring(0, 27)) + "...";
              }
              navButton.find(".ui-navbutton-text").text(navTargetTitle);
              navButton.attr("href", navTargetHash);
              navButton.click((function(target) {
                return function(e) {
                  return navigateTo(target);
                };
              })(navTargetHash));
            } else {
              navButton.hide();
            }
          }
          activePanel = panel;
          adjustSizes();
          break;
        }
        index++;
        _results.push(prevPanel = panel);
      }
      return _results;
    }
  };

  createPlayer = function(opt) {
    return $(document).ready(function() {
      options = opt;
      renderInside("player", options.target);
      return $.get(options.feed, function(data) {
        podcast = new Podcast(data);
        if (options.afterParsing !== null) {
          options.afterParsing(podcast);
        }
        updatePlayer();
        $("#jspod_header a").hover(function(e) {
          return $(e.delegateTarget).toggleClass("ui-state-hover");
        });
        window.addEventListener("hashchange", updatePlayer, false);
        return $(window).resize(function(event) {
          return adjustSizes();
        });
      }, "xml");
    });
  };

  EJS.Helpers.prototype.link_start_tag = function(target, title) {
    return "<a href=\"" + target + "\" title=\"" + title + "\"\n   onclick=\"JSPod.navigateTo('" + target + "'); return false\">";
  };

  (typeof exports !== "undefined" && exports !== null ? exports : this).JSPod = {
    Podcast: Podcast,
    createPlayer: createPlayer,
    navigateTo: navigateTo,
    title2Id: title2Id
  };

  templates = {
    player: "\n<div id=\"jspod\" class=\"ui-widget ui-helper-clearfix\">\n	<div id=\"jspod_header\"\n	     class=\"ui-widget-header ui-helper-clearfix\">\n		<a class=\"ui-navbutton-prev ui-corner-all ui-state-default\"\n		   title=\"Previous Panel\"\n		   onclick=\"return false;\"\n		   style=\"display: none\">\n			<span class=\"ui-icon ui-icon-circle-triangle-w\"></span>\n			<span class=\"ui-navbutton-text\"></span>\n		</a>\n		<a class=\"ui-navbutton-next ui-corner-all ui-state-default\"\n		   title=\"Next Panel\"\n		   onclick=\"return false;\"\n		   style=\"display: none\">\n			<span class=\"ui-navbutton-text\"></span>\n			<span class=\"ui-icon ui-icon-circle-triangle-e\"></span>\n		</a>\n	</div>\n	<div id=\"jspod_panels\" class=\"ui-widget-content\">\n		<div class=\"jspod_panel\" id=\"jspod_podcast_panel\">\n			<div class=\"jspod_panel_content\"\n			     id=\"jspod_podcast_panel_content\"></div>\n		</div>\n		<div class=\"jspod_panel\" id=\"jspod_episode_panel\">\n			<div class=\"jspod_panel_content\"\n			     id=\"jspod_episode_panel_content\"></div>\n		</div>\n	</div>\n</div>\n",
    podcast: "<div id=\"jspod_podcast_panel_header\" class=\"ui-helper-clearfix\">\n	<%= img_tag(podcast.image, \"\") %>\n\n	<h1><%= podcast.title %></h1>\n\n	<%= podcast.description %>\n</div>\n\n<h2>Alle Folgen</h2>\n\n<ul>\n	<% $.each(podcast.episodes, function(index, episode) { %>\n		<li>\n			<hgroup>\n				<h3>\n					<%= link_start_tag(episode.id, episode.title) %>\n						<%= episode.title %>\n					</a>\n				</h3>\n				<h4><%= episode.subtitle %></h4>\n			</hgroup>\n			<p><%= episode.short_description %></p>\n		</li>\n	<% }); %>\n</ul>\n",
    episode: "<header>\n	<hgroup>\n	<h1><%= episode.title %></h1>\n	<h2><%= episode.subtitle %></h2>\n	</hgroup>\n</header>\n\n<!-- TODO: besser implementieren (mehrere Sources) -->\n\n<div id=\"jspod_mediacontainer\">\n	<%= mediaelementsrc %>\n</div>\n\n<p>\n	<a href=\"<%= episode.source %>\" \n	   title=\"Download dieser <%= episode.source_type %>-Datei\">\n	   Download dieser <%= episode.source_type %>-Datei\n	</a>\n</p>\n\n<%= episode.description %>",
    native_media: "<<%= episode.media_type %> id=\"jspod_mediaelement\" controls=\"controls\"\n	metadata=\"preload\" width=\"<%= width %>\" height=\"<%= height %>\"\n	alt=\"\">\n	<% $.each(episode.sources, function (i, source) { %>\n		<source src='<%= source.source %>'\n		type='<%= source.source_type %>'>\n	<% }); %>\n	<%= flash %>\n</<%= episode.media_type %>>",
    flash_media: "<embed\n	src='<%= flashurl %>'\n	name='jspod_mediaelement_flash'\n	id='jspod_mediaelement_flash'\n	allowscriptaccess='always'\n	allowfullscreen='true'\n	flashvars='file=<%= source %>'\n	width='<%= width %>'\n	height='<%= height %>'\n	alt=''\n>"
  };

}).call(this);
