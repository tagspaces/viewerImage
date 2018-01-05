/* Copyright (c) 2013-present The TagSpaces Authors.
 * Use of this source code is governed by the MIT license which can be found in the LICENSE.txt file. */
"use strict";

$(document).ready(function() {
  var filePath = getParameterByName("file");
  var locale = getParameterByName("locale");

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  var isWeb = (document.URL.startsWith('http') && !document.URL.startsWith('http://localhost:1212/'));
  // isCordovaAndroid: document.URL.indexOf( 'file:///android_asset' ) === 0,
  // isCordovaiOS: /^file:\/{3}[^\/]/i.test(window.location.href) && /ios|iphone|ipod|ipad/i.test(navigator.userAgent),
  var isCordova = (document.URL.indexOf('file:///android_asset') === 0);

  if (isCordova || isWeb) {

  } else {
    filePath = "file://" + filePath;
  }

  var $imgViewer = $("#imageContainer");
  var exifObj;

  var extSettings, imageBackgroundColor = "#000000";
  loadExtSettings();

  if (extSettings && extSettings.imageBackgroundColor) {
    imageBackgroundColor = extSettings.imageBackgroundColor;
  }

  //save settings for viewerSettings
  function saveExtSettings() {
    var settings = {
      "imageBackgroundColor": imageBackgroundColor
    };
    localStorage.setItem('imageViewerSettings', JSON.stringify(settings));
    console.debug(settings);
  }

  //load settings for viewerSettings
  function loadExtSettings() {
    extSettings = JSON.parse(localStorage.getItem("imageViewerSettings"));
  }

  var opt = {
    //url: filePath,
    movable: true,
    navbar: false,
    toolbar: false,
    title: false,
    fullscreen: true,
    inline: 'inline',
    //fading: true,
    hide: function(e) {
      console.log(e.type);
    }
  };
  var viewer;

  $("#imageContent").attr("src", filePath).bind("load", function() {
    viewer = new Viewer(document.getElementById('imageContent'), opt);
    viewer.full();
    imageViewerContainer[0].style.background = imageBackgroundColor;
    $(this).addClass("transparentImageBackground");
    $imgViewer.addClass("imgViewer");
    if (filePath.toLowerCase().indexOf("jpg") === (filePath.length - 3) ||
      filePath.toLowerCase().indexOf("jpeg") === (filePath.length - 4)) {
      EXIF.getData(this, function() {
        var orientation = EXIF.getTag(this, "Orientation");
        correctOrientation(orientation);
        //console.log(EXIF.pretty(this));
        exifObj = {};
        var tags = ['Make', 'Model', 'DateTime', 'Artist', 'Copyright', 'ExposureTime ', 'FNumber', 'ISOSpeedRatings', 'ShutterSpeedValue', 'ApertureValue', 'FocalLength'];
        for (var tag in tags) {
          var prop = tags[tag];
          if (this.exifdata.hasOwnProperty(prop)) {
            exifObj[prop] = this.exifdata[prop];
          }
        }
        jQuery.extend(exifObj, this.iptcdata);
        if (!jQuery.isEmptyObject(exifObj)) {
          $("#exifButton").parent().show();
          printEXIF();
        }
      });
    }
  });

  $("#imageContent").css("visibility", "hidden");

  var offset = 0;
  $("#zoomInButton").on('click', function(e) {
    e.stopPropagation();
    viewer.zoom(offset + 1);
  });

  $("#zoomOutButton").on('click', function(e) {
    e.stopPropagation();
    viewer.zoom(offset - 1);
  });

  $("#zoomResetButton").on('click', function(e) {
    viewer.zoomTo(1);
  });

  $("#fitToScreen").on('click', function(e) {
    viewer.reset();
  });

  $("#rotateLeftButton").on('click', function(e) {
    e.stopPropagation();
    viewer.rotate(-90);
  });

  $("#rotateRightButton").on('click', function(e) {
    e.stopPropagation();
    viewer.rotate(90);
  });

  var flipHorizontal, flipVertical, flipBoth, flipColor;
  $("#flipHorizontal").on('click', function(e) {
    e.stopPropagation();
    if (flipHorizontal === true) {
      flipHorizontal = false;
      viewer.scaleX(1); // Flip horizontal
    } else {
      flipHorizontal = true;
      viewer.scaleX(-1); // Flip horizontal
    }
  });

  $("#flipVertical").on('click', function(e) {
    e.stopPropagation();
    if (flipVertical === true) {
      flipVertical = false;
      viewer.scaleY(1); // Flip horizontal
    } else {
      flipVertical = true;
      viewer.scaleY(-1); // Flip vertical
    }
  });

  $("#flipBoth").on('click', function(e) {
    e.stopPropagation();
    if (flipBoth === true) {
      flipBoth = false;
      viewer.scale(1); // Flip horizontal
    } else {
      flipBoth = true;
      viewer.scale(-1); // Flip both horizontal and vertical
    }
  });

  var imageViewerContainer = document.getElementsByClassName("viewer-container");

  $("#whiteBackgroundColor").on('click', function(e) {
    e.stopPropagation();
    imageViewerContainer[0].style.background = "#ffffff";
    imageBackgroundColor = "#ffffff";
    saveExtSettings();
  });

  $("#blackBackgroundColor").on('click', function(e) {
    e.stopPropagation();
    imageViewerContainer[0].style.background = "#000000";
    imageBackgroundColor = "#000000";
    saveExtSettings();
  });

  $("#sepiaBackgroundColor").on('click', function(e) {
    e.stopPropagation();
    imageViewerContainer[0].style.background = "#f4ecd8";
    imageBackgroundColor = "#f4ecd8";
    saveExtSettings();
  });

  $("#flipBlackAndWhiteColor").on('click', function(e) {
    e.stopPropagation();
    if (flipColor) {
      flipColor = false;
      imageViewerContainer[0].style.filter = "grayscale(0%)";
      imageViewerContainer[0].style.WebkitFilter = "grayscale(0%)";
    } else {
      flipColor = true;
      imageViewerContainer[0].style.filter = "grayscale(100%)";
      imageViewerContainer[0].style.WebkitFilter = "grayscale(100%)";
    }
  });

  function printEXIF() {
    var $exifRow = $("#exifRow").clone(); // Preparing the template
    var $exifTableBody = $("#exifTableBody");
    $exifTableBody.empty();
    for (var key in exifObj) {
      if (exifObj.hasOwnProperty(key) && exifObj[key].length !== 0) {
        $exifRow.find("th").text(key);
        $exifRow.find("td").text(exifObj[key]);
        $exifTableBody.append($exifRow.clone());
        //$exifTableBody.append("<tr><th>" + key + "</th><td>" + exifObj[key] + "</td></tr>");
      }
    }
  }

  function correctOrientation(orientation) {
    switch (orientation) {
      case 8:
        viewer.rotate(-90);
        break;
      case 3:
        viewer.rotate(180);
        break;
      case 6:
        viewer.rotate(90);
        break;
      case 1:
        viewer.rotateTo(0);
        break;
      default:
        viewer.rotateTo(0);
    }
  }

  if (isCordova) {
    $("#printButton").hide();
  }

  // Init internationalization
  i18next.init({
    ns: {namespaces: ['ns.viewerImage']},
    debug: true,
    lng: locale,
    fallbackLng: 'en_US'
  }, function() {
    jqueryI18next.init(i18next, $);
    $('[data-i18n]').localize();
  });

  // Nano progressbar
  $(function() {
    var options = {
      bg: '#42BEDB', // (optional) background css property, '#000' by default
      // leave target blank for global nanobar
      target: document.getElementById('nanoBar'), //(optional) Where to put the progress bar, nanobar will be fixed to top of document if target is null
      // id for new nanobar
      id: 'nanoBar' // (optional) id for nanobar div
    };
    var nanobar = new Nanobar(options);
    var pct = 0;
    $(document).ajaxSend(function() {
      pct += 0.1;
      // move bar
      nanobar.go(pct);
      if (pct > 100.0) {
        pct = 0.0;
      }
    }).ajaxComplete(function() {
      // Finish progress bar
      nanobar.go(100);
    });
  });

});
